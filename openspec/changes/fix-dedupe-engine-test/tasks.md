# Tasks

## Preparation

- [x] **Step 1 — Sync default branch:** `git checkout main` and `git pull --ff-only`
- [x] **Step 2 — Create and publish working branch:** `git checkout -b fix-dedupe-engine-test` then immediately `git push -u origin fix-dedupe-engine-test`

## Execution

### Task 1: Remove broken test from unit tests

- [x] **1.1** Open `tests/unit/import/dedupeEngine.test.ts`
- [x] **1.2** Remove the test at lines 80-91 ("skips monster when transform is invalid (not when it exists)")
- [x] **1.3** Verify the file still contains:
  - Tests for `shouldImport` (lines 23-62)
  - Tests for "inserts monster when not duplicate and valid" (lines 65-78)
  - Tests for "skips monster when it already exists" (lines 93-105)
  - Tests for "counts error when monster transform is invalid" (lines 107-118)
  - Tests for "processes multiple monsters" (lines 120-160)
  - Spell import tests (lines 163-218)
- [x] **1.4** Run `npm test -- tests/unit/import/dedupeEngine.test.ts --passWithNoTests` to verify tests still exist

### Task 2: Create integration test file

- [x] **2.1** Create directory `tests/integration/import/`
- [x] **2.2** Create `tests/integration/import/dedupeEngine.integration.test.ts`
- [x] **2.3** Set up MongoDB testcontainer connection using pattern from `tests/integration/helpers/server.ts` (simplified for direct function calls)
- [x] **2.4** Import `importMonstersFromOpen5E` from `@/lib/import/dedupeEngine`
- [x] **2.5** Import `createMockClient`, `createTestCreature` from `tests/integration/import/testHelpers` (new file created for integration helpers)
- [x] **2.6** Use dynamic imports of `@/lib/db` for direct MongoDB access (not `storage` module)

### Task 3: Write integration test for "inserts when not duplicate"

- [x] **3.1** Create test "inserts monster when not duplicate and valid"
  - Use `createTestCreature` to make a valid Goblin
  - Use `createMockClient` with the creature
  - Call `importMonstersFromOpen5E(client)`
  - Assert `result.inserted === 1`
  - Assert `result.skipped === 0`
  - Query MongoDB directly to verify monster exists
- [x] **3.2** Run the test and verify it passes

### Task 4: Write integration test for "skips when exists"

- [x] **4.1** Create test "skips monster when it already exists"
  - First, import a Goblin (inserted)
  - Then, import the same Goblin again (skipped)
  - Assert first call: `result.inserted === 1, result.skipped === 0`
  - Assert second call: `result.inserted === 0, result.skipped === 1`
  - Query MongoDB to verify only one Goblin exists
- [x] **4.2** Run the test and verify it passes

### Task 5: Write integration test for "errors when transform invalid"

- [x] **5.1** Create test "counts error when monster transform is invalid"
  - Create a creature with empty name (invalid)
  - Use `createMockClient` with the invalid creature
  - Call `importMonstersFromOpen5E(client)`
  - Assert `result.errors === 1`
  - Assert `result.inserted === 0`
  - Assert `result.skipped === 0`
- [x] **5.2** Run the test and verify it passes

### Task 6: Clean up and verify

- [x] **6.1** Run all unit tests: `npm test -- tests/unit/`
- [x] **6.2** Run all integration tests: `npm test -- tests/integration/`
- [x] **6.3** Verify no duplicate test coverage between unit and integration

## Validation

- [x] **Unit tests pass:** `npm test -- tests/unit/import/dedupeEngine.test.ts`
- [x] **Integration tests pass:** `npm test -- tests/integration/import/dedupeEngine.integration.test.ts`
- [x] **Type checks pass:** `npm run typecheck` (or `npm run tsc -- --noEmit`)
- [x] **Build succeeds:** `npm run build` (if applicable)
- [x] **No lint errors:** `npm run lint` (if applicable)
- [x] All completed tasks marked as complete

## Remote push validation

Verification requirements (all must pass before PR or pushing updates to a PR):

- **Unit tests** — `npm test -- tests/unit/import/dedupeEngine.test.ts` — all tests must pass
- **Integration tests** — `npm test -- tests/integration/import/dedupeEngine.integration.test.ts` — all tests must pass
- **Type checks** — `npm run typecheck` — no errors
- **Build** — `npm run build` — build must succeed with no errors
- if **ANY** of the above fail, you **MUST** iterate and address the failure

## PR and Merge

- [ ] Run the required pre-PR self-review from `skills/openspec-apply-change/SKILL.md` before committing
- [ ] Commit all changes to the working branch and push to remote
- [ ] Open PR from `fix-dedupe-engine-test` to `main`
- [ ] Wait 180 seconds for CI to start and agentic reviewers to post their comments
- [ ] Enable auto-merge: `gh pr merge <PR-URL> --auto --merge`
- [ ] **Monitor PR comments** — poll for new comments autonomously; when comments appear, address them, commit fixes, follow all steps in [Remote push validation] then push to the same working branch; wait 180 seconds then repeat until no unresolved comments remain
- [ ] **Monitor CI checks** — poll for check status autonomously; when any CI check fails, diagnose and fix the failure, commit fixes, follow all steps in [Remote push validation] then push to the same working branch; wait 180 seconds then repeat until all checks pass
- [ ] **Poll for merge** — after each iteration run `gh pr view <PR-URL> --json state`; when `state` is `MERGED` proceed to Post-Merge; if `CLOSED` exit and notify the user — **never wait for a human to report the merge**; **never force-merge**

Ownership metadata:

- Implementer: AI agent
- Reviewer(s): Human reviewer
- Required approvals: 1

Blocking resolution flow:

- CI failure → fix → commit → validate locally → push → re-run checks
- Review comment → address → commit → validate locally → push → confirm resolved

## Post-Merge

- [ ] `git checkout main` and `git pull --ff-only`
- [ ] Verify the merged changes appear on the default branch
- [ ] Mark all remaining tasks as complete (`- [x]`)
- [ ] Sync approved spec deltas into `openspec/specs/` (no spec changes for this fix-only change)
- [ ] Archive the change: move `openspec/changes/fix-dedupe-engine-test/` to `openspec/changes/archive/2026-05-02-fix-dedupe-engine-test/` and stage both the new location and the deletion of the old location in a single commit — do not commit the copy and delete separately
- [ ] Confirm `openspec/changes/archive/2026-05-02-fix-dedupe-engine-test/` exists and `openspec/changes/fix-dedupe-engine-test/` is gone
- [ ] Commit and push the archive to the default branch in one commit
- [ ] Prune merged local feature branches: `git fetch --prune` and `git branch -d fix-dedupe-engine-test`

Required cleanup after archive: `git fetch --prune` and `git branch -d fix-dedupe-engine-test`