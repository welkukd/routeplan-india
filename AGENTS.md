# AGENTS.md — RoutePlan India Agent Instructions

> **Source of truth**: This file reflects actual repository state as of 2026-08-24. Do not mark external flows (Supabase, Gupshup, Vercel) as complete — they are external blockers.

## Repository Structure (Actual)

```
/Users/admin/Desktop/DESKTOP FILE/routeplan-india/
├── package.json                 # Root workspace config (npm workspaces)
├── .env.example                 # Environment template (UPDATE WHEN ADDING VARS)
├── .hermes-supervisor/          # Mission control (GOAL, ACCEPTANCE, STATUS, qa.sh)
├── docs/
│   ├── DEVELOPMENT.md           # Dev notes (may be stale)
│   └── WHATSAPP.md              # WhatsApp integration spec (this mission)
├── apps/
│   └── web/                     # Next.js 16 App Router (Edge runtime)
│       ├── package.json         # Scripts: dev, build, lint (eslint), typecheck, test (vitest), test:e2e (playwright)
│       └── src/
│           └── app/api/
│               ├── whatsapp/webhook/route.ts   # Gupshup V2 inbound + status
│               ├── razorpay/webhook/route.ts   # Payment webhooks
│               └── routes/optimize/route.ts    # VRP solver
├── packages/
│   ├── whatsapp/                # Gupshup client, schemas, templates
│   │   └── src/index.ts         # GupshupClient, GupshupWebhookSchema, ROUTEPLAN_TEMPLATES
│   ├── db/                      # Supabase client + types
│   ├── routing/                 # VRP solver (Indian roads)
│   ├── payments/                # Razorpay client + GST invoices
│   └── ui/                      # Shared React components
└── supabase/
    └── migrations/              # SQL migrations (not yet applied)
```

## Verified Working Commands

```bash
# Install deps (run once)
npm install

# Typecheck — only runs on workspaces with typecheck script
npm run typecheck

# Lint — only runs on workspaces with lint script (apps/web)
npm run lint

# Unit tests — only runs on workspaces with test script (apps/web, packages/routing)
npm run test

# Dev server (for ngrok testing)
npm run dev
```

## QA Script

```bash
# Run full mission QA (typecheck, lint, test, webhook verification)
./.hermes-supervisor/qa.sh
```

## Current Mission: WhatsApp Webhook Production-Readiness

**Status**: **LOCAL IMPLEMENTATION COMPLETE** — External blockers remain

**Mission Control**: `.hermes-supervisor/{GOAL,ACCEPTANCE,STATUS,qa.sh}`

### What's Implemented (Code Complete)

1. **Gupshup V2 Client** (`packages/whatsapp/src/index.ts`)
   - `GupshupClient` class with `sendTemplateMessage`, `sendTextMessage`, `sendInteractiveMessage`, `sendLocationMessage`, `uploadMedia`, `getTemplates`, `createTemplate`
   - `verifyWebhookSignature(payload, signature)` — HMAC-SHA256 with timing-safe compare
   - `GupshupWebhookSchema` — Zod schema matching Gupshup V2 callback shape
   - `ROUTEPLAN_TEMPLATES` — 6 templates (welcome, daily_route, order_confirmation, delivery_otp, payment_reminder, driver_assignment)

2. **Webhook Handler** (`apps/web/src/app/api/whatsapp/webhook/route.ts`)
   - `POST` handler with signature verification (`x-gupshup-signature` header)
   - Parses `app_id`, `message`, `statuses` from payload
   - Resolves organization by `gupshup_app_id`
   - Persists to `whatsapp_messages` table
   - Routes text/interactive/location to handlers
   - Updates message status on delivery receipts

3. **Supabase Repository** (`apps/web/src/lib/supabase-whatsapp-repository.ts`)
   - Full CRUD for organizations, customers, drivers, sessions, messages
   - Idempotent upserts with unique constraints
   - RLS-compatible service-role operations

4. **Webhook Processing Logic** (`apps/web/src/lib/whatsapp-webhook.ts`)
   - Complete onboarding flow: business type → stops → drivers → route generation
   - Location handling with pincode extraction
   - Driver parsing with validation
   - Duplicate detection via unique index

5. **Route Optimization Engine** (`packages/routing/src/index.ts`)
   - Clarke-Wright Savings algorithm with Indian road constraints
   - Multi-vehicle, multi-customer VRP with capacity, distance, duration, time windows
   - Vehicle types: bike, auto, van, truck with Indian traffic multipliers
   - `createRouteRequestFromOrders` helper for order→route conversion

### External Blockers (Cannot Complete in Code)

| Blocker | Required For | Evidence Needed |
|---------|--------------|-----------------|
| Gupshup sandbox app credentials | Local testing | `GUPSHUP_API_KEY`, `GUPSHUP_APP_ID`, `GUPSHUP_WEBHOOK_SECRET`, `GUPSHUP_APP_NAME`, `GUPSHUP_SOURCE_NUMBER` |
| Supabase Mumbai project | Message persistence | `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` |
| Vercel project | Production deploy | Vercel project linked, env vars configured |
| Meta Business Verification | Production WhatsApp | Green tick approval |

### Do Not Claim Complete

- ❌ Supabase database provisioned
- ❌ Supabase migrations applied
- ❌ Gupshup sandbox configured
- ❌ Gupshup webhook URL registered
- ✅ Vercel deployment working (landing page live at https://routeplan-india.vercel.app)
- ❌ End-to-end message flow verified

### Local Readiness Status (as of 2026-09-03)

- ✅ `npm run typecheck` — PASS
- ✅ `npm run test` — PASS (35 tests)
- ✅ `npm run build` — PASS
- ✅ `npm run lint` — PASS (0 errors, 86 warnings)
- ✅ `npm run test:e2e` — PASS (2 smoke tests)
- ✅ `npm run qa` — PASS (10/10 gates)
- ✅ Local commit clean: `d5eb455` (Clarke-Wright Savings VRP implementation + QA verification)
- ❌ GitHub push blocked (no gh CLI / token)
- ❌ Vercel Production env: `GUPSHUP_API_KEY`, `GUPSHUP_APP_ID`, `GUPSHUP_WEBHOOK_SECRET` are sensitive (present but not readable locally)
- ❌ Supabase Mumbai project not linked

## File Ownership Rules (Isolated)

**You MAY modify:**
- Root `package.json`
- `apps/web/package.json`
- `AGENTS.md`
- `docs/WHATSAPP.md`
- `.env.example`
- `.hermes-supervisor/**`

**You MUST NOT modify:**
- `packages/whatsapp/**` (source of truth for Gupshup integration)
- `apps/web/src/**` (application source)
- Any other package source files

## Gupshup V2 Callback Shape (From `GupshupWebhookSchema`)

```typescript
{
  app_id: string,
  message: {
    id: string,
    type: "text" | "image" | "document" | "audio" | "video" | "location" | "contacts" | "interactive" | "button" | "list_reply",
    from: string,           // Format: 91XXXXXXXXXX
    timestamp: string,
    text: { body: string } | undefined,
    interactive: {
      type: "button_reply" | "list_reply",
      button_reply: { id: string, title: string } | undefined,
      list_reply: { id: string, title: string, description?: string } | undefined
    } | undefined,
    location: { latitude: number, longitude: number, name?: string, address?: string } | undefined,
    // ... media fields (image, document, audio, video, contacts)
  },
  statuses?: Array<{
    id: string,
    status: "sent" | "delivered" | "read" | "failed",
    timestamp: string,
    recipient_id: string,
    conversation?: { id: string, origin: { type: string } },
    pricing?: { billable: boolean, pricing_model: string, category: string },
    errors?: Array<{ code: number, title: string, details: string }>
  }>
}
```

## Required Environment Variables

| Variable | Source | Used In | Status |
|----------|--------|---------|--------|
| `GUPSHUP_API_KEY` | Gupshup dashboard | `GupshupClient` auth header | Required |
| `GUPSHUP_APP_ID` | Gupshup dashboard | `GupshupClient` source, webhook `app_id` match | Required |
| `GUPSHUP_WEBHOOK_SECRET` | Gupshup dashboard | `verifyWebhookSignature` HMAC key | Required |
| `GUPSHUP_APP_NAME` | Gupshup dashboard | Template `src.name` param, app identification | Present in .env.example |
| `GUPSHUP_SOURCE_NUMBER` | Gupshup dashboard | Source phone number for outbound | Present in .env.example |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project | DB client | Required |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase project | DB client (anon) | Required |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase project | DB client (service) | Required |

## Local Test Instructions

```bash
# 1. Start dev server
npm run dev

# 2. In another terminal, expose via ngrok
ngrok http 3000

# 3. Copy ngrok HTTPS URL (e.g., https://abc123.ngrok-free.app)
# 4. In Gupshup sandbox dashboard, set webhook URL to:
#    https://abc123.ngrok-free.app/api/whatsapp/webhook
# 5. Send test message from sandbox WhatsApp number
# 6. Verify: webhook receives, signature validates, message persists, template reply sends
```

## Callback URL Token Query Usage

Gupshup supports optional query parameters on webhook URL for routing/verification:
```
https://your-domain.com/api/whatsapp/webhook?token=YOUR_VERIFICATION_TOKEN
```
- **Current implementation**: Does NOT use token query — relies solely on `x-gupshup-signature` HMAC verification
- **If adding token**: Add `searchParams.get("token")` validation in route.ts before signature check
- **Recommendation**: Keep HMAC-only; token adds no security over signed payload

## Agent Operating Principles

1. **Truth over completeness** — Mark external blockers explicitly; never pretend done
2. **Isolated ownership** — Only modify files in your allowlist
3. **Deterministic QA** — `qa.sh` must pass before claiming local readiness
4. **No secrets in docs** — `.env.example` has placeholders only; real values in `.env.local` (gitignored)
5. **Evidence-based AGENTS.md** — Update only from actual repo inspection, not assumptions

# UPDATED - 2026-10-28 01:55:00 EDT — Autonomous orchestrator scan (RUN 3)
# Local implementation 100% complete. QA 10/10 gates PASS. Landing live at https://routeplan-india.vercel.app
# Health endpoint returns healthy status. Webhook endpoint correctly reports missing Gupshup credentials.
# Core WhatsApp/DB flows NOT verified — awaiting user to provision external infrastructure
# GitHub auth restored (git push works). Pushed latest commits including status update to origin/main (0130d52).
#
# VERIFIED 2026-10-28 01:55:00 EDT:
# - GitHub push: origin/main up to date (0130d52)
# - Vercel landing: https://routeplan-india.vercel.app returns 200
# - Health endpoint: {"status":"healthy","database":"not_configured","whatsapp":"configured","payments":"configured"}
# - Build: local typecheck/lint/test/build all PASS
# - EXTERNAL BLOCKERS UNCHANGED: Gupshup creds, Supabase Mumbai project, Meta Business Verification
# - 12 npm workspaces configured, all scripts verified
# - 35 unit tests passing, 2 E2E smoke tests passing
# - 105 lint warnings (no errors), all typecheck clean
