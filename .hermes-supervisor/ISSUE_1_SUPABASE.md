## Summary
The local implementation is complete and all QA gates pass (10/10), but the production WhatsApp flow is blocked because no Supabase Mumbai project exists and migrations haven't been applied.

## Current State
- ✅ Local code complete: Supabase client, repository, RLS policies, migrations (001, 002, 003)
- ✅ All 35 unit tests passing, `npm run qa` passes 10/10 gates
- ✅ Vercel deployment live at https://routeplan-india.vercel.app
- ❌ No Supabase project in Mumbai region (ap-south-1)
- ❌ No migrations applied
- ❌ No RLS verification

## Required Actions
1. **Create Supabase project** in Mumbai region (ap-south-1)
2. **Add credentials to Vercel Production Environment Variables:**
   - `NEXT_PUBLIC_SUPABASE_URL` (e.g., `https://<project-ref>.supabase.co`)
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` (anon public key)
   - `SUPABASE_SERVICE_ROLE_KEY` (service role key) — **mark as Sensitive**
3. **Link Supabase CLI:** `npx supabase link --project-ref <project-ref>`
4. **Apply migrations in order:**
   ```bash
   npx supabase db push
   # Applies: 001_initial_schema.sql, 002_whatsapp_webhook_sessions.sql, 003_whatsapp_webhook_jobs.sql
   ```
5. **Verify schema readback** (all must pass):
   - [ ] `whatsapp_messages` table exists with unique index on `(organization_id, gupshup_message_id)`
   - [ ] `whatsapp_sessions` table exists with unique constraint on `(organization_id, phone)`
   - [ ] `whatsapp_webhook_jobs` table exists with status/next_attempt indexes
   - [ ] RLS enabled on all tables with `org_isolation` and `service_role_all` policies
   - [ ] Service-role write + readback works (test insert → select → delete)

## Verification Queries (Run in Supabase SQL Editor)
```sql
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

## Acceptance Criteria
- [ ] Supabase Mumbai project created and accessible
- [ ] All 3 migrations applied successfully
- [ ] All 5 verification queries pass
- [ ] Vercel Production has all 3 Supabase env vars configured
- [ ] `GET https://routeplan-india.vercel.app/api/whatsapp/webhook` no longer reports Supabase as missing

## Related Files
- `supabase/migrations/001_initial_schema.sql`
- `supabase/migrations/002_whatsapp_webhook_sessions.sql`
- `supabase/migrations/003_whatsapp_webhook_jobs.sql`
- `EXTERNAL_BLOCKERS_AND_CHECKLIST.md` (Phase 1)
- `.hermes-supervisor/STATUS.md`

## Priority
**P0 — Critical** — Blocks all data persistence and WhatsApp message processing