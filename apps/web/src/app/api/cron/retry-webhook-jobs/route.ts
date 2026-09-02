import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@routeplan/db";
import { createSupabaseWhatsAppRepository } from "@/lib/supabase-whatsapp-repository";
import {
  processGupshupWebhook,
  type RouteGenerationSummary,
} from "@/lib/whatsapp-webhook";
import { createGupshupClient } from "@routeplan/whatsapp";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

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

export async function GET(request: NextRequest) {
  // Verify cron secret
  const cronSecret = request.headers.get("Authorization")?.replace("Bearer ", "");
  if (cronSecret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createServerClient();
  const repository = createSupabaseWhatsAppRepository(supabase);

  try {
    // Claim jobs that are pending or failed and ready for retry
    const { data: jobs, error } = await supabase.rpc("claim_webhook_jobs_batch", {
      p_limit: 10,
    });

    if (error) throw error;

    if (!jobs || jobs.length === 0) {
      return NextResponse.json({ processed: 0, message: "No jobs to process" });
    }

    let processed = 0;
    let succeeded = 0;
    let failed = 0;

    for (const job of jobs) {
      try {
        await repository.log("info", "Retrying webhook job", {
          jobId: job.id,
          callbackId: job.callback_id,
          eventType: job.event_type,
          attempt: job.attempts,
        });

        // Parse the original payload
        const parsedEvent = job.payload;

        await processGupshupWebhook(parsedEvent, {
          appId: process.env.GUPSHUP_APP_ID as string,
          appName: process.env.GUPSHUP_APP_NAME as string,
          sourceNumber: process.env.GUPSHUP_SOURCE_NUMBER as string,
          repository,
          client: createGupshupClient(),
          generateRoutes: generateRoutesForOrganization,
        });

        // Mark job completed
        await supabase.rpc("complete_webhook_job", {
          p_job_id: job.id,
        });

        succeeded++;
      } catch (jobError) {
        console.error("Webhook job retry failed", {
          jobId: job.id,
          error: jobError instanceof Error ? jobError.message : String(jobError),
        });

        await repository.log("error", "Webhook job retry failed", {
          jobId: job.id,
          error: jobError instanceof Error ? jobError.message : String(jobError),
        });

        await supabase.rpc("fail_webhook_job", {
          p_job_id: job.id,
          p_error: jobError instanceof Error ? jobError.message : String(jobError),
        });

        failed++;
      }

      processed++;
    }

    return NextResponse.json({
      processed,
      succeeded,
      failed,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Webhook retry cron failed", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal error" },
      { status: 500 },
    );
  }
}