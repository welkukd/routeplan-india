import { NextRequest, NextResponse } from "next/server";
import { solveVRP, createRouteRequestFromOrders, RouteRequestSchema, OptimizedRoute } from "@routeplan/routing";
import { createServerClient } from "@routeplan/db";

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerClient();
    const body = await request.json();

    // Validate request
    const parsed = RouteRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request", details: parsed.error.errors }, { status: 400 });
    }

    const result = solveVRP(parsed.data);

    // Log usage
    if (body.organization_id) {
      await supabase.rpc("log_usage", {
        p_organization_id: body.organization_id,
        p_metric: "routes_optimized",
        p_count: 1,
        p_metadata: {
          vehicles_used: result.summary.vehiclesUsed,
          locations_served: result.summary.locationsServed,
          total_distance_km: result.summary.totalDistanceKm,
        },
      });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Route optimization error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient();
    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get("organization_id");
    const date = searchParams.get("date") || new Date().toISOString().split("T")[0];

    if (!organizationId) {
      return NextResponse.json({ error: "organization_id required" }, { status: 400 });
    }

    // Fetch orders for the date
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
        customers!inner (
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
      latitude: 19.0760, // Mumbai default
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
        status: "planned",
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

      // Send WhatsApp notifications to drivers
      // TODO: Integrate with Gupshup client
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Auto-route error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}