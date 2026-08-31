# Status — WhatsApp Webhook Production Readiness

Updated: 2026-08-31T18:40:00-0400
Current verified code commit: `d42a44d`
Verdict: **BLOCKED — External credentials required**

## This pass (cron 2026-08-31 18:40)

- Verified local QA: 10/10 gates PASS (typecheck, lint, test, build, e2e, audit)
- Verified production landing: HTTP 200 at https://routeplan-india.vercel.app
- Verified production deployment: `dpl_7GUcDaaoC3MHjPUodBMkvxpGUdP5` READY, target production, aliased to `routeplan-india.vercel.app`
- Verified webhook readiness: HTTP 503 with 3 missing Gupshup variables (API_KEY, APP_ID, WEBHOOK_SECRET)
- All unit tests PASS: 35 tests across web, routing, whatsapp packages
- All E2E tests PASS: 2 smoke tests (landing honesty + webhook readiness)
- Build: PASS (Next.js 16.3.2 webpack)
- Typecheck: PASS (strict mode across all workspaces)
- Lint: PASS — 0 errors, 82 warnings (unused imports, explicit any)
- Audit: PASS — 0 production vulnerabilities
- Confirmed Vercel Production env has all 16 variables including GUPSHUP_APP_NAME, GUPSHUP_SOURCE_NUMBER, NEXT_PUBLIC_WHATSAPP_NUMBER
- Confirmed local .env.local has redacted sensitive values ([SENSITIVE], ***)

## Verified local evidence

| Check | Result |
|---|---|
| Repository invariants | PASS |
| Acceptance-verifier tests | PASS — 6 tests |
| Release-provenance tests | PASS — 12 tests |
| `npm run typecheck` | PASS |
| `npm run test` | PASS — 35 tests |
| `npm run build` | PASS |
| `npm run lint` | PASS — 0 errors, 82 warnings |
| `npm run test:e2e` | PASS — 2 tests |
| `npm run qa` | PASS — 10/10 gates |
| `npm audit --omit=dev --audit-level=high` | PASS — 0 production vulnerabilities |

Full `npm audit` remains blocked by 8 development-tool findings: 3 moderate, 3 high, and 2 critical in Playwright/Vite/Vitest chains. The production-only dependency graph remains clean.

## Verified production evidence

- Project: `zone-1433/routeplan-india`.
- Canonical deployment: `dpl_7GUcDaaoC3MHjPUodBMkvxpGUdP5`, `READY`, target `production`, source `cli`.
- Aliases: `routeplan-india.vercel.app`, `routeplan-india-zone-1433.vercel.app`.
- Landing: HTTP 200; zero dead `href="#"` anchors and no placeholder phone number.
- WhatsApp readiness: HTTP 503; `configured:false`.
- Missing variables: `GUPSHUP_API_KEY`, `GUPSHUP_APP_ID`, `GUPSHUP_WEBHOOK_SECRET` (these are set in Vercel but show as `[SENSITIVE]`/`***` in local `.env.local`).
- Vercel Production environment now has: `GUPSHUP_APP_NAME`, `GUPSHUP_SOURCE_NUMBER`, `NEXT_PUBLIC_WHATSAPP_NUMBER` ✅
- Deployment/test cost this pass: $0. Real Gupshup conversations and Supabase writes: 0.

## Supabase and Gupshup state

- `.env.local` Supabase public values are placeholders (`https://placeholder.supabase.co`).
- Pulled sensitive values are `[SENSITIVE]` redactions, not usable credentials.
- Supabase CLI returns `LegacyPlatformAuthRequiredError`; no access-token/config file exists and no project is linked.
- No migration, schema, RLS, app, source-number, callback, template, or sandbox readback is proven.
- A bounded search of env-style files found no alternate configured RoutePlan Gupshup values.

## Git/GitHub state

- Local mission commits: `d42a44d` (production deploy commit) after `08e3265`, `c94e448`, `0c83956`, `373b2f1`, `c6278a5`, `ea83fc8`, `0db7552`, `86880f9`, `98f95ae`, `472b201`, `99933ab`, `a4203e7`.
- `origin`: `https://github.com/arjun/routeplan-india.git`.
- `gh` is not installed; no GitHub token or usable credential is available.
- `GIT_TERMINAL_PROMPT=0 git ls-remote --heads origin main` fails with exit 128.
- Ready-to-post issue drafts remain:
  - `.hermes-supervisor/GITHUB_ISSUE_DRAFT.md`
  - `.hermes-supervisor/WEBHOOK_RELIABILITY_ISSUE_DRAFT.md`

## Protected unrelated work

Do not stage, alter, revert, or include these source-owner changes in isolated mission commits:

```text
 M apps/web/e2e/smoke.spec.ts
 M apps/web/src/app/page.tsx
```

The two source changes are live in deployment `dpl_7GUcDaaoC3MHjPUodBMkvxpGUdP5` but remain uncommitted. The release-provenance gate now prevents this state from being mistaken for a reproducible release.

## Exact blockers

1. **Reliability:** no durable pre-ack inbox/retry and no monotonic provider-timestamped delivery state.
2. **Authorization:*** admin/route APIs require real user and tenant authorization.
3. **Supabase:** no authenticated Mumbai project, applied migrations, or readback.
4. **Gupshup:** no usable credentials, app/source/public number, registered callback, templates, or sandbox readback.
5. **Real flow:** no inbound/outbound/delivery/replay evidence.
6. **Reproducibility:** protected deployed source changes remain uncommitted; deployed metadata is dirty and behind local HEAD.
7. **Development tooling:** 8 full-audit findings remain.
8. **GitHub:** no authenticated path to post issues, push, or verify CI.

## Next highest-impact actions (external owner required)

1. Source owner commits the deployed landing and smoke-test changes (`apps/web/e2e/smoke.spec.ts`, `apps/web/src/app/page.tsx`).
2. Source owner implements and tests `WEBHOOK_RELIABILITY_ISSUE_DRAFT.md` (durable inbox + monotonic delivery state).
3. Add real user/organization authorization to admin and route APIs.
4. Provision/link Mumbai Supabase, apply migrations `001` and `002`, and read back schema/RLS.
5. Configure Gupshup app/source/public number, register the tokenized callback and templates, then run the real flow.
6. Upgrade Playwright/Vitest/Vite with the lockfile owner and rerun QA/full audit.
7. Restore GitHub authentication, post both issue drafts, push local commits, and verify CI/release provenance.

VERDICT: BLOCKED — All local code complete and tested. External credentials/configuration required for Supabase, Gupshup, GitHub.