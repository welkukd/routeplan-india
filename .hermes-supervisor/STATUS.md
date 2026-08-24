# Status — WhatsApp Webhook Production Readiness

Updated: 2026-08-24T00:50:06-0400
Current shipped commit: `86880f97ab5cc89557c0183601e67d314b40c300`
Verdict: **BLOCKED**

## This pass

- Re-read git state, local environment classifications, Vercel project/deployment/environment metadata, public readiness, Supabase CLI authentication, and GitHub authentication without exposing secret values.
- Added a fail-closed acceptance parser and release gate so `qa:external` cannot report completion while any manual mission checkbox remains unchecked.
- Added six dependency-free Node tests covering checkbox parsing, malformed input, empty contracts, structural contraction, and invalid types.
- Pinned minimum checklist counts for all six acceptance sections so deleting blockers cannot turn the release gate green.
- Wired parser tests into local QA and the completion contract into external QA; repository invariants now verify that wiring remains present.
- Verified `npm run qa`: 8 passed, 0 failed. Verified `npm run qa:external`: 8 passed, 2 failed exactly as intended—33 acceptance items remain and production readiness is HTTP 503.
- Received an independent cached-diff approval with no security or logic finding (`deleg_4b0e5e15`).
- Committed the isolated mission-control change as `86880f9`; no protected source-owner change was staged.
- Retried `git push origin main`; it remains blocked by missing GitHub credentials (`could not read Username`).
- Kept deployment `dpl_EPHgBFZycLSShCNk3VUigFLVtLbL` unchanged because this pass modified mission-control code and documentation only, not the deployed application.

## Verified local evidence

| Check | Result |
|---|---|
| `npm run typecheck` | PASS |
| `npm run test` | PASS — 35 tests |
| Acceptance verifier | PASS — 6 tests |
| `npm run build` | PASS |
| `npm run lint` | PASS — 0 errors, 82 warnings |
| `npm run test:e2e` | PASS — 2 tests |
| `npm run qa` | PASS — 8 gates |
| `npm audit --omit=dev --audit-level=high` | PASS — 0 production vulnerabilities |

Full `npm audit` and Vercel's development install report 8 build/test-tool findings: 3 moderate, 3 high, and 2 critical in Playwright/Vite/Vitest-related chains. They are not present in the production-only dependency graph, but remain an operational blocker for broader contributor/CI exposure.

## Verified production evidence

- Vercel identity: `splshca-9112`.
- Project: `zone-1433/routeplan-india`.
- Deployment: `dpl_EPHgBFZycLSShCNk3VUigFLVtLbL`, status `READY`.
- Aliases: `routeplan-india.vercel.app`, `routeplan-india-zone-1433.vercel.app`.
- `/`, `/driver`, `/admin`, `/admin/customers`, `/admin/routes`, `/admin/billing`, and `/admin/analytics`: HTTP 200.
- Observed request totals in one post-deploy batch: root `0.523s`; driver `0.485s`; admin `1.157s`; other tested admin pages `0.411–0.465s`.
- Production-targeted Playwright: PASS — 2 tests in `3.8s`.
- Landing HTML: 0 dead `href="#"` anchors, no placeholder number, no `99.9%`, fake GSTIN, or `50+ Indian SMBs` claim; honest pilot-pending CTA is present.
- Desktop and mobile: no horizontal overflow, broken images, or console/page errors.
- Production readiness: HTTP 503, `configured:false`.
- Missing list: `GUPSHUP_API_KEY`, `GUPSHUP_APP_ID`, `GUPSHUP_APP_NAME`, `GUPSHUP_SOURCE_NUMBER`, `GUPSHUP_WEBHOOK_SECRET`.
- `npm run qa:external` is fail-closed: 8 gates pass; the acceptance contract fails with 25/58 checked and the public readiness probe fails on HTTP 503.
- Vercel usage percentage is unavailable: `vercel usage` returns `Costs not found (404)`.
- Deployment and test actions consumed $0; no Gupshup conversation or real Supabase write was made.

## Independent review outcome

Approved:

- Mission-control and QA scripts.
- Acceptance parser, six tests, structural-contraction guard, and external release-gate wiring.
- Exact landing cleanup.
- New production deployment and live desktop/mobile rendering.

Not approved:

1. The deferred `after()` path has no durable inbox/retry after the callback receives `202`.
2. Delivery/read updates use local processing time and can regress under out-of-order provider events.
3. Admin and route APIs still lack production-grade user/organization authorization.
4. Real provider/database configuration and end-to-end evidence are absent.

Two reviewer claims were rejected after official-documentation readback: Self-Serve does not publish the alleged HMAC header, and Gupshup documents `app` as app name, so the current `appName` validation versus separate `appId` tenant lookup is not the claimed mismatch.

## Supabase and Gupshup state

- `.env.local` Supabase public values are placeholders.
- Supabase CLI: `LegacyPlatformAuthRequiredError`; no linked project.
- Vercel Production lacks `GUPSHUP_APP_NAME`, `GUPSHUP_SOURCE_NUMBER`, and `NEXT_PUBLIC_WHATSAPP_NUMBER` metadata entries.
- Sensitive Vercel values cannot be recovered locally; pulls are redacted.
- No migrations, tables, indexes, policies, app details, source number, callback, template IDs, or sandbox numbers have been read back.

## Git/GitHub state

- Local commits now include `a4203e7` (mission control), `99933ab` (GitHub blocker issue draft), `472b201` (grounded reliability review), `98f95ae` (push blocker evidence), and `86880f9` (fail-closed release acceptance).
- `origin`: `https://github.com/arjun/routeplan-india.git`.
- `gh` is not installed; no token or credential is available.
- The post-`86880f9` `git push origin main` attempt failed with `could not read Username for 'https://github.com'`; remote state and CI remain unreadable.
- Ready-to-post drafts:
  - `.hermes-supervisor/GITHUB_ISSUE_DRAFT.md`
  - `.hermes-supervisor/WEBHOOK_RELIABILITY_ISSUE_DRAFT.md`

## Protected unrelated work

Do not stage, alter, revert, or include these source-owner changes in the isolated mission commit:

```text
 M apps/web/e2e/smoke.spec.ts
 M apps/web/src/app/page.tsx
?? AGENTS.md
```

The two source changes are live in deployment `dpl_EPHgBFZycLSShCNk3VUigFLVtLbL` but remain uncommitted, so production is not reproducible from git. `AGENTS.md` is stale and untracked; its protected-file write requires an interactive approval unavailable to this cron job.

## Exact blockers

1. **Reliability:** no durable pre-ack inbox/retry and no monotonic provider-timestamped delivery state.
2. **Authorization:** admin/route APIs require real user and tenant authorization.
3. **Supabase:** no authenticated Mumbai project, applied migrations, or readback.
4. **Gupshup:** no usable credentials, app/source/public number, registered callback, templates, or sandbox readback.
5. **Real flow:** no inbound/outbound/delivery/replay evidence.
6. **Reproducibility:** deployed landing changes remain uncommitted.
7. **Development tooling:** 8 full-audit findings remain.
8. **GitHub:** no authenticated path to post issues, push, or verify CI.
9. **Instruction file:** protected guard blocks unattended correction/commit of stale `AGENTS.md`.

## Next highest-impact actions

1. Source owner commits the deployed landing and smoke-test changes.
2. Source owner implements and tests `WEBHOOK_RELIABILITY_ISSUE_DRAFT.md`.
3. Add real user/organization authorization to admin and route APIs.
4. Provision/link Mumbai Supabase, apply migrations `001` and `002`, and read back schema/RLS.
5. Configure Gupshup app/source/public number, register tokenized callback and templates, then run the real flow.
6. Upgrade Playwright/Vitest/Vite with the lockfile owner and rerun QA/full audit.
7. Restore GitHub authentication, post both issue drafts, push local commits, and verify CI.

VERDICT: BLOCKED
