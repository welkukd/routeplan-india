## Summary
The Gupshup V2 client and webhook handler are implemented and tested locally, but no Gupshup sandbox exists, the callback URL isn't registered, and templates haven't been submitted for approval.

## Current State
- ✅ `GupshupClient` class with all send methods implemented (`packages/whatsapp/src/index.ts`)
- ✅ Webhook handler with HMAC-SHA256 signature verification (`apps/web/src/app/api/whatsapp/webhook/route.ts`)
- ✅ 6 templates defined in `ROUTEPLAN_TEMPLATES`: welcome, daily_route, order_confirmation, delivery_otp, payment_reminder, driver_assignment
- ❌ No Gupshup account/app created
- ❌ No credentials: `GUPSHUP_API_KEY`, `GUPSHUP_APP_ID`, `GUPSHUP_APP_NAME`, `GUPSHUP_SOURCE_NUMBER`, `GUPSHUP_WEBHOOK_SECRET`
- ❌ No callback URL registered in Gupshup dashboard
- ❌ No templates submitted for approval

## Required Actions
1. **Create Gupshup Self-Serve account** at https://www.gupshup.io/developer
2. **Create WhatsApp Business API app** (Self-Serve V2)
3. **Record credentials:**
   - `GUPSHUP_API_KEY` (format: `sk_...`) → Dashboard → Developer → API Keys
   - `GUPSHUP_APP_ID` (numeric) → Dashboard → Apps → Your App → App ID
   - `GUPSHUP_APP_NAME` (string, e.g., `RoutePlan`) → Dashboard → Apps → Your App → App Name
   - `GUPSHUP_SOURCE_NUMBER` (format: `91XXXXXXXXXX`) → Dashboard → Channels → WhatsApp → Source Number
4. **Generate webhook secret:** `openssl rand -hex 32` → `GUPSHUP_WEBHOOK_SECRET`
5. **Add all 5 Gupshup vars to Vercel Production Environment Variables** (mark as **Sensitive**)
6. **Register callback URL** in Gupshup Dashboard:
   ```
   https://routeplan-india.vercel.app/api/whatsapp/webhook?token=<GUPSHUP_WEBHOOK_SECRET>
   ```
   - Also accepts `X-Gupshup-Webhook-Secret` header or `Authorization: Bearer ***`
7. **Submit 6 templates for approval** (from `ROUTEPLAN_TEMPLATES`):
   | Template | Category | Variables |
   |----------|----------|-----------|
   | welcome | utility | {{1}} (name) |
   | daily_route | utility | {{1}} (date), {{2}} (stops) |
   | order_confirmation | utility | {{1}} (order#), {{2}} (amount) |
   | delivery_otp | authentication | {{1}} (OTP) |
   | payment_reminder | utility | {{1}} (amount), {{2}} (due date) |
   | driver_assignment | utility | {{1}} (driver), {{2}} (vehicle) |
8. **Store approved template IDs** in `whatsapp_templates` table (via Supabase)

## Template Content Reference
See `packages/whatsapp/src/index.ts` → `ROUTEPLAN_TEMPLATES` for exact body/header/footer/button content.

## Readback Verification
- [ ] `GET https://api.gupshup.io/wa/api/v1/app/<APP_ID>` returns 200 with app details
- [ ] Callback URL shows as "Registered" in Gupshup dashboard
- [ ] All 6 templates show "Approved" status with real `gupshup_template_id`
- [ ] Sandbox number can send/receive test messages

## Acceptance Criteria
- [ ] Gupshup Self-Serve account created with WhatsApp Business API app
- [ ] All 5 credentials configured in Vercel Production (Sensitive)
- [ ] Callback URL registered and verified in Gupshup dashboard
- [ ] All 6 templates approved with real template IDs stored in Supabase
- [ ] `GET https://routeplan-india.vercel.app/api/whatsapp/webhook` returns `{ "configured": true }`
- [ ] Sandbox end-to-end test passes (see Issue 3 for full flow)

## Related Files
- `packages/whatsapp/src/index.ts` (GupshupClient, ROUTEPLAN_TEMPLATES, GupshupWebhookSchema)
- `apps/web/src/app/api/whatsapp/webhook/route.ts` (webhook handler)
- `EXTERNAL_BLOCKERS_AND_CHECKLIST.md` (Phase 2)
- `.hermes-supervisor/STATUS.md`

## Priority
**P0 — Critical** — Blocks all WhatsApp messaging