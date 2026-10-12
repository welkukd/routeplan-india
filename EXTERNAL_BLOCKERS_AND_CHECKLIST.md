# RoutePlan India — External Blockers & Production Readiness Checklist

**Generated:** 2026-10-12  
**Local Implementation Status:** ✅ COMPLETE (35 tests passing, QA 10/10 gates)  
**Live Landing Page:** https://routeplan-india.vercel.app  
**Current Verdict:** **BLOCKED** — External credentials/configuration required

---

## 📋 Executive Summary

| Category | Status | Notes |
|----------|--------|-------|
| Local Code | ✅ Complete | All packages, webhook handler, VRP solver, tests |
| Vercel Deployment | ✅ Live | Landing page deployed, cron endpoints active |
| Supabase (Mumbai) | ❌ Not Provisioned | No project, no migrations applied |
| Gupshup Sandbox | ❌ Not Configured | No credentials, no callback registered |
| Meta Business Verification | ❌ Not Started | Required for production WhatsApp |
| GitHub/CI | ❌ No Auth | `gh` CLI not installed, no token |

---

## 🚫 External Blockers (Detailed)

### Blocker 1: Supabase Mumbai Project
**Owner:** Infrastructure/Platform Team  
**Priority:** P0 — Blocks all data persistence

| Item | Required Value | Where to Get |
|------|----------------|--------------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://<project-ref>.supabase.co` | Supabase Dashboard → Project Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJ...` (anon public) | Supabase Dashboard → Project Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJ...` (service role) | Supabase Dashboard → Project Settings → API |

**Actions Required:**
1. Create new Supabase project in **Mumbai region (ap-south-1)**
2. Copy the three keys above into Vercel Production Environment Variables
3. Link Supabase CLI: `npx supabase link --project-ref <project-ref>`
4. Apply migrations in order:
   ```bash
   npx supabase db push
   # Verifies: 001_initial_schema.sql, 002_whatsapp_webhook_sessions.sql, 003_whatsapp_webhook_jobs.sql
   ```
5. **Readback Verification** (all must pass):
   - [ ] `whatsapp_messages` table exists with unique index on `(organization_id, gupshup_message_id)`
   - [ ] `whatsapp_sessions` table exists with unique constraint on `(organization_id, phone)`
   - [ ] `whatsapp_webhook_jobs` table exists with status/next_attempt indexes
   - [ ] RLS enabled on all tables with `org_isolation` and `service_role_all` policies
   - [ ] Service-role write + readback works (test insert → select → delete)

---

### Blocker 2: Gupshup Sandbox Credentials
**Owner:** Platform/Integrations Team  
**Priority:** P0 — Blocks all WhatsApp messaging

| Item | Required Value | Where to Get |
|------|----------------|--------------|
| `GUPSHUP_API_KEY` | `sk_...` | Gupshup Dashboard → Developer → API Keys |
| `GUPSHUP_APP_ID` | Numeric ID | Gupshup Dashboard → Apps → Your App → App ID |
| `GUPSHUP_APP_NAME` | String (e.g., `RoutePlan`) | Gupshup Dashboard → Apps → Your App → App Name |
| `GUPSHUP_SOURCE_NUMBER` | `91XXXXXXXXXX` | Gupshup Dashboard → Channels → WhatsApp → Source Number |
| `GUPSHUP_WEBHOOK_SECRET` | Random 32+ char string | **Generate locally** (e.g., `openssl rand -hex 32`) |

**Actions Required:**
1. Create Gupshup Self-Serve account at https://www.gupshup.io/developer
2. Create new **WhatsApp Business API** app (Self-Serve V2)
3. Note down: `GUPSHUP_API_KEY`, `GUPSHUP_APP_ID`, `GUPSHUP_APP_NAME`
4. Provision **Sandbox** source number (format: `91XXXXXXXXXX`) → `GUPSHUP_SOURCE_NUMBER`
5. Generate webhook secret: `openssl rand -hex 32` → `GUPSHUP_WEBHOOK_SECRET`
6. **Register Webhook Callback URL** in Gupshup Dashboard:
   ```
   https://routeplan-india.vercel.app/api/whatsapp/webhook?token=<GUPSHUP_WEBHOOK_SECRET>
   ```
   - Also accepts `X-Gupshup-Webhook-Secret` header or `Authorization: Bearer <secret>`
7. **Submit 6 Templates for Approval** (from `ROUTEPLAN_TEMPLATES` in `packages/whatsapp/src/index.ts`):
   - `welcome` (utility)
   - `daily_route` (utility)
   - `order_confirmation` (utility)
   - `delivery_otp` (authentication)
   - `payment_reminder` (utility)
   - `driver_assignment` (utility)
8. Store approved template IDs in `whatsapp_templates` table (via Supabase)

**Readback Verification:**
- [ ] `GET https://api.gupshup.io/wa/api/v1/app/<APP_ID>` returns 200 with app details
- [ ] Callback URL shows as "Registered" in Gupshup dashboard
- [ ] All 6 templates show "Approved" status with real `gupshup_template_id`
- [ ] Sandbox number can send/receive test messages

---

### Blocker 3: Vercel Production Environment Variables
**Owner:** DevOps/Platform Team  
**Priority:** P0 — Required for production runtime

**Current State:** Vercel project linked, deployment `READY`, but webhook returns `503 configured:false` with 3 missing variables.

**Required Variables in Vercel → Settings → Environment Variables (Production):**

| Variable | Status | Notes |
|----------|--------|-------|
| `GUPSHUP_API_KEY` | ❌ Missing | Add as **Sensitive** |
| `GUPSHUP_APP_ID` | ❌ Missing | Add as **Sensitive** |
| `GUPSHUP_WEBHOOK_SECRET` | ❌ Missing | Add as **Sensitive** |
| `GUPSHUP_APP_NAME` | ✅ Configured | Already present |
| `GUPSHUP_SOURCE_NUMBER` | ✅ Configured | Already present |
| `NEXT_PUBLIC_WHATSAPP_NUMBER` | ✅ Configured | Already present |
| `NEXT_PUBLIC_SUPABASE_URL` | ❌ Placeholder | Replace with real Mumbai URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ❌ Placeholder | Replace with real anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | ❌ Missing | Add as **Sensitive** |
| `RAZORPAY_KEY_ID` | ⚠️ Optional | For payments (Phase 6) |
| `RAZORPAY_KEY_SECRET` | ⚠️ Optional | For payments (Phase 6) |
| `RAZORPAY_WEBHOOK_SECRET` | ⚠️ Optional | For payments (Phase 6) |
| `GOOGLE_AI_API_KEY` | ⚠️ Optional | For AI features |
| `RESEND_API_KEY` | ⚠️ Optional | For email |
| `NEXT_PUBLIC_APP_URL` | ⚠️ Check | Should be `https://routeplan-india.vercel.app` |
| `NEXT_PUBLIC_APP_NAME` | ✅ Configured | Already present |

**Action:** Add all missing/sensitive variables in Vercel Dashboard → Project → Settings → Environment Variables → Production. Redeploy after adding.

**Verification:** `GET https://routeplan-india.vercel.app/api/whatsapp/webhook` returns:
```json
{ "configured": true, "missing": [] }
```

---

### Blocker 4: Meta Business Verification (Production WhatsApp)
**Owner:** Business/Legal Team  
**Priority:** P1 — Required to graduate from sandbox to production

**Prerequisites:**
- [ ] Meta Business Manager account created
- [ ] Business verification submitted (documents: GST, PAN, address proof)
- [ ] WhatsApp Business Account (WABA) created under verified business
- [ ] Phone number registered (not the sandbox number)
- [ ] Green tick approval received

**Timeline:** 2-5 business days after submission

**Note:** Sandbox testing can proceed **in parallel** — Meta verification is only needed for production traffic.

---

## ✅ Actionable Checklist for Production Readiness

### Phase 0: Prerequisites (Do First)
- [ ] **Supabase Mumbai project created** — Region: `ap-south-1`
- [ ] **Gupshup Self-Serve account created** — WhatsApp Business API app provisioned
- [ ] **Vercel CLI access** — `vercel env ls` shows all 16 variables

### Phase 1: Supabase Provisioning (Parallelizable)
- [ ] 1.1 Create Supabase project in Mumbai region
- [ ] 1.2 Add 3 Supabase keys to Vercel Production env vars
- [ ] 1.3 `npx supabase link --project-ref <ref>`
- [ ] 1.4 `npx supabase db push` (applies 001, 002, 003)
- [ ] 1.5 **Verify schema readback** (run verification queries below)

**Supabase Verification Queries:**
```sql
-- Run in Supabase SQL Editor
-- 1. Check tables exist
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('whatsapp_messages', 'whatsapp_sessions', 'whatsapp_webhook_jobs', 'organizations', 'customers', 'drivers');

-- 2. Check unique indexes
SELECT indexname, indexdef FROM pg_indexes 
WHERE tablename IN ('whatsapp_messages', 'customers', 'drivers') 
AND indexname LIKE '%unique%';

-- 3. Check RLS policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename IN ('whatsapp_messages', 'whatsapp_sessions', 'whatsapp_webhook_jobs', 'organizations');

-- 4. Service role write test
INSERT INTO organizations (name, gupshup_app_id) VALUES ('Test Org', 'test_app_id') RETURNING id;
-- Then delete the test row
```

### Phase 2: Gupshup Configuration (Parallelizable)
- [ ] 2.1 Create Gupshup WhatsApp Business API app
- [ ] 2.2 Record: `GUPSHUP_API_KEY`, `GUPSHUP_APP_ID`, `GUPSHUP_APP_NAME`
- [ ] 2.3 Provision sandbox source number → `GUPSHUP_SOURCE_NUMBER`
- [ ] 2.4 Generate webhook secret: `openssl rand -hex 32` → `GUPSHUP_WEBHOOK_SECRET`
- [ ] 2.5 Add 5 Gupshup vars to Vercel Production env vars
- [ ] 2.6 Register callback URL in Gupshup Dashboard:
  ```
  https://routeplan-india.vercel.app/api/whatsapp/webhook?token=<GUPSHUP_WEBHOOK_SECRET>
  ```
- [ ] 2.7 Submit 6 templates for approval (use template content from `ROUTEPLAN_TEMPLATES`)
- [ ] 2.8 Store approved template IDs in `whatsapp_templates` table

**Template Submission Checklist:**
| Template | Category | Variables | Status |
|----------|----------|-----------|--------|
| welcome | utility | {{1}} (name) | [ ] Submitted |
| daily_route | utility | {{1}} (date), {{2}} (stops) | [ ] Submitted |
| order_confirmation | utility | {{1}} (order#), {{2}} (amount) | [ ] Submitted |
| delivery_otp | authentication | {{1}} (OTP) | [ ] Submitted |
| payment_reminder | utility | {{1}} (amount), {{2}} (due date) | [ ] Submitted |
| driver_assignment | utility | {{1}} (driver), {{2}} (vehicle) | [ ] Submitted |

### Phase 3: End-to-End Verification (After Phase 1 & 2)
- [ ] 3.1 `npm run qa` — Local gates still pass
- [ ] 3.2 `GET https://routeplan-india.vercel.app/api/whatsapp/webhook` → `{ "configured": true }`
- [ ] 3.3 **Real Sandbox Flow Test:**
  - [ ] Send `HI` from sandbox number to Gupshup source number
  - [ ] Verify webhook receives callback (check Vercel logs)
  - [ ] Verify empty `202` returned within 5s
  - [ ] Query Supabase: `SELECT * FROM whatsapp_messages WHERE to_number = '<sandbox_number>'`
  - [ ] Query Supabase: `SELECT * FROM whatsapp_sessions WHERE phone = '<sandbox_number>'`
  - [ ] Verify outbound reply sent (welcome template)
  - [ ] Verify Gupshup returns real `messageId`
  - [ ] Wait for delivery event → verify `whatsapp_messages` status updated to `delivered`
  - [ ] Replay same callback → verify no duplicate reply sent
- [ ] 3.4 Test full onboarding flow: `HI` → Business Type → `ADD STOP` (send location) → `ADD DRIVER` → `ROUTE`

### Phase 4: GitHub & CI (Can Start Anytime)
- [ ] 4.1 Install `gh` CLI: `brew install gh` (macOS) or `winget install GitHub.cli` (Windows)
- [ ] 4.2 `gh auth login` — authenticate with GitHub
- [ ] 4.3 `git push origin main` — push local commits (`1722cbc` + predecessors)
- [ ] 4.4 Verify GitHub Actions CI passes
- [ ] 4.5 Post issue drafts:
  - [ ] `.hermes-supervisor/GITHUB_ISSUE_DRAFT.md`
  - [ ] `.hermes-supervisor/WEBHOOK_RELIABILITY_ISSUE_DRAFT.md`
- [ ] 4.6 Verify release-provenance gate: local HEAD = `origin/main` = Vercel Production commit

### Phase 5: Meta Business Verification (Start Early)
- [ ] 5.1 Create Meta Business Manager account
- [ ] 5.2 Submit business verification (GST, PAN, address proof)
- [ ] 5.3 Create WhatsApp Business Account (WABA)
- [ ] 5.4 Register production phone number
- [ ] 5.5 Wait for green tick approval
- [ ] 5.6 Migrate from sandbox to production credentials in Vercel/Gupshup

### Phase 6: Security Hardening (Post-Launch)
- [ ] 6.1 Obtain Gupshup inbound IP ranges from support → add to allowlist
- [ ] 6.2 Implement durable post-ack retry (tracked in `WEBHOOK_RELIABILITY_ISSUE_DRAFT.md`)
- [ ] 6.3 Add API authorization on admin/route endpoints
- [ ] 6.4 Upgrade dev dependencies: Playwright, Vite, Vitest (8 audit findings)
- [ ] 6.5 Full audit clean: `npm audit --omit=dev --audit-level=high` → 0 findings

---

## 📋 Quick Reference: Environment Variables

### Local `.env.local` (for ngrok testing)
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
GUPSHUP_WEBHOOK_SECRET=<your-generated-secret>

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_WHATSAPP_NUMBER=91XXXXXXXXXX
```

### Vercel Production (Dashboard → Settings → Environment Variables)
All 16 variables as listed in Blocker 3 table above.

---

## 🔗 Key References

| Document | Path |
|----------|------|
| Mission Control | `.hermes-supervisor/` |
| Current Status | `.hermes-supervisor/STATUS.md` |
| Acceptance Criteria | `.hermes-supervisor/ACCEPTANCE.md` |
| WhatsApp Spec | `docs/WHATSAPP.md` |
| Agent Instructions | `AGENTS.md` |
| Webhook Reliability Issue | `.hermes-supervisor/WEBHOOK_RELIABILITY_ISSUE_DRAFT.md` |
| Migrations | `supabase/migrations/001, 002, 003.sql` |

---

## 🎯 Definition of Done (Production Ready)

**All of the following must be true:**
- [ ] `npm run qa:external` exits 0 (all acceptance checkboxes + live probe pass)
- [ ] Real Supabase Mumbai project with migrations applied and readback verified
- [ ] Real Gupshup sandbox configured, callback registered, templates approved
- [ ] End-to-end sandbox flow: `HI` → onboarding → `ROUTE` → delivery receipt verified
- [ ] Vercel Production readiness endpoint returns `{ "configured": true }`
- [ ] GitHub authenticated, commits pushed, CI green
- [ ] Meta Business Verification submitted (can be in-flight for pilot)

---

*This checklist is derived from `.hermes-supervisor/STATUS.md`, `.hermes-supervisor/ACCEPTANCE.md`, and `docs/WHATSAPP.md` as of 2026-10-12.*