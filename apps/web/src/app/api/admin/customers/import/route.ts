import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@routeplan/db";
import { Database } from "@routeplan/db";

export const dynamic = "force-dynamic";

type CustomerInsert = Database["public"]["Tables"]["customers"]["Insert"];

const DEFAULT_ORG_ID = "org-demo";

interface CSVRow {
  name: string;
  phone: string;
  email?: string;
  address: string;
  city?: string;
  state?: string;
  pincode?: string;
  latitude?: string;
  longitude?: string;
  delivery_instructions?: string;
  tags?: string;
  gstin?: string;
}

function parseCSV(csvText: string): CSVRow[] {
  const lines = csvText.trim().split("\n");
  if (lines.length < 2) return [];

  const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());
  const rows: CSVRow[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(",").map((v) => v.trim().replace(/^"|"$/g, ""));
    if (values.length < headers.length) continue;

    const row: CSVRow = {} as CSVRow;
    headers.forEach((header, index) => {
      row[header as keyof CSVRow] = values[index] || "";
    });
    rows.push(row);
  }

  return rows;
}

function validateRow(row: CSVRow): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!row.name || row.name.trim() === "") {
    errors.push("Name is required");
  }
  if (!row.phone || row.phone.trim() === "") {
    errors.push("Phone is required");
  }
  if (!row.address || row.address.trim() === "") {
    errors.push("Address is required");
  }

  // Validate phone format (basic check)
  if (row.phone && !/^[\d+\-\s()]{10,}$/.test(row.phone.replace(/\s/g, ""))) {
    errors.push("Invalid phone format");
  }

  // Validate email if provided
  if (row.email && row.email.trim() !== "" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(row.email)) {
    errors.push("Invalid email format");
  }

  // Validate coordinates if provided
  if (row.latitude) {
    const lat = parseFloat(row.latitude);
    if (isNaN(lat) || lat < -90 || lat > 90) {
      errors.push("Invalid latitude");
    }
  }
  if (row.longitude) {
    const lng = parseFloat(row.longitude);
    if (isNaN(lng) || lng < -180 || lng > 180) {
      errors.push("Invalid longitude");
    }
  }

  return { valid: errors.length === 0, errors };
}

function transformRow(row: CSVRow): CustomerInsert {
  const tags = row.tags ? row.tags.split(";").map((t) => t.trim()).filter(Boolean) : [];

  return {
    organization_id: DEFAULT_ORG_ID,
    name: row.name.trim(),
    phone: row.phone.trim(),
    email: row.email?.trim() || null,
    address: row.address.trim(),
    city: row.city?.trim() || null,
    state: row.state?.trim() || null,
    pincode: row.pincode?.trim() || null,
    latitude: row.latitude ? parseFloat(row.latitude) : null,
    longitude: row.longitude ? parseFloat(row.longitude) : null,
    delivery_instructions: row.delivery_instructions?.trim() || null,
    tags: tags.length > 0 ? tags : null,
    gstin: row.gstin?.trim() || null,
  };
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerClient();
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (!file.name.endsWith(".csv")) {
      return NextResponse.json({ error: "File must be a CSV" }, { status: 400 });
    }

    const csvText = await file.text();
    const rows = parseCSV(csvText);

    if (rows.length === 0) {
      return NextResponse.json({ error: "CSV file is empty or invalid" }, { status: 400 });
    }

    const results = {
      total: rows.length,
      successful: 0,
      failed: 0,
      errors: [] as Array<{ row: number; errors: string[]; data: CSVRow }>,
    };

    // Process each row
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const validation = validateRow(row);

      if (!validation.valid) {
        results.failed++;
        results.errors.push({ row: i + 1, errors: validation.errors, data: row });
        continue;
      }

      const customerData = transformRow(row);

      const { error } = await supabase.from("customers").insert(customerData);

      if (error) {
        results.failed++;
        results.errors.push({ row: i + 1, errors: [error.message], data: row });
      } else {
        results.successful++;
      }
    }

    return NextResponse.json(results);
  } catch (error) {
    console.error("CSV import error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET() {
  // Return CSV template
  const template = `name,phone,email,address,city,state,pincode,latitude,longitude,delivery_instructions,tags,gstin
"Sharma Dairy","+919876543210","sharma@dairy.com","Shop 12, SV Road, Jogeshwari West","Mumbai","Maharashtra","400102","19.1383","72.8303","Leave at door if closed","dairy;wholesale","27AAAAA0000A1Z5"
"Patel Kirana","+919876543211","patel@kirana.com","Main Road, Goregaon East","Mumbai","Maharashtra","400063","19.1667","72.8562","Call on arrival","kirana;retail","27BBBBB0000B2Z6"
"Gupta Pharmacy","+919876543212","gupta@pharmacy.com","Link Road, Malad West","Mumbai","Maharashtra","400064","19.1889","72.8479","Urgent - temperature sensitive","pharmacy;medical","27CCCCC0000C3Z7"`;

  return new NextResponse(template, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": 'attachment; filename="customers-template.csv"',
    },
  });
}