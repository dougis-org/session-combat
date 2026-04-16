# Tasks

## Preparation

- [x] **Step 1 — Sync default branch:** `git checkout main` and `git pull --ff-only`
- [x] **Step 2 — Create and publish working branch:** `git checkout -b cleanup-misclassified-integration-tests` then immediately `git push -u origin cleanup-misclassified-integration-tests`

## Execution

> **Ordering rule:** Write destination first, verify it passes, then delete source. Never delete before destination is green.

### Group A — Simple moves (no overlap, wholesale)

- [x] **A1 — Move `duplicate-monster.test.ts`**
  - Create `tests/unit/api/monsters/duplicate.test.ts` with content from `tests/integration/duplicate-monster.test.ts`
  - Run `npm run test:unit` — must pass
  - Delete `tests/integration/duplicate-monster.test.ts`
  - Run `npm run test:unit` — must still pass

- [x] **A2 — Move `clientStorage.test.ts`**
  - Create `tests/unit/lib/clientStorage.test.ts` with content from `tests/integration/clientStorage.test.ts`
  - Run `npm run test:unit` — must pass
  - Delete `tests/integration/clientStorage.test.ts`

- [x] **A3 — Move `validation/password.test.ts`**
  - Create `tests/unit/validation/password.test.ts` with content from `tests/integration/validation/password.test.ts`
  - Run `npm run test:unit` — must pass
  - Delete `tests/integration/validation/password.test.ts`
  - Delete `tests/integration/validation/` directory if empty

### Group B — Augment existing unit files, then delete integration source

- [x] **B1 — Port party route tests**
  - In `tests/unit/api/parties/route.test.ts`:
    - Add assertion to existing "creates party and returns 201" test: verify `savedParty._id` is `undefined` and `savedParty.id` is a non-empty string (UUID)
    - Add new `describe("PUT /api/parties/[id]")` block covering: updates party fields, strips `_id` from saved payload, returns 200
  - Run `npm run test:unit` — must pass
  - Delete `tests/integration/party-routes.test.ts`

- [x] **B2 — Port storage.saveParty test**
  - In `tests/unit/storage/storage.test.ts`:
    - Add `describe("storage.saveParty")` block: verifies `collection("parties")` called, `updateOne` called with filter `{id, userId}` and `{$set: partyDataWithout_id}` and `{upsert: true}`
  - Run `npm run test:unit` — must pass
  - Delete `tests/integration/storage.party.test.ts`

### Group C — `monsterUpload` split into `tests/unit/monster-upload/`

- [x] **C1 — Create `tests/unit/monster-upload/document-validation.test.ts`**
  - Content: all `validateMonsterUploadDocument` scenarios from `tests/integration/monsterUpload.test.ts` (reject missing array, reject empty array, accept single/multi monster, collect errors from all invalid monsters)
  - Run `npm run test:unit` — must pass

- [x] **C2 — Create `tests/unit/monster-upload/field-validation.test.ts`**
  - Content: all `validateMonsterData` scenarios from `tests/integration/monsterUpload.test.ts` (required fields, optional fields with validation, ability scores, array fields, legendaryActionCount validation)
  - Run `npm run test:unit` — must pass

- [x] **C3 — Create `tests/unit/monster-upload/transform.test.ts`**
  - Content: all `transformMonsterData` scenarios from `tests/integration/monsterUpload.test.ts` (defaults, complete data, hp clamping, ID uniqueness, userId assignment, isGlobal=false, name trimming)
  - **Plus** absorb all tests from `tests/unit/validation/monsterUpload.test.ts` as a nested `describe("damage type filtering")` block within `describe("transformMonsterData")`
  - Run `npm run test:unit` — must pass
  - Delete `tests/unit/validation/monsterUpload.test.ts`

- [x] **C4 — Create `tests/unit/monster-upload/pipeline.test.ts`**
  - Content: "end-to-end validation flow" scenarios from `tests/integration/monsterUpload.test.ts` (validate+transform complete doc, validate+transform minimal doc)
  - Run `npm run test:unit` — must pass

- [x] **C5 — Delete integration source files**
  - Verify `npm run test:unit` is green (all C1–C4 tests pass)
  - Delete `tests/integration/monsterUpload.test.ts`
  - Delete `tests/integration/monsterUploadRoute.test.ts` (redundant — no migration needed)
  - Run `npm run test:unit` — must still pass

### Group D — Document `logout-clears-storage.test.ts`

- [x] **D1 — Add documentation header**
  - Add JSDoc header to `tests/integration/offline/logout-clears-storage.test.ts`:
    ```
    /**
     * Client-side integration test for logout storage cleanup.
     *
     * Integrates: useAuth, LocalStore, SyncQueue, clientStorage
     * Intentional mocks (external boundaries only):
     *   - next/navigation: no real router in test env
     *   - fetch: simulates API response / network failure
     *
     * These mocks do NOT test whether auth/storage work individually.
     * They test that all client storage layers clear correctly on logout.
     */
    ```
  - Run `npm run test:integration` — must pass

### Group E — Config collapse (last, after all file moves complete)

- [x] **E1 — Verify no jest.mock() in tests/integration/ (except documented boundary mocks)**
  - Run: `grep -r "jest.mock" tests/integration/`
  - Only allowed result: `tests/integration/offline/logout-clears-storage.test.ts` (boundary mocks)
  - If any other file appears, it was missed — do not proceed until resolved

- [x] **E2 — Update `jest.integration.config.js`**
  - Remove `testPathIgnorePatterns` array
  - `testMatch` must be: `["**/tests/integration/**/*.test.ts"]`

- [x] **E3 — Delete `jest.docker.config.js`**

- [x] **E4 — Remove `test:docker` from `package.json` scripts**

- [x] **E5 — Verify config collapse**
  - Run `npm run test:integration` — must pass and include all integration tests
  - Run `npm run test:ci` — must pass
  - Confirm `npm run test:docker` is no longer a valid script

## Validation

- [x] `npm run test:unit` — all pass
- [x] `npm run test:integration` — all pass, no exclusions
- [x] `npm run test:ci` — passes with forceExit
- [x] `npx tsc --noEmit` — no type errors
- [x] `grep -r "jest.mock" tests/integration/` — only `logout-clears-storage.test.ts` appears
- [x] `cat jest.integration.config.js` — no `testPathIgnorePatterns`
- [x] `ls jest.docker.config.js` — file not found
- [x] All tasks above marked complete

## Remote push validation

Verification requirements (all must pass before PR or pushing updates to a PR):

- **Unit tests** — `npm run test:unit` — all tests must pass
- **Integration tests** — `npm run test:integration` — all tests must pass
- **Build** — `npm run build` — must succeed with no errors
- If **ANY** of the above fail, iterate and fix before pushing

## PR and Merge

- [x] Run pre-PR self-review before committing
- [ ] Commit all changes to the working branch and push to remote
- [ ] Open PR from `cleanup-misclassified-integration-tests` to `main`
- [ ] Wait 120 seconds for agentic reviewers
- [ ] **Monitor PR comments** — address, commit, validate, push; repeat until no unresolved comments
- [ ] Enable auto-merge once no blocking review comments remain
- [ ] **Monitor CI checks** — diagnose failures, fix, commit, validate, push; repeat until all checks pass
- [ ] Wait for PR to merge — never force-merge

Ownership metadata:

- Implementer: Doug Hubbard
- Reviewer(s): TBD
- Required approvals: 1

Blocking resolution flow:

- CI failure → fix → commit → validate locally → push → re-run checks
- Security finding → remediate → commit → validate locally → push → re-scan
- Review comment → address → commit → validate locally → push → confirm resolved

## Post-Merge

- [ ] `git checkout main` and `git pull --ff-only`
- [ ] Verify merged changes appear on main
- [ ] Mark all remaining tasks as complete
- [ ] No documentation updates required (test-only change)
- [ ] Sync approved spec deltas into `openspec/specs/` if applicable
- [ ] Archive the change: move `openspec/changes/cleanup-misclassified-integration-tests/` to `openspec/changes/archive/YYYY-MM-DD-cleanup-misclassified-integration-tests/` — stage both copy and deletion in a single commit
- [ ] Confirm archive exists and original location is gone
- [ ] Commit and push archive to main in one commit
- [ ] `git fetch --prune` and `git branch -d cleanup-misclassified-integration-tests`
