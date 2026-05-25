# Tasks

## Preparation

- [x] **Step 1 — Sync default branch:** `git checkout main` and `git pull --ff-only`
- [x] **Step 2 — Create and publish working branch:** `git checkout -b fix/flyio-health-check` then immediately `git push -u origin fix/flyio-health-check`

## Execution

- [x] **Task 1 — Add health check to fly.toml**
  - File: `fly.toml`
  - Change: Add the following block inside `[http_service]`:
    ```toml
    [http_service.checks]
      grace_period = "30s"
      interval = "15s"
      method = "GET"
      timeout = "5s"
      path = "/api/health"
    ```
  - Verify: `grep -A 6 'http_service.checks' fly.toml` shows the block; TOML structure is valid

- [x] **Task 2 — Verify no other files need changes**
  - Confirm `Dockerfile` and `docker-entrypoint.js` are unchanged (they are not the cause of the alert)
  - Confirm `next.config.js` redirect is unchanged (it is intentional)
  - Confirm `app/api/health/route.ts` still returns `{ ok: true }` — no change needed

## Validation

- [x] Run build: `npm run build` — must succeed (confirms fly.toml change doesn't break anything)
- [x] Run unit tests: `npm run test:unit`
- [x] Run type checks: `npm run typecheck`
- [x] Confirm TOML is valid: manually inspect `fly.toml` or use `flyctl config validate` if flyctl available
- [x] Confirm `curl -sI https://session-combat.fly.dev/api/health` still returns 308 (expected — Fly Doctor will still show the alert, but this is cosmetic)
- [x] Confirm `curl -s https://dnd.dougis.com/api/health` returns `{"ok":true}` (app is healthy)
- [x] All completed tasks marked as complete
- [x] All steps in [Remote push validation]

## Remote push validation

Verification requirements (all must pass before PR or pushing updates to a PR):

- **Unit tests** — `npm run test:unit`; all tests must pass
- **Type checks** — `npm run typecheck`; no errors
- **Build** — `npm run build`; must complete without errors
- If **ANY** of the above fail, iterate and address the failure before pushing

## PR and Merge

- [ ] Commit `fly.toml` change to `fix/flyio-health-check` and push to remote
- [ ] Open PR from `fix/flyio-health-check` to `main` with title: `fix: add fly.io HTTP health check to resolve false-positive port alert`
- [ ] PR description should note: this is a false positive caused by the redirect in PR #217; the app is healthy; this change adds an internal health check so fly.io has a reliable liveness signal
- [ ] Wait 120 seconds for agentic reviewers to post comments
- [ ] **Monitor PR comments** — address, commit fixes, validate locally, push; repeat until no unresolved comments remain
- [ ] Enable auto-merge once no blocking review comments remain
- [ ] **Monitor CI checks** — diagnose failures, fix, validate locally, push; repeat until all checks pass
- [ ] Wait for the PR to merge — never force-merge; if a human force-merges, continue to Post-Merge

Ownership metadata:

- Implementer: doug@dougis.com
- Reviewer(s): AI reviewer (auto) + human approval
- Required approvals: 1

Blocking resolution flow:

- CI failure → fix → commit → validate locally → push → re-run checks
- Review comment → address → commit → validate locally → push → confirm resolved

## Post-Merge

- [ ] `git checkout main` and `git pull --ff-only`
- [ ] Confirm `fly.toml` has `[http_service.checks]` on main
- [ ] After fly.io deploys: `flyctl checks list --app session-combat` — confirm health check shows passing
- [ ] Confirm `curl -s https://dnd.dougis.com/api/health` still returns `{"ok":true}`
- [ ] Mark all remaining tasks as complete (`- [x]`)
- [ ] Archive the change: move `openspec/changes/fix-flyio-port-binding/` to `openspec/changes/archive/2026-05-25-fix-flyio-port-binding/` in a single commit (stage both the new location and deletion of old location together)
- [ ] Confirm archive location exists and original is gone; commit and push to main
- [ ] Prune merged local branch: `git fetch --prune` and `git branch -d fix/flyio-health-check`
