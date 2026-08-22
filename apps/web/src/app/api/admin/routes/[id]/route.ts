import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@routeplan/db";
import { Database } from "@routeplan/db";

type RouteRow = Database["public"]["Tables"]["routes"]["Row"];

const DEFAULT_ORG_ID = "org-demo";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = createServerClient();
    const { id } = await params;

    const { data: route, error } = await supabase
      .from("routes")
      .select(`
        *,
        drivers:driver_id (
          id,
          name,
          phone,
          vehicle_type,
          vehicle_number,
          license_number,
          max_capacity_kg,
          home_latitude,
          home_longitude
        )
      `)
      .eq("id", id)
      .eq("organization_id", DEFAULT_ORG_ID)
      .single();

    if (error) {
      console.error("Supabase error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!route) {
      return NextResponse.json({ error: "Route not found" }, { status: 404 });
    }

    // Fetch stops (orders) for this route
    const { data: stops } = await supabase
      .from("orders")
      .select(`
        id,
        customer_id,
        order_number,
        status,
        priority,
        items,
        total_amount,
        tax_amount,
        discount_amount,
        delivery_window_start,
        delivery_window_end,
        actual_delivery_time,
        proof_of_delivery,
        notes,
        created_at,
        customers:customer_id (
          id,
          name,
          phone,
          email,
          address,
          city,
          state,
          pincode,
          latitude,
          longitude,
          delivery_instructions
        )
      `)
      .eq("route_id", id)
      .order("created_at");

    // Calculate route polyline if not present
    const stopsWithCoords = (stops || []).filter((s) => {
      const customer = Array.isArray(s.customers) ? s.customers[0] : s.customers;
      return customer?.latitude && customer?.longitude;
    });

    return NextResponse.json({
      route: {
        ...route,
        stops: stops || [],
        polyline: stopsWithCoords.length > 1
          ? stopsWithCoords.map((s) => {
              const customer = Array.isArray(s.customers) ? s.customers[0] : s.customers;
              return `${customer!.latitude.toFixed(6)},${customer!.longitude.toFixed(6)}`;
            }).join("|")
          : null,
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

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = createServerClient();
    const { id } = await params;
    const body = await request.json();

    const { data: route, error } = await supabase
      .from("routes")
      .update({
        ...body,
        updated_at: new Date().toISOString(),
      })
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

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = createServerClient();
    const { id } = await params;

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