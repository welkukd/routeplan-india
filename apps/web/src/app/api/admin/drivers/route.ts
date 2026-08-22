import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@routeplan/db";
import { Database } from "@routeplan/db";

type DriverRow = Database["public"]["Tables"]["drivers"]["Row"];

// Default organization ID for demo purposes
const DEFAULT_ORG_ID = "org-demo";

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient();
    const searchParams = request.nextUrl.searchParams;

    // Pagination
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = (page - 1) * limit;

    // Filters
    const isActive = searchParams.get("is_active");
    const vehicleType = searchParams.get("vehicle_type");
    const search = searchParams.get("search") || "";

    // Build query
    let query = supabase
      .from("drivers")
      .select("*", { count: "exact" })
      .eq("organization_id", DEFAULT_ORG_ID)
      .order("created_at", { ascending: false });

    // Apply filters
    if (isActive !== null && isActive !== "") {
      query = query.eq("is_active", isActive === "true");
    }
    if (vehicleType) {
      query = query.eq("vehicle_type", vehicleType);
    }
    if (search) {
      query = query.or(`name.ilike.%${search}%,phone.ilike.%${search}%,vehicle_number.ilike.%${search}%`);
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    const { data: drivers, error, count } = await query;

    if (error) {
      console.error("Supabase error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      drivers: drivers || [],
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