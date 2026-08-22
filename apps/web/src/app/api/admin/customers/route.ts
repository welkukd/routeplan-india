import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@routeplan/db";
import { Database } from "@routeplan/db";

type Customer = Database["public"]["Tables"]["customers"]["Row"];
type CustomerInsert = Database["public"]["Tables"]["customers"]["Insert"];
type CustomerUpdate = Database["public"]["Tables"]["customers"]["Update"];

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

    // Search
    const search = searchParams.get("search") || "";

    // Filters
    const status = searchParams.get("status") || "";
    const tags = searchParams.get("tags") || "";
    const city = searchParams.get("city") || "";
    const state = searchParams.get("state") || "";

    // Build query
    let query = supabase
      .from("customers")
      .select("*", { count: "exact" })
      .eq("organization_id", DEFAULT_ORG_ID)
      .order("created_at", { ascending: false });

    // Apply search
    if (search) {
      query = query.or(
        `name.ilike.%${search}%,phone.ilike.%${search}%,email.ilike.%${search}%,address.ilike.%${search}%,city.ilike.%${search}%`
      );
    }

    // Apply filters
    if (status) {
      query = query.eq("status", status);
    }
    if (tags) {
      query = query.contains("tags", [tags]);
    }
    if (city) {
      query = query.ilike("city", `%${city}%`);
    }
    if (state) {
      query = query.ilike("state", `%${state}%`);
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    const { data: customers, error, count } = await query;

    if (error) {
      console.error("Supabase error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      customers: customers || [],
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

    const customerData: CustomerInsert = {
      organization_id: DEFAULT_ORG_ID,
      name: body.name,
      phone: body.phone,
      email: body.email || null,
      address: body.address,
      city: body.city || null,
      state: body.state || null,
      pincode: body.pincode || null,
      latitude: body.latitude || null,
      longitude: body.longitude || null,
      delivery_instructions: body.delivery_instructions || null,
      tags: body.tags || [],
      gstin: body.gstin || null,
    };

    const { data: customer, error } = await supabase
      .from("customers")
      .insert(customerData)
      .select()
      .single();

    if (error) {
      console.error("Supabase error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ customer }, { status: 201 });
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}