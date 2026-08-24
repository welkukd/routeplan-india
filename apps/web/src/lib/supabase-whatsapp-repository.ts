import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  CustomerLocationInput,
  DriverInput,
  InboundMessageRecord,
  WhatsAppSession,
  WhatsAppSessionState,
  WhatsAppWebhookRepository,
} from "./whatsapp-webhook";

interface SupabaseErrorLike {
  message: string;
}

function throwIfError(error: SupabaseErrorLike | null): void {
  if (error) throw new Error(error.message);
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

export function createSupabaseWhatsAppRepository(
  supabase: SupabaseClient,
): WhatsAppWebhookRepository {
  return {
    async findOrganizationByGupshupAppId(appId) {
      const { data, error } = await supabase
        .from("organizations")
        .select("id, name")
        .eq("gupshup_app_id", appId)
        .maybeSingle();
      throwIfError(error);
      return data ? { id: String(data.id), name: String(data.name) } : null;
    },

    async recordInboundMessage(input: InboundMessageRecord) {
      const { data, error } = await supabase
        .from("whatsapp_messages")
        .upsert(
          {
            organization_id: input.organizationId,
            gupshup_message_id: input.messageId,
            from_number: input.fromNumber,
            to_number: input.toNumber,
            type: input.type,
            content: input.content,
            status: "delivered",
          },
          { onConflict: "organization_id,gupshup_message_id", ignoreDuplicates: true },
        )
        .select("id")
        .maybeSingle();
      throwIfError(error);
      return Boolean(data?.id);
    },

    async updateMessageStatus(organizationId, messageId, status, errorMessage) {
      const timestamp = new Date().toISOString();
      const update: Record<string, unknown> = {
        status,
        error_message: errorMessage,
      };
      if (status === "delivered") update.delivered_at = timestamp;
      if (status === "read") {
        update.delivered_at = timestamp;
        update.read_at = timestamp;
      }
      const { error } = await supabase
        .from("whatsapp_messages")
        .update(update)
        .eq("organization_id", organizationId)
        .eq("gupshup_message_id", messageId)
        .select("id")
        .maybeSingle();
      throwIfError(error);
    },

    async findActor(organizationId, phone) {
      const [userResult, customerResult] = await Promise.all([
        supabase
          .from("users")
          .select("id")
          .eq("organization_id", organizationId)
          .eq("phone", phone)
          .maybeSingle(),
        supabase
          .from("customers")
          .select("id")
          .eq("organization_id", organizationId)
          .eq("phone", phone)
          .maybeSingle(),
      ]);
      throwIfError(userResult.error);
      throwIfError(customerResult.error);
      return {
        user: userResult.data ? { id: String(userResult.data.id) } : null,
        customer: customerResult.data
          ? { id: String(customerResult.data.id) }
          : null,
      };
    },

    async getSession(organizationId, phone): Promise<WhatsAppSession | null> {
      const { data, error } = await supabase
        .from("whatsapp_sessions")
        .select("state, context")
        .eq("organization_id", organizationId)
        .eq("phone", phone)
        .gt("expires_at", new Date().toISOString())
        .maybeSingle();
      throwIfError(error);
      if (!data) return null;
      return {
        state: data.state as WhatsAppSessionState,
        context: asRecord(data.context),
      };
    },

    async setSession(organizationId, phone, state, context) {
      const { error } = await supabase
        .from("whatsapp_sessions")
        .upsert(
          {
            organization_id: organizationId,
            phone,
            state,
            context,
            expires_at: new Date(Date.now() + 24 * 60 * 60 * 1_000).toISOString(),
          },
          { onConflict: "organization_id,phone" },
        )
        .select("id")
        .maybeSingle();
      throwIfError(error);
    },

    async clearSession(organizationId, phone) {
      const { error } = await supabase
        .from("whatsapp_sessions")
        .delete()
        .eq("organization_id", organizationId)
        .eq("phone", phone)
        .select("id")
        .maybeSingle();
      throwIfError(error);
    },

    async setBusinessType(organizationId, businessType) {
      const current = await supabase
        .from("organizations")
        .select("settings")
        .eq("id", organizationId)
        .maybeSingle();
      throwIfError(current.error);
      const settings = {
        ...asRecord(current.data?.settings),
        business_type: businessType,
      };
      const { error } = await supabase
        .from("organizations")
        .update({ settings })
        .eq("id", organizationId)
        .select("id")
        .maybeSingle();
      throwIfError(error);
    },

    async upsertCustomerLocation(input: CustomerLocationInput) {
      const { data, error } = await supabase
        .from("customers")
        .upsert(
          {
            organization_id: input.organizationId,
            phone: input.phone,
            name: input.name,
            address: input.address,
            latitude: input.latitude,
            longitude: input.longitude,
            pincode: input.pincode,
          },
          { onConflict: "organization_id,phone" },
        )
        .select("name, address, pincode")
        .maybeSingle();
      throwIfError(error);
      if (!data) throw new Error("Customer location was not saved");
      return {
        name: String(data.name),
        address: String(data.address),
        pincode: data.pincode ? String(data.pincode) : null,
      };
    },

    async createDriver(input: DriverInput) {
      const { data, error } = await supabase
        .from("drivers")
        .upsert(
          {
            organization_id: input.organizationId,
            name: input.name,
            phone: input.phone,
            vehicle_type: input.vehicleType,
            max_capacity_kg: input.capacityKg,
            is_active: true,
          },
          { onConflict: "organization_id,phone" },
        )
        .select("name, vehicle_type")
        .maybeSingle();
      throwIfError(error);
      if (!data) throw new Error("Driver was not saved");
      return {
        name: String(data.name),
        vehicleType: String(data.vehicle_type),
      };
    },

    async log(level, message, context = {}, organizationId) {
      const { error } = await supabase
        .from("logs")
        .insert({
          level,
          message,
          context,
          source: "gupshup-webhook",
          organization_id: organizationId ?? null,
        })
        .select("id")
        .maybeSingle();
      throwIfError(error);
    },
  };
}
