import { describe, expect, it, vi } from "vitest";
import { createSupabaseWhatsAppRepository } from "./supabase-whatsapp-repository";

interface QueuedResult {
  data: unknown;
  error: { message: string } | null;
}

function createFakeClient(results: QueuedResult[]) {
  const builders: Array<Record<string, ReturnType<typeof vi.fn>>> = [];
  const from = vi.fn(() => {
    const result = results.shift() ?? { data: null, error: null };
    const builder: Record<string, ReturnType<typeof vi.fn>> = {};
    for (const method of [
      "select",
      "eq",
      "gt",
      "upsert",
      "update",
      "delete",
      "insert",
    ]) {
      builder[method] = vi.fn(() => builder);
    }
    builder.maybeSingle = vi.fn(async () => result);
    builders.push(builder);
    return builder;
  });
  return { client: { from }, from, builders };
}

describe("createSupabaseWhatsAppRepository", () => {
  it("writes an idempotent inbound record with the real schema column names", async () => {
    const fake = createFakeClient([{ data: { id: "row-1" }, error: null }]);
    const repository = createSupabaseWhatsAppRepository(
      fake.client as unknown as Parameters<typeof createSupabaseWhatsAppRepository>[0],
    );

    const inserted = await repository.recordInboundMessage({
      organizationId: "org-1",
      messageId: "wamid-1",
      fromNumber: "919876543210",
      toNumber: "917834811114",
      type: "text",
      content: { text: "HI" },
    });

    expect(inserted).toBe(true);
    expect(fake.from).toHaveBeenCalledWith("whatsapp_messages");
    expect(fake.builders[0].upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        organization_id: "org-1",
        gupshup_message_id: "wamid-1",
        from_number: "919876543210",
        to_number: "917834811114",
      }),
      { onConflict: "organization_id,gupshup_message_id", ignoreDuplicates: true },
    );
  });

  it("reports a duplicate when ignoreDuplicates inserts no row", async () => {
    const fake = createFakeClient([{ data: null, error: null }]);
    const repository = createSupabaseWhatsAppRepository(
      fake.client as unknown as Parameters<typeof createSupabaseWhatsAppRepository>[0],
    );
    const inserted = await repository.recordInboundMessage({
      organizationId: "org-1",
      messageId: "wamid-1",
      fromNumber: "919876543210",
      toNumber: "917834811114",
      type: "text",
      content: { text: "HI" },
    });
    expect(inserted).toBe(false);
  });

  it("scopes delivery-status updates to the organization and provider ID", async () => {
    const fake = createFakeClient([{ data: { id: "row-1" }, error: null }]);
    const repository = createSupabaseWhatsAppRepository(
      fake.client as unknown as Parameters<typeof createSupabaseWhatsAppRepository>[0],
    );

    await repository.updateMessageStatus(
      "org-1",
      "gupshup-message-1",
      "delivered",
      null,
    );

    expect(fake.builders[0].eq).toHaveBeenNthCalledWith(
      1,
      "organization_id",
      "org-1",
    );
    expect(fake.builders[0].eq).toHaveBeenNthCalledWith(
      2,
      "gupshup_message_id",
      "gupshup-message-1",
    );
  });

  it("merges business type into existing organization settings", async () => {
    const fake = createFakeClient([
      { data: { settings: { timezone: "Asia/Kolkata" } }, error: null },
      { data: { id: "org-1" }, error: null },
    ]);
    const repository = createSupabaseWhatsAppRepository(
      fake.client as unknown as Parameters<typeof createSupabaseWhatsAppRepository>[0],
    );

    await repository.setBusinessType("org-1", "Dairy");

    expect(fake.builders[1].update).toHaveBeenCalledWith({
      settings: { timezone: "Asia/Kolkata", business_type: "Dairy" },
    });
  });

  it("fails loudly on Supabase errors instead of claiming success", async () => {
    const fake = createFakeClient([
      { data: null, error: { message: "database unavailable" } },
    ]);
    const repository = createSupabaseWhatsAppRepository(
      fake.client as unknown as Parameters<typeof createSupabaseWhatsAppRepository>[0],
    );

    await expect(repository.findOrganizationByGupshupAppId("app-1")).rejects.toThrow(
      "database unavailable",
    );
  });
});
