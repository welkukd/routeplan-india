import { createServerClient } from "@routeplan/db";

const DEFAULT_ORG_ID = "org-demo";

function hasSupabaseConfig(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const values = [url, anonKey, serviceKey];
  if (
    values.some(
      (value) =>
        !value ||
        value === "[SENSITIVE]" ||
        value.toLowerCase().includes("placeholder"),
    )
  ) {
    return false;
  }
  try {
    const parsed = new URL(url as string);
    return parsed.protocol === "https:" && parsed.hostname.endsWith(".supabase.co");
  } catch {
    return false;
  }
}

type DashboardMetrics = {
  totalCustomers: number;
  activeDrivers: number;
  todaysRoutes: number;
  pendingOrders: number;
  monthlyRevenue: number;
  whatsappConversations: number;
};

export async function getDashboardMetrics(): Promise<DashboardMetrics> {
  // Return mock data during build if Supabase not configured
  if (!hasSupabaseConfig()) {
    return {
      totalCustomers: 1247,
      activeDrivers: 156,
      todaysRoutes: 89,
      pendingOrders: 234,
      monthlyRevenue: 420000,
      whatsappConversations: 1234,
    };
  }

  const supabase = createServerClient();
  const today = new Date().toISOString().split("T")[0];
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);
  const startOfMonthISO = startOfMonth.toISOString();

  try {
    // Fetch all metrics in parallel
    const [
      customersResult,
      driversResult,
      routesResult,
      ordersResult,
      revenueResult,
      whatsappResult,
    ] = await Promise.all([
      // Total customers
      supabase
        .from("customers")
        .select("id", { count: "exact", head: true })
        .eq("organization_id", DEFAULT_ORG_ID),

      // Active drivers
      supabase
        .from("drivers")
        .select("id", { count: "exact", head: true })
        .eq("organization_id", DEFAULT_ORG_ID)
        .eq("is_active", true),

      // Today's routes
      supabase
        .from("routes")
        .select("id", { count: "exact", head: true })
        .eq("organization_id", DEFAULT_ORG_ID)
        .eq("date", today),

      // Pending orders
      supabase
        .from("orders")
        .select("id", { count: "exact", head: true })
        .eq("organization_id", DEFAULT_ORG_ID)
        .eq("status", "pending"),

      // Monthly revenue (delivered orders this month)
      supabase
        .from("orders")
        .select("total_amount")
        .eq("organization_id", DEFAULT_ORG_ID)
        .eq("status", "delivered")
        .gte("created_at", startOfMonthISO),

      // WhatsApp conversations today (unique 'to' numbers with messages today)
      supabase
        .from("whatsapp_messages")
        .select("to_number")
        .eq("organization_id", DEFAULT_ORG_ID)
        .gte("sent_at", today),
    ]);

    const totalCustomers = customersResult.count || 0;
    const activeDrivers = driversResult.count || 0;
    const todaysRoutes = routesResult.count || 0;
    const pendingOrders = ordersResult.count || 0;

    // Calculate monthly revenue
    const monthlyRevenue =
      revenueResult.data?.reduce((sum, order) => sum + (order.total_amount || 0), 0) || 0;

    // Count unique WhatsApp conversations (unique 'to' numbers)
    const uniqueConversations = new Set(
      whatsappResult.data?.map((msg) => msg.to_number) || []
    ).size;

    return {
      totalCustomers,
      activeDrivers,
      todaysRoutes,
      pendingOrders,
      monthlyRevenue,
      whatsappConversations: uniqueConversations,
    };
  } catch (error) {
    console.error("Error fetching dashboard metrics:", error);
    return {
      totalCustomers: 0,
      activeDrivers: 0,
      todaysRoutes: 0,
      pendingOrders: 0,
      monthlyRevenue: 0,
      whatsappConversations: 0,
    };
  }
}

export async function getRecentActivity(limit = 10) {
  // Return mock data during build if Supabase not configured
  if (!hasSupabaseConfig()) {
    const now = new Date();
    return [
      {
        id: "act-1",
        type: "order" as const,
        title: "Order ORD-2024-001",
        description: "Status: delivered • ₹12,500",
        time: new Date(now.getTime() - 1000 * 60 * 5).toISOString(),
        status: "delivered",
      },
      {
        id: "act-2",
        type: "route" as const,
        title: "Route Morning Milk Run",
        description: "Status: active • Date: 2024-08-22",
        time: new Date(now.getTime() - 1000 * 60 * 30).toISOString(),
        status: "active",
      },
      {
        id: "act-3",
        type: "customer" as const,
        title: "New customer onboarded",
        description: "Sharma Dairy Co.",
        time: new Date(now.getTime() - 1000 * 60 * 60 * 2).toISOString(),
        status: "new",
      },
    ].slice(0, limit);
  }

  const supabase = createServerClient();

  try {
    // Get recent orders
    const { data: recentOrders } = await supabase
      .from("orders")
      .select("id, order_number, status, created_at, customer_id, total_amount")
      .eq("organization_id", DEFAULT_ORG_ID)
      .order("created_at", { ascending: false })
      .limit(limit);

    // Get recent routes
    const { data: recentRoutes } = await supabase
      .from("routes")
      .select("id, name, status, created_at, date")
      .eq("organization_id", DEFAULT_ORG_ID)
      .order("created_at", { ascending: false })
      .limit(limit);

    // Get recent customers
    const { data: recentCustomers } = await supabase
      .from("customers")
      .select("id, name, created_at")
      .eq("organization_id", DEFAULT_ORG_ID)
      .order("created_at", { ascending: false })
      .limit(limit);

    // Combine and sort all activities
    const activities = [
      ...(recentOrders?.map((order) => ({
        id: order.id,
        type: "order" as const,
        title: `Order ${order.order_number}`,
        description: `Status: ${order.status} • ₹${order.total_amount?.toLocaleString("en-IN")}`,
        time: order.created_at,
        status: order.status,
      })) || []),
      ...(recentRoutes?.map((route) => ({
        id: route.id,
        type: "route" as const,
        title: `Route ${route.name}`,
        description: `Status: ${route.status} • Date: ${route.date}`,
        time: route.created_at,
        status: route.status,
      })) || []),
      ...(recentCustomers?.map((customer) => ({
        id: customer.id,
        type: "customer" as const,
        title: "New customer onboarded",
        description: customer.name,
        time: customer.created_at,
        status: "new",
      })) || []),
    ]
      .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
      .slice(0, limit);

    return activities;
  } catch (error) {
    console.error("Error fetching recent activity:", error);
    return [];
  }
}

export async function getRouteStatusDistribution() {
  // Return mock data during build if Supabase not configured
  if (!hasSupabaseConfig()) {
    return [
      { name: "Completed", value: 67, color: "bg-green-500" },
      { name: "In Progress", value: 18, color: "bg-blue-500" },
      { name: "Pending", value: 12, color: "bg-amber-500" },
      { name: "Issues", value: 3, color: "bg-red-500" },
    ];
  }

  const supabase = createServerClient();
  const today = new Date().toISOString().split("T")[0];

  try {
    const { data: routes } = await supabase
      .from("routes")
      .select("status")
      .eq("organization_id", DEFAULT_ORG_ID)
      .eq("date", today);

    if (!routes) {
      return [
        { name: "Completed", value: 0, color: "bg-green-500" },
        { name: "In Progress", value: 0, color: "bg-blue-500" },
        { name: "Pending", value: 0, color: "bg-amber-500" },
        { name: "Issues", value: 0, color: "bg-red-500" },
      ];
    }

    const total = routes.length;
    if (total === 0) {
      return [
        { name: "Completed", value: 0, color: "bg-green-500" },
        { name: "In Progress", value: 0, color: "bg-blue-500" },
        { name: "Pending", value: 0, color: "bg-amber-500" },
        { name: "Issues", value: 0, color: "bg-red-500" },
      ];
    }

    const statusCounts = {
      completed: routes.filter((r) => r.status === "completed").length,
      active: routes.filter((r) => r.status === "active").length,
      planned: routes.filter((r) => r.status === "planned").length,
      cancelled: routes.filter((r) => r.status === "cancelled").length,
    };

    return [
      {
        name: "Completed",
        value: Math.round((statusCounts.completed / total) * 100),
        color: "bg-green-500",
      },
      {
        name: "In Progress",
        value: Math.round((statusCounts.active / total) * 100),
        color: "bg-blue-500",
      },
      {
        name: "Pending",
        value: Math.round((statusCounts.planned / total) * 100),
        color: "bg-amber-500",
      },
      {
        name: "Issues",
        value: Math.round((statusCounts.cancelled / total) * 100),
        color: "bg-red-500",
      },
    ];
  } catch (error) {
    console.error("Error fetching route status distribution:", error);
    return [
      { name: "Completed", value: 0, color: "bg-green-500" },
      { name: "In Progress", value: 0, color: "bg-blue-500" },
      { name: "Pending", value: 0, color: "bg-amber-500" },
      { name: "Issues", value: 0, color: "bg-red-500" },
    ];
  }
}

// Utility functions (can be used in both server and client components)
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatNumber(num: number): string {
  return new Intl.NumberFormat("en-IN").format(num);
}

export function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? "s" : ""} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
  return date.toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
}