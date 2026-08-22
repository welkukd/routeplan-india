import { z } from "zod";

const GUPSHUP_BASE_URL = "https://api.gupshup.io/sm/api/v1";

export const GupshupConfigSchema = z.object({
  apiKey: z.string().min(1),
  appId: z.string().min(1),
  webhookSecret: z.string().min(1),
});

export type GupshupConfig = z.infer<typeof GupshupConfigSchema>;

export const WhatsAppTemplateSchema = z.object({
  name: z.string().min(1),
  category: z.enum(["marketing", "utility", "authentication"]),
  language: z.string().default("en"),
  header: z.string().optional(),
  body: z.string().min(1),
  footer: z.string().optional(),
  buttons: z
    .array(
      z.object({
        type: z.enum(["quick_reply", "url", "phone_number"]),
        text: z.string().optional(),
        url: z.string().optional(),
        phone_number: z.string().optional(),
      })
    )
    .optional(),
});

export type WhatsAppTemplate = z.infer<typeof WhatsAppTemplateSchema>;

export const WhatsAppMessageSchema = z.object({
  to: z.string().regex(/^91\d{10}$/, "Must be Indian number in 91XXXXXXXXXX format"),
  type: z.enum(["template", "text", "image", "document", "location", "interactive"]),
  template: z
    .object({
      name: z.string(),
      language: z.object({
        code: z.string().default("en"),
        policy: z.enum(["deterministic", "fallback"]).default("deterministic"),
      }),
      components: z.array(z.record(z.unknown())).optional(),
    })
    .optional(),
  text: z
    .object({
      body: z.string(),
      preview_url: z.boolean().default(false),
    })
    .optional(),
  image: z
    .object({
      link: z.string().url(),
      caption: z.string().optional(),
    })
    .optional(),
  document: z
    .object({
      link: z.string().url(),
      filename: z.string().optional(),
      caption: z.string().optional(),
    })
    .optional(),
  location: z
    .object({
      latitude: z.number(),
      longitude: z.number(),
      name: z.string().optional(),
      address: z.string().optional(),
    })
    .optional(),
  interactive: z
    .object({
      type: z.enum(["button", "list", "product", "product_list"]),
      header: z
        .object({
          type: z.enum(["text", "image", "document", "video"]),
          text: z.string().optional(),
          image: z.object({ link: z.string().url() }).optional(),
          document: z.object({ link: z.string().url(), filename: z.string() }).optional(),
          video: z.object({ link: z.string().url() }).optional(),
        })
        .optional(),
      body: z.object({
        text: z.string(),
      }),
      footer: z.object({ text: z.string() }).optional(),
      action: z.record(z.unknown()),
    })
    .optional(),
});

export type WhatsAppMessage = z.infer<typeof WhatsAppMessageSchema>;

export const GupshupWebhookSchema = z.object({
  app_id: z.string(),
  message: z.object({
    id: z.string(),
    type: z.enum(["text", "image", "document", "audio", "video", "location", "contacts", "interactive", "button", "list_reply"]),
    from: z.string(),
    timestamp: z.string(),
    text: z.object({ body: z.string() }).optional(),
    image: z.object({ id: z.string(), mime_type: z.string(), sha256: z.string(), caption: z.string().optional() }).optional(),
    document: z.object({ id: z.string(), mime_type: z.string(), sha256: z.string(), filename: z.string().optional(), caption: z.string().optional() }).optional(),
    audio: z.object({ id: z.string(), mime_type: z.string(), sha256: z.string() }).optional(),
    video: z.object({ id: z.string(), mime_type: z.string(), sha256: z.string(), caption: z.string().optional() }).optional(),
    location: z.object({ latitude: z.number(), longitude: z.number(), name: z.string().optional(), address: z.string().optional() }).optional(),
    contacts: z.array(z.object({ name: z.object({ formatted_name: z.string() }), phones: z.array(z.object({ phone: z.string(), type: z.string() })) })).optional(),
    interactive: z.object({
      type: z.enum(["button_reply", "list_reply"]),
      button_reply: z.object({ id: z.string(), title: z.string() }).optional(),
      list_reply: z.object({ id: z.string(), title: z.string(), description: z.string().optional() }).optional(),
    }).optional(),
    button: z.object({ payload: z.string(), text: z.string() }).optional(),
  }),
  statuses: z
    .array(
      z.object({
        id: z.string(),
        status: z.enum(["sent", "delivered", "read", "failed"]),
        timestamp: z.string(),
        recipient_id: z.string(),
        conversation: z.object({ id: z.string(), origin: z.object({ type: z.string() }) }).optional(),
        pricing: z.object({ billable: z.boolean(), pricing_model: z.string(), category: z.string() }).optional(),
        errors: z.array(z.object({ code: z.number(), title: z.string(), details: z.string() })).optional(),
      })
    )
    .optional(),
});

export type GupshupWebhook = z.infer<typeof GupshupWebhookSchema>;

export class GupshupClient {
  private config: GupshupConfig;

  constructor(config: GupshupConfig) {
    this.config = GupshupConfigSchema.parse(config);
  }

  private async request<T>(method: string, path: string, body?: unknown): Promise<T> {
    const url = `${GUPSHUP_BASE_URL}${path}`;
    const headers: Record<string, string> = {
      "Content-Type": "application/x-www-form-urlencoded",
      apikey: this.config.apiKey,
    };

    const response = await fetch(url, {
      method,
      headers,
      body: body ? new URLSearchParams(body as Record<string, string>).toString() : undefined,
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Gupshup API error: ${response.status} ${error}`);
    }

    return response.json() as Promise<T>;
  }

  async sendTemplateMessage(template: WhatsAppTemplate, to: string, components?: Record<string, unknown>[]): Promise<{ message_id: string }> {
    const body = {
      channel: "whatsapp",
      source: this.config.appId,
      destination: to,
      "src.name": "RoutePlan",
      template: JSON.stringify({
        name: template.name,
        language: { code: template.language, policy: "deterministic" },
        components: components || [
          { type: "body", parameters: [] },
        ],
      }),
    };

    return this.request<{ message_id: string }>("POST", "/msg", body);
  }

  async sendTextMessage(to: string, text: string): Promise<{ message_id: string }> {
    const body = {
      channel: "whatsapp",
      source: this.config.appId,
      destination: to,
      "src.name": "RoutePlan",
      message: JSON.stringify({ type: "text", text: { body: text, preview_url: false } }),
    };

    return this.request<{ message_id: string }>("POST", "/msg", body);
  }

  async sendInteractiveMessage(
    to: string,
    bodyText: string,
    buttons: { id: string; title: string }[],
    headerText?: string,
    footerText?: string
  ): Promise<{ message_id: string }> {
    const body = {
      channel: "whatsapp",
      source: this.config.appId,
      destination: to,
      "src.name": "RoutePlan",
      message: JSON.stringify({
        type: "interactive",
        interactive: {
          type: "button",
          header: headerText ? { type: "text", text: headerText } : undefined,
          body: { text: bodyText },
          footer: footerText ? { text: footerText } : undefined,
          action: {
            buttons: buttons.map((btn) => ({
              type: "reply",
              reply: { id: btn.id, title: btn.title },
            })),
          },
        },
      }),
    };

    return this.request<{ message_id: string }>("POST", "/msg", body);
  }

  async sendLocationMessage(to: string, latitude: number, longitude: number, name?: string, address?: string): Promise<{ message_id: string }> {
    const body = {
      channel: "whatsapp",
      source: this.config.appId,
      destination: to,
      "src.name": "RoutePlan",
      message: JSON.stringify({
        type: "location",
        location: { latitude, longitude, name, address },
      }),
    };

    return this.request<{ message_id: string }>("POST", "/msg", body);
  }

  async uploadMedia(file: Buffer, mimeType: string): Promise<{ file_id: string }> {
    const formData = new FormData();
    const fileBlob = new Blob([new Uint8Array(file)], { type: mimeType });
    formData.append("file", fileBlob);
    formData.append("channel", "whatsapp");

    const response = await fetch(`${GUPSHUP_BASE_URL}/media/upload`, {
      method: "POST",
      headers: { apikey: this.config.apiKey },
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Gupshup media upload failed: ${response.status}`);
    }

    return response.json() as Promise<{ file_id: string }>;
  }

  async getTemplates(): Promise<unknown[]> {
    return this.request<unknown[]>("GET", `/app/${this.config.appId}/templates`);
  }

  async createTemplate(template: WhatsAppTemplate): Promise<{ template_id: string }> {
    const body = {
      channel: "whatsapp",
      template: JSON.stringify({
        name: template.name,
        category: template.category,
        language: template.language,
        header: template.header ? { type: "text", text: template.header } : undefined,
        body: { text: template.body },
        footer: template.footer ? { text: template.footer } : undefined,
        buttons: template.buttons,
      }),
    };

    return this.request<{ template_id: string }>("POST", `/app/${this.config.appId}/templates`, body);
  }

  verifyWebhookSignature(payload: string, signature: string): boolean {
    const crypto = require("crypto");
    const expectedSignature = crypto
      .createHmac("sha256", this.config.webhookSecret)
      .update(payload)
      .digest("hex");
    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature));
  }
}

export function createGupshupClient(): GupshupClient {
  return new GupshupClient({
    apiKey: process.env.GUPSHUP_API_KEY!,
    appId: process.env.GUPSHUP_APP_ID!,
    webhookSecret: process.env.GUPSHUP_WEBHOOK_SECRET!,
  });
}

export const ROUTEPLAN_TEMPLATES: WhatsAppTemplate[] = [
  {
    name: "routeplan_welcome",
    category: "utility",
    language: "en",
    body: "Welcome to RoutePlan India! 🇮🇳\n\nYour account is ready. Let's set up your first delivery route.\n\nReply with your business type:\n1️⃣ Dairy\n2️⃣ Pharmacy\n3️⃣ Bakery\n4️⃣ Kirana\n5️⃣ Other",
    footer: "RoutePlan India — Circuit for Indian SMBs",
  },
  {
    name: "routeplan_daily_route",
    category: "utility",
    language: "en",
    header: "📦 Today's Route",
    body: "Good morning {{1}}! Your optimized route for {{2}} is ready.\n\n📍 {{3}} stops\n⏱️ Est. {{4}} hours\n🚛 Driver: {{5}}\n\nTap 'Start Route' to begin navigation.",
    footer: "RoutePlan India",
    buttons: [
      { type: "quick_reply", text: "Start Route" },
      { type: "quick_reply", text: "View Details" },
      { type: "quick_reply", text: "Reschedule" },
    ],
  },
  {
    name: "routeplan_order_confirmation",
    category: "utility",
    language: "en",
    header: "✅ Order Confirmed",
    body: "Hi {{1}}, your order #{{2}} is confirmed!\n\n📦 Items: {{3}}\n💰 Total: ₹{{4}}\n📍 Delivery: {{5}}\n⏰ Window: {{6}} - {{7}}\n\nDriver {{8}} will contact you shortly.",
    footer: "Track your order: routeplan-india.vercel.app/track/{{2}}",
  },
  {
    name: "routeplan_delivery_otp",
    category: "authentication",
    language: "en",
    body: "Your delivery OTP is {{1}}. Share this with the driver to confirm delivery.\n\nValid for 10 minutes.",
    footer: "RoutePlan India",
  },
  {
    name: "routeplan_payment_reminder",
    category: "utility",
    language: "en",
    header: "💳 Payment Due",
    body: "Hi {{1}}, your subscription renewal of ₹{{2}} is due on {{3}}.\n\nPay via UPI: {{4}}\nOr reply 'PAY' for Razorpay link.",
    footer: "RoutePlan India — GSTIN: 27AAAAA0000A1Z5",
    buttons: [
      { type: "quick_reply", text: "Pay Now" },
      { type: "quick_reply", text: "View Invoice" },
    ],
  },
  {
    name: "routeplan_driver_assignment",
    category: "utility",
    language: "en",
    header: "🚛 New Assignment",
    body: "Hi {{1}}, you have a new route assignment!\n\n📅 Date: {{2}}\n📍 Stops: {{3}}\n⏱️ Est. Time: {{4}}\n📦 Orders: {{5}}\n\nTap 'Accept' to start.",
    footer: "RoutePlan India",
    buttons: [
      { type: "quick_reply", text: "Accept" },
      { type: "quick_reply", text: "View Route" },
      { type: "quick_reply", text: "Decline" },
    ],
  },
];