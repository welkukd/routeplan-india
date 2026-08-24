import { describe, expect, it, vi } from "vitest";
import {
  processGupshupWebhook,
  type GupshupWebhookDependencies,
  type WhatsAppWebhookRepository,
} from "./whatsapp-webhook";

const organization = {
  id: "11111111-1111-4111-8111-111111111111",
  name: "Sharma Dairy",
};

function textEvent(text: string, id = "wamid-text-1") {
  return {
    app: "RoutePlan",
    timestamp: 1_787_534_000_000,
    version: 2,
    type: "message" as const,
    payload: {
      id,
      source: "919876543210",
      type: "text" as const,
      payload: { text },
      sender: {
        phone: "919876543210",
        name: "Arjun",
        country_code: "91",
        dial_code: "9876543210",
      },
    },
  };
}

function locationEvent(id = "wamid-location-1") {
  return {
    app: "RoutePlan",
    timestamp: 1_787_534_000_000,
    version: 2,
    type: "message" as const,
    payload: {
      id,
      source: "+91 98765 43210",
      type: "location" as const,
      payload: {
        latitude: "19.0760",
        longitude: "72.8777",
        name: "Sharma Stores",
        address: "Fort, Mumbai 400001",
      },
      sender: {
        phone: "919876543210",
        name: "Arjun",
        country_code: "91",
        dial_code: "9876543210",
      },
    },
  };
}

function createRepository(
  overrides: Partial<WhatsAppWebhookRepository> = {},
): WhatsAppWebhookRepository {
  return {
    findOrganizationByGupshupAppId: vi.fn().mockResolvedValue(organization),
    recordInboundMessage: vi.fn().mockResolvedValue(true),
    updateMessageStatus: vi.fn().mockResolvedValue(undefined),
    findActor: vi.fn().mockResolvedValue({ user: null, customer: null }),
    getSession: vi.fn().mockResolvedValue(null),
    setSession: vi.fn().mockResolvedValue(undefined),
    clearSession: vi.fn().mockResolvedValue(undefined),
    setBusinessType: vi.fn().mockResolvedValue(undefined),
    upsertCustomerLocation: vi.fn().mockResolvedValue({
      name: "Sharma Stores",
      address: "Fort, Mumbai 400001",
      pincode: "400001",
    }),
    createDriver: vi.fn().mockResolvedValue({ name: "Ravi", vehicleType: "bike" }),
    log: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

function createDependencies(
  repository = createRepository(),
): GupshupWebhookDependencies {
  return {
    appId: "app-id-123",
    appName: "RoutePlan",
    sourceNumber: "917834811114",
    repository,
    client: {
      sendTextMessage: vi.fn().mockResolvedValue({
        status: "submitted",
        messageId: "gupshup-outbound-1",
      }),
    },
    generateRoutes: vi.fn().mockResolvedValue({
      routeCount: 2,
      stopCount: 14,
      distanceKm: 38.4,
    }),
  };
}

describe("processGupshupWebhook", () => {
  it("starts a real Gupshup V2 text session and asks for business type", async () => {
    const repository = createRepository();
    const dependencies = createDependencies(repository);

    const result = await processGupshupWebhook(textEvent("HI"), dependencies);

    expect(result).toEqual({ acknowledged: true, action: "welcome" });
    expect(repository.recordInboundMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        messageId: "wamid-text-1",
        organizationId: organization.id,
        fromNumber: "919876543210",
        toNumber: "917834811114",
        type: "text",
      }),
    );
    expect(dependencies.client.sendTextMessage).toHaveBeenCalledWith(
      "919876543210",
      expect.stringContaining("business type"),
    );
    expect(repository.setSession).toHaveBeenCalledWith(
      organization.id,
      "919876543210",
      "awaiting_business_type",
      {},
    );
  });

  it("does not send a second reply when Gupshup retries the same message", async () => {
    const repository = createRepository({
      recordInboundMessage: vi.fn().mockResolvedValue(false),
    });
    const dependencies = createDependencies(repository);

    const result = await processGupshupWebhook(textEvent("HI"), dependencies);

    expect(result).toEqual({ acknowledged: true, action: "duplicate" });
    expect(dependencies.client.sendTextMessage).not.toHaveBeenCalled();
  });

  it("persists shared coordinates as numbers and closes the add-stop session", async () => {
    const repository = createRepository({
      getSession: vi.fn().mockResolvedValue({
        state: "awaiting_stop",
        context: {},
      }),
    });
    const dependencies = createDependencies(repository);

    const result = await processGupshupWebhook(locationEvent(), dependencies);

    expect(result).toEqual({ acknowledged: true, action: "stop_saved" });
    expect(repository.upsertCustomerLocation).toHaveBeenCalledWith(
      expect.objectContaining({
        organizationId: organization.id,
        phone: "919876543210",
        latitude: 19.076,
        longitude: 72.8777,
        pincode: "400001",
      }),
    );
    expect(repository.clearSession).toHaveBeenCalledWith(
      organization.id,
      "919876543210",
    );
  });

  it("creates a validated Indian driver from the awaiting-driver session", async () => {
    const repository = createRepository({
      getSession: vi.fn().mockResolvedValue({
        state: "awaiting_driver",
        context: {},
      }),
    });
    const dependencies = createDependencies(repository);

    const result = await processGupshupWebhook(
      textEvent(
        "Name: Ravi Kumar\nPhone: +91 99887 76655\nVehicle: bike\nCapacity (kg): 40",
      ),
      dependencies,
    );

    expect(result).toEqual({ acknowledged: true, action: "driver_saved" });
    expect(repository.createDriver).toHaveBeenCalledWith({
      organizationId: organization.id,
      name: "Ravi Kumar",
      phone: "919988776655",
      vehicleType: "bike",
      capacityKg: 40,
    });
    expect(repository.clearSession).toHaveBeenCalled();
  });

  it("generates and summarizes routes from the ROUTE command", async () => {
    const dependencies = createDependencies();

    const result = await processGupshupWebhook(textEvent("ROUTE"), dependencies);

    expect(result).toEqual({ acknowledged: true, action: "route_generated" });
    expect(dependencies.generateRoutes).toHaveBeenCalledWith(organization.id);
    expect(dependencies.client.sendTextMessage).toHaveBeenLastCalledWith(
      "919876543210",
      expect.stringMatching(/2 routes[\s\S]*14 stops[\s\S]*38\.4 km/),
    );
  });

  it("updates delivery status using gsId from a real Gupshup message-event", async () => {
    const repository = createRepository();
    const dependencies = createDependencies(repository);
    const event = {
      app: "RoutePlan",
      timestamp: 1_787_534_000_000,
      version: 2,
      type: "message-event" as const,
      payload: {
        id: "wamid-provider-1",
        gsId: "gupshup-outbound-1",
        type: "delivered" as const,
        destination: "919876543210",
        payload: { ts: 1_787_534_000 },
      },
    };

    const result = await processGupshupWebhook(event, dependencies);

    expect(result).toEqual({ acknowledged: true, action: "status_updated" });
    expect(repository.updateMessageStatus).toHaveBeenCalledWith(
      organization.id,
      "gupshup-outbound-1",
      "delivered",
      null,
    );
    expect(dependencies.client.sendTextMessage).not.toHaveBeenCalled();
  });

  it("ignores delivered events without gsId instead of matching a WhatsApp event ID", async () => {
    const repository = createRepository();
    const dependencies = createDependencies(repository);
    const event = {
      app: "RoutePlan",
      timestamp: 1_787_534_000_000,
      version: 2,
      type: "message-event" as const,
      payload: {
        id: "wamid-provider-only",
        type: "delivered" as const,
        destination: "919876543210",
        payload: { ts: 1_787_534_000 },
      },
    };

    const result = await processGupshupWebhook(event, dependencies);

    expect(result).toEqual({ acknowledged: true, action: "event_ignored" });
    expect(repository.updateMessageStatus).not.toHaveBeenCalled();
    expect(repository.log).toHaveBeenCalledWith(
      "warn",
      "Ignored Gupshup delivery event without gsId",
      expect.objectContaining({ eventType: "delivered" }),
    );
  });

  it("acknowledges non-message events without attempting customer actions", async () => {
    const repository = createRepository();
    const dependencies = createDependencies(repository);
    const event = {
      app: "RoutePlan",
      timestamp: 1_787_534_000_000,
      version: 2,
      type: "user-event" as const,
      payload: { phone: "919876543210", type: "opted-in" },
    };

    const result = await processGupshupWebhook(event, dependencies);

    expect(result).toEqual({ acknowledged: true, action: "event_ignored" });
    expect(repository.recordInboundMessage).not.toHaveBeenCalled();
    expect(dependencies.client.sendTextMessage).not.toHaveBeenCalled();
  });
});
