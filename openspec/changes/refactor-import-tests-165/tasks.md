# Tasks

## Preparation

- [x] **Step 1 — Sync default branch:** `git checkout main` and `git pull --ff-only`
- [x] **Step 2 — Create and publish working branch:** `git checkout -b refactor/import-tests-165` then immediately `git push -u origin refactor/import-tests-165`

## Execution

### Phase 1: Refactor dedupeEngine

- [x] **1.1 — Update dedupeEngine tests first (TDD):** In `tests/unit/import/dedupeEngine.test.ts`, update/add assertions for `importMonsterSingle`:
  - Assert `shouldImport` is called before `transformMonster` for duplicate case
  - Assert `transformMonster` is NOT called when duplicate detected
  - Assert invalid+duplicate monster returns `skipped: true` (not `error: true`)
- [x] **1.2 — Refactor `importMonsterSingle`** in `lib/import/dedupeEngine.ts`:
  - Replace inline `storage.findMonsterByNameAndSource` call with `shouldImport("monsters", raw.name, "open5e")` (Open5ECreature has no source field; "open5e" matches what transformMonster hardcodes)
  - Move existence check before `transformMonster` call
  - Return `{ inserted: false, skipped: true, error: false }` when `!should`
- [x] **1.3 — Verify dedupeEngine integration tests** in `tests/integration/import/dedupeEngine.integration.test.ts` still pass; update if any assertions relied on old order

### Phase 2: Extract D&D Beyond mock server

- [x] **2.1 — Create `tests/mocks/dndBeyond/server.ts`:**
  - Export `createDndBeyondMockServer()` factory
  - Returns `{ setup(): Promise<void>, teardown(): Promise<void> }`
  - `setup()` starts a `createServer` on a random port, sets `process.env.DND_BEYOND_CHARACTER_SERVICE_BASE_URL`
  - `teardown()` closes the server
  - Handler logic extracted verbatim from `characterImport.integration.test.ts` lines 48–65
- [x] **2.2 — Update `tests/integration/import/characterImport.integration.test.ts`:**
  - Remove inline `createServer` block and related `let mockService`/`let mockServicePort` variables
  - Import and use `createDndBeyondMockServer`
  - Wire `setup()`/`teardown()` into existing `beforeAll`/`afterAll` hooks
- [x] **2.3 — Verify integration test still passes** with new helper wiring

## Validation

- [x] Run unit tests: `npm run test:unit -- --testPathPattern="dedupeEngine"`
- [x] Run integration tests: `npm run test:integration -- --testPathPattern="import"`
- [x] Run full unit suite: `npm run test:unit`
- [x] Run type check: `npx tsc --noEmit`
- [x] Run build: `npm run build`
- [x] Confirm no new entries in `package.json`
- [x] All tasks above marked complete

## Remote push validation

Verification requirements (all must pass before PR or pushing updates to a PR):

- **Unit tests** — `npm test`; all tests must pass
- **Integration tests** — `npm run test:integration`; all tests must pass
- **Build** — `npm run build`; must succeed with no errors
- if **ANY** of the above fail, you **MUST** iterate and address the failure

## PR and Merge

- [x] Run the required pre-PR self-review from `skills/openspec-apply-change/SKILL.md` before committing
- [x] Commit all changes to `refactor/import-tests-165` and push to remote
- [x] Open PR from `refactor/import-tests-165` to `main` — title: `refactor: centralize D&D Beyond mock server and unify importMonsterSingle dedupe check (closes #165)`
- [ ] Wait 120 seconds for agentic reviewers to post comments
- [ ] **Monitor PR comments** — address each, commit fixes, follow Remote push validation, push; repeat until no unresolved comments remain
- [ ] Enable auto-merge once no blocking review comments remain
- [ ] **Monitor CI checks** — diagnose and fix any failure, commit, follow Remote push validation, push; repeat until all checks pass
- [ ] Wait for PR to merge — **never force-merge**; if human force-merges, continue to Post-Merge

Ownership metadata:

- Implementer: dougis
- Reviewer(s): automated PR review (agentic)
- Required approvals: 1

Blocking resolution flow:

- CI failure → fix → commit → validate locally → push → re-run checks
- Security finding → remediate → commit → validate locally → push → re-scan
- Review comment → address → commit → validate locally → push → confirm resolved

## Post-Merge

- [ ] `git checkout main` and `git pull --ff-only`
- [ ] Verify merged changes appear on `main`
- [ ] Mark all remaining tasks as complete (`- [x]`)
- [ ] No documentation updates needed (test-only change)
- [ ] Sync approved spec deltas into `openspec/specs/` (dedupe-engine and mock-server specs)
- [ ] Archive the change: move `openspec/changes/refactor-import-tests-165/` to `openspec/changes/archive/2026-05-19-refactor-import-tests-165/` **in a single commit** (stage both copy and deletion together)
- [ ] Confirm `openspec/changes/archive/2026-05-19-refactor-import-tests-165/` exists and `openspec/changes/refactor-import-tests-165/` is gone
- [ ] Commit and push archive to `main`
- [ ] Prune: `git fetch --prune` and `git branch -d refactor/import-tests-165`
