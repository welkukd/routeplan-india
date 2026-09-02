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

  // Resolve organization by app_id before durable inbox insert
  const appId = (parsed.data as any).app; // Gupshup V2 uses 'app' field for app name
  let organizationId: string | null = null;
  let repository: ReturnType<typeof createSupabaseWhatsAppRepository> | null = null;
  let jobId: string | null = null;

  try {
    repository = createSupabaseWhatsAppRepository(createServerClient());
    const org = await repository.findOrganizationByGupshupAppId(appId);
    if (!org) {
      console.error("Gupshup callback: organization not found for app_id", { appId });
      return NextResponse.json({ error: "Organization not configured" }, { status: 404 });
    }
    organizationId = org.id;
  } catch (error) {
    console.error("Gupshup callback: organization lookup failed", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }

  // Extract callback_id and event_type for idempotency
  // For message events, the callback_id is in payload.id
  // For status events, it's in payload.id or payload.gsId
  const callbackId =
    (parsed.data as any).payload?.id ||
    (parsed.data as any).payload?.gsId ||
    `unknown-${Date.now()}`;
  const eventType = parsed.data.type; // 'message' | 'message-event' | 'status' etc.

  // Durable inbox insert BEFORE 202 ACK
  let jobCreated = false;
  try {
    await repository.log("info", "Gupshup callback received — inserting into durable inbox", {
      appId,
      eventType,
      callbackId,
    });

    // Use the database function for atomic upsert
    const { data: jobResult } = await createServerClient()
      .rpc("upsert_webhook_job", {
        p_organization_id: organizationId,
        p_callback_id: callbackId,
        p_app_name: process.env.GUPSHUP_APP_NAME as string,
        p_event_type: eventType,
        p_payload: parsed.data as any,
      });

    if (jobResult && jobResult.length > 0) {
      jobCreated = jobResult[0].is_new;
      jobId = jobResult[0].job_id;
      if (!jobCreated) {
        // Duplicate callback — return 202 without reprocessing
        console.log("Gupshup callback: duplicate callback_id, skipping reprocessing", { callbackId });
        return new NextResponse(null, { status: 202 });
      }
    }
  } catch (inboxError) {
    console.error("Gupshup callback: durable inbox insert failed", inboxError);
    // Return non-2xx so Gupshup will retry
    return NextResponse.json(
      { error: "Internal error: failed to persist callback" },
      { status: 500 },
    );
  }

  // ACK 202 immediately after durable insert
  const ackResponse = new NextResponse(null, { status: 202 });

  // Process in background via after()
  after(async () => {
    let processingRepo: ReturnType<typeof createSupabaseWhatsAppRepository> | null = null;
    try {
      processingRepo = createSupabaseWhatsAppRepository(createServerClient());
      await processingRepo.log("info", "Gupshup callback processing started", {
        appId,
        eventType,
        callbackId,
        jobCreated,
      });

      await processGupshupWebhook(parsed.data, {
        appId: process.env.GUPSHUP_APP_ID as string,
        appName: process.env.GUPSHUP_APP_NAME as string,
        sourceNumber: process.env.GUPSHUP_SOURCE_NUMBER as string,
        repository: processingRepo,
        client: createGupshupClient(),
        generateRoutes: generateRoutesForOrganization,
      });

      // Mark job completed
      if (processingRepo && jobId) {
        await createServerClient()
          .rpc("complete_webhook_job", {
            p_job_id: jobId,
          });
      }
    } catch (error) {
      console.error("Gupshup callback processing failed", error);
      if (processingRepo) {
        try {
          await processingRepo.log("error", "Gupshup callback processing failed", {
            error: error instanceof Error ? error.message : String(error),
            eventType,
            callbackId,
          });
        } catch (loggingError) {
          console.error("Gupshup callback error logging failed", loggingError);
        }
      }

      // Mark job failed for retry
      try {
        await createServerClient()
          .rpc("fail_webhook_job", {
            p_job_id: jobId,
            p_error: error instanceof Error ? error.message : String(error),
          });
      } catch (failError) {
        console.error("Failed to mark webhook job as failed", failError);
      }
    }
  });

  return ackResponse;
}
