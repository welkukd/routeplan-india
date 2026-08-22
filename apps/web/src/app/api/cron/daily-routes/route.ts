import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@routeplan/db";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    // Verify cron secret
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;
    
    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = createServerClient();
    const today = new Date().toISOString().split("T")[0];

    // Get all active organizations
    const { data: organizations, error: orgError } = await supabase
      .from("organizations")
      .select("id")
      .neq("gupshup_app_id", null);

    if (orgError || !organizations?.length) {
      return NextResponse.json({ message: "No organizations with WhatsApp configured" });
    }

    const results = [];

    for (const org of organizations) {
      try {
        // Fetch pending orders for today
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
          .eq("organization_id", org.id)
          .eq("status", "pending")
          .gte("created_at", `${today}T00:00:00`)
          .lt("created_at", `${today}T23:59:59`);

        // Fetch active drivers
        const { data: drivers } = await supabase
          .from("drivers")
          .select("*")
          .eq("organization_id", org.id)
          .eq("is_active", true);

        if (!orders?.length || !drivers?.length) {
          results.push({ organization_id: org.id, message: "No pending orders or active drivers" });
          continue;
        }

        // Get depot (organization address)
        const { data: orgData } = await supabase
          .from("organizations")
          .select("name, address, latitude, longitude")
          .eq("id", org.id)
          .single();

        const depot = orgData || {
          name: "Depot",
          address: "Main Warehouse",
          latitude: 19.0760,
          longitude: 72.8777,
        };

        // Import routing function
        const { createRouteRequestFromOrders, solveVRP } = await import("@routeplan/routing");
        type OptimizedRoute = {
          vehicleId: string;
          driverId: string;
          driverName: string;
          driverPhone: string;
          stops: Array<{
            locationId: string;
            locationName: string;
            sequence: number;
            arrivalTime: string;
            departureTime: string;
            distanceFromPreviousKm: number;
            durationFromPreviousMin: number;
            cumulativeDistanceKm: number;
            cumulativeDurationMin: number;
            loadKg: number;
            loadL: number;
          }>;
          totalDistanceKm: number;
          totalDurationMin: number;
          totalLoadKg: number;
          totalLoadL: number;
          utilizationPct: number;
          cost: number;
          polyline?: string;
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
            organization_id: org.id,
            driver_id: r.driverId,
            name: `Route ${today} - ${r.driverName}`,
            date: today,
            status: "planned",
            optimized_order: r.stops.filter((s: { locationId: string }) => s.locationId !== "depot").map((s: { locationId: string }) => s.locationId),
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
                  .filter((s: { locationId: string }) => s.locationId !== "depot" && s.locationId !== `driver-home-${route.driver_id}`)
                  .map((s: { locationId: string }) => s.locationId);

                await supabase
                  .from("orders")
                  .update({ route_id: route.id, status: "assigned", driver_id: route.driver_id })
                  .in("id", orderIds);
              }
            }
          }

          // Log usage
          await supabase.rpc("log_usage", {
            p_organization_id: org.id,
            p_metric: "routes_optimized",
            p_count: 1,
            p_metadata: {
              vehicles_used: result.summary.vehiclesUsed,
              locations_served: result.summary.locationsServed,
              total_distance_km: result.summary.totalDistanceKm,
            },
          });

          results.push({
            organization_id: org.id,
            routes_created: result.routes.length,
            orders_assigned: result.summary.locationsServed,
            total_distance_km: result.summary.totalDistanceKm,
          });
        } else {
          results.push({ organization_id: org.id, message: "No routes generated" });
        }
      } catch (orgError) {
        console.error(`Error processing org ${org.id}:`, orgError);
        results.push({ organization_id: org.id, error: String(orgError) });
      }
    }

    return NextResponse.json({ success: true, processed: organizations.length, results });
  } catch (error) {
    console.error("Cron daily routes error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  // For testing via browser
  return POST(request);
}