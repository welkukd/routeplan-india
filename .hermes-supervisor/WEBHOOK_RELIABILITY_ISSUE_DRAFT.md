# GitHub Issue Draft — Make WhatsApp Webhook Processing Durable and Monotonic

Suggested title: `[high] Add durable webhook inbox and monotonic delivery-state updates`

Suggested labels: `reliability`, `whatsapp`, `priority:high`, `backend`

## Problem

The callback route correctly follows Gupshup's fast-ack guidance by returning an empty `202` and doing work in Next.js `after()`. Two production-reliability gaps remain:

1. A database/provider failure after the `202` is logged but not durably queued. Gupshup will not retry a callback that already received 2xx, so the inbound event can be lost.
2. Delivery-state updates use local processing time and unconditional updates. Gupshup documents that events can arrive out of order; a later-arriving lower-rank event can downgrade the row, and a `read` callback overwrites `delivered_at` with read-processing time.

This issue is a source-owner follow-up. The isolated mission must not edit `apps/web/src/**`, package source, or migrations.

## Evidence

- `apps/web/src/app/api/whatsapp/webhook/route.ts` schedules `processGupshupWebhook()` inside `after()` and returns `202` immediately.
- The `catch` branch logs an error but does not retain a pending job or retry schedule.
- `apps/web/src/lib/supabase-whatsapp-repository.ts:updateMessageStatus()` uses `new Date()` rather than the provider event timestamp.
- The same method updates status unconditionally and sets both `delivered_at` and `read_at` to the read-processing timestamp.
- Gupshup's message-event documentation says notification order may not reflect event timing and directs consumers to use timestamps.

Provider references:

- https://docs.gupshup.io/docs/what-is-a-webhook
- https://docs.gupshup.io/docs/message-events

## Required Design

### 1. Durable inbox before acknowledgement

Add a Supabase-backed inbox table, for example:

```text
whatsapp_webhook_jobs
- id UUID primary key
- callback_id TEXT not null
- app_name TEXT not null
- event_type TEXT not null
- payload JSONB not null
- status pending|processing|completed|failed
- attempts INTEGER not null default 0
- next_attempt_at TIMESTAMPTZ
- last_error TEXT
- created_at / updated_at / completed_at TIMESTAMPTZ
- UNIQUE(app_name, callback_id, event_type)
```

Route behavior:

1. Authenticate the project-owned callback token.
2. Enforce size and parse the official V2 envelope.
3. Upsert the raw callback into the durable inbox.
4. Return empty `202` only after that durable insert succeeds.
5. Return a retryable non-2xx response when the durable write fails.
6. Use `after()` for the first processing attempt, but leave the row pending/failed on error.
7. Add a free-tier-safe retry worker/cron that claims jobs atomically, applies bounded exponential backoff, and records terminal failure for alerting.
8. Mark the job completed only after all required persistence and outbound work succeeds.

Do not place secrets or full customer message bodies in logs.

### 2. Monotonic event ordering

Use provider event time (`payload.payload.ts` in seconds when present, outer callback `timestamp` as fallback) and a monotonic rank:

```text
submitted/enqueued < sent < delivered < read
failed is terminal only when it is newer than the last provider event
```

Update rows atomically so a lower-rank or older callback cannot downgrade status. Preserve the earliest known `delivered_at`; set `read_at` from the provider read event; if read implies delivery and no delivery timestamp exists, set `delivered_at` once without overwriting a prior value.

## Required Tests

- Durable inbox insert succeeds before the route returns `202`.
- Inbox write failure returns non-2xx and schedules no false success.
- `after()` processing failure leaves a retryable job.
- Retry completes a previously failed job exactly once.
- Duplicate callback IDs do not create duplicate jobs or replies.
- `read` arriving before `delivered` leaves final status `read`.
- `delivered` arriving after `read` cannot downgrade status.
- Duplicate/read retries preserve original timestamps.
- Provider timestamps, not local processing order, determine state.
- Tenant/app isolation is covered.

## Acceptance

- [ ] No callback is acknowledged before it is durably retained.
- [ ] A simulated post-ack processing failure is recovered automatically.
- [ ] Replay produces one inbox row and one outbound reply.
- [ ] Delivery status never regresses under every event-order permutation.
- [ ] Provider timestamps are persisted and verified.
- [ ] Typecheck, unit tests, build, lint, and Playwright pass.
- [ ] Real sandbox failure/retry and out-of-order delivery evidence is attached after credentials exist.
