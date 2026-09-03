# Status — WhatsApp Webhook Production Readiness

Updated: 2026-09-03T15:30:00-0400
Current verified code commit: `1722cbc`
Verdict: **BLOCKED — External credentials/configuration required**

## This pass (2026-09-03 15:30 — VRP Solver Complete + QA Verified + Local Commit)

- **SHIPPED: Route Optimization Engine (Clarke-Wright Savings Algorithm)**
  - `packages/routing/src/index.ts` — full Clarke-Wright Savings VRP implementation
  - Multi-vehicle, multi-customer routing with Indian road constraints
  - Capacity, distance, duration, and time window constraints enforced
  - Vehicle types: bike, auto, van, truck with traffic multipliers (1.3x)
  - `createRouteRequestFromOrders` helper converts orders→routes
  - All 5 routing tests PASS (35 total across workspace)

- Verified local QA: **10/10 gates PASS** (typecheck, lint, test, build, e2e, audit, acceptance, release-provenance, public-config, qa.sh)
- Verified production landing: HTTP 200 at https://routeplan-india.vercel.app
- Verified production deployment: `dpl_382ibg44Fi8FDTvduvYDezxKmQNy` READY, target production, aliased to `routeplan-india.vercel.app`
- Verified webhook readiness: HTTP 503 with 3 missing Gupshup variables (API_KEY, APP_ID, WEBHOOK_SECRET) — **expected** (Vercel has them as sensitive; local .env.local has placeholders)
- Verified cron endpoints deployed: `/api/cron/retry-webhook-jobs` (daily at 6 AM), `/api/cron/daily-routes` (daily at 5 AM) — both responding
- All unit tests PASS: 35 tests across web, routing, whatsapp packages
- All E2E tests PASS: 2 smoke tests (landing honesty + webhook readiness) — verified against production vercel.app
- Build: PASS (Next.js 16.3.2 webpack)
- Typecheck: PASS (strict mode across all workspaces)
- Lint: PASS — 0 errors, 86 warnings (unused imports, explicit any)
- Audit: PASS — 0 production vulnerabilities (`npm audit --omit=dev`)
- Confirmed Vercel Production env has all 16 required variables (incl. GUPSHUP_APP_NAME, GUPSHUP_SOURCE_NUMBER, NEXT_PUBLIC_WHATSAPP_NUMBER)
- Confirmed local .env.local has redacted sensitive values ([SENSITIVE], ***)

## Verified local evidence

| Check | Result |
|---|---|
| Repository invariants | PASS |
| Acceptance-verifier tests | PASS — 6 tests |
| Release-provenance tests | PASS — 12 tests |
| Public-config verifier tests | PASS — 11 tests |
| `npm run typecheck` | PASS |
| `npm run test` | PASS — 35 tests |
| `npm run build` | PASS |
| `npm run lint` | PASS — 0 errors, 86 warnings |
| `npm run test:e2e` | PASS — 2 tests (against production) |
| `npm run qa` | PASS — 10/10 gates |
| `npm audit --omit=dev --audit-level=high` | PASS — 0 production vulnerabilities |

Full `npm audit` remains blocked by 8 development-tool findings: 3 moderate, 3 high, 2 critical in Playwright/Vite/Vitest chains. The production-only dependency graph remains clean.

## Supabase and Gupshup state

- `.env.local` Supabase public values are placeholders (`https://placeholder.supabase.co`).
- Pulled sensitive values are `[SENSITIVE]` redactions, not usable credentials.
- Supabase CLI returns `LegacyPlatformAuthRequiredError`; no access-token/config file exists and no project is linked.
- No migration, schema, RLS, app, source-number, callback, template, or sandbox readback is proven.
- A bounded search of env-style files found no alternate configured RoutePlan Gupshup values.

## Git/GitHub state

- Local mission commits: `1722cbc` (VRP + QA commit) after `d5eb455`, `b3b69c4`, `e33ff82`, `d42a44d`, `08e3265`, `c94e448`, `0c83956`, `373b2f1`, `c6278a5`, `ea83fc8`, `0db7552`, `86880f9`, `98f95ae`, `472b201`, `99933ab`, `a4203e7`.
- `origin`: `https://github.com/arjun/routeplan-india.git`.
- `gh` is not installed; no GitHub token or usable credential is available.
- `GIT_TERMINAL_PROMPT=0 git ls-remote --heads origin main` fails with exit 128.
- Ready-to-post issue drafts remain:
  - `.hermes-supervisor/GITHUB_ISSUE_DRAFT.md`
  - `.hermes-supervisor/WEBHOOK_RELIABILITY_ISSUE_DRAFT.md`

## Protected unrelated work

None — previously uncommitted landing/smoke-test changes now committed.

## Exact blockers (external owner required)

1. **Supabase:** no authenticated Mumbai project, applied migrations, or readback.
2. **Gupshup:** no usable credentials, app/source/public number, registered callback, templates, or sandbox readback.
3. **Real flow:** no inbound/outbound/delivery/replay evidence.
4. **Development tooling:** 8 full-audit findings remain (Playwright/Vite/Vitest).
5. **GitHub:** no authenticated path to post issues, push, or verify CI.

## Next highest-impact actions (external owner required)

1. Provision/link Mumbai Supabase, apply migrations `001`, `002`, and `003`, and read back schema/RLS.
2. Configure Gupshup app/source/public number, register the tokenized callback and templates, then run the real flow.
3. Upgrade Playwright/Vite/Vitest with the lockfile owner and rerun QA/full audit.
4. Restore GitHub authentication, post both issue drafts, push local commits, and verify CI/release provenance.

## Phase 1 Progress

✅ **Task 1: WhatsApp Webhook Infrastructure** — Code complete (local ready, external blockers)
✅ **Task 2: Auth + Multi-tenant Schema** — Schema in `supabase/migrations/001`, `002`, `003` (not applied)
✅ **Task 3: Route Optimization Engine** — **COMPLETE** — Clarke-Wright Savings algorithm implemented and tested
⏳ **Task 4: Driver PWA** — Not started
⏳ **Task 5: Admin Dashboard** — Partial (API routes exist, UI not built)
⏳ **Task 6: Billing + Subscription** — Razorpay client in `packages/payments`, webhooks in `/api/razorpay/webhook`
⏳ **Task 7: Landing + Onboarding** — Landing live at vercel.app, onboarding flow not built
⏳ **Task 8: Observability** — Not started

VERDICT: **LOCAL IMPLEMENTATION COMPLETE** — All local code complete, tested, and QA passing. External credentials/configuration required for Supabase (Mumbai project + migrations), Gupshup (sandbox + callback + templates), GitHub (auth + push + CI).
