# Goal — WhatsApp Webhook Production Readiness

## Product outcome

A real Indian SMB can message the registered RoutePlan India WhatsApp number, complete onboarding, add a stop or driver, request a route, receive a reply, and have every callback and delivery event persisted idempotently in the tenant's Mumbai-region Supabase data.

## Production target

- Web app: `https://routeplan-india.vercel.app`
- Readiness: `GET /api/whatsapp/webhook`
- Callback: `POST /api/whatsapp/webhook?token=<GUPSHUP_WEBHOOK_SECRET>`

## In scope

1. Gupshup Self-Serve V2 callback and outbound-message contract.
2. Authenticated, fast, idempotent callback processing.
3. Tenant-scoped Supabase persistence and onboarding sessions.
4. Real Gupshup/Supabase/Vercel configuration and readback.
5. A real end-to-end sandbox conversation and delivery event.
6. Deterministic local and production QA gates.
7. Honest landing-page links and readiness states.

## Completion contract

The mission is complete only when all acceptance boxes in `ACCEPTANCE.md` are checked with evidence, `./.hermes-supervisor/qa.sh --external` exits zero, and a fresh independent review reports no critical or high-severity issue.

A deployed build, passing unit tests, configured-looking secret names, or a mocked callback does not prove the real flow.

## Hard constraints

- Spend $0; remain inside free tiers.
- Use cloud services only; no local LLM.
- Keep secrets out of git and logs.
- Use Mumbai-region Supabase for India data localization.
- Preserve unrelated working-tree changes.
- Respect the file ownership rules in root `AGENTS.md`.
