# WhatsApp Integration — Gupshup Self-Serve V2

Status: **BLOCKED** for a real production flow. Local implementation and the Vercel landing deployment are verified. Deployment `dpl_EPHgBFZycLSShCNk3VUigFLVtLbL` is `READY` and aliased to `https://routeplan-india.vercel.app`, but `GET /api/whatsapp/webhook` returns `503 configured:false` until real provider values replace placeholders and missing variables. The full blocker ledger is `.hermes-supervisor/STATUS.md`.

Durable acceptance evidence and deterministic gates live under `.hermes-supervisor/`. `npm run qa` runs eight local gates. `npm run qa:external` additionally requires every manual checkbox in `ACCEPTANCE.md` and the live production probe to pass; it intentionally remains non-zero while reliability, authorization, provider/database configuration, readback, and real-flow evidence are incomplete.

## Implemented architecture

- `packages/whatsapp/src/index.ts` — V2 callback schemas, Indian number normalization, constant-time callback token comparison, current `/wa/api/v1` client, template metadata.
- `apps/web/src/app/api/whatsapp/webhook/route.ts` — readiness check, callback authentication, payload validation, fast empty `202`, deferred processing.
- `apps/web/src/lib/whatsapp-webhook.ts` — idempotent onboarding state machine and route command.
- `apps/web/src/lib/supabase-whatsapp-repository.ts` — tenant-scoped persistence adapter.
- `supabase/migrations/001_initial_schema.sql` — base schema required by the WhatsApp repository.
- `supabase/migrations/002_whatsapp_webhook_sessions.sql` — idempotency, sessions, RLS, indexes, message-type expansion.

## Documented callback envelope

```json
{
  "app": "RoutePlan",
  "timestamp": 1787534000000,
  "version": 2,
  "type": "message",
  "payload": {
    "id": "wamid-1",
    "source": "919876543210",
    "type": "text",
    "payload": { "text": "HI" }
  }
}
```

Delivery events use `type: "message-event"` and carry `id`, optional `gsId`, event `type`, and destination inside `payload`.

Authoritative provider references:

- Inbound envelope: https://docs.gupshup.io/docs/what-is-an-inbound-message
- Message events: https://docs.gupshup.io/docs/message-events
- Session send API: https://docs.gupshup.io/reference/msg
- Template send API: https://docs.gupshup.io/docs/template-messages
- Webhook acknowledgement requirements: https://docs.gupshup.io/docs/what-is-a-webhook

## Callback authentication

Gupshup's Self-Serve webhook documentation does not publish an `x-gupshup-signature` HMAC contract. RoutePlan therefore adds a project-owned secret token. Configure the callback as:

```text
https://<production-host>/api/whatsapp/webhook?token=<GUPSHUP_WEBHOOK_SECRET>
```

The handler also accepts the same secret in `X-Gupshup-Webhook-Secret` or an `Authorization: Bearer <same-secret>` header for subscription products that support custom headers. Values are compared with `timingSafeEqual`. Gupshup's official security guidance recommends allowlisting its inbound request IPs; obtain the current ranges through provider support before broad production access.

The V2 envelope's `app` field is the Gupshup **app name**, so RoutePlan validates it against `GUPSHUP_APP_NAME`. `GUPSHUP_APP_ID` is separately used for the tenant database lookup and provider template-management endpoints.

Callback-ID uniqueness prevents duplicate replies, but it is not a substitute for durable post-ack retry. The current `after()` path can lose work if processing fails after the empty `202`; delivery callbacks can also arrive out of order. The source-owner design and test contract are tracked in `.hermes-supervisor/WEBHOOK_RELIABILITY_ISSUE_DRAFT.md`. Do not call the webhook production-complete until that follow-up and a real sandbox flow are verified.

## Required environment

```dotenv
GUPSHUP_API_KEY=
GUPSHUP_APP_ID=
GUPSHUP_APP_NAME=
GUPSHUP_SOURCE_NUMBER=91XXXXXXXXXX
GUPSHUP_WEBHOOK_SECRET=
NEXT_PUBLIC_WHATSAPP_NUMBER=91XXXXXXXXXX

NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

`GUPSHUP_SOURCE_NUMBER` and `NEXT_PUBLIC_WHATSAPP_NUMBER` must be real Indian mobile numbers in `91XXXXXXXXXX` format. Never deploy the literal example.

## Supported flows

1. `HI`, `HELLO`, or `START` creates an onboarding session and asks for business type.
2. Reply `1`–`5` stores Dairy, Pharmacy, Bakery, Kirana, or Other.
3. `ADD STOP` opens location capture; a shared WhatsApp location upserts the customer.
4. `ADD DRIVER` opens a validated driver-detail flow.
5. `ROUTE` invokes the existing route-generation handler and sends a summary.
6. Delivery events update persisted outbound message state.
7. Duplicate inbound message IDs are acknowledged without sending a second reply.

## Apply migrations

```bash
npx supabase link --project-ref <real-mumbai-project-ref>
npx supabase db push
```

Migration success must be verified by reading back `whatsapp_sessions`, the unique callback index, and RLS policies. These steps have not been run because the configured Supabase values are placeholders.

## Verification

```bash
npm test --workspace=@routeplan/whatsapp
npm test --workspace=@routeplan/web
npm run typecheck
npm run build
npm run test:e2e
npm run qa
npm run qa:external
```

The local command must exit zero before an isolated mission commit. The external command is the release-completion gate: it prints the exact unchecked acceptance items and the public readiness failure without exposing environment values.

Real-flow acceptance remains:

- [ ] Gupshup sandbox callback receives a real message.
- [ ] Endpoint returns empty `202` within provider timeout.
- [ ] `whatsapp_messages` insert is read back from Supabase.
- [ ] `whatsapp_sessions` mutation is read back.
- [ ] Outbound reply returns a real Gupshup `messageId`.
- [ ] Delivery event updates that exact message row.
