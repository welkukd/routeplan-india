# RoutePlan India — "Circuit for Indian SMBs"

Phase 1: WhatsApp-first routing + dispatch SaaS for dairy, pharmacy, bakery, kirana.
Phase 2: Freight marketplace.
Phase 3: Embedded finance.

## Stack
- **Frontend + API**: Next.js 15 + React 19 + Tailwind on Vercel
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
    /web          # Next.js 15 + React 19 + Tailwind (Vercel)
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
GUPSHUP_WEBHOOK_SECRET=

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
cd apps/web
npm install
npm run dev
```

## Deployment
Push to main → Vercel auto-deploys.
Supabase migrations run via CLI or dashboard.
Gupshup webhook URL: `https://your-vercel-app.vercel.app/api/whatsapp/webhook`