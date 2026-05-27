# Tasks

## Preparation

- [ ] **Step 1 — Sync default branch:** `git checkout main` and `git pull --ff-only`
- [ ] **Step 2 — Create and publish working branch:** `git checkout -b feat/password-reset-ui` then `git push -u origin feat/password-reset-ui`

## Prerequisites

- [ ] #266 (password-reset-api) merged — forgot and reset endpoints live

## Implementation

- [ ] Implement `app/forgot-password/page.tsx`:
  - Email input form with validation
  - POST to `/api/auth/password/forgot` on submit
  - Handle: 200 (show confirmation), 400 (inline error), 429 (rate limit message), 5xx (error banner)
  - Disable form during in-flight request
- [ ] Implement `app/reset-password/page.tsx`:
  - Read `token` from `useSearchParams()`
  - Redirect to `/forgot-password` if token missing
  - New password + confirm password fields with client-side match validation
  - POST `{ token, password }` to `/api/auth/password/reset`
  - Handle: 200 (success + login link), 400 invalid token (re-request link), 400 weak password (inline details), 429, 5xx
  - Disable form during in-flight request
- [ ] Add "Forgot password?" link on login page pointing to `/forgot-password`

## Tests (Integration)

- [ ] forgot-password page renders email form
- [ ] Submitting valid email shows confirmation message (mock API returns 200)
- [ ] Submitting invalid email format shows inline field error
- [ ] 429 response shows rate-limit message
- [ ] reset-password page with valid `?token=` renders new password form
- [ ] Mismatched confirm password shows client-side error before submit
- [ ] Successful reset (mock 200) shows success state with login link
- [ ] Invalid/expired token (mock 400) shows re-request message with link to forgot-password
- [ ] Weak password (mock 400 with details) shows inline error
- [ ] Missing `?token=` in URL redirects to `/forgot-password`

## Validation

- [ ] `npm run lint` passes
- [ ] `npm run typecheck` passes
- [ ] Integration test suite passes

## Pre-Commit Code Review

- [ ] Run `openspec-review-code` sub-agent before every commit

## Remote push validation

Verification requirements (all must pass before PR or pushing updates to a PR):

- **Unit tests** — `npm run test:unit`; all tests must pass
- **Integration tests** — `npm run test:integration`; all tests must pass
- **Build** — `npm run build`; must succeed with no errors
- if **ANY** of the above fail, iterate and address the failure before pushing

## PR and Merge

- [ ] Commit all changes to `feat/password-reset-ui` and push to remote
- [ ] Open PR from `feat/password-reset-ui` to `main`; reference `Closes #267`
- [ ] Wait 180 seconds for CI and agentic reviewers to post comments
- [ ] Enable auto-merge: `gh pr merge <PR-URL> --auto --merge`
- [ ] **Monitor PR comments** — address comments, commit fixes, follow Remote push validation, push, wait 180 s, repeat until no unresolved comments
- [ ] **Monitor CI checks** — diagnose and fix failures, commit, follow Remote push validation, push, wait 180 s, repeat until all checks pass
- [ ] **Poll for merge** — after each iteration run `gh pr view <PR-URL> --json state`; when `state` is `MERGED` proceed to Post-Merge; never force-merge

Ownership metadata:

- Implementer: dougis
- Required approvals: 1

Blocking resolution flow:

- CI failure → fix → commit → validate locally → push → re-run checks
- Security finding → remediate → commit → validate locally → push → re-scan
- Review comment → address → commit → validate locally → push → confirm resolved

## Post-Merge

- [ ] `git checkout main` and `git pull --ff-only`
- [ ] Verify merged changes appear on `main`
- [ ] Mark all remaining tasks as complete (`- [x]`)
- [ ] Sync approved spec deltas into `openspec/specs/` (global spec)
- [ ] Archive: move `openspec/changes/password-reset-ui/` → `openspec/changes/archive/YYYY-MM-DD-password-reset-ui/` in a single commit
- [ ] Confirm archive location exists and original directory is gone
- [ ] Commit and push the archive to `main`
- [ ] Prune merged branch: `git fetch --prune` and `git branch -d feat/password-reset-ui`
