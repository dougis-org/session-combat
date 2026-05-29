# Tasks

## Preparation

- [x] **Step 1 — Sync default branch:** `git checkout main` and `git pull --ff-only`
- [x] **Step 2 — Create and publish working branch:** `git checkout -b feat/password-reset-ui` then `git push -u origin feat/password-reset-ui`

## Prerequisites

- [x] #266 (password-reset-api) merged — forgot and reset endpoints live

## Implementation

- [x] Implement `app/forgot-password/page.tsx`:
  - Email input form with validation
  - POST to `/api/auth/password/forgot` on submit
  - Handle: 200 (show confirmation), 400 (inline error), 429 (rate limit message), 5xx (error banner)
  - Disable form during in-flight request
- [x] Implement `app/reset-password/page.tsx` (server component — no `'use client'`):
  - Receives `searchParams: Promise<{ token?: string }>` as a prop
  - Awaits the token; calls `redirect('/forgot-password')` if missing
  - Renders `<ResetPasswordForm token={token} />`
- [x] Implement `app/reset-password/ResetPasswordForm.tsx` (client component — `'use client'`):
  - Receives `token` as a string prop (guaranteed non-empty by page)
  - New password + confirm password fields with client-side match validation
  - POST `{ token, password }` to `/api/auth/password/reset`
  - Handle: 200 (success + login link), 400 invalid token (re-request link), 400 weak password (inline details), 429, 5xx
  - Disable form during in-flight request
- [x] Add "Forgot password?" link on login page pointing to `/forgot-password`

## Tests (Integration)

- [x] forgot-password page renders email form
- [x] Submitting valid email shows confirmation message (mock API returns 200)
- [x] Submitting invalid email format shows inline field error
- [x] 429 response shows rate-limit message
- [x] reset-password page with valid `?token=` renders new password form
- [x] Mismatched confirm password shows client-side error before submit
- [x] Successful reset (mock 200) shows success state with login link
- [x] Invalid/expired token (mock 400) shows re-request message with link to forgot-password
- [x] Weak password (mock 400 with details) shows inline error
- [x] Missing `?token=` in URL redirects to `/forgot-password`

## Validation

- [x] `npm run lint` passes
- [x] `npm run typecheck` passes
- [x] Integration test suite passes

## Pre-Commit Code Review

- [x] Run `openspec-review-code` sub-agent before every commit

## Remote push validation

Verification requirements (all must pass before PR or pushing updates to a PR):

- **Unit tests** — `npm run test:unit`; all tests must pass
- **Integration tests** — `npm run test:integration`; all tests must pass
- **Build** — `npm run build`; must succeed with no errors
- if **ANY** of the above fail, iterate and address the failure before pushing

## PR and Merge

- [x] Commit all changes to `feat/password-reset-ui` and push to remote
- [x] Open PR from `feat/password-reset-ui` to `main`; reference `Closes #267`
- [x] Wait 180 seconds for CI and agentic reviewers to post comments
- [x] Enable auto-merge: `gh pr merge <PR-URL> --auto --merge`
- [x] **Monitor PR comments** — address comments, commit fixes, follow Remote push validation, push, wait 180 s, repeat until no unresolved comments
- [x] **Monitor CI checks** — diagnose and fix failures, commit, follow Remote push validation, push, wait 180 s, repeat until all checks pass
- [x] **Poll for merge** — after each iteration run `gh pr view <PR-URL> --json state`; when `state` is `MERGED` proceed to Post-Merge; never force-merge

Ownership metadata:

- Implementer: dougis
- Required approvals: 1

Blocking resolution flow:

- CI failure → fix → commit → validate locally → push → re-run checks
- Security finding → remediate → commit → validate locally → push → re-scan
- Review comment → address → commit → validate locally → push → confirm resolved

## Post-Merge

- [x] `git checkout main` and `git pull --ff-only`
- [x] Verify merged changes appear on `main`
- [x] Mark all remaining tasks as complete (`- [x]`)
- [x] Sync approved spec deltas into `openspec/specs/` (global spec)
- [x] Archive: move `openspec/changes/password-reset-ui/` → `openspec/changes/archive/YYYY-MM-DD-password-reset-ui/` in a single commit
- [x] Confirm archive location exists and original directory is gone
- [x] Commit and push the archive to `main`
- [x] Prune merged branch: `git fetch --prune` and `git branch -d feat/password-reset-ui`
