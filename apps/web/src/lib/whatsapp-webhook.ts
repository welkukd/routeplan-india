import { normalizeIndianWhatsAppNumber } from "@routeplan/whatsapp";

export type WhatsAppSessionState =
  | "awaiting_business_type"
  | "awaiting_stop"
  | "awaiting_driver";

export interface WhatsAppSession {
  state: WhatsAppSessionState;
  context: Record<string, unknown>;
}

export interface WhatsAppOrganization {
  id: string;
  name: string;
}

export interface InboundMessageRecord {
  organizationId: string;
  messageId: string;
  fromNumber: string;
  toNumber: string;
  type: string;
  content: Record<string, unknown>;
}

export interface CustomerLocationInput {
  organizationId: string;
  phone: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  pincode: string | null;
}

export interface DriverInput {
  organizationId: string;
  name: string;
  phone: string;
  vehicleType: "bike" | "auto" | "van" | "truck";
  capacityKg: number;
}

export interface WhatsAppWebhookRepository {
  findOrganizationByGupshupAppId(appId: string): Promise<WhatsAppOrganization | null>;
  recordInboundMessage(input: InboundMessageRecord): Promise<boolean>;
  updateMessageStatus(
    organizationId: string,
    messageId: string,
    status: "sent" | "delivered" | "read" | "failed",
    errorMessage: string | null,
  ): Promise<void>;
  findActor(
    organizationId: string,
    phone: string,
  ): Promise<{ user: { id: string } | null; customer: { id: string } | null }>;
  getSession(organizationId: string, phone: string): Promise<WhatsAppSession | null>;
  setSession(
    organizationId: string,
    phone: string,
    state: WhatsAppSessionState,
    context: Record<string, unknown>,
  ): Promise<void>;
  clearSession(organizationId: string, phone: string): Promise<void>;
  setBusinessType(organizationId: string, businessType: string): Promise<void>;
  upsertCustomerLocation(input: CustomerLocationInput): Promise<{
    name: string;
    address: string;
    pincode: string | null;
  }>;
  createDriver(input: DriverInput): Promise<{
    name: string;
    vehicleType: string;
  }>;
  log(
    level: "debug" | "info" | "warn" | "error" | "critical",
    message: string,
    context?: Record<string, unknown>,
    organizationId?: string,
  ): Promise<void>;
}

export interface OutboundWhatsAppClient {
  sendTextMessage(
    to: string,
    text: string,
  ): Promise<{ status?: string; messageId?: string; message_id?: string }>;
}

export interface RouteGenerationSummary {
  routeCount: number;
  stopCount: number;
  distanceKm: number;
}

export interface GupshupWebhookDependencies {
  appId: string;
  appName: string;
  sourceNumber: string;
  repository: WhatsAppWebhookRepository;
  client: OutboundWhatsAppClient;
  generateRoutes(organizationId: string): Promise<RouteGenerationSummary>;
}

interface GupshupBaseWebhook {
  app: string;
  timestamp: number;
  version: number;
  type: string;
  payload: Record<string, unknown>;
}

interface GupshupInboundWebhook extends GupshupBaseWebhook {
  type: "message";
  payload: {
    id: string;
    source: string;
    type: string;
    payload: Record<string, unknown>;
    sender?: Record<string, unknown>;
    context?: Record<string, unknown>;
  };
}

interface GupshupStatusWebhook extends GupshupBaseWebhook {
  type: "message-event";
  payload: {
    id: string;
    gsId?: string;
    type: string;
    destination: string;
    payload?: Record<string, unknown>;
  };
}

export type GupshupWebhook =
  | GupshupInboundWebhook
  | GupshupStatusWebhook
  | GupshupBaseWebhook;

export interface WebhookProcessResult {
  acknowledged: true;
  action:
    | "welcome"
    | "duplicate"
    | "stop_saved"
    | "driver_saved"
    | "business_type_saved"
    | "route_generated"
    | "status_updated"
    | "event_ignored"
    | "organization_not_found"
    | "help"
    | "prompted_for_stop"
    | "prompted_for_driver"
    | "validation_error"
    | "unknown_command";
}

const BUSINESS_TYPES: Record<string, string> = {
  "1": "Dairy",
  "2": "Pharmacy",
  "3": "Bakery",
  "4": "Kirana",
  "5": "Other",
};

const HELP_TEXT = [
  "RoutePlan India commands:",
  "START / HI - Start setup",
  "ADD STOP - Add a delivery location",
  "ADD DRIVER - Add a driver",
  "ROUTE - Generate today's routes",
  "HELP - Show this menu",
].join("\n");

function messageTypeForStorage(type: string): string {
  if (type === "file") return "document";
  if (type === "quick_reply" || type === "list_reply") return "interactive";
  return type;
}

function extractText(type: string, payload: Record<string, unknown>): string | null {
  if (type === "text" && typeof payload.text === "string") return payload.text;
  if (type === "quick_reply" || type === "list_reply") {
    for (const key of ["postbackText", "title", "reply"]) {
      const value = payload[key];
      if (typeof value === "string" && value.trim()) return value;
    }
  }
  return null;
}

function extractPincode(address: string): string | null {
  return address.match(/\b[1-9]\d{5}\b/)?.[0] ?? null;
}

function parseDriverDetails(text: string): Omit<DriverInput, "organizationId"> | null {
  const fields = new Map<string, string>();
  for (const line of text.split(/\r?\n/)) {
    const separator = line.indexOf(":");
    if (separator < 0) continue;
    const key = line.slice(0, separator).toLowerCase().replace(/[^a-z]/g, "");
    const value = line.slice(separator + 1).trim();
    if (key && value) fields.set(key, value);
  }

  const name = fields.get("name")?.trim();
  const phoneInput = fields.get("phone");
  const vehicle = fields.get("vehicle")?.toLowerCase();
  const capacityInput = fields.get("capacitykg") ?? fields.get("capacity");
  if (!name || !phoneInput || !vehicle || !capacityInput) return null;
  if (!(["bike", "auto", "van", "truck"] as string[]).includes(vehicle)) return null;

  const capacityKg = Number(capacityInput);
  if (!Number.isFinite(capacityKg) || capacityKg <= 0 || capacityKg > 20_000) {
    return null;
  }

  try {
    return {
      name,
      phone: normalizeIndianWhatsAppNumber(phoneInput),
      vehicleType: vehicle as DriverInput["vehicleType"],
      capacityKg,
    };
  } catch {
    return null;
  }
}

function statusForStorage(type: string): "sent" | "delivered" | "read" | "failed" | null {
  if (type === "enqueued" || type === "sent") return "sent";
  if (type === "delivered" || type === "read" || type === "failed") return type;
  return null;
}

function failedReason(payload: Record<string, unknown> | undefined): string | null {
  if (!payload || typeof payload.reason !== "string") return null;
  return payload.reason.slice(0, 500);
}

export async function processGupshupWebhook(
  event: GupshupWebhook,
  dependencies: GupshupWebhookDependencies,
): Promise<WebhookProcessResult> {
  const { repository } = dependencies;

  if (event.app !== dependencies.appName) {
    await repository.log("warn", "Ignored Gupshup callback for another app", {
      receivedApp: event.app,
    });
    return { acknowledged: true, action: "event_ignored" };
  }

  if (event.type === "message-event") {
    const statusOrganization = await repository.findOrganizationByGupshupAppId(
      dependencies.appId,
    );
    if (!statusOrganization) {
      await repository.log("error", "No organization mapped to Gupshup app", {
        appId: dependencies.appId,
      });
      return { acknowledged: true, action: "organization_not_found" };
    }
    const statusEvent = event as GupshupStatusWebhook;
    const status = statusForStorage(statusEvent.payload.type);
    if (!status) return { acknowledged: true, action: "event_ignored" };
    const eventType = statusEvent.payload.type;
    const messageId =
      statusEvent.payload.gsId ||
      (eventType === "enqueued" || eventType === "failed"
        ? statusEvent.payload.id
        : null);
    if (!messageId) {
      await repository.log(
        "warn",
        "Ignored Gupshup delivery event without gsId",
        { eventType, providerEventId: statusEvent.payload.id },
      );
      return { acknowledged: true, action: "event_ignored" };
    }
    await repository.updateMessageStatus(
      statusOrganization.id,
      messageId,
      status,
      status === "failed" ? failedReason(statusEvent.payload.payload) : null,
    );
    return { acknowledged: true, action: "status_updated" };
  }

  if (event.type !== "message") {
    await repository.log("info", "Acknowledged non-message Gupshup event", {
      type: event.type,
    });
    return { acknowledged: true, action: "event_ignored" };
  }

  const inbound = event as GupshupInboundWebhook;
  const organization = await repository.findOrganizationByGupshupAppId(
    dependencies.appId,
  );
  if (!organization) {
    await repository.log("error", "No organization mapped to Gupshup app", {
      appId: dependencies.appId,
    });
    return { acknowledged: true, action: "organization_not_found" };
  }

  let phone: string;
  try {
    phone = normalizeIndianWhatsAppNumber(inbound.payload.source);
  } catch (error) {
    await repository.log(
      "warn",
      "Rejected inbound WhatsApp message with invalid Indian phone",
      { source: inbound.payload.source, error: error instanceof Error ? error.message : "invalid" },
      organization.id,
    );
    return { acknowledged: true, action: "validation_error" };
  }

  const inserted = await repository.recordInboundMessage({
    organizationId: organization.id,
    messageId: inbound.payload.id,
    fromNumber: phone,
    toNumber: normalizeIndianWhatsAppNumber(dependencies.sourceNumber),
    type: messageTypeForStorage(inbound.payload.type),
    content: inbound.payload.payload,
  });
  if (!inserted) return { acknowledged: true, action: "duplicate" };

  const session = await repository.getSession(organization.id, phone);
  const text = extractText(inbound.payload.type, inbound.payload.payload);

  if (inbound.payload.type === "location") {
    const latitude = Number(inbound.payload.payload.latitude);
    const longitude = Number(inbound.payload.payload.longitude);
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      await dependencies.client.sendTextMessage(
        phone,
        "That location could not be read. Please share the location again.",
      );
      return { acknowledged: true, action: "validation_error" };
    }
    const address =
      typeof inbound.payload.payload.address === "string"
        ? inbound.payload.payload.address
        : "Location shared via WhatsApp";
    const name =
      typeof inbound.payload.payload.name === "string"
        ? inbound.payload.payload.name
        : `Customer ${phone.slice(-4)}`;
    const customer = await repository.upsertCustomerLocation({
      organizationId: organization.id,
      phone,
      name,
      address,
      latitude,
      longitude,
      pincode: extractPincode(address),
    });
    await repository.clearSession(organization.id, phone);
    await dependencies.client.sendTextMessage(
      phone,
      `Location saved for ${customer.name}: ${customer.address}. Reply ADD STOP for another or ROUTE to optimize deliveries.`,
    );
    return { acknowledged: true, action: "stop_saved" };
  }

  if (!text) {
    await dependencies.client.sendTextMessage(phone, HELP_TEXT);
    return { acknowledged: true, action: "help" };
  }

  const normalized = text.trim().toLowerCase();
  if (["start", "hi", "hello"].includes(normalized)) {
    await dependencies.client.sendTextMessage(
      phone,
      [
        `Welcome to RoutePlan India for ${organization.name}.`,
        "Choose your business type:",
        "1 - Dairy",
        "2 - Pharmacy",
        "3 - Bakery",
        "4 - Kirana",
        "5 - Other",
      ].join("\n"),
    );
    await repository.setSession(
      organization.id,
      phone,
      "awaiting_business_type",
      {},
    );
    return { acknowledged: true, action: "welcome" };
  }

  if (session?.state === "awaiting_business_type" && BUSINESS_TYPES[normalized]) {
    const businessType = BUSINESS_TYPES[normalized];
    await repository.setBusinessType(organization.id, businessType);
    await repository.clearSession(organization.id, phone);
    await dependencies.client.sendTextMessage(
      phone,
      `${businessType} selected. Reply ADD STOP to add a delivery location or ADD DRIVER to add your vehicle team.`,
    );
    return { acknowledged: true, action: "business_type_saved" };
  }

  if (normalized === "add stop") {
    await repository.setSession(organization.id, phone, "awaiting_stop", {});
    await dependencies.client.sendTextMessage(
      phone,
      "Share the delivery location using WhatsApp's location attachment. Include the customer name/address if available.",
    );
    return { acknowledged: true, action: "prompted_for_stop" };
  }

  if (normalized === "add driver") {
    await repository.setSession(organization.id, phone, "awaiting_driver", {});
    await dependencies.client.sendTextMessage(
      phone,
      "Send driver details as:\nName: Ravi Kumar\nPhone: 919988776655\nVehicle: bike\nCapacity (kg): 40",
    );
    return { acknowledged: true, action: "prompted_for_driver" };
  }

  if (session?.state === "awaiting_driver") {
    const driver = parseDriverDetails(text);
    if (!driver) {
      await dependencies.client.sendTextMessage(
        phone,
        "Driver details are invalid. Use Name, Phone, Vehicle (bike/auto/van/truck), and Capacity (kg).",
      );
      return { acknowledged: true, action: "validation_error" };
    }
    const saved = await repository.createDriver({
      organizationId: organization.id,
      ...driver,
    });
    await repository.clearSession(organization.id, phone);
    await dependencies.client.sendTextMessage(
      phone,
      `${saved.name} added with ${saved.vehicleType}. Reply ROUTE when today's stops are ready.`,
    );
    return { acknowledged: true, action: "driver_saved" };
  }

  if (normalized === "route" || normalized === "generate route") {
    await dependencies.client.sendTextMessage(phone, "Generating today's optimized routes...");
    const summary = await dependencies.generateRoutes(organization.id);
    if (summary.routeCount === 0) {
      await dependencies.client.sendTextMessage(
        phone,
        "No route was generated. Add pending orders/stops and at least one active driver, then try ROUTE again.",
      );
    } else {
      await dependencies.client.sendTextMessage(
        phone,
        `Ready: ${summary.routeCount} routes, ${summary.stopCount} stops, ${summary.distanceKm.toFixed(1)} km total. Open the driver dashboard to start navigation.`,
      );
    }
    return { acknowledged: true, action: "route_generated" };
  }

  if (normalized === "help") {
    await dependencies.client.sendTextMessage(phone, HELP_TEXT);
    return { acknowledged: true, action: "help" };
  }

  await dependencies.client.sendTextMessage(
    phone,
    "I did not understand that. Reply HELP for available commands.",
  );
  return { acknowledged: true, action: "unknown_command" };
}
