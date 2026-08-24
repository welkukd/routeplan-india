import { timingSafeEqual } from "node:crypto";
import { z } from "zod";

const GUPSHUP_API_ORIGIN = "https://api.gupshup.io";
const GUPSHUP_SESSION_ENDPOINT = `${GUPSHUP_API_ORIGIN}/wa/api/v1/msg`;
const GUPSHUP_TEMPLATE_ENDPOINT = `${GUPSHUP_API_ORIGIN}/wa/api/v1/template/msg`;
const REQUEST_TIMEOUT_MS = 8_000;

const WebhookTimestampSchema = z.coerce.number().int().nonnegative();
const WebhookVersionSchema = z.union([z.literal(2), z.literal("2")]).transform(() => 2 as const);
const UnknownPayloadSchema = z.record(z.unknown());

export const GupshupWebhookEnvelopeSchema = z.object({
  app: z.string().min(1),
  timestamp: WebhookTimestampSchema,
  version: WebhookVersionSchema,
  type: z.string().min(1),
  payload: UnknownPayloadSchema,
});

export const GupshupMessageWebhookSchema = GupshupWebhookEnvelopeSchema.extend({
  type: z.literal("message"),
  payload: z.object({
    id: z.string().min(1),
    source: z.string().min(1),
    type: z.enum([
      "text",
      "image",
      "file",
      "document",
      "audio",
      "video",
      "contact",
      "contacts",
      "location",
      "button_reply",
      "quick_reply",
      "list_reply",
      "interactive",
      "sticker",
      "reaction",
    ]),
    payload: UnknownPayloadSchema,
    sender: z
      .object({
        phone: z.string().optional(),
        name: z.string().optional(),
        country_code: z.string().optional(),
        dial_code: z.string().optional(),
      })
      .passthrough()
      .optional(),
    context: UnknownPayloadSchema.optional(),
  }),
});

export const GupshupMessageEventWebhookSchema = GupshupWebhookEnvelopeSchema.extend({
  type: z.literal("message-event"),
  payload: z.object({
    id: z.string().min(1),
    gsId: z.string().min(1).optional(),
    type: z.enum([
      "enqueued",
      "failed",
      "sent",
      "delivered",
      "read",
      "deleted",
      "mismatch",
    ]),
    destination: z.string().optional(),
    payload: UnknownPayloadSchema.optional(),
    conversation: UnknownPayloadSchema.optional(),
    pricing: UnknownPayloadSchema.optional(),
  }),
});

const GupshupOtherWebhookSchema = GupshupWebhookEnvelopeSchema.refine(
  (event) => event.type !== "message" && event.type !== "message-event",
  { message: "Message callbacks must match their event-specific schema" },
);

export const GupshupWebhookSchema = z.union([
  GupshupMessageWebhookSchema,
  GupshupMessageEventWebhookSchema,
  GupshupOtherWebhookSchema,
]);

export type GupshupMessageWebhook = z.infer<typeof GupshupMessageWebhookSchema>;
export type GupshupMessageEventWebhook = z.infer<
  typeof GupshupMessageEventWebhookSchema
>;
export type GupshupWebhook = z.infer<typeof GupshupWebhookSchema>;

export const GupshupConfigSchema = z.object({
  apiKey: z.string().min(1),
  appId: z.string().min(1),
  appName: z.string().min(1),
  sourceNumber: z.string().regex(/^91[6-9]\d{9}$/),
  webhookSecret: z.string().min(1),
});

export type GupshupConfig = z.infer<typeof GupshupConfigSchema>;

export const WhatsAppTemplateSchema = z.object({
  name: z.string().regex(/^[a-z0-9_]+$/),
  category: z.enum(["marketing", "utility", "authentication"]),
  language: z.string().default("en"),
  header: z.string().max(60).optional(),
  body: z.string().min(1).max(1024),
  footer: z.string().max(60).optional(),
  buttons: z
    .array(
      z.object({
        type: z.enum(["quick_reply", "url", "phone_number"]),
        text: z.string().optional(),
        url: z.string().optional(),
        phone_number: z.string().optional(),
      }),
    )
    .max(10)
    .optional(),
});

export type WhatsAppTemplate = z.infer<typeof WhatsAppTemplateSchema>;

export interface GupshupApiResponse {
  status: string;
  messageId: string;
}

export interface CreateTemplateInput extends WhatsAppTemplate {
  example: string;
  vertical: string;
}

export function normalizeIndianWhatsAppNumber(input: string): string {
  let digits = input.replace(/\D/g, "");
  if (digits.length === 11 && digits.startsWith("0")) digits = digits.slice(1);
  if (digits.length === 10) digits = `91${digits}`;
  if (!/^91[6-9]\d{9}$/.test(digits)) {
    throw new Error("Phone must be a valid Indian mobile number");
  }
  return digits;
}

export function verifyWebhookToken(provided: string, expected: string): boolean {
  if (!provided || !expected) return false;
  const providedBuffer = Buffer.from(provided, "utf8");
  const expectedBuffer = Buffer.from(expected, "utf8");
  if (providedBuffer.length !== expectedBuffer.length) return false;
  return timingSafeEqual(providedBuffer, expectedBuffer);
}

export class GupshupClient {
  private readonly config: GupshupConfig;

  constructor(config: GupshupConfig) {
    this.config = GupshupConfigSchema.parse(config);
  }

  private async request<T>(
    url: string,
    method: "GET" | "POST",
    body?: Record<string, string>,
  ): Promise<T> {
    const response = await fetch(url, {
      method,
      headers: {
        Accept: "application/json",
        apikey: this.config.apiKey,
        ...(body ? { "Content-Type": "application/x-www-form-urlencoded" } : {}),
      },
      body: body ? new URLSearchParams(body).toString() : undefined,
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });

    if (!response.ok) {
      const providerMessage = (await response.text()).replace(/\s+/g, " ").slice(0, 500);
      throw new Error(`Gupshup API error: ${response.status} ${providerMessage}`.trim());
    }

    return response.json() as Promise<T>;
  }

  private sessionForm(to: string, message: Record<string, unknown>): Record<string, string> {
    return {
      channel: "whatsapp",
      source: this.config.sourceNumber,
      destination: normalizeIndianWhatsAppNumber(to),
      "src.name": this.config.appName,
      message: JSON.stringify(message),
    };
  }

  async sendTextMessage(to: string, text: string): Promise<GupshupApiResponse> {
    return this.request<GupshupApiResponse>(
      GUPSHUP_SESSION_ENDPOINT,
      "POST",
      this.sessionForm(to, { type: "text", text }),
    );
  }

  async sendTemplateMessage(
    to: string,
    templateId: string,
    params: string[] = [],
  ): Promise<GupshupApiResponse> {
    return this.request<GupshupApiResponse>(GUPSHUP_TEMPLATE_ENDPOINT, "POST", {
      channel: "whatsapp",
      source: this.config.sourceNumber,
      destination: normalizeIndianWhatsAppNumber(to),
      "src.name": this.config.appName,
      template: JSON.stringify({ id: templateId, params }),
    });
  }

  async sendInteractiveMessage(
    to: string,
    bodyText: string,
    buttons: { id: string; title: string }[],
    headerText?: string,
    footerText?: string,
  ): Promise<GupshupApiResponse> {
    if (buttons.length < 1 || buttons.length > 3) {
      throw new Error("Gupshup quick replies require one to three buttons");
    }
    return this.request<GupshupApiResponse>(
      GUPSHUP_SESSION_ENDPOINT,
      "POST",
      this.sessionForm(to, {
        type: "quick_reply",
        msgid: `routeplan-${Date.now()}`,
        content: {
          type: "text",
          ...(headerText ? { header: headerText } : {}),
          text: bodyText,
          ...(footerText ? { caption: footerText } : {}),
        },
        options: buttons.map((button) => ({
          type: "text",
          title: button.title,
          postbackText: button.id,
        })),
      }),
    );
  }

  async sendLocationMessage(
    to: string,
    latitude: number,
    longitude: number,
    name?: string,
    address?: string,
  ): Promise<GupshupApiResponse> {
    return this.request<GupshupApiResponse>(
      GUPSHUP_SESSION_ENDPOINT,
      "POST",
      this.sessionForm(to, {
        type: "location",
        latitude,
        longitude,
        name,
        address,
      }),
    );
  }

  async getTemplates(): Promise<unknown[]> {
    return this.request<unknown[]>(
      `${GUPSHUP_API_ORIGIN}/wa/app/${encodeURIComponent(this.config.appId)}/template`,
      "GET",
    );
  }

  async createTemplate(templateInput: CreateTemplateInput): Promise<unknown> {
    const template = WhatsAppTemplateSchema.parse(templateInput);
    const buttons = template.buttons ? JSON.stringify(template.buttons) : undefined;
    return this.request<unknown>(
      `${GUPSHUP_API_ORIGIN}/wa/app/${encodeURIComponent(this.config.appId)}/template`,
      "POST",
      {
        elementName: template.name,
        languageCode: template.language,
        category: template.category.toUpperCase(),
        content: template.body,
        example: templateInput.example,
        vertical: templateInput.vertical,
        ...(template.header ? { header: template.header } : {}),
        ...(template.footer ? { footer: template.footer } : {}),
        ...(buttons ? { buttons } : {}),
      },
    );
  }
}

export function createGupshupClient(): GupshupClient {
  const required = {
    GUPSHUP_API_KEY: process.env.GUPSHUP_API_KEY,
    GUPSHUP_APP_ID: process.env.GUPSHUP_APP_ID,
    GUPSHUP_APP_NAME: process.env.GUPSHUP_APP_NAME,
    GUPSHUP_SOURCE_NUMBER: process.env.GUPSHUP_SOURCE_NUMBER,
    GUPSHUP_WEBHOOK_SECRET: process.env.GUPSHUP_WEBHOOK_SECRET,
  };
  const missing = Object.entries(required)
    .filter(([, value]) => !value || value === "[SENSITIVE]")
    .map(([name]) => name);
  if (missing.length > 0) {
    throw new Error(`Missing required Gupshup environment variables: ${missing.join(", ")}`);
  }

  return new GupshupClient({
    apiKey: required.GUPSHUP_API_KEY as string,
    appId: required.GUPSHUP_APP_ID as string,
    appName: required.GUPSHUP_APP_NAME as string,
    sourceNumber: normalizeIndianWhatsAppNumber(
      required.GUPSHUP_SOURCE_NUMBER as string,
    ),
    webhookSecret: required.GUPSHUP_WEBHOOK_SECRET as string,
  });
}

export const ROUTEPLAN_TEMPLATES: WhatsAppTemplate[] = [
  {
    name: "routeplan_welcome",
    category: "utility",
    language: "en",
    body: "Welcome to RoutePlan India. Your account is ready. Reply with your business type: 1 Dairy, 2 Pharmacy, 3 Bakery, 4 Kirana, 5 Other.",
    footer: "RoutePlan India — routes built for Indian SMBs",
  },
  {
    name: "routeplan_daily_route",
    category: "utility",
    language: "en",
    header: "Today's Route",
    body: "Good morning {{1}}. Your optimized route for {{2}} is ready: {{3}} stops, approximately {{4}} hours, driver {{5}}.",
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
    header: "Order Confirmed",
    body: "Hi {{1}}, order {{2}} is confirmed. Items: {{3}}. Total: INR {{4}}. Delivery: {{5}}, {{6}} to {{7}}. Driver: {{8}}.",
    footer: "RoutePlan India",
  },
  {
    name: "routeplan_delivery_otp",
    category: "authentication",
    language: "en",
    body: "Your delivery OTP is {{1}}. Share it with the driver to confirm delivery. It is valid for 10 minutes.",
    footer: "RoutePlan India",
  },
  {
    name: "routeplan_payment_reminder",
    category: "utility",
    language: "en",
    header: "Payment Due",
    body: "Hi {{1}}, your subscription renewal of INR {{2}} is due on {{3}}. Pay via UPI: {{4}}.",
    footer: "RoutePlan India",
    buttons: [
      { type: "quick_reply", text: "Pay Now" },
      { type: "quick_reply", text: "View Invoice" },
    ],
  },
  {
    name: "routeplan_driver_assignment",
    category: "utility",
    language: "en",
    header: "New Assignment",
    body: "Hi {{1}}, you have a route for {{2}} with {{3}} stops, estimated {{4}}, covering {{5}} orders.",
    footer: "RoutePlan India",
    buttons: [
      { type: "quick_reply", text: "Accept" },
      { type: "quick_reply", text: "View Route" },
      { type: "quick_reply", text: "Decline" },
    ],
  },
];
