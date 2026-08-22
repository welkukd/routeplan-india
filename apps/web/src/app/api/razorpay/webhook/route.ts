import { NextRequest, NextResponse } from "next/server";
import { createRazorpayClient } from "@routeplan/payments";
import { createServerClient } from "@routeplan/db";

export async function POST(request: NextRequest) {
  try {
    const client = createRazorpayClient();
    const supabase = createServerClient();

    // Verify webhook signature
    const signature = request.headers.get("x-razorpay-signature") || "";
    const payload = await request.text();
    
    if (!client.verifyWebhookSignature(payload, signature)) {
      console.error("Invalid Razorpay webhook signature");
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    const body = JSON.parse(payload);
    const event = body.event;
    const payload_data = body.payload;

    console.log(`Razorpay webhook: ${event}`);

    switch (event) {
      case "payment.captured":
      case "payment.failed":
        await handlePaymentEvent(supabase, payload_data.payment.entity);
        break;
      case "order.paid":
        await handleOrderPaid(supabase, payload_data.order.entity);
        break;
      case "subscription.authenticated":
      case "subscription.activated":
      case "subscription.charged":
      case "subscription.completed":
      case "subscription.cancelled":
      case "subscription.paused":
      case "subscription.resumed":
        await handleSubscriptionEvent(supabase, event, payload_data.subscription.entity);
        break;
      case "invoice.issued":
      case "invoice.paid":
        await handleInvoiceEvent(supabase, event, payload_data.invoice.entity);
        break;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Razorpay webhook error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

async function handlePaymentEvent(supabase: any, payment: any) {
  // Find subscription by order_id or notes
  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("*")
    .or(`razorpay_subscription_id.eq.${payment.order_id},notes->>order_id.eq.${payment.order_id}`)
    .single();

  if (subscription) {
    await supabase.from("subscriptions").update({
      status: payment.status === "captured" ? "active" : "failed",
      notes: { ...subscription.notes, last_payment_id: payment.id, last_payment_status: payment.status },
    }).eq("id", subscription.id);

    // Log usage
    await supabase.rpc("log_usage", {
      p_organization_id: subscription.organization_id,
      p_metric: "api_calls",
      p_count: 1,
    });
  }
}

async function handleOrderPaid(supabase: any, order: any) {
  // Find organization by receipt or notes
  const { data: org } = await supabase
    .from("organizations")
    .select("id")
    .eq("razorpay_account_id", order.notes?.account_id || "")
    .single();

  if (org) {
    await supabase.rpc("log_usage", {
      p_organization_id: org.id,
      p_metric: "api_calls",
      p_count: 1,
    });
  }
}

async function handleSubscriptionEvent(supabase: any, event: string, subscription: any) {
  const statusMap: Record<string, string> = {
    "subscription.authenticated": "authenticated",
    "subscription.activated": "active",
    "subscription.charged": "active",
    "subscription.completed": "completed",
    "subscription.cancelled": "cancelled",
    "subscription.paused": "paused",
    "subscription.resumed": "active",
  };

  const newStatus = statusMap[event] || "active";

  const { data: existingSub } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("razorpay_subscription_id", subscription.id)
    .single();

  if (existingSub) {
    await supabase.from("subscriptions").update({
      status: newStatus,
      current_period_start: subscription.current_start ? new Date(subscription.current_start * 1000).toISOString() : null,
      current_period_end: subscription.current_end ? new Date(subscription.current_end * 1000).toISOString() : null,
      quantity: subscription.quantity,
      notes: { ...existingSub.notes, last_event: event, last_event_at: new Date().toISOString() },
    }).eq("id", existingSub.id);

    // Log usage
    await supabase.rpc("log_usage", {
      p_organization_id: existingSub.organization_id,
      p_metric: "api_calls",
      p_count: 1,
    });
  } else {
    // Create new subscription record
    const { data: org } = await supabase
      .from("organizations")
      .select("id")
      .eq("razorpay_account_id", subscription.notes?.account_id || "")
      .single();

    if (org) {
      await supabase.from("subscriptions").insert({
        organization_id: org.id,
        razorpay_subscription_id: subscription.id,
        razorpay_plan_id: subscription.plan_id,
        status: newStatus,
        current_period_start: subscription.current_start ? new Date(subscription.current_start * 1000).toISOString() : null,
        current_period_end: subscription.current_end ? new Date(subscription.current_end * 1000).toISOString() : null,
        quantity: subscription.quantity,
        notes: { ...subscription.notes, created_from_webhook: true },
      });
    }
  }
}

async function handleInvoiceEvent(supabase: any, event: string, invoice: any) {
  // Log invoice events
  if (invoice.subscription_id) {
    const { data: sub } = await supabase
      .from("subscriptions")
      .select("organization_id")
      .eq("razorpay_subscription_id", invoice.subscription_id)
      .single();

    if (sub) {
      await supabase.rpc("log_usage", {
        p_organization_id: sub.organization_id,
        p_metric: "api_calls",
        p_count: 1,
      });
    }
  }
}