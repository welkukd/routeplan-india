## Summary
Local commits (15+ commits ahead of origin/main) cannot be pushed because `gh` CLI is not installed and no GitHub token is available. This also blocks creating GitHub issues for tracking the other blockers.

## Current State
- ✅ Local implementation complete, all QA passing
- ✅ Local commits: `1722cbc` (VRP + QA) + 14 predecessors
- ✅ Vercel deployment working, linked to `https://github.com/welkukd/routeplan-india.git`
- ❌ `gh` CLI not installed
- ❌ No GitHub token/credentials available
- ❌ Cannot push to origin
- ❌ Cannot create issues for tracking
- ❌ Cannot verify GitHub Actions CI

## Required Actions
1. **Install GitHub CLI:**
   - macOS: `brew install gh`
   - Linux: `sudo apt install gh` or download from https://github.com/cli/cli/releases
   - Windows: `winget install GitHub.cli`
2. **Authenticate:**
   ```bash
   gh auth login
   # Choose: GitHub.com, HTTPS, Login with browser/token
   ```
3. **Push local commits:**
   ```bash
   git push origin main
   ```
4. **Verify GitHub Actions CI passes** (workflow in `.github/workflows/`)
5. **Create the two blocker issues** (Issue 1: Supabase, Issue 2: Gupshup) plus the webhook reliability issue:
   ```bash
   # Issue 1: Supabase
   gh issue create \
     --repo welkukd/routeplan-india \
     --title "[blocker] Provision Supabase Mumbai project and apply migrations" \
     --body-file .hermes-supervisor/ISSUE_1_SUPABASE.md \
     --label "blocker,infrastructure,database,priority:critical"

   # Issue 2: Gupshup
   gh issue create \
     --repo welkukd/routeplan-india \
     --title "[blocker] Configure Gupshup sandbox, register webhook callback, approve templates" \
     --body-file .hermes-supervisor/ISSUE_2_GUPSHUP.md \
     --label "blocker,infrastructure,whatsapp,priority:critical"

   # Issue 3: Webhook reliability (existing draft)
   gh issue create \
     --repo welkukd/routeplan-india \
     --title "[high] Add durable webhook inbox and monotonic delivery-state updates" \
     --body-file .hermes-supervisor/WEBHOOK_RELIABILITY_ISSUE_DRAFT.md \
     --label "reliability,whatsapp,priority:high,backend"
   ```
6. **Verify release-provenance gate:** local HEAD = `origin/main` = Vercel Production commit

## Acceptance Criteria
- [ ] `gh auth status` shows authenticated user
- [ ] `git push origin main` succeeds
- [ ] GitHub Actions CI passes on `main` branch
- [ ] All 3 issues created and visible in GitHub
- [ ] Release-provenance verified: `git rev-parse HEAD` matches Vercel Production deployment commit

## Related Files
- `.github/workflows/` (CI configuration)
- `.hermes-supervisor/GITHUB_ISSUE_DRAFT.md`
- `.hermes-supervisor/WEBHOOK_RELIABILITY_ISSUE_DRAFT.md`
- `EXTERNAL_BLOCKERS_AND_CHECKLIST.md` (Phase 4)
- `.hermes-supervisor/STATUS.md`

## Priority
**P1 — High** — Required for issue tracking, CI verification, and release provenance