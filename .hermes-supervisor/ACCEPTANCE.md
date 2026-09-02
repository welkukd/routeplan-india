# Acceptance — WhatsApp Webhook Production Readiness

Last evidence refresh: 2026-08-31T23:55:13-0400
Baseline commit: `ea83fc8b7baf2ebb2521462d7aaeec23a0e9a876`

## A. Local implementation

- [x] Gupshup Self-Serve V2 inbound and `message-event` schemas are unit tested.
- [x] Session and template send payloads target the current `/wa/api/v1` endpoints and are unit tested.
- [x] Callback token authentication fails closed and uses constant-time comparison.
- [x] Valid callbacks return an empty `202` and defer processing.
- [x] Duplicate callback IDs do not send duplicate replies.
- [x] Onboarding, business type, location, driver, `ROUTE`, and delivery-event paths have unit coverage.
- [x] Migration `002_whatsapp_webhook_sessions.sql` defines sessions, uniqueness, indexes, message types, and RLS.
- [x] `.env.example` contains every required WhatsApp and Supabase key with blank values.
- [x] `npm run typecheck` exits zero.
- [x] `npm run test` exits zero: 35 tests pass.
- [x] `npm run build` exits zero.
- [x] `npm run lint` exits zero with 0 errors; 82 warnings remain.
- [x] `npm run test:e2e` exits zero: 2 smoke tests pass.
- [x] `npm run qa` exits zero: 10 gates pass.
- [x] `qa:external` parses every manual acceptance checkbox and fails closed while any remain unchecked.
- [x] Release-provenance logic has dependency-free tests for dirty files, Git divergence, missing evidence, dirty deployments, commit mismatch, and non-production state.
- [x] Fresh independent review of mission control and the landing cleanup finds no critical/high-severity defect.
- [ ] Fresh independent review of the full production webhook finds no critical/high-severity defect. Current high-severity reliability follow-ups are tracked in `WEBHOOK_RELIABILITY_ISSUE_DRAFT.md`.

## B. Production deployment

- [x] Vercel project `zone-1433/routeplan-india` is linked.
- [x] Deployment `dpl_9r5CNdk3crFBYKjNDoiPkeneexDE` is `READY`.
- [x] Both production aliases resolve and the landing page returns HTTP 200.
- [x] Production landing page has no dead `href="#"` controls and no unverified `99.9%` claim.
- [x] Production-targeted Playwright smoke tests pass: 2 tests.
- [x] Live desktop 1440px and mobile 390px checks show no overflow, broken images, or console errors.
- [ ] Production readiness returns HTTP 200 with `configured:true` and no missing variables reported.
- [x] `GUPSHUP_APP_NAME` is configured in Vercel Production.
- [x] `GUPSHUP_SOURCE_NUMBER` is configured in `91XXXXXXXXXX` format.
- [x] `NEXT_PUBLIC_WHATSAPP_NUMBER` is configured in `91XXXXXXXXXX` format.
- [ ] Supabase URL and anon key are real values rather than placeholders.

## C. Supabase readback

- [ ] A real Supabase project exists in the Mumbai region.
- [ ] CLI or dashboard access is authenticated.
- [ ] Migrations `001` and `002` are applied.
- [ ] `whatsapp_messages` and `whatsapp_sessions` are read back.
- [ ] Unique callback index is read back.
- [ ] RLS enablement and organization policies are read back.
- [ ] A service-role repository write is read back and then test data is removed.

## D. Gupshup readback

- [ ] API key and app ID are validated against a read-only provider endpoint.
- [ ] App name and source number match the provider dashboard.
- [ ] Callback URL is registered with the production token query parameter.
- [ ] Required templates are approved and real provider template IDs are stored.
- [ ] Sandbox source/destination numbers are confirmed.

## E. Real conversation

- [ ] A real WhatsApp `HI` reaches the production callback.
- [ ] Gupshup records an empty `202` acknowledgement within its timeout.
- [ ] The exact inbound message ID is read back from `whatsapp_messages`.
- [ ] The sender's onboarding session mutation is read back.
- [ ] RoutePlan sends an outbound reply and returns a real Gupshup `messageId`.
- [ ] A delivery/read event updates that exact outbound row.
- [ ] Replaying the inbound callback does not create or send a duplicate.
- [ ] The `ADD STOP`, `ADD DRIVER`, and `ROUTE` paths are exercised with real callbacks.

## F. Security and operations

- [ ] Admin and route APIs have real user/organization authorization before broad pilot access.
- [ ] Gupshup inbound IP ranges are obtained from provider support and allowlisted before broad production access.
- [ ] Every authenticated callback is durably retained before `202`; post-ack failures retry automatically.
- [ ] Delivery/read status uses provider event timestamps and cannot regress when events arrive out of order.
- [x] No local env or Vercel directory is tracked by git.
- [x] Readiness output names missing variables but does not expose values.
- [x] Production dependency audit is clean: `npm audit --omit=dev` reports 0 vulnerabilities.
- [ ] Full development dependency audit is clean. Current result: 8 findings (3 moderate, 3 high, 2 critical) in Playwright/Vite/Vitest tooling.
- [ ] The release-provenance gate confirms a clean deploy-relevant tree, local HEAD equals `origin/main`, and Vercel Production is a clean build of that exact commit.
- [ ] GitHub authentication is restored, changes are pushed, and remote commit/CI state is read back.
- Runtime completion gate (derived, not manually checked): `npm run qa:external` exits zero only after every checkbox above and the live production probe pass.

## Current verdict

`BLOCKED` for the real production flow: provider credentials/configuration and Supabase project access are unavailable. Durable post-ack retry, monotonic delivery-state handling, API authorization, reproducible source, GitHub synchronization, and development-tool upgrades also remain.
