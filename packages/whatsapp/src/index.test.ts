import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  GupshupClient,
  GupshupWebhookSchema,
  createGupshupClient,
  normalizeIndianWhatsAppNumber,
  verifyWebhookToken,
} from "./index";

const config = {
  apiKey: "test-api-key",
  appId: "test-app-id",
  appName: "RoutePlan",
  sourceNumber: "917834811114",
  webhookSecret: "test-webhook-secret",
};

function inboundTextPayload() {
  return {
    app: "RoutePlan",
    timestamp: 1_787_534_000_000,
    version: 2,
    type: "message",
    payload: {
      id: "wamid-1",
      source: "919876543210",
      type: "text",
      payload: { text: "HI" },
      sender: {
        phone: "919876543210",
        name: "Arjun",
        country_code: "91",
        dial_code: "9876543210",
      },
    },
  };
}

describe("GupshupWebhookSchema", () => {
  it("parses the documented Gupshup V2 inbound text envelope", () => {
    const result = GupshupWebhookSchema.parse(inboundTextPayload());
    expect(result.type).toBe("message");
    expect(result.version).toBe(2);
    if (result.type === "message") {
      expect(result.payload.id).toBe("wamid-1");
      expect(result.payload.payload).toEqual({ text: "HI" });
    }
  });

  it("parses delivery events when gsId is absent", () => {
    const result = GupshupWebhookSchema.parse({
      app: "RoutePlan",
      timestamp: 1_787_534_000_001,
      version: 2,
      type: "message-event",
      payload: {
        id: "wamid-provider-1",
        type: "delivered",
        destination: "919876543210",
        ts: 1_787_534_000,
      },
    });
    expect(result.type).toBe("message-event");
  });

  it("rejects malformed message envelopes instead of accepting them as unknown events", () => {
    const malformed = inboundTextPayload();
    delete (malformed.payload as Partial<typeof malformed.payload>).id;
    expect(() => GupshupWebhookSchema.parse(malformed)).toThrow();
  });
});

describe("webhook token and Indian number validation", () => {
  it("compares matching webhook tokens and safely rejects different lengths", () => {
    expect(verifyWebhookToken("secret123", "secret123")).toBe(true);
    expect(verifyWebhookToken("short", "a-much-longer-secret")).toBe(false);
    expect(verifyWebhookToken("secret123", "secret124")).toBe(false);
  });

  it("normalizes supported Indian mobile formats", () => {
    expect(normalizeIndianWhatsAppNumber("+91 98765 43210")).toBe("919876543210");
    expect(normalizeIndianWhatsAppNumber("09876543210")).toBe("919876543210");
    expect(() => normalizeIndianWhatsAppNumber("14155552671")).toThrow();
  });
});

describe("GupshupClient", () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("sends session text through the current WhatsApp endpoint and payload shape", async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ status: "submitted", messageId: "gs-1" }),
    });
    const client = new GupshupClient(config);

    const result = await client.sendTextMessage("+91 98765 43210", "Hello");

    expect(result).toEqual({ status: "submitted", messageId: "gs-1" });
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://api.gupshup.io/wa/api/v1/msg");
    const form = new URLSearchParams(String(init.body));
    expect(form.get("source")).toBe("917834811114");
    expect(form.get("destination")).toBe("919876543210");
    expect(form.get("src.name")).toBe("RoutePlan");
    expect(JSON.parse(form.get("message") || "{}")).toEqual({
      type: "text",
      text: "Hello",
    });
  });

  it("sends approved templates as one documented template JSON field", async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ status: "submitted", messageId: "gs-2" }),
    });
    const client = new GupshupClient(config);

    await client.sendTemplateMessage("919876543210", "template-id", ["Ravi", "12 stops"]);

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://api.gupshup.io/wa/api/v1/template/msg");
    const form = new URLSearchParams(String(init.body));
    expect(JSON.parse(form.get("template") || "{}")).toEqual({
      id: "template-id",
      params: ["Ravi", "12 stops"],
    });
    expect(form.get("template.id")).toBeNull();
  });

  it("sends location fields at the documented message object level", async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ status: "submitted", messageId: "gs-3" }),
    });
    const client = new GupshupClient(config);

    await client.sendLocationMessage(
      "919876543210",
      19.075983,
      72.877655,
      "Mumbai",
      "Mumbai, Maharashtra",
    );

    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    const form = new URLSearchParams(String(init.body));
    expect(JSON.parse(form.get("message") || "{}")).toEqual({
      type: "location",
      latitude: 19.075983,
      longitude: 72.877655,
      name: "Mumbai",
      address: "Mumbai, Maharashtra",
    });
  });

  it("sends quick replies with header and footer inside the documented content object", async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ status: "submitted", messageId: "gs-4" }),
    });
    const client = new GupshupClient(config);

    await client.sendInteractiveMessage(
      "919876543210",
      "Choose your next action",
      [{ id: "route", title: "Build Route" }],
      "RoutePlan",
      "Reply HELP any time",
    );

    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    const form = new URLSearchParams(String(init.body));
    expect(JSON.parse(form.get("message") || "{}")).toMatchObject({
      type: "quick_reply",
      content: {
        type: "text",
        header: "RoutePlan",
        text: "Choose your next action",
        caption: "Reply HELP any time",
      },
      options: [
        { type: "text", title: "Build Route", postbackText: "route" },
      ],
    });
  });
});

describe("createGupshupClient", () => {
  it("fails closed when required environment variables are absent", () => {
    const previous = { ...process.env };
    delete process.env.GUPSHUP_SOURCE_NUMBER;
    try {
      expect(() => createGupshupClient()).toThrow(/GUPSHUP_SOURCE_NUMBER/);
    } finally {
      process.env = previous;
    }
  });
});
