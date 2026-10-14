# GitHub Issues for RoutePlan India External Blockers

This document contains 3 well-structured GitHub issues ready to be created once GitHub authentication is available.

Individual issue body files are in the same directory:
- `ISSUE_1_SUPABASE.md` — Supabase Mumbai project + migrations
- `ISSUE_2_GUPSHUP.md` — Gupshup sandbox + callback + templates
- `ISSUE_3_GITHUB.md` — GitHub auth + push + CI
- `WEBHOOK_RELIABILITY_ISSUE_DRAFT.md` — Durable webhook inbox (existing draft)

---

## Quick Creation Commands (Run After `gh auth login`)

```bash
cd /Users/admin/Desktop/DESKTOP\ FILE/routeplan-india

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

# Issue 3: GitHub auth + push + CI
gh issue create \
  --repo welkukd/routeplan-india \
  --title "[blocker] Restore GitHub authentication, push commits, verify CI" \
  --body-file .hermes-supervisor/ISSUE_3_GITHUB.md \
  --label "blocker,devops,ci,priority:high"

# Issue 4: Webhook reliability (existing draft)
gh issue create \
  --repo welkukd/routeplan-india \
  --title "[high] Add durable webhook inbox and monotonic delivery-state updates" \
  --body-file .hermes-supervisor/WEBHOOK_RELIABILITY_ISSUE_DRAFT.md \
  --label "reliability,whatsapp,priority:high,backend"
```

---

## Alternative: Create via curl with Personal Access Token

If `gh` CLI is unavailable, use a classic Personal Access Token (PAT) with `repo` scope:

```bash
export GITHUB_TOKEN="ghp_xxxxxxxxxxxx"  # Your PAT

# Issue 1: Supabase
curl -X POST \
  -H "Authorization: token $GITHUB_TOKEN" \
  -H "Accept: application/vnd.github.v3+json" \
  https://api.github.com/repos/welkukd/routeplan-india/issues \
  -d '{
    "title": "[blocker] Provision Supabase Mumbai project and apply migrations",
    "body": "'"$(cat .hermes-supervisor/ISSUE_1_SUPABASE.md | sed 's/"/\\"/g' | sed ':a;N;$!ba;s/\n/\\n/g')"'"",
    "labels": ["blocker", "infrastructure", "database", "priority:critical"]
  }'

# Issue 2: Gupshup
curl -X POST \
  -H "Authorization: token $GITHUB_TOKEN" \
  -H "Accept: application/vnd.github.v3+json" \
  https://api.github.com/repos/welkukd/routeplan-india/issues \
  -d '{
    "title": "[blocker] Configure Gupshup sandbox, register webhook callback, approve templates",
    "body": "'"$(cat .hermes-supervisor/ISSUE_2_GUPSHUP.md | sed 's/"/\\"/g' | sed ':a;N;$!ba;s/\n/\\n/g')"'"",
    "labels": ["blocker", "infrastructure", "whatsapp", "priority:critical"]
  }'

# Issue 3: GitHub auth
curl -X POST \
  -H "Authorization: token $GITHUB_TOKEN" \
  -H "Accept: application/vnd.github.v3+json" \
  https://api.github.com/repos/welkukd/routeplan-india/issues \
  -d '{
    "title": "[blocker] Restore GitHub authentication, push commits, verify CI",
    "body": "'"$(cat .hermes-supervisor/ISSUE_3_GITHUB.md | sed 's/"/\\"/g' | sed ':a;N;$!ba;s/\n/\\n/g')"'"",
    "labels": ["blocker", "devops", "ci", "priority:high"]
  }'

# Issue 4: Webhook reliability
curl -X POST \
  -H "Authorization: token $GITHUB_TOKEN" \
  -H "Accept: application/vnd.github.v3+json" \
  https://api.github.com/repos/welkukd/routeplan-india/issues \
  -d '{
    "title": "[high] Add durable webhook inbox and monotonic delivery-state updates",
    "body": "'"$(cat .hermes-supervisor/WEBHOOK_RELIABILITY_ISSUE_DRAFT.md | sed 's/"/\\"/g' | sed ':a;N;$!ba;s/\n/\\n/g')"'"",
    "labels": ["reliability", "whatsapp", "priority:high", "backend"]
  }'
```

---

## Issue Summary

| # | Title | Labels | Priority | Blocks |
|---|-------|--------|----------|--------|
| 1 | Provision Supabase Mumbai project and apply migrations | `blocker,infrastructure,database,priority:critical` | P0 | All data persistence |
| 2 | Configure Gupshup sandbox, register webhook callback, approve templates | `blocker,infrastructure,whatsapp,priority:critical` | P0 | All WhatsApp messaging |
| 3 | Restore GitHub authentication, push commits, verify CI | `blocker,devops,ci,priority:high` | P1 | Issue tracking, CI, release provenance |
| 4 | Add durable webhook inbox and monotonic delivery-state updates | `reliability,whatsapp,priority:high,backend` | P1 | Production webhook reliability |

---

## Prerequisites for Issue Creation

1. **Install GitHub CLI:**
   - macOS: `brew install gh`
   - Linux: `sudo apt install gh` or download from https://github.com/cli/cli/releases
   - Windows: `winget install GitHub.cli`

2. **Authenticate:**
   ```bash
   gh auth login
   # Choose: GitHub.com → HTTPS → Login with browser (recommended) or token
   ```

3. **Verify access:**
   ```bash
   gh auth status
   gh repo view welkukd/routeplan-india
   ```

4. **Push commits first (recommended):**
   ```bash
   git push origin main
   ```

5. **Then create issues using commands above**

---

## Reference Documents

- `EXTERNAL_BLOCKERS_AND_CHECKLIST.md` — Full checklist with phases
- `.hermes-supervisor/STATUS.md` — Current mission status
- `.hermes-supervisor/ACCEPTANCE.md` — Acceptance criteria
- `docs/WHATSAPP.md` — WhatsApp integration specification
- `AGENTS.md` — Agent instructions and file ownership rules