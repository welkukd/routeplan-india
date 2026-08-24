# Phase 1 Status — RoutePlan India

Last verified: 2026-08-23

## Shipped in code

- [x] Next.js 16 monorepo builds in strict TypeScript mode.
- [x] Gupshup Self-Serve V2 callback schemas use the documented `{ app, timestamp, version, type, payload }` envelope.
- [x] Current Gupshup `/wa/api/v1` session and template send payloads are unit tested.
- [x] WhatsApp webhook token authentication, validation, fast `202` acknowledgement, and background processing.
- [x] Callback idempotency, 24-hour onboarding sessions, business-type selection, location capture, driver creation, delivery status updates, and `ROUTE` command orchestration.
- [x] Supabase migration `002_whatsapp_webhook_sessions.sql` for session storage, callback uniqueness, message types, tenant phone uniqueness, RLS, and indexes.
- [x] Webhook/repository/processor, WhatsApp client/schema, and routing unit tests.
- [x] Playwright smoke tests for the landing page and webhook readiness endpoint.
- [x] Workspace build, typecheck, lint, unit-test, E2E, and production dependency audit commands.
- [x] Landing page no longer claims Phase 1 is live or exposes `91XXXXXXXXXX` links when no number is configured.

## Incomplete / blocked

- [ ] Apply Supabase migrations `001` and `002` to a real Mumbai-region project and verify rows by readback.
- [ ] Replace placeholder Vercel environment values with real Supabase, Gupshup, Razorpay, Resend, and AI credentials.
- [ ] Set `NEXT_PUBLIC_WHATSAPP_NUMBER` to the registered Indian WhatsApp number.
- [ ] Configure Gupshup callback URL as `/api/whatsapp/webhook?token=<GUPSHUP_WEBHOOK_SECRET>`.
- [ ] Send a real sandbox message and verify callback `202`, database insert, session mutation, and outbound reply.
- [ ] Register/approve templates and store provider template IDs.
- [ ] Add real Supabase Auth plus organization/role authorization to admin and API routes.
- [ ] Protect route/admin APIs that currently use the service-role client without user authorization.
- [ ] Fix the routing solver's documented two-customer feasibility limitation.
- [ ] Finish driver PWA offline sync, GPS, and proof-of-delivery against Supabase.
- [ ] Complete and verify Razorpay checkout/subscription flows.
- [ ] Replace remaining dashboard demo data with tenant-scoped production data.

## Current blockers

Production environment inspection found placeholders rather than credentials. GitHub authentication is unavailable (`gh` absent, no GitHub token, configured `origin` cannot authenticate), so commits are local until credentials are restored.

## Verification commands

```bash
npm run typecheck
npm test
npm run lint
npm run build
npm run test:e2e
npm audit --omit=dev
```

## Endpoints

- Project production alias: `https://routeplan-india-zone-1433.vercel.app`
- Requested alias: `https://routeplan-india.vercel.app`
- Webhook readiness: `GET /api/whatsapp/webhook`
- Gupshup callback: `POST /api/whatsapp/webhook?token=<secret>`
