# Tasks

## Preparation

- [x] **Step 1 — Sync default branch:** `git checkout main` and `git pull --ff-only`
- [x] **Step 2 — Create and publish working branch:** `git checkout -b feat/password-reset-infrastructure` then `git push -u origin feat/password-reset-infrastructure`

## Prerequisites

- [x] #207 (session-invalidation-foundation) merged — tokenVersion auth in place

## Implementation

- [x] Install `mailtrap` npm package (`npm install mailtrap`)
- [x] Add `MAILTRAP_TOKEN`, `MAILTRAP_FROM_EMAIL`, `APP_URL` to `.env.example`
  (`APP_URL` is consumed by the forgot endpoint in Part 2 to construct the reset link; `lib/email.ts` receives a fully-formed `resetUrl` string and does not read `APP_URL` itself.)
- [x] Implement `lib/rate-limit.ts` — in-memory Map + TTL rate limiter; document cold-start limitation.
  Exported API: `checkRateLimit(key: string, limit: number, windowMs: number): void` — throws (or returns a 429-ready `Response`) when the key has exceeded `limit` calls within `windowMs` milliseconds.
- [x] Implement `lib/email.ts` — `sendPasswordResetEmail(to, resetUrl)` via Mailtrap SDK
- [x] Implement `lib/reset-tokens.ts`:
  - `generateResetToken()` — crypto.randomBytes(32).toString('hex')
  - `hashToken(token)` — SHA-256 hex digest
  - `storeResetToken(userId, tokenHash)` — insert new token document; **delete** any prior active token documents for the same `userId` before inserting
  - `validateResetToken(token)` — hash lookup; check expiresAt and consumedAt; return userId or throw
  - `consumeResetToken(tokenHash)` — set consumedAt atomically
- [x] Add to `lib/db.ts` `initializeDatabase()`:
  ```ts
  await db.collection('password_reset_tokens').createIndex({ tokenHash: 1 }, { unique: true });
  ```

## Tests

- [x] Unit: `generateResetToken()` returns 64-char hex string, never repeats across calls
- [x] Unit: `hashToken()` is deterministic; output never equals input
- [x] Unit: `validateResetToken()` throws on expired token (`expiresAt` in past)
- [x] Unit: `validateResetToken()` throws on consumed token (`consumedAt` set)
- [x] Unit: `storeResetToken()` called twice for same userId invalidates the first token
- [x] Unit: rate limiter allows N requests under threshold; throws/rejects at threshold
- [x] Unit: rate limiter resets after TTL window

## Validation

- [x] `npm run lint` passes
- [x] `npm run typecheck` passes
- [x] `npm test` (unit suite) passes

## Pre-Commit Code Review

- [x] Run `openspec-review-code` sub-agent before every commit

## Remote push validation

Verification requirements (all must pass before PR or pushing updates to a PR):

- **Unit tests** — `npm run test:unit`; all tests must pass
- **Integration tests** — `npm run test:integration`; all tests must pass
- **Build** — `npm run build`; must succeed with no errors
- if **ANY** of the above fail, iterate and address the failure before pushing

## PR and Merge

- [x] Commit all changes to `feat/password-reset-infrastructure` and push to remote
- [x] Open PR from `feat/password-reset-infrastructure` to `main`; reference `Closes #265`
- [ ] Wait 180 seconds for CI and agentic reviewers to post comments
- [x] Enable auto-merge: `gh pr merge <PR-URL> --auto --merge`
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
- [ ] Archive: move `openspec/changes/password-reset-infrastructure/` → `openspec/changes/archive/YYYY-MM-DD-password-reset-infrastructure/` in a single commit
- [ ] Confirm archive location exists and original directory is gone
- [ ] Commit and push the archive to `main`
- [ ] Prune merged branch: `git fetch --prune` and `git branch -d feat/password-reset-infrastructure`
