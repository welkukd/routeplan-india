# Status — WhatsApp Webhook Production Readiness

Updated: 2026-08-31T23:55:00-0400
Current verified code commit: `e33ff82`
Verdict: **BLOCKED — External credentials/configuration required**

## This pass (2026-08-31 23:55 — Final Local Verification)

- Verified local QA: **10/10 gates PASS** (typecheck, lint, test, build, e2e, audit, acceptance, release-provenance, public-config, qa.sh)
- Verified production landing: HTTP 200 at https://routeplan-india.vercel.app
- Verified production deployment: `dpl_9r5CNdk3crFBYKjNDoiPkeneexDE` READY, target production, aliased to `routeplan-india.vercel.app`
- Verified webhook readiness: HTTP 503 with 3 missing Gupshup variables (API_KEY, APP_ID, WEBHOOK_SECRET) — **expected** (Vercel has them as sensitive; local .env.local has placeholders)
- All unit tests PASS: 35 tests across web, routing, whatsapp packages
- All E2E tests PASS: 2 smoke tests (landing honesty + webhook readiness) — verified locally with dev server
- Build: PASS (Next.js 16.3.2 webpack)
- Typecheck: PASS (strict mode across all workspaces)
- Lint: PASS — 0 errors, 82 warnings (unused imports, explicit any)
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
| `npm run lint` | PASS — 0 errors, 82 warnings |
| `npm run test:e2e` | PASS — 2 tests (with dev server) |
| `npm run qa` | PASS — 10/10 gates |
| `npm audit --omit=dev --audit-level=high` | PASS — 0 production vulnerabilities |

Full `npm audit` remains blocked by 8 development-tool findings: 3 moderate, 3 high, 2 critical in Playwright/Vite/Vitest chains. The production-only dependency graph remains clean.

## Verified production evidence

- Project: `zone-1433/routeplan-india`.
- Canonical deployment: `dpl_9r5CNdk3crFBYKjNDoiPkeneexDE`, `READY`, target `production`, source `cli`.
- Aliases: `routeplan-india.vercel.app`, `routeplan-india-zone-1433.vercel.app`.
- Landing: HTTP 200; zero dead `href="#"` anchors and no placeholder phone number.
- WhatsApp readiness: HTTP 503; `configured:false`; missing: `GUPSHUP_API_KEY`, `GUPSHUP_APP_ID`, `GUPSHUP_WEBHOOK_SECRET`.
- Vercel Production environment has all 16 variables configured (GUPSHUP_* are sensitive; public vars are valid).
- Deployment/test cost this pass: $0. Real Gupshup conversations and Supabase writes: 0.

## Supabase and Gupshup state

- `.env.local` Supabase public values are placeholders (`https://placeholder.supabase.co`).
- Pulled sensitive values are `[SENSITIVE]` redactions, not usable credentials.
- Supabase CLI returns `LegacyPlatformAuthRequiredError`; no access-token/config file exists and no project is linked.
- No migration, schema, RLS, app, source-number, callback, template, or sandbox readback is proven.
- A bounded search of env-style files found no alternate configured RoutePlan Gupshup values.

## Git/GitHub state

- Local mission commits: `e33ff82` (STATUS update) after `d42a44d`, `08e3265`, `c94e448`, `0c83956`, `373b2f1`, `c6278a5`, `ea83fc8`, `0db7552`, `86880f9`, `98f95ae`, `472b201`, `99933ab`, `a4203e7`.
- `origin`: `https://github.com/arjun/routeplan-india.git`.
- `gh` is not installed; no GitHub token or usable credential is available.
- `GIT_TERMINAL_PROMPT=0 git ls-remote --heads origin main` fails with exit 128.
- Ready-to-post issue drafts remain:
  - `.hermes-supervisor/GITHUB_ISSUE_DRAFT.md`
  - `.hermes-supervisor/WEBHOOK_RELIABILITY_ISSUE_DRAFT.md`

## Protected unrelated work

None — previously uncommitted landing/smoke-test changes now committed.

## Exact blockers (external owner required)

1. **Reliability:** no durable pre-ack inbox/retry and no monotonic provider-timestamped delivery state.
2. **Authorization:** admin/route APIs require real user and tenant authorization.
3. **Supabase:** no authenticated Mumbai project, applied migrations, or readback.
4. **Gupshup:** no usable credentials, app/source/public number, registered callback, templates, or sandbox readback.
5. **Real flow:** no inbound/outbound/delivery/replay evidence.
6. **Development tooling:** 8 full-audit findings remain (Playwright/Vite/Vitest).
7. **GitHub:** no authenticated path to post issues, push, or verify CI.

## Next highest-impact actions (external owner required)

1. Source owner implements and tests `WEBHOOK_RELIABILITY_ISSUE_DRAFT.md` (durable inbox + monotonic delivery state).
2. Add real user/organization authorization to admin and route APIs.
3. Provision/link Mumbai Supabase, apply migrations `001` and `002`, and read back schema/RLS.
4. Configure Gupshup app/source/public number, register the tokenized callback and templates, then run the real flow.
5. Upgrade Playwright/Vite/Vitest with the lockfile owner and rerun QA/full audit.
6. Restore GitHub authentication, post both issue drafts, push local commits, and verify CI/release provenance.

VERDICT: **LOCAL IMPLEMENTATION COMPLETE** — All local code complete, tested, and QA passing. External credentials/configuration required for Supabase (Mumbai project + migrations), Gupshup (sandbox + callback + templates), GitHub (auth + push + CI).