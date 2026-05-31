# Tasks

## Preparation

- [x] **Step 1 — Sync default branch:** `git checkout main` and `git pull --ff-only`
- [x] **Step 2 — Create and publish working branch:** `git checkout -b feat/add-username-to-user-model` then immediately `git push -u origin feat/add-username-to-user-model`

## Execution

### Task 1 — Add `username` field to `User` interface (`lib/types.ts`)

- [x] Add `username?: string` to the `User` interface (after `isAdmin?`, before `createdAt`)
- [x] Verify TypeScript accepts a `User` object with and without `username` (compile check)

### Task 2 — Add sparse unique index on `users.username` (`lib/db.ts`)

- [x] Inside `initializeDatabase`, add a new isolated `try/catch` block after the `users.email` index block
- [x] Create index: `db.collection("users").createIndex({ username: 1 }, { unique: true, sparse: true })`
- [x] Log success: `console.log("Created index on users.username")`
- [x] On catch: warn if not already-exists error, otherwise ignore (mirror exact pattern of `users.email` block)

### Task 3 — Write backfill script (`scripts/backfill-usernames.ts`)

- [x] Connect to MongoDB using `MONGODB_URI` / `MONGODB_DB` env vars (same as `lib/db.ts`)
- [x] Query `users` collection for `{ username: { $exists: false } }` — only unset documents
- [x] For each user: derive candidate = `email.split('@')[0]`
- [x] Check if candidate is already taken (among already-assigned usernames in this run + existing DB values); if taken, try `candidate-2`, `candidate-3`, etc.
- [x] Update document with `$set: { username: <final> }` (never write `null`)
- [x] Log each assignment: `Assigned username "<x>" to user <email>`
- [x] On completion: log count of users updated
- [x] Script exits cleanly with code 0 on success, 1 on unexpected error
- [x] Verify idempotency: a second run against a fully-assigned collection logs "0 users updated" and exits 0

### Task 4 — Write tests (see `tests.md`)

- [x] Unit test: `User` type accepts/rejects username field (TypeScript compile check)
- [x] Integration test: duplicate username insert returns error code 11000
- [x] Integration test: documents without username coexist without conflict (sparse index)
- [x] Integration test: index creation failure is non-fatal (mock `createIndex` to throw)
- [x] Integration test: backfill assigns email local-part as username
- [x] Integration test: backfill de-duplicates collisions with `-2`/`-3` suffix
- [x] Integration test: backfill is idempotent (run twice, second run modifies 0 docs)

## Pre-Commit Code Review

- [ ] **Before every commit**, spawn a dedicated sub-agent to run the `openspec-review-code` skill. The primary agent must automatically address all findings before committing.

## Validation

- [ ] `npm run test:unit` — all tests pass
- [ ] `npm run test:integration` (or equivalent) — all tests pass
- [ ] `npx tsc --noEmit` — no type errors
- [ ] `npm run build` — build succeeds
- [ ] All tasks above marked complete

## Remote push validation

Verification requirements (all must pass before PR or pushing updates to a PR):

- **Unit tests** — `npm run test:unit`; all must pass
- **Integration tests** — run integration suite; all must pass
- **Build** — `npm run build`; must succeed with no errors
- if **ANY** of the above fail, iterate and fix before pushing

## PR and Merge

- [ ] Run `openspec-review-code` sub-agent; address all findings before final commit
- [ ] Commit all changes to `feat/add-username-to-user-model` and push to remote
- [ ] Open PR from `feat/add-username-to-user-model` to `main`. PR body must include:
  - `Closes #300`
  - `Part of #293`
- [ ] **IMMEDIATELY** enable auto-merge: `gh pr merge <PR-URL> --auto --squash` (never `--admin`)
- [ ] Wait 180 seconds for CI to start and agentic reviewers to post comments
- [ ] **Monitor PR comments** — poll autonomously; address each comment, commit fixes, validate locally, push, wait 180 seconds, repeat until no unresolved threads remain
- [ ] **Monitor CI checks** — poll with `gh pr checks <PR-URL> --json isRequired,state`; fix any required failing check, validate locally, push, wait 180 seconds, repeat
- [ ] **Poll for merge** — after each iteration run `gh pr view <PR-URL> --json state`; when `MERGED` proceed to Post-Merge; if `CLOSED` exit and notify user

Ownership metadata:

- Implementer: (agent)
- Reviewer(s): dougis
- Required approvals: 1

Blocking resolution flow:

- CI failure → fix → commit → validate locally → push → re-run checks
- Security finding → remediate → commit → validate locally → push → re-scan
- Review comment → address → commit → validate locally → push → confirm resolved

## Post-Merge

- [x] `git checkout main` and `git pull --ff-only`
- [x] Verify the merged changes appear on `main`
- [x] Mark all remaining tasks as complete (`- [x]`)
- [x] Sync approved spec deltas into `openspec/specs/` (copy `specs/username-model.md` → `openspec/specs/username-model.md`)
- [x] Archive the change: move `openspec/changes/add-username-to-user-model/` to `openspec/changes/archive/2026-05-30-add-username-to-user-model/` **in a single atomic commit** (stage both the new location and deletion of the old)
- [x] Confirm `openspec/changes/archive/2026-05-30-add-username-to-user-model/` exists and `openspec/changes/add-username-to-user-model/` is gone
- [x] **Create a doc branch**: `git checkout -b doc/archive-2026-05-30-add-username-to-user-model` then push to remote
- [x] Open PR from doc branch to `main` with title `docs: archive add-username-to-user-model (2026-05-30)`
- [x] **IMMEDIATELY** enable auto-merge on doc PR: `gh pr merge <DOC-PR-URL> --auto --squash`
- [x] Monitor doc PR until merged (same loop — address comments and CI failures, push, repeat)
- [x] Prune merged branches: `git fetch --prune` and `git branch -d feat/add-username-to-user-model doc/archive-2026-05-30-add-username-to-user-model`
