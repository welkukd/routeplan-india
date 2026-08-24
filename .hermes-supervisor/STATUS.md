# Status — WhatsApp Webhook Production Readiness

Updated: 2026-08-24T01:33:13-0400
Current verified code commit: `ea83fc8b7baf2ebb2521462d7aaeec23a0e9a876`
Verdict: **BLOCKED**

## This pass

- Reconstructed continuity from session history, git, mission control, live Vercel readback, local environment classifications, Supabase CLI state, and GitHub reachability.
- Confirmed no usable Gupshup app name, source number, public WhatsApp number, Supabase access token, or GitHub credential exists in the inspected local stores; secret values were never printed.
- Added a fail-closed Git/GitHub/Vercel release-provenance gate under `.hermes-supervisor/**` using strict TDD.
- Added dependency-free checks for staged, unstaged, and untracked deploy-relevant files; local HEAD versus `origin/main`; canonical Vercel deployment state; Vercel `gitDirty`; and exact deployed commit parity.
- Added command timeouts, metadata-key normalization, strict field allowlisting that discards Vercel environment data, and explicit handling for documented clean/dirty metadata variants.
- Added 12 release-provenance tests and wired them into local QA. Wired the live provenance probe into `qa:external`.
- Expanded repository invariants and acceptance-structure minimums so this gate cannot silently disappear.
- Ran a first independent review, hardened the implementation against every blocking concern, and received a clean second-pass verdict (`deleg_a2641690`): no security concern and no logic error.
- Committed the verified implementation as `ea83fc8` without staging or altering protected source-owner changes.
- Did not redeploy: this pass changed only mission-control verification, not application output, and the current production artifact is intentionally flagged as unreproducible.

## Verified local evidence

| Check | Result |
|---|---|
| Repository invariants | PASS |
| Acceptance-verifier tests | PASS — 6 tests |
| Release-provenance tests | PASS — 12 tests |
| `npm run typecheck` | PASS |
| `npm run test` | PASS — 35 application/package tests |
| `npm run build` | PASS |
| `npm run lint` | PASS — 0 errors, 82 warnings |
| `npm run test:e2e` | PASS — 2 tests |
| `npm run qa` | PASS — 9 gates |
| `npm audit --omit=dev --audit-level=high` | PASS — 0 production vulnerabilities |

Full `npm audit` remains blocked by 8 development-tool findings: 3 moderate, 3 high, and 2 critical in Playwright/Vite/Vitest chains. The production-only dependency graph remains clean.

## External gate evidence

`npm run qa:external` is fail-closed and currently exits non-zero with **9 passed, 3 failed**:

1. **Release provenance fails:**
   - `origin/main` cannot be read because GitHub authentication is absent.
   - Deploy-relevant files `apps/web/e2e/smoke.spec.ts` and `apps/web/src/app/page.tsx` remain uncommitted.
   - Production deployment `dpl_EPHgBFZycLSShCNk3VUigFLVtLbL` reports `gitDirty=1`.
   - That deployment reports commit `99933abf2dcdc23f57a8749c9f1211c52ab063ef`, not local verified commit `ea83fc8b7baf2ebb2521462d7aaeec23a0e9a876`.
2. **Acceptance contract fails:** 26/59 items checked; 33 remain.
3. **Production readiness fails:** HTTP 503 with five missing Gupshup variables.

## Verified production evidence

- Project: `zone-1433/routeplan-india`.
- Canonical deployment: `dpl_EPHgBFZycLSShCNk3VUigFLVtLbL`, `READY`, target `production`, source `cli`.
- Aliases: `routeplan-india.vercel.app`, `routeplan-india-zone-1433.vercel.app`.
- Landing: HTTP 200; observed response `0.277s`; zero dead `href="#"` anchors and no placeholder phone number.
- WhatsApp readiness: HTTP 503; observed response `0.384s`; `configured:false`.
- Missing variables: `GUPSHUP_API_KEY`, `GUPSHUP_APP_ID`, `GUPSHUP_APP_NAME`, `GUPSHUP_SOURCE_NUMBER`, `GUPSHUP_WEBHOOK_SECRET`.
- Vercel Production environment metadata still lacks `GUPSHUP_APP_NAME`, `GUPSHUP_SOURCE_NUMBER`, and `NEXT_PUBLIC_WHATSAPP_NUMBER`.
- Deployment/test cost this pass: $0. Real Gupshup conversations and Supabase writes: 0.

## Supabase and Gupshup state

- `.env.local` Supabase public values are placeholders.
- Pulled sensitive values are `[SENSITIVE]` redactions, not usable credentials.
- Supabase CLI returns `LegacyPlatformAuthRequiredError`; no access-token/config file exists and no project is linked.
- No migration, schema, RLS, app, source-number, callback, template, or sandbox readback is proven.
- A bounded search of env-style files found no alternate configured RoutePlan Gupshup values.

## Git/GitHub state

- Local mission commits now include `ea83fc8` (release-provenance gate) after `0db7552`, `86880f9`, `98f95ae`, `472b201`, `99933ab`, and `a4203e7`.
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
?? AGENTS.md
```

The two source changes are live in deployment `dpl_EPHgBFZycLSShCNk3VUigFLVtLbL` but remain uncommitted. The release-provenance gate now prevents this state from being mistaken for a reproducible release.

## Exact blockers

1. **Reliability:** no durable pre-ack inbox/retry and no monotonic provider-timestamped delivery state.
2. **Authorization:** admin/route APIs require real user and tenant authorization.
3. **Supabase:** no authenticated Mumbai project, applied migrations, or readback.
4. **Gupshup:** no usable credentials, app/source/public number, registered callback, templates, or sandbox readback.
5. **Real flow:** no inbound/outbound/delivery/replay evidence.
6. **Reproducibility:** protected deployed source changes remain uncommitted; deployed metadata is dirty and behind local HEAD.
7. **Development tooling:** 8 full-audit findings remain.
8. **GitHub:** no authenticated path to post issues, push, or verify CI.
9. **Instruction file:** root `AGENTS.md` remains stale, protected, and untracked.

## Next highest-impact actions

1. Source owner commits the deployed landing and smoke-test changes.
2. Source owner implements and tests `WEBHOOK_RELIABILITY_ISSUE_DRAFT.md`.
3. Add real user/organization authorization to admin and route APIs.
4. Provision/link Mumbai Supabase, apply migrations `001` and `002`, and read back schema/RLS.
5. Configure Gupshup app/source/public number, register the tokenized callback and templates, then run the real flow.
6. Upgrade Playwright/Vitest/Vite with the lockfile owner and rerun QA/full audit.
7. Restore GitHub authentication, post both issue drafts, push local commits, and verify CI/release provenance.

VERDICT: BLOCKED
