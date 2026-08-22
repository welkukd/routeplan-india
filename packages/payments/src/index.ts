import { z } from "zod";

const RAZORPAY_BASE_URL = "https://api.razorpay.com/v1";

export const RazorpayConfigSchema = z.object({
  keyId: z.string().min(1),
  keySecret: z.string().min(1),
  webhookSecret: z.string().min(1),
});

export type RazorpayConfig = z.infer<typeof RazorpayConfigSchema>;

export const RazorpayCustomerSchema = z.object({
  name: z.string().min(1),
  email: z.string().email().optional(),
  contact: z.string().regex(/^\+?91\d{10}$/),
  gstin: z.string().optional(),
  notes: z.record(z.string()).optional(),
});

export type RazorpayCustomer = z.infer<typeof RazorpayCustomerSchema>;

export const RazorpayPlanSchema = z.object({
  period: z.enum(["daily", "weekly", "monthly", "yearly"]),
  interval: z.number().int().positive().default(1),
  item: z.object({
    name: z.string(),
    amount: z.number().int().positive(), // in paise
    currency: z.string().default("INR"),
    description: z.string().optional(),
  }),
  notes: z.record(z.string()).optional(),
});

export type RazorpayPlan = z.infer<typeof RazorpayPlanSchema>;

export const RazorpaySubscriptionSchema = z.object({
  plan_id: z.string(),
  customer_id: z.string().optional(),
  customer_notify: z.number().int().min(0).max(1).default(1),
  total_count: z.number().int().positive().optional(), // null = infinite
  quantity: z.number().int().positive().default(1),
  start_at: z.number().int().optional(), // unix timestamp
  expire_by: z.number().int().optional(), // unix timestamp
  addons: z.array(z.object({ item: z.object({ name: z.string(), amount: z.number().int().positive(), currency: z.string().default("INR") }) })).optional(),
  notes: z.record(z.string()).optional(),
});

export type RazorpaySubscription = z.infer<typeof RazorpaySubscriptionSchema>;

export const RazorpayPaymentLinkSchema = z.object({
  amount: z.number().int().positive(), // in paise
  currency: z.string().default("INR"),
  accept_partial: z.boolean().default(false),
  first_min_partial_amount: z.number().int().positive().optional(),
  description: z.string().optional(),
  customer: z.object({
    name: z.string().min(1),
    email: z.string().email().optional(),
    contact: z.string().regex(/^\+?91\d{10}$/),
  }),
  notify: z.object({
    sms: z.boolean().default(true),
    email: z.boolean().default(true),
  }).optional(),
  reminder_enable: z.boolean().default(true),
  notes: z.record(z.string()).optional(),
  callback_url: z.string().url().optional(),
  callback_method: z.enum(["get", "post"]).default("get"),
});

export type RazorpayPaymentLink = z.infer<typeof RazorpayPaymentLinkSchema>;

export const RazorpayWebhookSchema = z.object({
  entity: z.string().default("event"),
  account_id: z.string(),
  event: z.string(),
  contains: z.array(z.string()),
  payload: z.object({
    payment: z.object({
      entity: z.object({
        id: z.string(),
        entity: z.string(),
        amount: z.number(),
        currency: z.string(),
        status: z.string(),
        order_id: z.string().optional(),
        invoice_id: z.string().optional(),
        international: z.boolean(),
        method: z.string(),
        amount_refunded: z.number(),
        refund_status: z.string().optional(),
        captured: z.boolean(),
        description: z.string().optional(),
        card_id: z.string().optional(),
        bank: z.string().optional(),
        wallet: z.string().optional(),
        vpa: z.string().optional(),
        email: z.string().optional(),
        contact: z.string().optional(),
        notes: z.record(z.string()),
        fee: z.number(),
        tax: z.number(),
        error_code: z.string().optional(),
        error_description: z.string().optional(),
        created_at: z.number(),
      }),
    }).optional(),
    order: z.object({
      entity: z.object({
        id: z.string(),
        entity: z.string(),
        amount: z.number(),
        amount_paid: z.number(),
        amount_due: z.number(),
        currency: z.string(),
        receipt: z.string().optional(),
        offer_id: z.string().optional(),
        status: z.string(),
        attempts: z.number(),
        notes: z.record(z.string()),
        created_at: z.number(),
      }),
    }).optional(),
    subscription: z.object({
      entity: z.object({
        id: z.string(),
        entity: z.string(),
        plan_id: z.string(),
        customer_id: z.string(),
        status: z.string(),
        current_start: z.number(),
        current_end: z.number(),
        ended_at: z.number().optional(),
        quantity: z.number(),
        charge_at: z.number(),
        start_at: z.number(),
        end_at: z.number(),
        auth_attempts: z.number(),
        total_count: z.number(),
        paid_count: z.number(),
        customer_notify: z.boolean(),
        created_at: z.number(),
        expires_at: z.number().optional(),
        short_url: z.string().optional(),
        has_scheduled_changes: z.boolean(),
        change_scheduled_at: z.number().optional(),
        remaining_count: z.number().optional(),
      }),
    }).optional(),
    invoice: z.object({
      entity: z.object({
        id: z.string(),
        entity: z.string(),
        type: z.string(),
        status: z.string(),
        amount: z.number(),
        amount_paid: z.number(),
        amount_due: z.number(),
        currency: z.string(),
        receipt: z.string().optional(),
        customer_id: z.string(),
        subscription_id: z.string().optional(),
        notes: z.record(z.string()),
        created_at: z.number(),
      }),
    }).optional(),
  }),
  created_at: z.number(),
});

export type RazorpayWebhook = z.infer<typeof RazorpayWebhookSchema>;

export class RazorpayClient {
  private config: RazorpayConfig;
  private authHeader: string;

  constructor(config: RazorpayConfig) {
    this.config = RazorpayConfigSchema.parse(config);
    const credentials = Buffer.from(`${this.config.keyId}:${this.config.keySecret}`).toString("base64");
    this.authHeader = `Basic ${credentials}`;
  }

  private async request<T>(method: string, path: string, body?: unknown): Promise<T> {
    const url = `${RAZORPAY_BASE_URL}${path}`;
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Authorization: this.authHeader,
    };

    const response = await fetch(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Razorpay API error: ${response.status} ${error}`);
    }

    return response.json();
  }

  // Customers
  async createCustomer(customer: RazorpayCustomer): Promise<{ id: string; entity: string }> {
    return this.request("POST", "/customers", customer);
  }

  async getCustomer(customerId: string): Promise<unknown> {
    return this.request("GET", `/customers/${customerId}`);
  }

  async updateCustomer(customerId: string, data: Partial<RazorpayCustomer>): Promise<unknown> {
    return this.request("PATCH", `/customers/${customerId}`, data);
  }

  // Plans
  async createPlan(plan: RazorpayPlan): Promise<{ id: string; entity: string }> {
    return this.request("POST", "/plans", plan);
  }

  async getPlan(planId: string): Promise<unknown> {
    return this.request("GET", `/plans/${planId}`);
  }

  // Subscriptions
  async createSubscription(subscription: RazorpaySubscription): Promise<{ id: string; entity: string; short_url: string }> {
    return this.request("POST", "/subscriptions", subscription);
  }

  async getSubscription(subscriptionId: string): Promise<unknown> {
    return this.request("GET", `/subscriptions/${subscriptionId}`);
  }

  async cancelSubscription(subscriptionId: string, cancelAtCycleEnd: boolean = false): Promise<unknown> {
    return this.request("POST", `/subscriptions/${subscriptionId}/cancel`, {
      cancel_at_cycle_end: cancelAtCycleEnd ? 1 : 0,
    });
  }

  async pauseSubscription(subscriptionId: string): Promise<unknown> {
    return this.request("POST", `/subscriptions/${subscriptionId}/pause`);
  }

  async resumeSubscription(subscriptionId: string): Promise<unknown> {
    return this.request("POST", `/subscriptions/${subscriptionId}/resume`);
  }

  // Payment Links
  async createPaymentLink(link: RazorpayPaymentLink): Promise<{ id: string; short_url: string; entity: string }> {
    return this.request("POST", "/payment_links", link);
  }

  async getPaymentLink(linkId: string): Promise<unknown> {
    return this.request("GET", `/payment_links/${linkId}`);
  }

  async cancelPaymentLink(linkId: string): Promise<unknown> {
    return this.request("POST", `/payment_links/${linkId}/cancel`);
  }

  // Orders (for one-time payments)
  async createOrder(data: {
    amount: number;
    currency: string;
    receipt?: string;
    notes?: Record<string, string>;
    partial_payment?: boolean;
    first_payment_min_amount?: number;
  }): Promise<{ id: string; entity: string }> {
    return this.request("POST", "/orders", data);
  }

  async getOrder(orderId: string): Promise<unknown> {
    return this.request("GET", `/orders/${orderId}`);
  }

  // Payments
  async getPayment(paymentId: string): Promise<unknown> {
    return this.request("GET", `/payments/${paymentId}`);
  }

  async capturePayment(paymentId: string, amount: number): Promise<unknown> {
    return this.request("POST", `/payments/${paymentId}/capture`, { amount });
  }

  async refundPayment(paymentId: string, amount?: number, notes?: Record<string, string>): Promise<unknown> {
    return this.request("POST", `/payments/${paymentId}/refund`, { amount, notes });
  }

  // Invoices
  async createInvoice(data: {
    type: "link" | "subscription";
    customer_id: string;
    line_items: Array<{
      name: string;
      description?: string;
      amount: number;
      currency: string;
      quantity: number;
    }>;
    billing_address?: Record<string, string>;
    shipping_address?: Record<string, string>;
    notes?: Record<string, string>;
    subscription_id?: string;
  }): Promise<{ id: string; short_url: string }> {
    return this.request("POST", "/invoices", data);
  }

  // Webhook verification
  verifyWebhookSignature(payload: string, signature: string): boolean {
    const crypto = require("crypto");
    const expectedSignature = crypto
      .createHmac("sha256", this.config.webhookSecret)
      .update(payload)
      .digest("hex");
    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature));
  }
}

export function createRazorpayClient(): RazorpayClient {
  return new RazorpayClient({
    keyId: process.env.RAZORPAY_KEY_ID!,
    keySecret: process.env.RAZORPAY_KEY_SECRET!,
    webhookSecret: process.env.RAZORPAY_WEBHOOK_SECRET!,
  });
}

// RoutePlan India Plans
export const ROUTEPLAN_PLANS: RazorpayPlan[] = [
  {
    period: "monthly",
    interval: 1,
    item: {
      name: "RoutePlan Growth",
      amount: 299900, // ₹2,999 in paise
      currency: "INR",
      description: "Up to 10,000 WhatsApp conversations, 25 drivers, priority routing, API access",
    },
    notes: {
      tier: "growth",
      whatsapp_conversations: "10000",
      drivers: "25",
    },
  },
  {
    period: "monthly",
    interval: 1,
    item: {
      name: "RoutePlan Enterprise",
      amount: 999900, // ₹9,999 in paise
      currency: "INR",
      description: "Unlimited conversations, unlimited drivers, custom integrations, dedicated support, SLA",
    },
    notes: {
      tier: "enterprise",
      whatsapp_conversations: "unlimited",
      drivers: "unlimited",
    },
  },
];

// GST Invoice generation helper
export function generateGSTInvoiceData(params: {
  invoiceNumber: string;
  date: string;
  dueDate: string;
  supplier: {
    name: string;
    address: string;
    gstin: string;
    state: string;
    stateCode: string;
  };
  recipient: {
    name: string;
    address: string;
    gstin?: string;
    state: string;
    stateCode: string;
  };
  items: Array<{
    description: string;
    hsnCode: string;
    quantity: number;
    unit: string;
    rate: number;
    taxableValue: number;
    cgstRate: number;
    sgstRate: number;
    igstRate: number;
  }>;
  placeOfSupply: string;
}): string {
  const { supplier, recipient, items, placeOfSupply } = params;
  
  let totalTaxable = 0;
  let totalCGST = 0;
  let totalSGST = 0;
  let totalIGST = 0;

  const itemRows = items.map((item, idx) => {
    const cgstAmount = (item.taxableValue * item.cgstRate) / 100;
    const sgstAmount = (item.taxableValue * item.sgstRate) / 100;
    const igstAmount = (item.taxableValue * item.igstRate) / 100;
    
    totalTaxable += item.taxableValue;
    totalCGST += cgstAmount;
    totalSGST += sgstAmount;
    totalIGST += igstAmount;

    return `
      <tr>
        <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${idx + 1}</td>
        <td style="border: 1px solid #ddd; padding: 8px;">${item.description}</td>
        <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${item.hsnCode}</td>
        <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${item.quantity}</td>
        <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${item.unit}</td>
        <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">₹${item.rate.toFixed(2)}</td>
        <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">₹${item.taxableValue.toFixed(2)}</td>
        <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${item.cgstRate}%</td>
        <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">₹${cgstAmount.toFixed(2)}</td>
        <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${item.sgstRate}%</td>
        <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">₹${sgstAmount.toFixed(2)}</td>
        <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${item.igstRate}%</td>
        <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">₹${igstAmount.toFixed(2)}</td>
        <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">₹${(item.taxableValue + cgstAmount + sgstAmount + igstAmount).toFixed(2)}</td>
      </tr>
    `;
  }).join("");

  const grandTotal = totalTaxable + totalCGST + totalSGST + totalIGST;
  const isInterState = supplier.stateCode !== recipient.stateCode;

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; margin: 20px; }
    .header { text-align: center; margin-bottom: 30px; }
    .company-name { font-size: 24px; font-weight: bold; color: #1a1a1a; }
    .invoice-title { font-size: 18px; margin-top: 10px; }
    .details { display: flex; justify-content: space-between; margin-bottom: 20px; }
    .party { width: 48%; }
    .party h4 { margin: 0 0 10px 0; color: #333; }
    .party p { margin: 2px 0; font-size: 14px; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 12px; }
    th { background: #f5f5f5; border: 1px solid #ddd; padding: 8px; text-align: center; font-weight: bold; }
    .totals { text-align: right; margin-top: 20px; }
    .totals p { margin: 5px 0; font-size: 14px; }
    .grand-total { font-size: 18px; font-weight: bold; color: #1a1a1a; }
    .footer { margin-top: 40px; font-size: 12px; color: #666; }
    .bank-details { margin-top: 20px; font-size: 12px; }
  </style>
</head>
<body>
  <div class="header">
    <div class="company-name">${supplier.name}</div>
    <div class="invoice-title">TAX INVOICE</div>
    <div>GSTIN: ${supplier.gstin} | State: ${supplier.state} (${supplier.stateCode})</div>
  </div>

  <div class="details">
    <div class="party">
      <h4>Invoice Details</h4>
      <p><strong>Invoice No:</strong> ${params.invoiceNumber}</p>
      <p><strong>Date:</strong> ${params.date}</p>
      <p><strong>Due Date:</strong> ${params.dueDate}</p>
      <p><strong>Place of Supply:</strong> ${placeOfSupply}</p>
    </div>
    <div class="party">
      <h4>Bill To</h4>
      <p><strong>${recipient.name}</strong></p>
      <p>${recipient.address}</p>
      <p>GSTIN: ${recipient.gstin || "Unregistered"}</p>
      <p>State: ${recipient.state} (${recipient.stateCode})</p>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th style="width: 5%;">#</th>
        <th style="width: 25%;">Description</th>
        <th style="width: 8%;">HSN/SAC</th>
        <th style="width: 8%;">Qty</th>
        <th style="width: 8%;">Unit</th>
        <th style="width: 10%;">Rate</th>
        <th style="width: 10%;">Taxable Value</th>
        <th style="width: 5%;">CGST %</th>
        <th style="width: 7%;">CGST Amt</th>
        <th style="width: 5%;">SGST %</th>
        <th style="width: 7%;">SGST Amt</th>
        <th style="width: 5%;">IGST %</th>
        <th style="width: 7%;">IGST Amt</th>
        <th style="width: 8%;">Total</th>
      </tr>
    </thead>
    <tbody>
      ${itemRows}
    </tbody>
  </table>

  <div class="totals">
    <p><strong>Total Taxable Value:</strong> ₹${totalTaxable.toFixed(2)}</p>
    ${!isInterState ? `
      <p><strong>Total CGST (${(totalCGST/totalTaxable*100).toFixed(1)}%):</strong> ₹${totalCGST.toFixed(2)}</p>
      <p><strong>Total SGST (${(totalSGST/totalTaxable*100).toFixed(1)}%):</strong> ₹${totalSGST.toFixed(2)}</p>
    ` : `
      <p><strong>Total IGST (${(totalIGST/totalTaxable*100).toFixed(1)}%):</strong> ₹${totalIGST.toFixed(2)}</p>
    `}
    <p class="grand-total"><strong>Grand Total: ₹${grandTotal.toFixed(2)}</strong></p>
  </div>

  <div class="bank-details">
    <h4>Bank Details</h4>
    <p>Account Name: ${supplier.name}</p>
    <p>Account No: 000000000000 | IFSC: XXXX0000000</p>
    <p>Bank: HDFC Bank | Branch: Mumbai</p>
    <p>UPI: routepay@hdfcbank</p>
  </div>

  <div class="footer">
    <p><strong>Terms & Conditions:</strong> Payment due within 15 days. Late payment attracts 18% p.a. interest.</p>
    <p>This is a computer-generated invoice. No signature required.</p>
    <p>Subject to ${supplier.state} Jurisdiction.</p>
  </div>
</body>
</html>
  `;
}