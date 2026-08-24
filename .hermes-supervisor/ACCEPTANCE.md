# Acceptance — WhatsApp Webhook Production Readiness

Last evidence refresh: 2026-08-24T00:00:27-04:00
Baseline commit: `9b5c0e47ab8cec4629ea10106a35775867727f3d`

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
- [x] `npm run qa` exits zero: 7 gates pass.
- [x] Fresh independent review finds no critical/high-severity defect.

## B. Production deployment

- [x] Vercel project `zone-1433/routeplan-india` is linked.
- [x] Deployment `dpl_W2hYRpq9zE3NLhuxCxj33GMLdesb` is `READY`.
- [x] Both production aliases resolve and the landing page returns HTTP 200.
- [x] Production landing page has no dead `href="#"` controls and no unverified `99.9%` claim.
- [x] Production-targeted Playwright smoke tests pass: 2 tests.
- [ ] Production readiness returns HTTP 200 with `configured:true` and an empty `missing` array.
- [ ] `GUPSHUP_APP_NAME` is configured in Vercel Production.
- [ ] `GUPSHUP_SOURCE_NUMBER` is configured in `91XXXXXXXXXX` format.
- [ ] `NEXT_PUBLIC_WHATSAPP_NUMBER` is configured in `91XXXXXXXXXX` format.
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
- [x] No local env or Vercel directory is tracked by git.
- [x] Readiness output names missing variables but does not expose values.
- [x] Production dependency audit is clean: `npm audit --omit=dev` reports 0 vulnerabilities.
- [ ] Full development dependency audit is clean. Current result: 8 findings (3 moderate, 3 high, 2 critical) in Playwright/Vite/Vitest tooling.
- [ ] The manually deployed landing-page source is committed so production is reproducible from git.
- [ ] GitHub authentication is restored, changes are pushed, and remote commit/CI state is read back.
- [ ] `npm run qa:external` exits zero against production.

## Current verdict

`BLOCKED` for the real production flow: provider credentials/configuration and Supabase project access are unavailable. The deployed landing fix is not yet reproducible from git, and development-tool vulnerabilities remain.
