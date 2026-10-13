# RoutePlan India — Comprehensive Deployment Checklist

**Project:** B2B WhatsApp SaaS for Indian SMBs (Highest Revenue Priority)  
**Status:** Code Complete ✅ | External Blockers ❌  
**Repository:** https://github.com/welkukd/routeplan-india.git  
**Landing Page:** https://routeplan-india.vercel.app  
**Target Region:** Mumbai (ap-south-1) for data localization  

---

## Table of Contents

1. [Supabase Mumbai Project Setup](#1-supabase-mumbai-project-setup)
2. [Gupshup WhatsApp Business API Sandbox](#2-gupshup-whatsapp-business-api-sandbox)
3. [Vercel Production Environment Variables](#3-vercel-production-environment-variables)
4. [Meta Business Verification](#4-meta-business-verification)
5. [End-to-End Verification Commands](#5-end-to-end-verification-commands)
6. [Quick Reference: All Variables](#6-quick-reference-all-variables)

---

## 1. Supabase Mumbai Project Setup

### 1.1 Create Supabase Project

| Step | Action | Dashboard URL |
|------|--------|---------------|
| 1 | Go to Supabase Dashboard | https://supabase.com/dashboard |
| 2 | Click **"New Project"** | — |
| 3 | Organization: Select your org | — |
| 4 | Project Name: `routeplan-india` | — |
| 5 | Database Password: Generate strong password (save securely) | — |
| 6 | **Region: Mumbai (ap-south-1)** ⚠️ CRITICAL | — |
| 7 | Pricing Plan: Free tier | — |
| 8 | Click **"Create new project"** | — |
| 9 | Wait ~2 minutes for provisioning | — |

### 1.2 Get API Credentials

After project creation, navigate to **Project Settings → API**:

| Variable | Dashboard Location | Format |
|----------|-------------------|--------|
| `NEXT_PUBLIC_SUPABASE_URL` | Settings → API → Project URL | `https://<project-ref>.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Settings → API → Project API keys → `anon` `public` | `eyJ...` (JWT) |
| `SUPABASE_SERVICE_ROLE_KEY` | Settings → API → Project API keys → `service_role` `secret` | `eyJ...` (JWT) |

### 1.3 Link Supabase CLI & Apply Migrations

```bash
# From /Users/admin/Desktop/DESKTOP FILE/routeplan-india
npx supabase link --project-ref <project-ref>
# Enter database password when prompted

# Apply all 3 migrations in order
npx supabase db push
```

**Expected output:** All 3 migrations applied successfully:
- `001_initial_schema.sql` — Core tables (organizations, customers, drivers, orders, routes, templates, messages, subscriptions, usage_logs, logs)
- `002_whatsapp_webhook_sessions.sql` — `whatsapp_sessions` table + unique indexes for idempotency
- `003_whatsapp_webhook_jobs.sql` — `whatsapp_webhook_jobs` durable inbox + monotonic delivery state functions

### 1.4 Supabase Schema Verification (Run in Supabase SQL Editor)

```sql
-- 1. Verify all tables exist
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
    'whatsapp_messages', 'whatsapp_sessions', 'whatsapp_webhook_jobs',
    'organizations', 'customers', 'drivers', 'users', 'orders', 'routes',
    'whatsapp_templates', 'subscriptions', 'usage_logs', 'logs'
);

-- 2. Verify unique indexes for idempotency
SELECT indexname, indexdef FROM pg_indexes 
WHERE tablename IN ('whatsapp_messages', 'customers', 'drivers') 
AND indexname LIKE '%unique%';

-- Expected results:
-- idx_whatsapp_messages_org_gupshup_id_unique ON whatsapp_messages(organization_id, gupshup_message_id)
-- idx_customers_organization_phone_unique ON customers(organization_id, phone)
-- idx_drivers_organization_phone_unique ON drivers(organization_id, phone)

-- 3. Verify RLS policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename IN ('whatsapp_messages', 'whatsapp_sessions', 'whatsapp_webhook_jobs', 'organizations');

-- Expected: org_isolation + service_role_all policies on all tables

-- 4. Service-role write test
INSERT INTO organizations (name, gupshup_app_id) VALUES ('Test Org', 'test_app_id') RETURNING id;
-- Should return UUID
DELETE FROM organizations WHERE gupshup_app_id = 'test_app_id';
-- Should delete cleanly

-- 5. Verify webhook jobs functions exist
SELECT proname FROM pg_proc 
WHERE proname IN ('upsert_webhook_job', 'claim_webhook_job', 'complete_webhook_job', 'fail_webhook_job', 'claim_webhook_jobs_batch', 'status_rank');
```

### 1.5 Verification Checklist

- [ ] Supabase project created in **Mumbai (ap-south-1)** region
- [ ] 3 API keys copied: URL, anon key, service role key
- [ ] Supabase CLI linked successfully
- [ ] `npx supabase db push` completes with 0 errors
- [ ] All 13 tables exist (see query 1)
- [ ] 3 unique indexes exist (see query 2)
- [ ] RLS enabled on all tables with both policies (see query 3)
- [ ] Service-role write test passes (see query 4)
- [ ] All 6 webhook job functions exist (see query 5)

---

## 2. Gupshup WhatsApp Business API Sandbox

### 2.1 Create Gupshup Self-Serve Account

| Step | Action | Dashboard URL |
|------|--------|---------------|
| 1 | Go to Gupshup Developer Portal | https://www.gupshup.io/developer |
| 2 | Click **"Sign Up"** → **Self-Serve** | — |
| 3 | Fill company details (RoutePlan India) | — |
| 4 | Verify email & complete onboarding | — |
| 5 | Land on Dashboard | https://www.gupshup.io/developer/dashboard |

### 2.2 Create WhatsApp Business API App

| Step | Action | Dashboard Location |
|------|--------|-------------------|
| 1 | Dashboard → **Apps** → **Create App** | https://www.gupshup.io/developer/apps |
| 2 | Select: **WhatsApp Business API** | — |
| 3 | Select: **Self-Serve V2** | — |
| 4 | App Name: `RoutePlan India` | — |
| 4 | Click **Create** | — |

### 2.3 Capture Required Credentials

After app creation, navigate to app details:

| Variable | Dashboard Location | Format/Notes |
|----------|-------------------|--------------|
| `GUPSHUP_API_KEY` | Dashboard → **API Keys** → Copy "Secret Key" | `sk_...` (starts with sk_) |
| `GUPSHUP_APP_ID` | Dashboard → **Apps** → Your App → **App ID** | Numeric (e.g., `123456`) |
| `GUPSHUP_APP_NAME` | Dashboard → **Apps** → Your App → **App Name** | String: `RoutePlan` or `RoutePlan India` |
| `GUPSHUP_SOURCE_NUMBER` | Dashboard → **Channels** → **WhatsApp** → **Source Number** | Indian format: `91XXXXXXXXXX` (12 digits) |

### 2.4 Generate Webhook Secret

```bash
# Run locally to generate cryptographically secure secret
openssl rand -hex 32
# Output example: a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef1234
```

**Save this as `GUPSHUP_WEBHOOK_SECRET`** — used for HMAC-SHA256 verification.

### 2.5 Register Webhook Callback URL

In Gupshup Dashboard → **Your App** → **Configuration** → **Webhook**:

| Field | Value |
|-------|-------|
| **Callback URL** | `https://routeplan-india.vercel.app/api/whatsapp/webhook?token=<GUPSHUP_WEBHOOK_SECRET>` |
| **Events** | Select all: `message`, `message-event`, `status` |

**Alternative header-based authentication** (also supported by code):
- Header: `X-Gupshup-Webhook-Secret: <GUPSHUP_WEBHOOK_SECRET>`
- Header: `Authorization: Bearer <GUPSHUP_WEBHOOK_SECRET>`

### 2.6 Submit 6 WhatsApp Templates for Approval

From `packages/whatsapp/src/index.ts` → `ROUTEPLAN_TEMPLATES`:

| Template Name | Category | Variables | Example Values |
|---------------|----------|-----------|----------------|
| `routeplan_welcome` | utility | `{{1}}` (name) | "Rajesh" |
| `routeplan_daily_route` | utility | `{{1}}` (name), `{{2}}` (date), `{{3}}` (stops), `{{4}}` (hours), `{{5}}` (driver) | "Rajesh", "Jan 15", "12", "3.5", "Amit" |
| `routeplan_order_confirmation` | utility | `{{1}}` (name), `{{2}}` (order#), `{{3}}` (items), `{{4}}` (amount), `{{5}}` (date), `{{6}}` (window start), `{{7}}` (window end), `{{8}}` (driver) | "Rajesh", "ORD-123", "Milk x10", "5000", "Jan 15", "09:00", "12:00", "Amit" |
| `routeplan_delivery_otp` | authentication | `{{1}}` (OTP) | "123456" |
| `routeplan_payment_reminder` | utility | `{{1}}` (name), `{{2}}` (amount), `{{3}}` (due date), `{{4}}` (UPI) | "Rajesh", "2999", "Jan 20", "routeplan@upi" |
| `routeplan_driver_assignment` | utility | `{{1}}` (driver name), `{{2}}` (date), `{{3}}` (stops), `{{4}}` (duration), `{{5}}` (orders) | "Amit", "Jan 15", "12", "3.5 hrs", "15" |

**In Gupshup Dashboard → Templates → Create Template:**

1. Select **Category** (utility/authentication)
2. **Element Name**: exact template name from table above
3. **Language**: English (en)
4. **Header**: (if applicable from table)
5. **Body**: exact body text from `ROUTEPLAN_TEMPLATES`
6. **Footer**: exact footer from `ROUTEPLAN_TEMPLATES`
7. **Buttons**: exact buttons from `ROUTEPLAN_TEMPLATES` (quick_reply type)
8. **Example**: Provide sample values for variables
9. **Vertical**: "Transportation & Logistics" or "Retail"
10. Submit for approval

### 2.7 Store Approved Template IDs

After approval (can take 24-48 hours), each template gets a `gupshup_template_id`. Store in Supabase:

```sql
-- Run in Supabase SQL Editor after templates approved
-- Get your organization_id first:
SELECT id FROM organizations WHERE gupshup_app_id = '<YOUR_GUPSHUP_APP_ID>';

-- Then insert (replace IDs and org_id):
INSERT INTO whatsapp_templates (organization_id, name, category, language, header, body, footer, buttons, gupshup_template_id, status)
VALUES 
  ('<org_id>', 'routeplan_welcome', 'utility', 'en', NULL, 'Welcome to RoutePlan India...', 'RoutePlan India — routes built for Indian SMBs', NULL, '<gupshup_template_id_1>', 'approved'),
  ('<org_id>', 'routeplan_daily_route', 'utility', 'en', 'Today''s Route', 'Good morning {{1}}...', 'RoutePlan India', '[{"type":"quick_reply","text":"Start Route"},{"type":"quick_reply","text":"View Details"},{"type":"quick_reply","text":"Reschedule"}]', '<gupshup_template_id_2>', 'approved'),
  ('<org_id>', 'routeplan_order_confirmation', 'utility', 'en', 'Order Confirmed', 'Hi {{1}}, order {{2}}...', 'RoutePlan India', NULL, '<gupshup_template_id_3>', 'approved'),
  ('<org_id>', 'routeplan_delivery_otp', 'authentication', 'en', NULL, 'Your delivery OTP is {{1}}...', 'RoutePlan India', NULL, '<gupshup_template_id_4>', 'approved'),
  ('<org_id>', 'routeplan_payment_reminder', 'utility', 'en', 'Payment Due', 'Hi {{1}}, your subscription...', 'RoutePlan India', '[{"type":"quick_reply","text":"Pay Now"},{"type":"quick_reply","text":"View Invoice"}]', '<gupshup_template_id_5>', 'approved'),
  ('<org_id>', 'routeplan_driver_assignment', 'utility', 'en', 'New Assignment', 'Hi {{1}}, you have a route...', 'RoutePlan India', '[{"type":"quick_reply","text":"Accept"},{"type":"quick_reply","text":"View Route"},{"type":"quick_reply","text":"Decline"}]', '<gupshup_template_id_6>', 'approved');
```

### 2.8 Gupshup Verification Commands

```bash
# 1. Verify app details (replace <APP_ID>)
curl -H "apikey: <GUPSHUP_API_KEY>" \
  "https://api.gupshup.io/wa/api/v1/app/<APP_ID>"
# Expected: 200 OK with app details including name, source number

# 2. Verify webhook callback registered
# Check in Gupshup Dashboard → Configuration → Webhook → should show "Registered"

# 3. List templates (replace <APP_ID>)
curl -H "apikey: <GUPSHUP_API_KEY>" \
  "https://api.gupshup.io/wa/app/<APP_ID>/template"
# Expected: Array with all 6 templates showing status: "approved"

# 4. Test sandbox message (replace <SOURCE_NUMBER> and <YOUR_WHATSAPP_NUMBER>)
curl -X POST "https://api.gupshup.io/wa/api/v1/msg" \
  -H "apikey: <GUPSHUP_API_KEY>" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "channel=whatsapp&source=<SOURCE_NUMBER>&destination=<YOUR_WHATSAPP_NUMBER>&src.name=RoutePlan&message={\"type\":\"text\",\"text\":\"Test from RoutePlan\"}"
# Expected: 200 with messageId
```

### 2.9 Gupshup Verification Checklist

- [ ] Gupshup Self-Serve account created
- [ ] WhatsApp Business API app created (Self-Serve V2)
- [ ] `GUPSHUP_API_KEY` captured (sk_...)
- [ ] `GUPSHUP_APP_ID` captured (numeric)
- [ ] `GUPSHUP_APP_NAME` captured (exact string)
- [ ] `GUPSHUP_SOURCE_NUMBER` captured (91XXXXXXXXXX format)
- [ ] `GUPSHUP_WEBHOOK_SECRET` generated (openssl rand -hex 32)
- [ ] Webhook callback URL registered in dashboard
- [ ] All 6 templates submitted for approval
- [ ] All 6 templates show "Approved" status
- [ ] Template IDs stored in Supabase `whatsapp_templates` table
- [ ] API test call returns 200
- [ ] Sandbox number can send/receive test messages

---

## 3. Vercel Production Environment Variables

### 3.1 Vercel Dashboard Navigation

**URL:** https://vercel.com/dashboard → Select `routeplan-india` project → **Settings** → **Environment Variables**

### 3.2 Required Production Variables (16 Total)

| Variable | Status | Sensitivity | Source | Notes |
|----------|--------|-------------|--------|-------|
| `GUPSHUP_API_KEY` | ❌ Required | **Sensitive** | Gupshup Dashboard → API Keys | sk_... |
| `GUPSHUP_APP_ID` | ❌ Required | **Sensitive** | Gupshup Dashboard → App ID | Numeric |
| `GUPSHUP_WEBHOOK_SECRET` | ❌ Required | **Sensitive** | Generated via `openssl rand -hex 32` | 64-char hex |
| `GUPSHUP_APP_NAME` | ✅ Configured | Sensitive | Gupshup Dashboard → App Name | Exact match |
| `GUPSHUP_SOURCE_NUMBER` | ✅ Configured | Sensitive | Gupshup Dashboard → Source Number | 91XXXXXXXXXX |
| `NEXT_PUBLIC_WHATSAPP_NUMBER` | ✅ Configured | Public | Same as SOURCE_NUMBER | Display only |
| `NEXT_PUBLIC_SUPABASE_URL` | ❌ Placeholder | Public | Supabase Dashboard → Project URL | https://xxx.supabase.co |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ❌ Placeholder | Public | Supabase Dashboard → anon key | eyJ... |
| `SUPABASE_SERVICE_ROLE_KEY` | ❌ Required | **Sensitive** | Supabase Dashboard → service_role key | eyJ... |
| `RAZORPAY_KEY_ID` | ⚠️ Optional | **Sensitive** | Razorpay Dashboard | Phase 6 |
| `RAZORPAY_KEY_SECRET` | ⚠️ Optional | **Sensitive** | Razorpay Dashboard | Phase 6 |
| `RAZORPAY_WEBHOOK_SECRET` | ⚠️ Optional | **Sensitive** | Razorpay Dashboard | Phase 6 |
| `GOOGLE_AI_API_KEY` | ⚠️ Optional | **Sensitive** | Google AI Studio | For AI features |
| `RESEND_API_KEY` | ⚠️ Optional | **Sensitive** | Resend Dashboard | For email |
| `NEXT_PUBLIC_APP_URL` | ⚠️ Check | Public | Should be `https://routeplan-india.vercel.app` | |
| `NEXT_PUBLIC_APP_NAME` | ✅ Configured | Public | "RoutePlan India" | |

### 3.3 How to Add Variables in Vercel

1. Go to **Settings → Environment Variables**
2. Click **"Add New"**
3. **Name**: Exact variable name from table above
4. **Value**: Paste the actual value
5. **Environment**: Select **Production** (and Preview/Development if needed)
6. **Sensitive**: Toggle ON for secrets (API keys, tokens)
7. Click **Save**
8. Repeat for all 16 variables

### 3.4 Redeploy After Adding Variables

```bash
# Option 1: Vercel Dashboard → Deployments → Redeploy latest
# Option 2: CLI
vercel --prod --scope=<team-slug>
# Option 3: Push to GitHub (triggers auto-deploy once CI configured)
```

### 3.5 Vercel Verification Commands

```bash
# 1. Check all env vars are configured
vercel env ls --scope=<team-slug> --environment=production
# Should show all 16 variables with correct sensitivity

# 2. Test webhook readiness endpoint
curl https://routeplan-india.vercel.app/api/whatsapp/webhook
# Expected: {"service":"gupshup-webhook","configured":true,"callbackVersion":2}

# 3. Test with missing vars (before all configured)
curl https://routeplan-india.vercel.app/api/whatsapp/webhook
# Expected (before): {"service":"gupshup-webhook","configured":false,"missing":["GUPSHUP_API_KEY","GUPSHUP_APP_ID","GUPSHUP_WEBHOOK_SECRET",...]}

# 4. Check deployment logs
vercel logs https://routeplan-india.vercel.app --scope=<team-slug>
# Look for: "Gupshup webhook is not configured" → should disappear after all vars added
```

### 3.6 Vercel Verification Checklist

- [ ] All 16 variables added in Vercel Dashboard → Production environment
- [ ] 7 sensitive variables marked as **Sensitive** (eye icon closed)
- [ ] `NEXT_PUBLIC_SUPABASE_URL` replaced with real Mumbai URL (not placeholder)
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` replaced with real anon key
- [ ] `SUPABASE_SERVICE_ROLE_KEY` added as Sensitive
- [ ] `GUPSHUP_API_KEY`, `GUPSHUP_APP_ID`, `GUPSHUP_WEBHOOK_SECRET` added as Sensitive
- [ ] `NEXT_PUBLIC_APP_URL` = `https://routeplan-india.vercel.app`
- [ ] Production redeployed after adding variables
- [ ] `GET /api/whatsapp/webhook` returns `{"configured":true,"missing":[]}`
- [ ] No "Gupshup webhook is not configured" errors in deployment logs

---

## 4. Meta Business Verification

### 4.1 Prerequisites Checklist

- [ ] Meta Business Manager account created: https://business.facebook.com
- [ ] Business verification documents ready:
  - [ ] GST Registration Certificate
  - [ ] PAN Card (Company)
  - [ ] Address Proof (Utility bill / Bank statement < 3 months)
  - [ ] Certificate of Incorporation
  - [ ] Authorized signatory ID proof
- [ ] Business phone number (not sandbox number) for WABA registration

### 4.2 Meta Business Verification Steps

| Step | Action | URL |
|------|--------|-----|
| 1 | Create Meta Business Manager account | https://business.facebook.com |
| 2 | Navigate to **Business Settings** → **Business Info** | — |
| 3 | Click **Start Verification** | — |
| 4 | Upload required documents | — |
| 5 | Submit for review | — |
| 6 | Wait for approval (2-5 business days) | — |
| 7 | Once verified → **WhatsApp Business Accounts** → **Create WABA** | — |
| 8 | Register production phone number | — |
| 9 | Complete **Display Name** review | — |
| 10 | Receive **Green Tick** approval | — |

### 4.3 Migration from Sandbox to Production

Once Green Tick approved:

| Action | Details |
|--------|---------|
| Create new Gupshup app | Production WhatsApp Business API (not sandbox) |
| Update Vercel env vars | Replace all `GUPSHUP_*` with production credentials |
| Update webhook URL | Same endpoint, new token |
| Resubmit templates | Production templates need re-approval |
| Update `NEXT_PUBLIC_WHATSAPP_NUMBER` | New production number |

**Note:** Sandbox testing can proceed in parallel — Meta verification only needed for production traffic.

### 4.4 Timeline

| Phase | Duration |
|-------|----------|
| Document preparation | 1 day |
| Meta review | 2-5 business days |
| WABA creation + phone registration | 1 day |
| Display name review | 1-3 business days |
| Green tick approval | Included above |
| **Total** | **5-10 business days** |

---

## 5. End-to-End Verification Commands

### 5.1 Local QA Gates (Must Pass Before Deploy)

```bash
cd /Users/admin/Desktop/DESKTOP\ FILE/routeplan-india

# All must pass
npm run typecheck    # TypeScript strict mode
npm run lint         # ESLint 0 errors
npm run test         # 35 unit tests
npm run build        # Next.js production build
npm run test:e2e     # 2 Playwright smoke tests
npm run qa           # Full 10-gate QA (from .hermes-supervisor/qa.sh)
```

### 5.2 Production Readiness Endpoint

```bash
# After all Vercel env vars configured
curl -s https://routeplan-india.vercel.app/api/whatsapp/webhook | jq .
# Expected:
{
  "service": "gupshup-webhook",
  "configured": true,
  "callbackVersion": 2
}
```

### 5.3 Real Sandbox Flow Test (Complete E2E)

**Prerequisites:** All Phases 1-3 complete, Supabase + Gupshup + Vercel configured.

```bash
# 1. Send test message from YOUR WhatsApp to Gupshup sandbox number
# Open WhatsApp → New Chat → Enter Gupshup SOURCE_NUMBER → Send "HI"

# 2. Watch Vercel function logs in real-time
vercel logs https://routeplan-india.vercel.app --scope=<team-slug> --follow
# Look for:
# - "Gupshup callback received — inserting into durable inbox"
# - "Gupshup callback processing started"
# - "Gupshup callback processing completed"

# 3. Verify webhook returns 202 within 5 seconds
# (Check Vercel logs for 202 response)

# 4. Query Supabase for inbound message
# In Supabase Dashboard → Table Editor → whatsapp_messages
# Filter: to_number = '<YOUR_SANDBOX_NUMBER>'
# Should show 1 row with type='text', content='{"body":"HI"}', status='sent'

# 5. Query Supabase for session created
# Table: whatsapp_sessions
# Filter: phone = '<YOUR_SANDBOX_NUMBER>'
# Should show 1 row with state='awaiting_business_type'

# 6. Verify outbound reply sent (welcome template)
# Table: whatsapp_messages
# Filter: from_number = '<GUPSHUP_SOURCE_NUMBER>', type='template'
# Should show 1 row with template_id pointing to routeplan_welcome

# 7. Verify Gupshup returned real messageId
# Check whatsapp_messages.gupshup_message_id is populated (not null)

# 8. Wait for delivery receipt (check Vercel logs)
# Look for "message-event" callback with type="delivered"

# 9. Verify message status updated to 'delivered'
# Table: whatsapp_messages
# Filter: gupshup_message_id = '<ID_FROM_STEP_7>'
# Should show status='delivered', provider_delivered_at populated

# 10. Test idempotency - replay same callback
# Re-send same webhook payload via curl:
curl -X POST "https://routeplan-india.vercel.app/api/whatsapp/webhook?token=<GUPSHUP_WEBHOOK_SECRET>" \
  -H "Content-Type: application/json" \
  -d '<SAME_PAYLOAD_AS_STEP_1>'
# Expected: 202 returned immediately, NO duplicate outbound message

# 11. Test full onboarding flow
# Send sequence via WhatsApp:
# HI → "1" (Dairy) → Send Location (for stop) → "ADD DRIVER" → "ROUTE"
# Verify each step creates expected DB records
```

### 5.4 Complete Onboarding Flow Verification

| Step | User Sends | Expected Bot Response | DB State |
|------|------------|----------------------|----------|
| 1 | `HI` | Welcome template + business type prompt | `whatsapp_sessions.state = 'awaiting_business_type'` |
| 2 | `1` (or 2-5) | "Add stops" prompt | `context.business_type = 'dairy'`, `state = 'awaiting_stop'` |
| 3 | Share Location (pin) | "Stop added. Add another or type DONE" | `customers` row created with lat/lng, pincode extracted |
| 4 | `DONE` | "Add drivers" prompt | `state = 'awaiting_driver'` |
| 5 | `Driver Name, Vehicle Type, Capacity` | "Driver added. Add another or type DONE" | `drivers` row created |
| 6 | `DONE` | Route generation starts | `routes` row created, `orders` linked |
| 7 | (Auto) | Daily route template sent | `whatsapp_messages` with template `routeplan_daily_route` |

### 5.5 Verification Checklist (Definition of Done)

- [ ] `npm run qa` exits 0 (all local gates pass)
- [ ] `GET /api/whatsapp/webhook` returns `{"configured": true}`
- [ ] Real sandbox message `HI` received and processed
- [ ] Webhook returns 202 within 5 seconds
- [ ] `whatsapp_messages` row created with inbound message
- [ ] `whatsapp_sessions` row created with correct state
- [ ] Outbound welcome template sent (gupshup_message_id populated)
- [ ] Delivery receipt received → status updated to `delivered`
- [ ] Duplicate callback replay returns 202, no duplicate message
- [ ] Full onboarding flow: HI → Business Type → Location → Driver → ROUTE
- [ ] GitHub authenticated, commits pushed, CI green
- [ ] Meta Business Verification submitted (can be in-flight)

---

## 6. Quick Reference: All Variables

### Local Development (`.env.local`)

```bash
# Supabase (REPLACE with real Mumbai values)
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# Gupshup (REPLACE with real sandbox values)
GUPSHUP_API_KEY=sk_...
GUPSHUP_APP_ID=123456
GUPSHUP_APP_NAME=RoutePlan
GUPSHUP_SOURCE_NUMBER=91XXXXXXXXXX
GUPSHUP_WEBHOOK_SECRET=<your-generated-64-char-hex>

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_WHATSAPP_NUMBER=91XXXXXXXXXX
NEXT_PUBLIC_APP_NAME="RoutePlan India"

# Optional (Phase 6+)
RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=
RAZORPAY_WEBHOOK_SECRET=
GOOGLE_AI_API_KEY=
RESEND_API_KEY=
```

### Vercel Production (Dashboard)

All 16 variables as listed in **Section 3.2**, configured for **Production** environment.

### Key Dashboard URLs

| Service | Dashboard URL |
|---------|---------------|
| Supabase | https://supabase.com/dashboard |
| Gupshup | https://www.gupshup.io/developer/dashboard |
| Vercel | https://vercel.com/dashboard |
| Meta Business Manager | https://business.facebook.com |
| GitHub | https://github.com/welkukd/routeplan-india |

### Key API Endpoints

| Endpoint | Purpose |
|----------|---------|
| `https://routeplan-india.vercel.app/api/whatsapp/webhook` | Gupshup V2 webhook callback |
| `https://routeplan-india.vercel.app/api/whatsapp/webhook?token=<secret>` | Webhook with token auth |
| `https://routeplan-india.vercel.app/api/routes/optimize` | VRP route optimization |
| `https://routeplan-india.vercel.app/api/cron/retry-webhook-jobs` | Daily retry cron (06:00 IST) |
| `https://routeplan-india.vercel.app/api/cron/daily-routes` | Daily route generation cron (05:00 IST) |

---

## Appendix: File Locations for Reference

| File | Purpose |
|------|---------|
| `/supabase/migrations/001_initial_schema.sql` | Core schema |
| `/supabase/migrations/002_whatsapp_webhook_sessions.sql` | Sessions + idempotency indexes |
| `/supabase/migrations/003_whatsapp_webhook_jobs.sql` | Durable inbox + delivery state |
| `/packages/whatsapp/src/index.ts` | Gupshup client, schemas, 6 templates |
| `/apps/web/src/app/api/whatsapp/webhook/route.ts` | Webhook handler (GET readiness + POST processing) |
| `/apps/web/src/lib/supabase-whatsapp-repository.ts` | Database operations |
| `/apps/web/src/lib/whatsapp-webhook.ts` | Business logic (onboarding flow) |
| `/.env.example` | Environment template |
| `/.env.vercel` | Current Vercel env snapshot |
| `/.hermes-supervisor/qa.sh` | QA script (10 gates) |
| `/vercel.json` | Vercel config (regions, crons, rewrites) |

---

**Document Version:** 1.0  
**Last Updated:** 2026-10-13  
**Maintained By:** RoutePlan India Deployment Team  
**Next Review:** After each external blocker resolution