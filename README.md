# RoutePlan India — "Circuit for Indian SMBs"

Phase 1: WhatsApp-first routing + dispatch SaaS for dairy, pharmacy, bakery, kirana.
Phase 2: Freight marketplace.
Phase 3: Embedded finance.

## Stack
- **Frontend + API**: Next.js 16.3.2 + React 19 + Tailwind on Vercel
- **Database + Auth + Realtime**: Supabase (PostgreSQL, Mumbai region)
- **WhatsApp**: Gupshup WhatsApp Business API
- **Payments**: Razorpay (UPI, Cards, Subscriptions)
- **AI**: Gemini Flash (Google AI Studio free tier)
- **Email**: Resend (3000/month free)
- **Cost**: $0 — free tiers only

## Project Structure
```
/routeplan-india
  /apps
    /web          # Next.js 16.3 + React 19 + Tailwind (Vercel)
    /api          # Next.js API routes (same repo, Vercel functions)
  /packages
    /db           # Supabase client + types + migrations
    /whatsapp     # Gupshup client + webhook handlers + templates
    /routing      # Route optimization engine (TS)
    /payments     # Razorpay client + webhooks
    /ui           # Shared components (unique design per project)
  /supabase
    /migrations   # SQL migrations
    /functions    # Edge functions (Deno)
  /docs           # API docs, env.example, architecture
```

## Autonomous Builder
This project is built by an autonomous agent that runs every 15 minutes via cronjob.
See `autonomous-builder` skill for persona and execution standards.

## Environment Variables
Copy `.env.example` to `.env.local` and fill in:
```bash
# Vercel
NEXT_PUBLIC_VERCEL_URL=

# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Gupshup WhatsApp
GUPSHUP_API_KEY=
GUPSHUP_APP_ID=
GUPSHUP_APP_NAME=
GUPSHUP_SOURCE_NUMBER=
GUPSHUP_WEBHOOK_SECRET=
NEXT_PUBLIC_WHATSAPP_NUMBER=

# Razorpay
RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=
RAZORPAY_WEBHOOK_SECRET=

# Gemini Flash
GOOGLE_AI_API_KEY=

# Resend
RESEND_API_KEY=
```

## Development
```bash
npm install
npm run typecheck
npm test
npm run lint
npm run build
npm run test:e2e
```

See `docs/PHASE1_STATUS.md` for completed work and blockers. See `docs/WHATSAPP.md` for the provider contract and real-flow acceptance checklist.

## Deployment

Vercel project alias: `https://routeplan-india-zone-1433.vercel.app`.
Requested alias: `https://routeplan-india.vercel.app`.

The Gupshup callback must include the configured token:

```text
https://<production-host>/api/whatsapp/webhook?token=<GUPSHUP_WEBHOOK_SECRET>
```

Supabase migrations run via CLI or dashboard and must be verified by readback. The production integrations remain unavailable while Vercel environment values are placeholders.
