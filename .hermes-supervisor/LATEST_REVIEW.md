# Latest Independent Review

Completed: 2026-08-24T00:08:31-04:00
Scope: full WhatsApp webhook implementation, mission control, landing cleanup, and production deployment

## Reviewed evidence

- Independent mission-control/reliability-document review: `deleg_b52d3e2f` — approved with no critical/high finding.
- Independent webhook/security review: `deleg_d8ea2611`.
- Independent landing deployment review: `deleg_6a4cf9f8`.
- Earlier mission-control and blocker review: `deleg_d7b16a33`.
- Local `./.hermes-supervisor/qa.sh`: 7 passed, 0 failed.
- Live deployment: `dpl_EPHgBFZycLSShCNk3VUigFLVtLbL`, `READY`.
- Production-targeted Playwright: 2 passed.
- 1440px desktop and 390px mobile live screenshots and DOM checks.
- Official Gupshup Self-Serve webhook, inbound-message, and message-event documentation.

## Approved scope

### Mission control and QA

- No critical/high security defect found in the mission-control scripts.
- The QA runner is fail-closed: every failed command increments the failure count and produces non-zero final exit.
- Repository marker checks are paired with strict typecheck, 35 unit tests, production build, lint, Playwright, and production dependency audit; they are not treated as behavioral proof alone.
- Secret values are not printed.

### Landing cleanup and deployment

- No critical/high defect found in the exact pending landing diff.
- The cleanup removes dead `href="#"` links, fake GSTIN, unsupported `50+ Indian SMBs` and `99.9%` claims, fake demo link, and misleading active WhatsApp CTA labels.
- Deployment `dpl_EPHgBFZycLSShCNk3VUigFLVtLbL` is `READY` and both aliases point to it.
- Live checks confirm HTTP 200, zero dead anchors, zero placeholder numbers, zero broken images, no horizontal overflow, and no browser console errors at 1440px and 390px.

## Grounded triage of webhook review findings

### Rejected as provider-contract errors

1. **“Missing Gupshup HMAC is a critical bypass” — not supported by the Self-Serve contract.** Gupshup's published Self-Serve docs do not define an `x-gupshup-signature` HMAC header. The official webhook guidance recommends allowlisting Gupshup inbound IPs through provider support. RoutePlan adds a project-owned secret token and constant-time comparison. The stale HMAC claims in untracked root `AGENTS.md` are documentation drift; a protected-file guard prevented correction in this unattended run.
2. **“`appName` versus `appId` is a tenant mismatch” — not supported by the payload contract.** Gupshup documents `app` as the app **name**. RoutePlan correctly validates it against `GUPSHUP_APP_NAME`; `GUPSHUP_APP_ID` is separately used for the configured tenant lookup and template API paths.

Provider references:

- https://docs.gupshup.io/docs/what-is-a-webhook
- https://docs.gupshup.io/docs/what-is-an-inbound-message
- https://docs.gupshup.io/docs/message-events

### Confirmed high-severity production-reliability gaps

1. **No durable post-ack retry.** The handler returns an empty `202` and invokes processing in Next.js `after()`, as Gupshup recommends for fast acknowledgement. If that deferred work fails, the callback has already received 2xx, the error is only logged, and no durable pending job guarantees retry.
2. **Delivery state is not monotonic or provider-timestamped.** Gupshup explicitly warns that event arrival order may differ from event timing. The repository uses local processing time and unconditional status updates; a later-arriving lower-rank event can downgrade state, and a read callback overwrites `delivered_at` with read-processing time.
3. **Broad API authorization remains incomplete.** The acceptance contract already records that admin and route APIs need real user/organization authorization before broad pilot access.

The concrete source-owner design, tests, and acceptance criteria are preserved in `.hermes-supervisor/WEBHOOK_RELIABILITY_ISSUE_DRAFT.md`.

## External blockers

- Supabase CLI is unauthenticated and no real Mumbai project is linked or read back.
- Supabase public production values are placeholders.
- Production webhook readiness is HTTP 503 and reports five missing Gupshup variables.
- App/source/public numbers, callback registration, templates, and sandbox numbers are not read back.
- No real inbound, outbound, delivery, or replay flow is proven.
- GitHub authentication is unavailable, so commits cannot be pushed or CI read back.
- Full development audit has 8 build/test-tool findings; production-only audit is clean.

## Verdict

The landing deployment and mission-control changes are approved. The full production webhook is not approved because durable retry, monotonic delivery handling, API authorization, external configuration, and real-flow evidence remain incomplete.

VERDICT: CONTINUE
