# Tasks

## Preparation

- [ ] **Step 1 — Sync default branch:** `git checkout main` and `git pull --ff-only`
- [ ] **Step 2 — Create and publish working branch:** `git checkout -b feat/password-reset-api` then `git push -u origin feat/password-reset-api`

## Prerequisites

- [ ] #265 (password-reset-infrastructure) merged — rate-limit, email, token store available

## Implementation

- [ ] Implement `app/api/auth/password/forgot/route.ts`:
  - Validate email format (reuse `validateEmail` from `lib/auth.ts`)
  - Rate limit by IP + normalized email
  - `findOne({ email })` on users collection
  - Return 200 with generic message immediately
  - If user found: `generateResetToken()` → `storeResetToken()` → fire-and-forget `sendPasswordResetEmail()`
- [ ] Implement `app/api/auth/password/reset/route.ts`:
  - Validate `token` and `password` present → 400
  - Rate limit by IP
  - `validateResetToken(token)` → 400 on failure
  - `validatePassword(password)` → 400 with details on failure
  - Atomic `updateOne`: set `passwordHash`, increment `tokenVersion`, set `updatedAt`
  - `consumeResetToken(tokenHash)`
  - Return 200 with success message

## Tests (Integration)

- [ ] `POST /api/auth/password/forgot` — unknown email → 200 generic message
- [ ] `POST /api/auth/password/forgot` — known email → 200 same generic message; token row in DB
- [ ] `POST /api/auth/password/forgot` — invalid email format → 400
- [ ] `POST /api/auth/password/forgot` — rate limit exceeded → 429
- [ ] `POST /api/auth/password/reset` — valid token + strong password → 200; password updated; token consumed
- [ ] `POST /api/auth/password/reset` — successful reset → old session JWT rejected with 401
- [ ] `POST /api/auth/password/reset` — login with new password succeeds; old password fails
- [ ] `POST /api/auth/password/reset` — expired token → 400 safe error
- [ ] `POST /api/auth/password/reset` — consumed token (reuse) → 400 safe error
- [ ] `POST /api/auth/password/reset` — invalid/malformed token → 400 safe error
- [ ] `POST /api/auth/password/reset` — weak password → 400 with validation details
- [ ] `POST /api/auth/password/reset` — rate limit exceeded → 429

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

- [ ] Commit all changes to `feat/password-reset-api` and push to remote
- [ ] Open PR from `feat/password-reset-api` to `main`; reference `Closes #266`
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
- [ ] Archive: move `openspec/changes/password-reset-api/` → `openspec/changes/archive/YYYY-MM-DD-password-reset-api/` in a single commit
- [ ] Confirm archive location exists and original directory is gone
- [ ] Commit and push the archive to `main`
- [ ] Prune merged branch: `git fetch --prune` and `git branch -d feat/password-reset-api`
