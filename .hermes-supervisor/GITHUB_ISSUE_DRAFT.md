# GitHub Issue Draft — Production WhatsApp Flow Blocked

Suggested title: `[blocker] Configure Supabase + Gupshup and verify the real WhatsApp flow`

Suggested labels: `blocker`, `infrastructure`, `whatsapp`, `priority:critical`

## Blocker

The application and webhook code are deployed, but the production WhatsApp flow cannot start because the real Supabase and Gupshup resources are unavailable or incomplete.

## Current evidence

- Vercel deployment `dpl_W2hYRpq9zE3NLhuxCxj33GMLdesb` is `READY`.
- `https://routeplan-india.vercel.app/` returns HTTP 200.
- `GET /api/whatsapp/webhook` returns HTTP 503 with `configured:false`.
- Readiness reports missing `GUPSHUP_API_KEY`, `GUPSHUP_APP_ID`, `GUPSHUP_APP_NAME`, `GUPSHUP_SOURCE_NUMBER`, and `GUPSHUP_WEBHOOK_SECRET`.
- Vercel Production has no `GUPSHUP_APP_NAME`, `GUPSHUP_SOURCE_NUMBER`, or `NEXT_PUBLIC_WHATSAPP_NUMBER` entries.
- Supabase URL and anon key are placeholders.
- Supabase CLI is unauthenticated and returns `LegacyPlatformAuthRequiredError`.
- Local sensitive Vercel pulls contain `[SENSITIVE]` redactions, not usable credentials.
- `npm run qa` passes all 7 local gates.
- `npm run qa:external` passes 7 gates and fails only the production-readiness gate.

## Reproduction

```bash
curl -i https://routeplan-india.vercel.app/api/whatsapp/webhook
npm run qa:external
supabase projects list
```

## Required work

1. Create or expose the real Mumbai-region Supabase project.
2. Authenticate Supabase CLI and link the project.
3. Apply migrations `001_initial_schema.sql` and `002_whatsapp_webhook_sessions.sql`.
4. Read back `whatsapp_messages`, `whatsapp_sessions`, callback uniqueness, indexes, and RLS policies.
5. Configure real Gupshup API key, app ID, app name, source number, and webhook secret in Vercel Production.
6. Set `NEXT_PUBLIC_WHATSAPP_NUMBER` to the registered `91XXXXXXXXXX` number.
7. Register `https://routeplan-india.vercel.app/api/whatsapp/webhook?token=<secret>` in Gupshup.
8. Approve templates and record real provider template IDs.
9. Send a real `HI`, verify empty `202`, read back the inbound row/session, capture the outbound `messageId`, and read back its delivery update.
10. Replay the inbound callback and verify no duplicate row or reply.

## Acceptance

- [ ] `GET /api/whatsapp/webhook` returns HTTP 200 with `configured:true` and `missing: []`.
- [ ] Migrations and RLS are verified by database readback.
- [ ] Real inbound, outbound, delivery, and replay-idempotency evidence is attached without secret values.
- [ ] `npm run qa:external` exits zero.

## Posting command after GitHub authentication is restored

```bash
gh issue create \
  --title "[blocker] Configure Supabase + Gupshup and verify the real WhatsApp flow" \
  --body-file .hermes-supervisor/GITHUB_ISSUE_DRAFT.md \
  --label "blocker,infrastructure,whatsapp,priority:critical"
```
