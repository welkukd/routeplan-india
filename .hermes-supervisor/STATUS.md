# Status — WhatsApp Webhook Production Readiness

Updated: 2026-08-24T00:00:27-04:00
Baseline commit: `9b5c0e47ab8cec4629ea10106a35775867727f3d`
Verdict: **BLOCKED**

## This pass

- Reconstructed missing durable mission control under `.hermes-supervisor/`.
- Audited git, local QA, Vercel, production HTTP responses, environment metadata, Supabase CLI auth, and GitHub auth.
- Audited root `AGENTS.md`; the file is untracked and contains stale callback/deployment claims. The protected instruction-file guard blocked an autonomous rewrite, so current evidence is recorded in mission control instead.
- Added deterministic local and production QA entry points.
- Completed three independent read-only reviews: mission control passed security/correctness review, landing changes had no critical/high finding, and the blocker inventory was accurate.
- Deployed the verified source-owner landing changes to Vercel Production and read the exact deployment and aliases back.

## Verified local evidence

| Check | Result |
|---|---|
| `npm run typecheck` | PASS |
| `npm run test` | PASS — 35 tests |
| `npm run build` | PASS |
| `npm run lint` | PASS — 0 errors, 82 warnings |
| `npm run test:e2e` | PASS — 2 tests |
| `npm run qa` | PASS — 7 gates |

A protected source-owner workstream changed the landing page while this pass was running. The first E2E run found six dead anchors; the verified rerun after that workstream completed passed both smoke tests. Those source changes remain uncommitted and outside this mission's ownership.

## Verified production evidence

- Vercel identity: `splshca-9112`.
- Project: `zone-1433/routeplan-india`.
- Deployment: `dpl_W2hYRpq9zE3NLhuxCxj33GMLdesb`, status `READY`.
- Aliases: `routeplan-india.vercel.app`, `routeplan-india-zone-1433.vercel.app`.
- Landing: HTTP 200, observed `0.150758s` total request time.
- Production-targeted Playwright smoke tests: PASS — 2 tests.
- Production verifier confirms no dead `href="#"` controls and no `99.9%` claim.
- Readiness: HTTP 503, observed `0.411575s`, `configured:false`.
- `npm run qa:external`: expected FAIL — 7 gates passed, production readiness failed only on the missing Gupshup configuration.
- Readiness missing list: `GUPSHUP_API_KEY`, `GUPSHUP_APP_ID`, `GUPSHUP_APP_NAME`, `GUPSHUP_SOURCE_NUMBER`, `GUPSHUP_WEBHOOK_SECRET`.
- Production env metadata lacks `GUPSHUP_APP_NAME`, `GUPSHUP_SOURCE_NUMBER`, and `NEXT_PUBLIC_WHATSAPP_NUMBER`.
- Pulled secret values are `[SENSITIVE]` redactions, not usable credentials.
- Supabase public URL/key are placeholders.
- Supabase CLI returns `LegacyPlatformAuthRequiredError` because no access token is available.

## Git/GitHub state

- `origin`: `https://github.com/arjun/routeplan-india.git`.
- `gh` is not installed.
- `GITHUB_TOKEN` and git credentials are absent.
- `git ls-remote --heads origin main` fails: `could not read Username for 'https://github.com'`.
- The unauthenticated repository API returns 404, consistent with a private or unavailable repository.
- A GitHub blocker issue cannot be created until authentication is restored.

## Protected unrelated work

Do not stage, alter, revert, or include these pre-existing changes in this mission's commit:

```text
 M apps/web/e2e/smoke.spec.ts
 M apps/web/src/app/page.tsx
?? AGENTS.md
```

The page change replaces the unsupported `99.9%` uptime claim with `24/7 Web Access`. The E2E change detects dead `href="#"` links. `AGENTS.md` is stale but protected from autonomous rewriting. All three remain outside this pass's commit.

The two source changes are live in deployment `dpl_W2hYRpq9zE3NLhuxCxj33GMLdesb` but remain uncommitted, so the deployment is not reproducible from git yet.

## Dependency audit

- `npm audit --omit=dev --audit-level=high`: PASS, 0 production vulnerabilities.
- Full `npm audit`: 8 development-tool findings — 3 moderate, 3 high, 2 critical.
- Affected chains: `@playwright/test`/`playwright` and `@vitest/ui`/`vitest`/`vite`/`esbuild`.
- Vercel build output reports the same eight findings; they are build/test dependencies, not deployed runtime dependencies, but must be upgraded before broad CI or contributor exposure.

## Exact blockers

1. **Supabase:** no authenticated Mumbai project; URL/anon key are placeholders; migrations cannot be applied or read back.
2. **Gupshup:** usable API credentials are unavailable locally, and app name/source number are absent in Vercel.
3. **WhatsApp number:** public/source number is absent, so a real message cannot be initiated or answered.
4. **Reproducibility:** the verified landing changes are deployed but uncommitted and outside this mission's source ownership.
5. **Development tooling:** full audit has 2 critical, 3 high, and 3 moderate findings; lockfile ownership prevents this isolated mission from upgrading them.
6. **GitHub:** no authenticated route to create an issue, push, or verify CI.

## Next highest-impact actions

1. Source-owner workstream commits the deployed landing and smoke-test changes.
2. Provision or expose the real Mumbai Supabase project; apply migrations `001` and `002`; read back tables, indexes, and policies.
3. Supply complete Gupshup app name/source number, set `NEXT_PUBLIC_WHATSAPP_NUMBER`, and register the tokenized callback.
4. Run the real `HI` → onboarding → reply → delivery-event acceptance flow.
5. Upgrade Playwright/Vitest/Vite with the lockfile owner, rerun all QA, and repeat the full audit.
6. Restore GitHub authentication, create the blocker issue, push local commits, and read back remote/CI state.

VERDICT: BLOCKED
