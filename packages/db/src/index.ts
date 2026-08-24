import { createClient } from "@supabase/supabase-js";

export const createServerClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

  if (!supabaseUrl || !supabaseAnonKey || !serviceRoleKey) {
    throw new Error("Missing Supabase environment variables");
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
};

export const createBrowserClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Missing Supabase environment variables");
  }

  return createClient(supabaseUrl, supabaseAnonKey);
};

export type Database = {
  public: {
    Tables: {
      organizations: {
        Row: {
          id: string;
          name: string;
          whatsapp_business_account_id: string | null;
          gupshup_app_id: string | null;
          razorpay_account_id: string | null;
          gstin: string | null;
          address: string | null;
          city: string | null;
          state: string | null;
          pincode: string | null;
          phone: string | null;
          email: string | null;
          settings: Record<string, unknown> | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["organizations"]["Row"], "id" | "created_at" | "updated_at">;
        Update: Partial<Database["public"]["Tables"]["organizations"]["Insert"]>;
      };
      users: {
        Row: {
          id: string;
          organization_id: string;
          supabase_user_id: string | null;
          role: "owner" | "admin" | "driver";
          name: string;
          phone: string;
          email: string | null;
          avatar_url: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["users"]["Row"], "id" | "created_at" | "updated_at">;
        Update: Partial<Database["public"]["Tables"]["users"]["Insert"]>;
      };
      customers: {
        Row: {
          id: string;
          organization_id: string;
          name: string;
          phone: string;
          email: string | null;
          address: string;
          city: string | null;
          state: string | null;
          pincode: string | null;
          latitude: number | null;
          longitude: number | null;
          delivery_instructions: string | null;
          tags: string[] | null;
          gstin: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["customers"]["Row"], "id" | "created_at" | "updated_at">;
        Update: Partial<Database["public"]["Tables"]["customers"]["Insert"]>;
      };
      drivers: {
        Row: {
          id: string;
          organization_id: string;
          user_id: string | null;
          name: string;
          phone: string;
          vehicle_type: "bike" | "auto" | "van" | "truck";
          vehicle_number: string | null;
          license_number: string | null;
          max_capacity_kg: number | null;
          max_volume_l: number | null;
          home_latitude: number | null;
          home_longitude: number | null;
          is_active: boolean;
          current_latitude: number | null;
          current_longitude: number | null;
          last_location_update: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["drivers"]["Row"], "id" | "created_at" | "updated_at">;
        Update: Partial<Database["public"]["Tables"]["drivers"]["Insert"]>;
      };
      orders: {
        Row: {
          id: string;
          organization_id: string;
          customer_id: string;
          driver_id: string | null;
          route_id: string | null;
          order_number: string;
          status: "pending" | "assigned" | "picked_up" | "delivered" | "cancelled" | "failed";
          priority: number;
          items: Record<string, unknown>[];
          total_amount: number;
          tax_amount: number;
          discount_amount: number;
          delivery_window_start: string | null;
          delivery_window_end: string | null;
          actual_delivery_time: string | null;
          proof_of_delivery: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["orders"]["Row"], "id" | "created_at" | "updated_at">;
        Update: Partial<Database["public"]["Tables"]["orders"]["Insert"]>;
      };
      routes: {
        Row: {
          id: string;
          organization_id: string;
          driver_id: string | null;
          name: string;
          date: string;
          status: "planned" | "active" | "completed" | "cancelled";
          optimized_order: string[] | null;
          total_distance_km: number | null;
          total_duration_min: number | null;
          started_at: string | null;
          completed_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["routes"]["Row"], "id" | "created_at" | "updated_at">;
        Update: Partial<Database["public"]["Tables"]["routes"]["Insert"]>;
      };
      whatsapp_templates: {
        Row: {
          id: string;
          organization_id: string;
          name: string;
          category: "marketing" | "utility" | "authentication";
          language: string;
          header: string | null;
          body: string;
          footer: string | null;
          buttons: Record<string, unknown>[] | null;
          gupshup_template_id: string | null;
          status: "pending" | "approved" | "rejected";
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["whatsapp_templates"]["Row"], "id" | "created_at" | "updated_at">;
        Update: Partial<Database["public"]["Tables"]["whatsapp_templates"]["Insert"]>;
      };
      whatsapp_messages: {
        Row: {
          id: string;
          organization_id: string;
          template_id: string | null;
          to_number: string;
          from_number: string;
          type:
            | "template"
            | "text"
            | "image"
            | "document"
            | "audio"
            | "video"
            | "contact"
            | "location"
            | "interactive"
            | "sticker"
            | "reaction";
          content: Record<string, unknown>;
          status: "sent" | "delivered" | "read" | "failed";
          gupshup_message_id: string | null;
          error_message: string | null;
          sent_at: string;
          delivered_at: string | null;
          read_at: string | null;
        };
        Insert: Omit<Database["public"]["Tables"]["whatsapp_messages"]["Row"], "id">;
        Update: Partial<Database["public"]["Tables"]["whatsapp_messages"]["Insert"]>;
      };
      whatsapp_sessions: {
        Row: {
          id: string;
          organization_id: string;
          phone: string;
          state: "awaiting_business_type" | "awaiting_stop" | "awaiting_driver";
          context: Record<string, unknown>;
          expires_at: string;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<
          Database["public"]["Tables"]["whatsapp_sessions"]["Row"],
          "id" | "created_at" | "updated_at"
        >;
        Update: Partial<Database["public"]["Tables"]["whatsapp_sessions"]["Insert"]>;
      };
      subscriptions: {
        Row: {
          id: string;
          organization_id: string;
          razorpay_subscription_id: string | null;
          razorpay_plan_id: string | null;
          status: "created" | "authenticated" | "active" | "paused" | "cancelled" | "expired" | "completed";
          current_period_start: string | null;
          current_period_end: string | null;
          quantity: number;
          notes: Record<string, unknown> | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["subscriptions"]["Row"], "id" | "created_at" | "updated_at">;
        Update: Partial<Database["public"]["Tables"]["subscriptions"]["Insert"]>;
      };
      usage_logs: {
        Row: {
          id: string;
          organization_id: string;
          metric: "whatsapp_conversations" | "api_calls" | "routes_optimized" | "orders_processed";
          count: number;
          date: string;
          metadata: Record<string, unknown> | null;
        };
        Insert: Omit<Database["public"]["Tables"]["usage_logs"]["Row"], "id">;
        Update: Partial<Database["public"]["Tables"]["usage_logs"]["Insert"]>;
      };
      logs: {
        Row: {
          id: string;
          organization_id: string | null;
          level: "debug" | "info" | "warn" | "error" | "critical";
          message: string;
          context: Record<string, unknown> | null;
          source: string | null;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["logs"]["Row"], "id" | "created_at">;
        Update: Partial<Database["public"]["Tables"]["logs"]["Insert"]>;
      };
    };
  };
};