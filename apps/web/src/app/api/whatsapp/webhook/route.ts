import { after, NextRequest, NextResponse } from "next/server";
import {
  createGupshupClient,
  GupshupWebhookSchema,
  verifyWebhookToken,
} from "@routeplan/whatsapp";
import { createServerClient } from "@routeplan/db";
import { createSupabaseWhatsAppRepository } from "@/lib/supabase-whatsapp-repository";
import {
  processGupshupWebhook,
  type RouteGenerationSummary,
} from "@/lib/whatsapp-webhook";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

const REQUIRED_GUPSHUP_ENV = [
  "GUPSHUP_API_KEY",
  "GUPSHUP_APP_ID",
  "GUPSHUP_APP_NAME",
  "GUPSHUP_SOURCE_NUMBER",
  "GUPSHUP_WEBHOOK_SECRET",
] as const;

function isConfiguredValue(value: string | undefined): value is string {
  if (!value) return false;
  const normalized = value.trim().toLowerCase();
  return !(
    normalized === "[sensitive]" ||
    normalized.includes("placeholder") ||
    normalized.startsWith("your-") ||
    normalized.startsWith("your_")
  );
}

function missingGupshupEnvironment(): string[] {
  return REQUIRED_GUPSHUP_ENV.filter(
    (name) => !isConfiguredValue(process.env[name]),
  );
}

function requestToken(request: NextRequest): string {
  const queryToken = request.nextUrl.searchParams.get("token");
  if (queryToken) return queryToken;

  const customHeader = request.headers.get("x-gupshup-webhook-secret");
  if (customHeader) return customHeader;

  const authorization = request.headers.get("authorization");
  return authorization?.startsWith("Bearer ")
    ? authorization.slice("Bearer ".length)
    : "";
}

async function generateRoutesForOrganization(
  organizationId: string,
): Promise<RouteGenerationSummary> {
  const { GET: optimizeRoutes } = await import("@/app/api/routes/optimize/route");
  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXT_PUBLIC_VERCEL_URL ||
    "http://localhost:3000";
  const url = new URL("/api/routes/optimize", baseUrl);
  url.searchParams.set("organization_id", organizationId);

  const response = await optimizeRoutes(new NextRequest(url));
  const body = (await response.json()) as {
    routes?: unknown[];
    summary?: {
      locationsServed?: number;
      totalDistanceKm?: number;
    };
    error?: string;
  };

  if (!response.ok) {
    throw new Error(body.error || `Route generation failed (${response.status})`);
  }

  return {
    routeCount: body.routes?.length ?? 0,
    stopCount: body.summary?.locationsServed ?? 0,
    distanceKm: body.summary?.totalDistanceKm ?? 0,
  };
}

export async function GET() {
  const missing = missingGupshupEnvironment();
  return NextResponse.json(
    {
      service: "gupshup-webhook",
      configured: missing.length === 0,
      callbackVersion: 2,
      ...(missing.length > 0 ? { missing } : {}),
    },
    { status: missing.length === 0 ? 200 : 503 },
  );
}

export async function POST(request: NextRequest) {
  const missing = missingGupshupEnvironment();
  if (missing.length > 0) {
    return NextResponse.json(
      { error: "Gupshup webhook is not configured", missing },
      { status: 503 },
    );
  }

  const expectedToken = process.env.GUPSHUP_WEBHOOK_SECRET as string;
  if (!verifyWebhookToken(requestToken(request), expectedToken)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rawBody = await request.text();
  if (Buffer.byteLength(rawBody, "utf8") > 1_000_000) {
    return NextResponse.json({ error: "Payload too large" }, { status: 413 });
  }

  let rawEvent: unknown;
  try {
    rawEvent = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Malformed JSON" }, { status: 400 });
  }

  const parsed = GupshupWebhookSchema.safeParse(rawEvent);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid Gupshup callback" }, { status: 400 });
  }

  after(async () => {
    let repository: ReturnType<typeof createSupabaseWhatsAppRepository> | null = null;
    try {
      repository = createSupabaseWhatsAppRepository(createServerClient());
      await processGupshupWebhook(parsed.data, {
        appId: process.env.GUPSHUP_APP_ID as string,
        appName: process.env.GUPSHUP_APP_NAME as string,
        sourceNumber: process.env.GUPSHUP_SOURCE_NUMBER as string,
        repository,
        client: createGupshupClient(),
        generateRoutes: generateRoutesForOrganization,
      });
    } catch (error) {
      console.error("Gupshup callback processing failed", error);
      if (repository) {
        try {
          await repository.log("error", "Gupshup callback processing failed", {
            error: error instanceof Error ? error.message : String(error),
            eventType: parsed.data.type,
          });
        } catch (loggingError) {
          console.error("Gupshup callback error logging failed", loggingError);
        }
      }
    }
  });

  return new NextResponse(null, { status: 202 });
}
