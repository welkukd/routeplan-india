import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@routeplan/db";
import { Database } from "@routeplan/db";
import { solveVRP, createRouteRequestFromOrders, RouteRequestSchema, OptimizedRoute } from "@routeplan/routing";

type RouteRow = Database["public"]["Tables"]["routes"]["Row"];
type RouteInsert = Database["public"]["Tables"]["routes"]["Insert"];
type RouteUpdate = Database["public"]["Tables"]["routes"]["Update"];

// Default organization ID for demo purposes
const DEFAULT_ORG_ID = "org-demo";

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient();
    const searchParams = request.nextUrl.searchParams;

    // Pagination
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const offset = (page - 1) * limit;

    // Filters
    const status = searchParams.get("status") || "";
    const driverId = searchParams.get("driver_id") || "";
    const date = searchParams.get("date") || new Date().toISOString().split("T")[0];

    // Build query
    let query = supabase
      .from("routes")
      .select(`
        *,
        drivers:driver_id (
          id,
          name,
          phone,
          vehicle_type
        )
      `, { count: "exact" })
      .eq("organization_id", DEFAULT_ORG_ID)
      .eq("date", date)
      .order("created_at", { ascending: false });

    // Apply filters
    if (status) {
      query = query.eq("status", status);
    }
    if (driverId) {
      query = query.eq("driver_id", driverId);
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    const { data: routes, error, count } = await query;

    if (error) {
      console.error("Supabase error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Fetch stops for each route
    const routesWithStops = await Promise.all(
      (routes || []).map(async (route) => {
        const { data: stops } = await supabase
          .from("orders")
          .select(`
            id,
            customer_id,
            order_number,
            status,
            items,
            total_amount,
            delivery_window_start,
            delivery_window_end,
            customers:customer_id (
              id,
              name,
              phone,
              address,
              latitude,
              longitude
            )
          `)
          .eq("route_id", route.id)
          .order("created_at");

        return {
          ...route,
          stops: stops || [],
        };
      })
    );

    return NextResponse.json({
      routes: routesWithStops,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    });
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerClient();
    const body = await request.json();

    // If it's an optimization request
    if (body.action === "optimize") {
      const organizationId = body.organization_id || DEFAULT_ORG_ID;
      const date = body.date || new Date().toISOString().split("T")[0];

      // Fetch pending orders for the date
      const { data: orders } = await supabase
        .from("orders")
        .select(`
          id,
          customer_id,
          order_number,
          status,
          items,
          total_amount,
          delivery_window_start,
          delivery_window_end,
          customers:customer_id (
            id,
            name,
            phone,
            address,
            latitude,
            longitude
          )
        `)
        .eq("organization_id", organizationId)
        .eq("status", "pending")
        .gte("created_at", `${date}T00:00:00`)
        .lt("created_at", `${date}T23:59:59`);

      // Fetch active drivers
      const { data: drivers } = await supabase
        .from("drivers")
        .select("*")
        .eq("organization_id", organizationId)
        .eq("is_active", true);

      if (!orders?.length || !drivers?.length) {
        return NextResponse.json({ routes: [], message: "No pending orders or active drivers" });
      }

      // Get depot (organization address)
      const { data: org } = await supabase
        .from("organizations")
        .select("name, address, latitude, longitude")
        .eq("id", organizationId)
        .single();

      const depot = org || {
        name: "Depot",
        address: "Main Warehouse",
        latitude: 19.0760,
        longitude: 72.8777,
      };

      const routeRequest = createRouteRequestFromOrders(
        orders.map((o) => {
          const customer = Array.isArray(o.customers) ? o.customers[0] : o.customers;
          return {
            id: o.id,
            customerName: customer?.name,
            address: customer?.address,
            latitude: customer?.latitude || depot.latitude,
            longitude: customer?.longitude || depot.longitude,
            weightKg: o.items?.reduce((sum: number, item: any) => sum + (item.weight || 1), 0) || 1,
            timeWindowStart: o.delivery_window_start ? new Date(o.delivery_window_start).toTimeString().slice(0, 5) : undefined,
            timeWindowEnd: o.delivery_window_end ? new Date(o.delivery_window_end).toTimeString().slice(0, 5) : undefined,
          };
        }),
        drivers.map((d) => ({
          id: d.id,
          name: d.name,
          phone: d.phone,
          vehicleType: d.vehicle_type,
          capacityKg: d.max_capacity_kg || 100,
          homeLat: d.home_latitude || depot.latitude,
          homeLng: d.home_longitude || depot.longitude,
        })),
        depot
      );

      const result = solveVRP(routeRequest);

      // Save routes to database
      if (result.routes.length > 0) {
        const routeRecords = result.routes.map((r: OptimizedRoute) => ({
          organization_id: organizationId,
          driver_id: r.driverId,
          name: `Route ${date} - ${r.driverName}`,
          date,
          status: "planned" as const,
          optimized_order: r.stops.filter((s) => s.locationId !== "depot").map((s) => s.locationId),
          total_distance_km: r.totalDistanceKm,
          total_duration_min: r.totalDurationMin,
        }));

        const { data: savedRoutes } = await supabase
          .from("routes")
          .insert(routeRecords)
          .select();

        // Update orders with route_id
        if (savedRoutes) {
          for (const route of savedRoutes) {
            const routeResult = result.routes.find((r: OptimizedRoute) => r.driverId === route.driver_id);
            if (routeResult) {
              const orderIds = routeResult.stops
                .filter((s) => s.locationId !== "depot" && s.locationId !== `driver-home-${route.driver_id}`)
                .map((s) => s.locationId);

              await supabase
                .from("orders")
                .update({ route_id: route.id, status: "assigned", driver_id: route.driver_id })
                .in("id", orderIds);
            }
          }
        }

        // Log usage
        await supabase.rpc("log_usage", {
          p_organization_id: organizationId,
          p_metric: "routes_optimized",
          p_count: 1,
          p_metadata: {
            vehicles_used: result.summary.vehiclesUsed,
            locations_served: result.summary.locationsServed,
            total_distance_km: result.summary.totalDistanceKm,
          },
        });

        return NextResponse.json({
          routes: result.routes,
          savedRoutes,
          unassignedLocations: result.unassignedLocations,
          summary: result.summary,
          metadata: result.metadata,
        });
      }

      return NextResponse.json(result);
    }

    // Create a new route manually
    const routeData = {
      organization_id: body.organization_id || DEFAULT_ORG_ID,
      driver_id: body.driver_id || null,
      name: body.name || `Route ${new Date().toISOString().split("T")[0]}`,
      date: body.date || new Date().toISOString().split("T")[0],
      status: (body.status || "planned") as "planned" | "active" | "completed" | "cancelled",
      optimized_order: body.optimized_order || [],
      total_distance_km: body.total_distance_km ?? null,
      total_duration_min: body.total_duration_min ?? null,
    } as RouteInsert;

    const { data: route, error } = await supabase
      .from("routes")
      .insert(routeData)
      .select()
      .single();

    if (error) {
      console.error("Supabase error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ route }, { status: 201 });
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const supabase = createServerClient();
    const body = await request.json();
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json({ error: "Route ID required" }, { status: 400 });
    }

    const routeUpdate: RouteUpdate = {
      ...updateData,
      updated_at: new Date().toISOString(),
    };

    const { data: route, error } = await supabase
      .from("routes")
      .update(routeUpdate)
      .eq("id", id)
      .eq("organization_id", DEFAULT_ORG_ID)
      .select()
      .single();

    if (error) {
      console.error("Supabase error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ route });
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = createServerClient();
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Route ID required" }, { status: 400 });
    }

    // First unassign orders from this route
    await supabase
      .from("orders")
      .update({ route_id: null, status: "pending", driver_id: null })
      .eq("route_id", id);

    const { error } = await supabase
      .from("routes")
      .delete()
      .eq("id", id)
      .eq("organization_id", DEFAULT_ORG_ID);

    if (error) {
      console.error("Supabase error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}