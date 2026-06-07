# Tasks

## Preparation

- [x] **Step 1 — Sync default branch:** `git checkout main` and `git pull --ff-only`
- [x] **Step 2 — Create and publish working branch:** `git checkout -b fix/soft-delete-flaky-test` then immediately `git push -u origin fix/soft-delete-flaky-test`

## Execution

### Task 1 — Add promise mutex to `connectToDatabase` (`lib/db.ts`)

**Spec:** `openspec/changes/fix-soft-delete-flaky-test/specs/db-init-concurrency/spec.md`

- [x] Add a module-level variable: `let connectionPromise: Promise<{ client: MongoClient; db: Db }> | null = null;`
- [x] Modify `connectToDatabase` to check `connectionPromise` after the cache check: if `connectionPromise` is non-null, return it directly
- [x] On first call (cache miss, no in-flight promise), assign `connectionPromise` to the full initialisation work
- [x] In the `catch` block of the initialisation, set `connectionPromise = null` before re-throwing, so the next call can retry
- [x] Verify: the existing integration test suite still passes; no new failures introduced

**Verification:**
```bash
npm run test:integration -- --testPathPattern="softDelete"
```

### Task 2 — Add `matchedCount` guard to `deleteCharacter` (`lib/storage.ts`)

**Spec:** `openspec/changes/fix-soft-delete-flaky-test/specs/delete-character-not-found/spec.md`

- [x] Capture the result of `updateOne`: `const result = await db.collection<Character>("characters").updateOne(...)`
- [x] After the `updateOne`, add: `if (result.matchedCount === 0) { throw new Error(\`Character ${id} not found\`); }`
- [x] Confirm the existing `try/catch` in `deleteCharacter` re-throws: error propagates to the DELETE route handler → HTTP 500
- [x] Verify: no existing tests break (the ownership pre-check in the route ensures `matchedCount === 0` is unreachable in normal flow)

**Verification:**
```bash
npm run test:unit
npm run test:integration -- --testPathPattern="softDelete"
```

### Task 3 — Add intermediate status assertions to the 404 test (`tests/integration/characters/softDelete.integration.test.ts`)

**Spec:** `openspec/changes/fix-soft-delete-flaky-test/specs/soft-delete-test-assertions/spec.md`

- [x] In the "should return 404 when accessing deleted character detail" test, add `expect(createRes.status).toBe(201);` immediately after the POST fetch
- [x] Capture the DELETE response: `const deleteRes = await fetch(...)` (it was previously fire-and-forget)
- [x] Add `expect(deleteRes.status).toBe(200);` after the DELETE fetch
- [x] Run the full soft-delete test file to confirm all tests pass

**Verification:**
```bash
npm run test:integration -- --testPathPattern="softDelete"
```

## Pre-Commit Code Review

- [x] **Before every commit**, spawn a dedicated sub-agent to run the `openspec-review-code` skill. The primary agent must automatically apply all clearly-correct findings directly to the code — without stopping, without presenting the findings list to the user, and without asking for confirmation. Apply fixes, re-run tests to confirm they pass, then proceed to commit.

## Validation

- [x] `npm run test:unit` — all unit tests pass
- [x] `npm run test:integration` — all integration tests pass (run at least twice to verify no flakiness)
- [x] `npm run build` — build succeeds with no type errors
- [x] All tasks 1–3 marked complete

## Remote push validation

Verification requirements (all must pass before PR or pushing updates to a PR):

- **Unit tests** — `npm run test:unit`; all tests must pass
- **Integration tests** — `npm run test:integration`; all tests must pass
- **Build** — `npm run build`; must succeed with no errors
- If **ANY** of the above fail, you **MUST** iterate and address the failure

## PR and Merge

- [x] Ensure the `openspec-review-code` sub-agent was run and all findings were automatically addressed before the final commit
- [x] Commit all changes to `fix/soft-delete-flaky-test` and push to remote
- [x] Open PR from `fix/soft-delete-flaky-test` to `main`. PR body must include `Closes #386`.
- [x] **IMMEDIATELY** enable auto-merge: `gh pr merge <PR-URL> --auto --squash` (NEVER use `--admin` to force the merge; use `--squash` per repo ruleset)
- [x] Wait 180 seconds for CI to start and agentic reviewers to post their comments
- [x] **Monitor PR comments** — poll for new comments autonomously; address them, commit fixes, resolve threads, follow Remote push validation steps, push to `fix/soft-delete-flaky-test`; wait 180 seconds then repeat
- [x] **Monitor CI checks** — poll with `gh pr checks <PR-URL> --json isRequired,state`; fix any required failing checks, follow Remote push validation steps, push, wait 180 seconds, repeat
- [x] **Poll for merge** — after each iteration run `gh pr view <PR-URL> --json state`; when `state` is `MERGED` proceed to Post-Merge; if `CLOSED` exit and notify the user

Ownership metadata:

- Implementer: assigned agent
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
- [x] Sync approved spec deltas into `openspec/specs/`:
  - Copy `openspec/changes/fix-soft-delete-flaky-test/specs/db-init-concurrency/spec.md` → `openspec/specs/db-init-concurrency/spec.md`
  - Copy `openspec/changes/fix-soft-delete-flaky-test/specs/delete-character-not-found/spec.md` → `openspec/specs/delete-character-not-found/spec.md`
  - Copy `openspec/changes/fix-soft-delete-flaky-test/specs/soft-delete-test-assertions/spec.md` → `openspec/specs/soft-delete-test-assertions/spec.md`
  - Update relative links in each promoted spec to point to archived locations (`../../changes/archive/YYYY-MM-DD-fix-soft-delete-flaky-test/design.md`, etc.)
- [x] Archive the change: move `openspec/changes/fix-soft-delete-flaky-test/` → `openspec/changes/archive/YYYY-MM-DD-fix-soft-delete-flaky-test/` in a **single atomic commit** (stage both copy and deletion together)
- [x] Confirm `openspec/changes/archive/YYYY-MM-DD-fix-soft-delete-flaky-test/` exists and `openspec/changes/fix-soft-delete-flaky-test/` is gone
- [x] **Create a doc branch:** `git checkout -b doc/archive-fix-soft-delete-flaky-test` then `git push -u origin doc/archive-fix-soft-delete-flaky-test`
- [x] Open a PR from `doc/archive-fix-soft-delete-flaky-test` to `main` with title `docs: archive fix-soft-delete-flaky-test`
- [x] **IMMEDIATELY** enable auto-merge: `gh pr merge <DOC-PR-URL> --auto --squash`
- [ ] Monitor the doc PR until it merges (same loop — address comments and CI failures, push to doc branch, repeat)
- [ ] Prune merged local branches: `git fetch --prune` && `git branch -d fix/soft-delete-flaky-test doc/archive-fix-soft-delete-flaky-test`
