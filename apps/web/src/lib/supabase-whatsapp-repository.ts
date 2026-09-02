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

    async updateMessageStatus(organizationId: string, messageId: string, status: "sent" | "delivered" | "read" | "failed", errorMessage: string | null, providerTimestamp?: number): Promise<boolean> {
      // Monotonic status rank: sent(1) < delivered(2) < read(3) < failed(4)
      // Only upgrade status if new status rank >= current status rank
      const statusRank = (s: string): number => {
        switch (s) {
          case "sent": return 1;
          case "delivered": return 2;
          case "read": return 3;
          case "failed": return 4;
          default: return 0;
        }
      };

      // First, get current status to enforce monotonic ordering
      const { data: currentMsg, error: fetchError } = await supabase
        .from("whatsapp_messages")
        .select("status, provider_delivered_at, provider_read_at, delivered_at, read_at")
        .eq("organization_id", organizationId)
        .eq("gupshup_message_id", messageId)
        .maybeSingle();
      throwIfError(fetchError);

      if (!currentMsg) {
        // Message not found - still try to update (may be out-of-order delivery event)
        console.warn("Gupshup: updateMessageStatus for unknown messageId", { organizationId, messageId });
      } else if (currentMsg.status && statusRank(status) < statusRank(currentMsg.status)) {
        // New status is lower rank - don't downgrade
        console.log("Gupshup: ignoring status downgrade", {
          organizationId,
          messageId,
          currentStatus: currentMsg.status,
          newStatus: status,
        });
        return false;
      }

      const providerTs = providerTimestamp ? new Date(providerTimestamp).toISOString() : new Date().toISOString();
      const update: Record<string, unknown> = {
        status,
        error_message: errorMessage,
      };

      // Set provider timestamps based on status, preserving earliest values
      if (status === "delivered") {
        // Only set provider_delivered_at if not already set (preserve earliest)
        if (!currentMsg?.provider_delivered_at) {
          update.provider_delivered_at = providerTs;
        }
        update.delivered_at = providerTs;
      }
      if (status === "read") {
        // Set provider_read_at if not already set
        if (!currentMsg?.provider_read_at) {
          update.provider_read_at = providerTs;
        }
        update.read_at = providerTs;
        // If read implies delivery and no delivery timestamp exists, set it once
        if (!currentMsg?.provider_delivered_at && !currentMsg?.delivered_at) {
          update.provider_delivered_at = providerTs;
          update.delivered_at = providerTs;
        }
      }
      if (status === "failed") {
        update.provider_failed_at = providerTs;
      }

      const { error } = await supabase
        .from("whatsapp_messages")
        .update(update)
        .eq("organization_id", organizationId)
        .eq("gupshup_message_id", messageId)
        .select("id")
        .maybeSingle();
      throwIfError(error);
      return true;
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
