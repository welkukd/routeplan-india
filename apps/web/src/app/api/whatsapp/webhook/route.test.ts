import { after, NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  scheduled: [] as Array<() => void | Promise<void>>,
  process: vi.fn().mockResolvedValue({ acknowledged: true, action: "welcome" }),
  repository: { log: vi.fn().mockResolvedValue(undefined) },
  client: { sendTextMessage: vi.fn().mockResolvedValue({ status: "submitted" }) },
  serverClient: { from: vi.fn() },
  createGupshupClient: vi.fn(),
  createServerClient: vi.fn(),
  createRepository: vi.fn(),
}));

vi.mock("next/server", async () => {
  const actual = await vi.importActual<typeof import("next/server")>("next/server");
  return {
    ...actual,
    after: vi.fn((callback: () => void | Promise<void>) => {
      mocks.scheduled.push(callback);
    }),
  };
});

vi.mock("@routeplan/whatsapp", async () => {
  const { z } = await import("zod");
  return {
    GupshupWebhookSchema: z.object({
      app: z.string(),
      timestamp: z.number(),
      version: z.number(),
      type: z.string(),
      payload: z.record(z.unknown()),
    }),
    verifyWebhookToken: (provided: string, expected: string) =>
      provided.length === expected.length && provided === expected,
    createGupshupClient: mocks.createGupshupClient,
    ROUTEPLAN_TEMPLATES: [],
  };
});

vi.mock("@routeplan/db", () => ({
  createServerClient: mocks.createServerClient,
}));

vi.mock("@/lib/supabase-whatsapp-repository", () => ({
  createSupabaseWhatsAppRepository: mocks.createRepository,
}));

vi.mock("@/lib/whatsapp-webhook", () => ({
  processGupshupWebhook: mocks.process,
}));

const ENV_KEYS = [
  "GUPSHUP_API_KEY",
  "GUPSHUP_APP_ID",
  "GUPSHUP_APP_NAME",
  "GUPSHUP_SOURCE_NUMBER",
  "GUPSHUP_WEBHOOK_SECRET",
] as const;

const originalEnv = Object.fromEntries(
  ENV_KEYS.map((key) => [key, process.env[key]]),
);

function configureEnvironment() {
  process.env.GUPSHUP_API_KEY = "api-key";
  process.env.GUPSHUP_APP_ID = "app-id";
  process.env.GUPSHUP_APP_NAME = "RoutePlan";
  process.env.GUPSHUP_SOURCE_NUMBER = "917834811114";
  process.env.GUPSHUP_WEBHOOK_SECRET = "test-secret";
}

function validPayload() {
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
    },
  };
}

async function loadRoute() {
  vi.resetModules();
  return import("./route");
}

beforeEach(() => {
  mocks.scheduled.length = 0;
  mocks.process.mockClear();
  mocks.repository.log.mockClear();
  mocks.createGupshupClient.mockReset().mockReturnValue(mocks.client);
  mocks.createServerClient.mockReset().mockReturnValue(mocks.serverClient);
  mocks.createRepository.mockReset().mockReturnValue(mocks.repository);
  configureEnvironment();
});

afterEach(() => {
  for (const key of ENV_KEYS) {
    const value = originalEnv[key];
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
});

describe("Gupshup webhook route", () => {
  it("reports readiness without exposing configuration values", async () => {
    const { GET } = await loadRoute();

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toMatchObject({
      service: "gupshup-webhook",
      configured: true,
      callbackVersion: 2,
    });
    expect(JSON.stringify(body)).not.toContain("test-secret");
    expect(JSON.stringify(body)).not.toContain("api-key");
  });

  it("returns 503 when required Gupshup configuration is missing", async () => {
    delete process.env.GUPSHUP_SOURCE_NUMBER;
    const { GET } = await loadRoute();

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(503);
    expect(body.configured).toBe(false);
    expect(body.missing).toContain("GUPSHUP_SOURCE_NUMBER");
  });

  it("rejects callbacks that do not contain the configured URL token", async () => {
    const { POST } = await loadRoute();
    const request = new NextRequest("http://localhost/api/whatsapp/webhook", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(validPayload()),
    });

    const response = await POST(request);

    expect(response.status).toBe(401);
    expect(mocks.scheduled).toHaveLength(0);
  });

  it("rejects malformed JSON with a deterministic 400 response", async () => {
    const { POST } = await loadRoute();
    const request = new NextRequest(
      "http://localhost/api/whatsapp/webhook?token=test-secret",
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: "{not-json",
      },
    );

    const response = await POST(request);

    expect(response.status).toBe(400);
    expect(mocks.scheduled).toHaveLength(0);
  });

  it("logs a background initialization failure after the fast acknowledgement", async () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => undefined);
    mocks.createServerClient.mockImplementationOnce(() => {
      throw new Error("Supabase unavailable");
    });
    const { POST } = await loadRoute();
    const request = new NextRequest(
      "http://localhost/api/whatsapp/webhook?token=test-secret",
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(validPayload()),
      },
    );

    const response = await POST(request);
    expect(response.status).toBe(202);

    await mocks.scheduled[0]();
    expect(consoleError).toHaveBeenCalledWith(
      "Gupshup callback processing failed",
      expect.any(Error),
    );
    expect(mocks.process).not.toHaveBeenCalled();
  });

  it("acknowledges a valid Gupshup V2 callback before background processing", async () => {
    const { POST } = await loadRoute();
    const request = new NextRequest(
      "http://localhost/api/whatsapp/webhook?token=test-secret",
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(validPayload()),
      },
    );

    const response = await POST(request);

    expect(response.status).toBe(202);
    expect(await response.text()).toBe("");
    expect(mocks.process).not.toHaveBeenCalled();
    expect(mocks.createGupshupClient).not.toHaveBeenCalled();
    expect(mocks.createServerClient).not.toHaveBeenCalled();
    expect(mocks.createRepository).not.toHaveBeenCalled();
    expect(after).toHaveBeenCalledOnce();
    expect(mocks.scheduled).toHaveLength(1);

    await mocks.scheduled[0]();
    expect(mocks.createGupshupClient).toHaveBeenCalledOnce();
    expect(mocks.createServerClient).toHaveBeenCalledOnce();
    expect(mocks.createRepository).toHaveBeenCalledOnce();
    expect(mocks.process).toHaveBeenCalledWith(
      expect.objectContaining({ type: "message", app: "RoutePlan" }),
      expect.objectContaining({
        appId: "app-id",
        appName: "RoutePlan",
        sourceNumber: "917834811114",
      }),
    );
  });
});
