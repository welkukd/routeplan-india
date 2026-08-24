import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  createServerClient: vi.fn(),
}));

vi.mock("@routeplan/db", () => ({
  createServerClient: mocks.createServerClient,
}));

const originalUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const originalServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

afterEach(() => {
  if (originalUrl === undefined) delete process.env.NEXT_PUBLIC_SUPABASE_URL;
  else process.env.NEXT_PUBLIC_SUPABASE_URL = originalUrl;
  if (originalServiceKey === undefined) delete process.env.SUPABASE_SERVICE_ROLE_KEY;
  else process.env.SUPABASE_SERVICE_ROLE_KEY = originalServiceKey;
});

beforeEach(() => {
  vi.resetModules();
  mocks.createServerClient.mockReset();
});

describe("admin dashboard configuration fallback", () => {
  it("does not contact Supabase when Vercel values are placeholders or masks", async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://placeholder.supabase.co";
    process.env.SUPABASE_SERVICE_ROLE_KEY = "[SENSITIVE]";
    mocks.createServerClient.mockImplementation(() => {
      throw new Error("placeholder client must not be constructed");
    });
    const {
      getDashboardMetrics,
      getRecentActivity,
      getRouteStatusDistribution,
    } = await import("./admin-dashboard");

    const [metrics, activity, statuses] = await Promise.all([
      getDashboardMetrics(),
      getRecentActivity(),
      getRouteStatusDistribution(),
    ]);

    expect(mocks.createServerClient).not.toHaveBeenCalled();
    expect(metrics.totalCustomers).toBeGreaterThan(0);
    expect(activity.length).toBeGreaterThan(0);
    expect(statuses.length).toBe(4);
  });
});
