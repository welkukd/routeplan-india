# Latest Independent Review

Completed: 2026-08-24T01:33:13-0400
Scope: staged release-provenance gate, its tests and QA wiring, plus existing WhatsApp production-readiness evidence

## Reviewed evidence

- First staged-diff review: `deleg_9580b81b` — requested explicit staged/unstaged separation, command timeouts, broader deploy-path coverage, metadata normalization, and clean-flag variants.
- Final staged-diff review: `deleg_a2641690` — `passed:true`, `security_concerns:[]`, `logic_errors:[]`.
- Static added-line scan: zero hardcoded-secret, shell-injection, eval, unsafe-deserialization, or SQL-interpolation matches.
- Release-provenance unit tests: 12 passed.
- Acceptance-verifier tests: 6 passed.
- Full local `npm run qa`: 9 passed, 0 failed.
- External `npm run qa:external`: 9 passed, 3 failed as designed.
- Canonical Vercel deployment API readback and public HTTP readiness probe.

## Approved scope

### Release-provenance gate

- Staged, unstaged, and untracked changes are read separately across deploy-relevant app, package, migration, lockfile, build-config, and workflow paths, then deduplicated.
- Local HEAD must exactly match authenticated `origin/main`; missing credentials fail closed without prompting.
- The canonical Vercel alias is resolved to a deployment ID, and the deployment must be `READY`, target `production`, project `routeplan-india`, `gitDirty` clean, and built from the exact verified Git commit.
- Every Git and Vercel subprocess has a 30-second timeout and uses argument arrays rather than shell interpolation.
- Vercel's raw deployment object is reduced through a strict field allowlist; environment data is discarded and never logged.
- Metadata keys are normalized case-insensitively; documented clean/dirty variants are tested.
- Errors expose only safe paths, public commit hashes, deployment IDs, and generic exit status—no credential values.
- Repository invariants ensure the implementation, tests, and external QA wiring cannot silently disappear.

### Test and review result

- Twelve dependency-free tests cover dirty-path union, clean success, dirty source, local/remote divergence, Vercel dirty variants, deployed-commit mismatch, missing metadata, field allowlisting, key normalization, wrong environment/state, operational failures, and malformed input.
- The first review's blocking concerns were addressed before commit.
- The final reviewer found no security concern and no logic error. Non-blocking suggestions were limited to JSDoc, reducing hardcoded project-name coupling, and documenting intentional fail-closed `null` handling.

## Current release-provenance result

The new gate correctly blocks the current state:

- GitHub `origin/main` is unreadable without authentication.
- `apps/web/e2e/smoke.spec.ts` and `apps/web/src/app/page.tsx` are dirty.
- Deployment `dpl_EPHgBFZycLSShCNk3VUigFLVtLbL` reports dirty source metadata.
- Its reported commit `99933abf2dcdc23f57a8749c9f1211c52ab063ef` differs from local verified commit `ea83fc8b7baf2ebb2521462d7aaeec23a0e9a876`.

## Existing unapproved production scope

The full WhatsApp production webhook remains unapproved because:

1. Deferred processing has no durable pre-ack inbox and retry path.
2. Delivery/read status can regress under out-of-order provider events and does not consistently use provider timestamps.
3. Admin and route APIs lack complete real-user/tenant authorization.
4. Supabase/Gupshup production configuration and real end-to-end evidence are absent.
5. Production readiness remains HTTP 503 with five missing Gupshup variables.

The source-owner design and tests remain in `.hermes-supervisor/WEBHOOK_RELIABILITY_ISSUE_DRAFT.md`.

## Verdict

The release-provenance gate is approved and correctly prevents an unreproducible deployment from being reported as production-ready. The overall WhatsApp mission remains blocked on source reliability, authorization, external credentials/configuration, GitHub synchronization, and real-flow evidence.

VERDICT: CONTINUE
