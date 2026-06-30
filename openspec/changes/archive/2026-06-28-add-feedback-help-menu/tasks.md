# Tasks

## Preparation

- [x] **Step 1 — Sync default branch:** `git checkout main` and `git pull --ff-only`
- [x] **Step 2 — Create and publish working branch:** `git checkout -b feat/add-feedback-help-menu` then immediately `git push -u origin feat/add-feedback-help-menu`

## Execution

### Task 1 — MongoDB rate limit module

Create `lib/db/feedbackRateLimit.ts`:
- [x] Export `checkAndIncrementRateLimit(ip: string): Promise<{ allowed: boolean }>` 
- [x] On first call, ensure `feedbackRateLimits` collection has TTL index on `windowResetAt` with `expireAfterSeconds: 0`
- [x] Upsert document keyed by `ip`; if no document exists or `windowResetAt` is past, create with `count: 1`; if document exists and `count < 12`, increment; if `count >= 12`, return `{ allowed: false }`
- [x] Window duration: 1 hour from first submission in that window

Verification: `npm run test:unit -- --testPathPattern=feedbackRateLimit`

### Task 2 — POST /api/feedback route

Create `app/api/feedback/route.ts`:
- [x] Require authenticated session; return 401 if no session
- [x] Extract client IP from `x-forwarded-for` or `request.ip`
- [x] Call `checkAndIncrementRateLimit(ip)`; return 429 with message if not allowed
- [x] Validate request body: `type` (`bug` | `feature`), `title` (required, non-empty), `description` (optional, max 2000 chars), `pageUrl` (optional string)
- [x] Build GitHub issue body:
  ```
  **Submitted by:** @{username} ({email})
  **Page:** {pageUrl}
  **User-Agent:** {request User-Agent header}

  ---

  {description}
  ```
- [x] Map `type` to label: `bug` → `["bug"]`, `feature` → `["enhancement"]`
- [x] `POST https://api.github.com/repos/dougis-org/session-combat/issues` with `Authorization: Bearer ${process.env.GITHUB_FEEDBACK_TOKEN}`
- [x] Return 201 with `{ issueUrl }` on success; 502 with error message on GitHub API failure
- [x] Log GitHub API errors server-side

Verification: `npm run test:unit -- --testPathPattern=feedback/route`

### Task 3 — FeedbackForm component

Create `lib/components/FeedbackForm.tsx`:
- [x] Props: `defaultType?: 'bug' | 'feature'`, `onSubmit: (data: FeedbackFormData) => void`, `onCancel: () => void`, `isSubmitting?: boolean`
- [x] Type `FeedbackFormData`: `{ type: 'bug' | 'feature', title: string, description: string, pageUrl: string }`
- [x] Type toggle: two buttons (Bug Report / Feature Request); selected state visually indicated
- [x] Title: required text input; Submit disabled when empty
- [x] Description: textarea, `maxLength={2000}`
- [x] `pageUrl`: hidden field, auto-set to `window.location.href` on mount
- [x] Submit button disabled when `isSubmitting` is true or title is empty
- [x] Cancel button always enabled; calls `onCancel`

Verification: `npm run test:unit -- --testPathPattern=FeedbackForm`

### Task 4 — FeedbackModal component

Create `lib/components/FeedbackModal.tsx`:
- [x] State: `open: boolean`, `submitting: boolean`, `result: 'idle' | 'success' | 'error'`, `errorMessage: string`
- [x] Expose `open` control via `isOpen` prop + `onClose` prop (or internal state toggled by NavBar)
- [x] On submit from `FeedbackForm`: set `submitting: true`, call `POST /api/feedback`, handle 201 → success state, non-201 → error state with message
- [x] Success state: show confirmation message, Close button
- [x] Error state: show error message, allow retry (re-render form) or Close
- [x] Backdrop click or Escape key closes modal (resets to idle if not in success state)

Verification: `npm run test:unit -- --testPathPattern=FeedbackModal`

### Task 5 — NavBar update

Modify `lib/components/NavBar.tsx`:
- [x] Import `FeedbackModal` and add local `isModalOpen` state
- [x] Render `?` button in the right-side group (before or adjacent to Logout), conditional on `isAuthenticated && !loading`
- [x] Button click sets `isModalOpen: true`
- [x] Render `<FeedbackModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />`
- [x] Add `data-testid="feedback-button"` for testability

Verification: `npm run test:unit -- --testPathPattern=NavBar`

### Task 6 — Environment variable

- [x] Add `GITHUB_FEEDBACK_TOKEN=` to `.env.example` with a comment explaining required scope (`issues:write` on `dougis-org/session-combat`)
- [x] Verify the token is documented in deployment runbook or fly.toml secrets reference

## Pre-Commit Code Review

- [x] **Before every commit**, spawn a dedicated sub-agent to run the `openspec-review-code` skill. Automatically apply all clearly-correct findings directly to the code — without stopping, without presenting findings to the user, and without asking for confirmation. Apply fixes, re-run tests to confirm they pass, then proceed to commit.

## Validation

- [x] `npm run test:unit` — all tests pass
- [x] `npm run build` — build succeeds with no errors
- [x] `npx tsc --noEmit` — no TypeScript errors (pre-existing errors in test files only, not in new code)
- [x] Manual smoke test: log in, click `?`, submit a bug report, verify GitHub issue created with correct label and body
- [x] Verify `?` button is absent when logged out
- [x] Verify 429 response after 12 rapid submissions from same IP (can test via curl)
- [x] Grep client bundle for `GITHUB_FEEDBACK_TOKEN` — must not appear
- [x] All tasks in Execution section marked `[x]`

## Remote push validation

Before running, determine whether the current change is **docs-only**: run `git diff --name-only HEAD` and check whether every changed file ends in `.md`. If yes, apply the docs-only path; otherwise apply the full path.

**Full path** (any non-`.md` file changed):

- **Unit tests** — `npm run test:unit`; all tests must pass
- **Build** — `npm run build`; must succeed with no errors

**Docs-only path** (every changed file is `.md`):

- **Build** — `npm run build`; must succeed with no errors
- Skip integration and regression/E2E tests

If **ANY** required step fails, iterate and address the failure before pushing.

## PR and Merge

- [x] Ensure `openspec-review-code` sub-agent was run and all findings addressed before final commit
- [x] Commit all changes to `feat/add-feedback-help-menu` and push to remote
- [x] Open PR from `feat/add-feedback-help-menu` to `main`. PR body must include: `Closes #445`
- [x] **IMMEDIATELY** enable auto-merge: `gh pr merge <PR-URL> --auto --squash` (NEVER use `--admin`)
- [x] Wait 180 seconds for CI to start and agentic reviewers to post comments
- [x] **Iterate until merged** — repeat continuously until `gh pr view <PR-URL> --json state` returns `MERGED`; if `CLOSED` exit and notify user — never force-merge:
  1. **Build and tests** — run all steps in Remote push validation; fix failures, commit, push before anything else
  2. **PR comments** — poll `gh pr view <PR-URL> --json reviewThreads`; address every unresolved thread, commit, run validation, push, wait 180s; repeat
  3. **CI check failures** — after all comments resolved, poll `gh pr checks <PR-URL> --json isRequired,state`; fix failing required checks, commit, run validation, push, wait 180s; restart from step 1

Ownership metadata:

- Implementer: (assigned agent)
- Reviewer(s): dougis
- Required approvals: 1

Blocking resolution flow:

- CI failure → fix → commit → validate locally → push → re-run checks
- Security finding → remediate → commit → validate locally → push → re-scan
- Review comment → address → commit → validate locally → push → confirm resolved

## Post-Merge

- [x] `git checkout main` and `git pull --ff-only`
- [x] Verify the merged changes appear on main
- [x] Mark all remaining tasks as complete (`- [x]`)
- [x] Sync spec delta to global spec: copy `openspec/changes/add-feedback-help-menu/specs/feedback-help-menu/spec.md` to `openspec/specs/feedback-help-menu/spec.md`; update relative links to point to archive location
- [x] Archive the change: move `openspec/changes/add-feedback-help-menu/` to `openspec/changes/archive/YYYY-MM-DD-add-feedback-help-menu/` — stage both the new location and deletion of the old location in **a single commit**
- [x] Confirm `openspec/changes/archive/YYYY-MM-DD-add-feedback-help-menu/` exists and `openspec/changes/add-feedback-help-menu/` is gone
- [x] **Create doc branch:** `git checkout -b doc/archive-YYYY-MM-DD-add-feedback-help-menu` then push
- [x] Open PR from doc branch to `main` with title `docs: archive add-feedback-help-menu (YYYY-MM-DD)`
- [x] **IMMEDIATELY** enable auto-merge on doc PR: `gh pr merge <DOC-PR-URL> --auto --squash`
- [x] Monitor doc PR until merged (same loop — address comments and CI failures, push, repeat)
- [x] Prune merged local branches: `git fetch --prune` and `git branch -D feat/add-feedback-help-menu doc/archive-YYYY-MM-DD-add-feedback-help-menu`
