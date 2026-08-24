# RoutePlan India - Development Notes

## Quick Start
```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Run type checking
npm run typecheck

# Run tests
npm run test
```

## Environment Setup
1. Copy `.env.example` to `.env.local` in `apps/web/`
2. Fill in all required credentials:
   - Supabase (Mumbai region)
   - Gupshup WhatsApp Business API
   - Razorpay
   - Google AI Studio (Gemini Flash)
   - Resend

## Project Structure
- `apps/web` - Next.js 16.3 frontend + API routes
- `packages/db` - Supabase types & client
- `packages/whatsapp` - Gupshup client & templates
- `packages/routing` - VRP solver for Indian roads
- `packages/payments` - Razorpay client & GST invoices
- `packages/ui` - Shared UI components
- `supabase/migrations` - SQL migrations
- `docs` - Architecture & API docs

## Key API Endpoints
- `POST /api/whatsapp/webhook` - Gupshup incoming messages
- `POST /api/razorpay/webhook` - Razorpay payment events
- `POST /api/routes/optimize` - VRP optimization
- `GET /api/routes/optimize?organization_id=xxx` - Auto-route for today's orders

## Free Tier Limits
| Service | Limit |
|---------|-------|
| Vercel | 100GB bandwidth, 1000 invocations/day |
| Supabase | 500MB DB, 2GB bandwidth, 50K MAU |
| Gupshup | 1000 conversations/month (sandbox) |
| Razorpay | 2% + GST per transaction |
| Gemini Flash | 1500 req/day, 1M tokens/min |
| Resend | 3000 emails/month |

## Autonomous Builder
This project is built by an autonomous agent running via cronjob every 15 minutes.
See `.hermes/skills/autonomous-ai-agents/autonomous-builder/` for persona.

## Deployment
1. Run `npm run typecheck && npm test && npm run lint && npm run build && npm run test:e2e`
2. Commit with a Git author who belongs to the Vercel team; otherwise Vercel blocks the deployment with `TEAM_ACCESS_REQUIRED`
3. Deploy with `npx vercel --prod --yes --force`
4. Apply and verify Supabase migrations separately
5. Configure the provider callback only after real credentials are installed

## Webhook URLs (Production)
- Readiness: `https://<production-host>/api/whatsapp/webhook`
- WhatsApp callback: `https://<production-host>/api/whatsapp/webhook?token=<GUPSHUP_WEBHOOK_SECRET>`
- Razorpay: `https://<production-host>/api/razorpay/webhook`

## Testing WhatsApp Locally
Use ngrok: `ngrok http 3000`
Set Gupshup callback to `https://<ngrok-host>/api/whatsapp/webhook?token=<GUPSHUP_WEBHOOK_SECRET>`

## Architecture Decisions
- Monorepo with npm workspaces
- Next.js App Router + Server Components
- Supabase for Auth + DB + Realtime
- All API routes as Edge Functions where possible
- Indian road network approximations in VRP solver
- Hindi + English bilingual from day one
- GST-compliant invoice generation
- DPDP Act ready (data in Mumbai region)