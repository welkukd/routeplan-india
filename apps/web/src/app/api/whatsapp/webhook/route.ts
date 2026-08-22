import { NextRequest, NextResponse } from "next/server";
import { createGupshupClient, GupshupWebhookSchema, ROUTEPLAN_TEMPLATES } from "@routeplan/whatsapp";
import { createServerClient } from "@routeplan/db";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const client = createGupshupClient();
    const supabase = createServerClient();

    // Verify webhook signature
    const signature = request.headers.get("x-gupshup-signature") || "";
    const payload = await request.text();
    
    if (!client.verifyWebhookSignature(payload, signature)) {
      console.error("Invalid Gupshup webhook signature");
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    const body = JSON.parse(payload);
    const webhook = GupshupWebhookSchema.parse(body);

    // Process incoming message
    if (webhook.message) {
      const msg = webhook.message;
      const from = msg.from; // Format: 91XXXXXXXXXX
      
      // Find organization by Gupshup app ID
      const { data: org } = await supabase
        .from("organizations")
        .select("id, name, gupshup_app_id")
        .eq("gupshup_app_id", webhook.app_id)
        .single();

      if (!org) {
        console.error("Organization not found for app_id:", webhook.app_id);
        return NextResponse.json({ error: "Organization not found" }, { status: 404 });
      }

      // Log incoming message
      await supabase.from("whatsapp_messages").insert({
        organization_id: org.id,
        to_number: webhook.app_id,
        from_number: from,
        type: msg.type,
        content: msg,
        status: "delivered",
      });

      // Handle different message types
      if (msg.type === "text" && msg.text) {
        await handleTextMessage(supabase, client, org, from, msg.text.body);
      } else if (msg.type === "interactive" && msg.interactive) {
        await handleInteractiveMessage(supabase, client, org, from, msg.interactive);
      } else if (msg.type === "location" && msg.location) {
        await handleLocationMessage(supabase, client, org, from, msg.location);
      }
    }

    // Process status updates
    if (webhook.statuses) {
      for (const status of webhook.statuses) {
        await supabase
          .from("whatsapp_messages")
          .update({
            status: status.status,
            delivered_at: status.status === "delivered" ? new Date().toISOString() : undefined,
            read_at: status.status === "read" ? new Date().toISOString() : undefined,
          })
          .eq("gupshup_message_id", status.id);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("WhatsApp webhook error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

async function handleTextMessage(
  supabase: any,
  client: any,
  org: any,
  from: string,
  text: string
) {
  const normalizedText = text.trim().toLowerCase();

  // Check if user exists in organization
  const { data: user } = await supabase
    .from("users")
    .select("*")
    .eq("organization_id", org.id)
    .eq("phone", from)
    .single();

  // Check if customer exists
  const { data: customer } = await supabase
    .from("customers")
    .select("*")
    .eq("organization_id", org.id)
    .eq("phone", from)
    .single();

  // Handle keywords
  if (normalizedText === "start" || normalizedText === "hi" || normalizedText === "hello") {
    if (!user && !customer) {
      // New user - send welcome template
      const welcomeTemplate = ROUTEPLAN_TEMPLATES.find((t) => t.name === "routeplan_welcome");
      if (welcomeTemplate) {
        await client.sendTemplateMessage(welcomeTemplate, from);
      }
    } else {
      await client.sendTextMessage(from, `Welcome back! How can I help you today?`);
    }
    return;
  }

  // Business type selection
  if (["1", "2", "3", "4", "5"].includes(normalizedText)) {
    const businessTypes = {
      "1": "Dairy",
      "2": "Pharmacy",
      "3": "Bakery",
      "4": "Kirana",
      "5": "Other",
    };
    
    await supabase.from("organizations").update({
      settings: { business_type: businessTypes[normalizedText as keyof typeof businessTypes] },
    }).eq("id", org.id);

    await client.sendTextMessage(
      from,
      `Great! You're set up as a ${businessTypes[normalizedText as keyof typeof businessTypes]} business.\n\nNext steps:\n1. Add your delivery stops (addresses)\n2. Add driver WhatsApp numbers\n3. Set delivery time windows\n\nReply "ADD STOP" to add your first delivery location, or "ADD DRIVER" to add a driver.`
    );
    return;
  }

  // Add stop flow
  if (normalizedText === "add stop") {
    await client.sendTextMessage(
      from,
      `Please send the delivery address as a WhatsApp location (tap 📎 > Location > Send Your Current Location), or reply with:\n\nName: [Customer Name]\nAddress: [Full Address]\nPincode: [6-digit PIN]\nTime Window: [HH:MM-HH:MM] (optional)`
    );
    return;
  }

  // Add driver flow
  if (normalizedText === "add driver") {
    await client.sendTextMessage(
      from,
      `Please provide driver details:\n\nName: [Driver Name]\nPhone: [91XXXXXXXXXX]\nVehicle: [bike/auto/van/truck]\nCapacity (kg): [Number]`
    );
    return;
  }

  // Generate route
  if (normalizedText === "generate route" || normalizedText === "route") {
    await client.sendTextMessage(from, "Generating optimized route... This will take a moment.");
    // TODO: Trigger route optimization
    return;
  }

  // Help
  if (normalizedText === "help") {
    await client.sendTextMessage(
      from,
      `RoutePlan India Commands:\n\n` +
      `START / HI - Welcome menu\n` +
      `ADD STOP - Add delivery stop\n` +
      `ADD DRIVER - Add driver\n` +
      `ROUTE - Generate today's route\n` +
      `STATUS - Check order status\n` +
      `HELP - Show this menu\n\n` +
      `For support, reply SUPPORT`
    );
    return;
  }

  // Default response
  await client.sendTextMessage(
    from,
    `I didn't understand that. Reply HELP for commands, or START to begin.`
  );
}

async function handleInteractiveMessage(
  supabase: any,
  client: any,
  org: any,
  from: string,
  interactive: any
) {
  if (interactive.type === "button_reply") {
    const buttonId = interactive.button_reply.id;
    
    switch (buttonId) {
      case "start_route":
        await client.sendTextMessage(from, "Starting route navigation... Opening map.");
        break;
      case "view_details":
        await client.sendTextMessage(from, "Route details: [Link to route details page]");
        break;
      case "reschedule":
        await client.sendTextMessage(from, "Please reply with new date (DD-MM-YYYY) or time window.");
        break;
      case "accept":
        await client.sendTextMessage(from, "Route accepted! Starting navigation.");
        break;
      case "decline":
        await client.sendTextMessage(from, "Route declined. Manager notified.");
        break;
      case "pay_now":
        await client.sendTextMessage(from, "Payment link: [Razorpay payment link]");
        break;
      default:
        await client.sendTextMessage(from, `Button pressed: ${buttonId}`);
    }
  } else if (interactive.type === "list_reply") {
    const listId = interactive.list_reply.id;
    await client.sendTextMessage(from, `Selected: ${interactive.list_reply.title}`);
  }
}

async function handleLocationMessage(
  supabase: any,
  client: any,
  org: any,
  from: string,
  location: any
) {
  // Save as customer location
  const { data: customer } = await supabase
    .from("customers")
    .upsert({
      organization_id: org.id,
      phone: from,
      name: `Customer ${from.slice(-4)}`,
      address: location.address || "Location shared via WhatsApp",
      latitude: location.latitude,
      longitude: location.longitude,
      pincode: location.address?.match(/\b\d{6}\b/)?.[0] || null,
    })
    .select()
    .single();

  if (customer) {
    await client.sendTextMessage(
      from,
      `✅ Location saved for ${customer.name}!\n\nAddress: ${customer.address}\nPincode: ${customer.pincode || "Not detected"}\n\nReply "ADD STOP" to add another, or "ROUTE" to generate optimized route.`
    );
  }
}