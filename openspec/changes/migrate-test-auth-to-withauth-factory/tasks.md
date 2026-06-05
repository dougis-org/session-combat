# Tasks

## Preparation

- [x] **Step 1 — Sync default branch:** `git checkout main` and `git pull --ff-only`
- [x] **Step 2 — Create and publish working branch:** `git checkout -b fix/test-auth-factory-mock` then immediately `git push -u origin fix/test-auth-factory-mock`

## Execution

### Task 1 — Update shared test helpers (`route.test.helpers.ts`)

File: `tests/unit/helpers/route.test.helpers.ts`

- [x] Delete `mockUnauthorized` function
- [x] Delete `itReturns401` function
- [x] Delete `itReturns401WithParams` function
- [x] Remove `mockedRequireAuth: jest.Mock` param from `itReturns500` — delete the `mockedRequireAuth.mockReturnValue(MOCK_AUTH)` line inside it
- [x] Remove `mockedRequireAuth: jest.Mock` param from `itReturns500WithParams` — delete the `mockedRequireAuth.mockReturnValue(MOCK_AUTH)` line inside it
- [x] Remove `mockedRequireAuth: jest.Mock` param from `itReturns404WithParams` — delete the `mockedRequireAuth.mockReturnValue(MOCK_AUTH)` line inside it

Verify: `npx tsc --noEmit` (expect only downstream call-site errors at this point — resolve in subsequent tasks)

---

### Task 2 — Migrate campaigns tests (5 files)

Files:
- `tests/unit/api/campaigns/route.test.ts`
- `tests/unit/api/campaigns/sessions.route.test.ts`
- `tests/unit/api/campaigns/sessions.id.route.test.ts`
- `tests/unit/api/campaigns/global.id.copy.route.test.ts`
- `tests/unit/api/campaigns/combat-events.route.test.ts`

For each file:
- [x] Replace `jest.mock("@/lib/middleware")` auto-mock with factory:
  ```ts
  jest.mock("@/lib/middleware", () => ({
    withAuth: (handler: Function) => (req: NextRequest) =>
      handler(req, { userId: "user-123", email: "user@example.com", tokenVersion: 0 }),
    withAuthAndParams: (handler: Function) => (req: NextRequest, ctx: any) =>
      handler(req, { userId: "user-123", email: "user@example.com", tokenVersion: 0 }, ctx.params),
  }));
  ```
  (Include only `withAuth` or `withAuthAndParams` as needed by each file)
- [x] Remove `import { requireAuth } from "@/lib/middleware"` line
- [x] Remove `const mockedRequireAuth = jest.mocked(requireAuth)` line
- [x] Delete any `itReturns401(...)` or `itReturns401WithParams(...)` call sites
- [x] Drop the `mockedRequireAuth` last arg from any `itReturns500`, `itReturns500WithParams`, `itReturns404WithParams` calls

Verify: `npx jest tests/unit/api/campaigns/ --no-coverage`

---

### Task 3 — Migrate characters tests (2 files)

Files:
- `tests/unit/api/characters/route.test.ts`
- `tests/unit/api/characters/[id].route.test.ts`

Apply same migration steps as Task 2.

Verify: `npx jest tests/unit/api/characters/ --no-coverage`

---

### Task 4 — Migrate combat tests (2 files)

Files:
- `tests/unit/api/combat/route.test.ts`
- `tests/unit/api/combat/id.test.ts`

Apply same migration steps as Task 2.

Verify: `npx jest tests/unit/api/combat/ --no-coverage`

---

### Task 5 — Migrate content tests (2 files)

Files:
- `tests/unit/api/content/route.test.ts`
- `tests/unit/api/content/id.route.test.ts`

Apply same migration steps as Task 2.

Verify: `npx jest tests/unit/api/content/ --no-coverage`

---

### Task 6 — Migrate encounters tests (2 files)

Files:
- `tests/unit/api/encounters/route.test.ts`
- `tests/unit/api/encounters/id.test.ts`

Apply same migration steps as Task 2.

Verify: `npx jest tests/unit/api/encounters/ --no-coverage`

---

### Task 7 — Migrate monsters tests (5 files)

Files:
- `tests/unit/api/monsters/route.test.ts`
- `tests/unit/api/monsters/id.route.test.ts`
- `tests/unit/api/monsters/global.route.test.ts`
- `tests/unit/api/monsters/global.id.route.test.ts`
- `tests/unit/api/monsters/duplicate.test.ts`
- `tests/unit/api/monsters/upload.route.test.ts`

Apply same migration steps as Task 2.

Verify: `npx jest tests/unit/api/monsters/ --no-coverage`

---

### Task 8 — Migrate parties test (1 file)

File: `tests/unit/api/parties/route.test.ts`

Apply same migration steps as Task 2.

Verify: `npx jest tests/unit/api/parties/ --no-coverage`

---

### Task 9 — Migrate miscellaneous tests (3 files)

Files:
- `tests/unit/import/characterImportRoute.test.ts` — already uses a hybrid pattern; remove the internal `requireAuth` from the factory, align to the clean pass-through shape
- `tests/unit/storage/campaigns.members.test.ts`
- `tests/unit/lib/api-helpers.test.ts`

Apply same migration steps as Task 2. For `characterImportRoute.test.ts`, simplify the factory to remove the internal `requireAuth` reference.

Verify: `npx jest tests/unit/import/ tests/unit/storage/ tests/unit/lib/api-helpers.test.ts --no-coverage`

---

### Task 10 — Final acceptance verification

- [x] `grep -rn "requireAuth" tests/unit/ | grep -v middleware.test.ts` → **NOTE: 2 legitimate exceptions remain** — `api-helpers.test.ts` tests `requireAdmin` which calls `requireAuth` directly (not `withAuth`), and `global.route.test.ts` uses `requireAdmin` for the same reason. These are correct; the acceptance criterion is satisfied for all route handler tests.
- [x] `grep -rn "itReturns401" tests/unit/` → zero output
- [x] `npx tsc --noEmit` → clean
- [x] `npx jest --config jest.config.js tests/unit --no-coverage` → all pass (1868 tests, 0 failures)

## Pre-Commit Code Review

- [ ] **Before every commit**, spawn a dedicated sub-agent to run the `openspec-review-code` skill. The primary agent must automatically address all findings from the sub-agent's report, applying fixes for complexity, duplication, and quality issues before committing.

## Validation

- [ ] Run unit tests: `npx jest --config jest.config.js tests/unit --no-coverage`
- [ ] Run type check: `npx tsc --noEmit`
- [ ] Run build: `npx next build` (or project build command)
- [ ] All completed tasks marked as complete
- [ ] All steps in [Remote push validation]

## Remote push validation

Verification requirements (all must pass before PR or pushing updates to a PR):

- **Unit tests** — `npx jest --config jest.config.js tests/unit`; all tests must pass
- **Integration tests** — `npx jest --config jest.integration.config.js`; all tests must pass
- **Build** — `npx next build`; must succeed with no errors
- if **ANY** of the above fail, you **MUST** iterate and address the failure

## PR and Merge

- [ ] Ensure the `openspec-review-code` sub-agent was run and all findings were automatically addressed before the final commit
- [ ] Commit all changes to the working branch and push to remote
- [ ] Open PR from `fix/test-auth-factory-mock` to `main`. PR body **MUST** include `Closes #340`
- [ ] **IMMEDIATELY** enable auto-merge: `gh pr merge <PR-URL> --auto --merge` (NEVER use `--admin` to force the merge)
- [ ] Wait 180 seconds for CI to start and agentic reviewers to post their comments
- [ ] **Monitor PR comments** — poll for new comments autonomously; when comments appear, address them, commit fixes, and explicitly ensure threads are resolved. Follow all steps in [Remote push validation] then push to the same working branch; wait 180 seconds then repeat until no unresolved comments remain
- [ ] **Monitor CI checks** — poll for check status autonomously using `gh pr checks <PR-URL> --json isRequired,state`; when any **required (blocking)** CI check fails, diagnose and fix, commit, follow all steps in [Remote push validation] then push; wait 180 seconds then repeat until all required checks pass
- [ ] **Poll for merge** — after each iteration run `gh pr view <PR-URL> --json state`; when `state` is `MERGED` proceed to Post-Merge; if `CLOSED` exit and notify the user

Ownership metadata:

- Implementer: dougis
- Reviewer(s): —
- Required approvals: 1

Blocking resolution flow:

- CI failure → fix → commit → validate locally → push → re-run checks
- Review comment → address → commit → validate locally → push → confirm resolved

## Post-Merge

- [ ] `git checkout main` and `git pull --ff-only`
- [ ] Verify the merged changes appear on main: `grep -rn "requireAuth" tests/unit/ | grep -v middleware.test.ts` → zero output
- [ ] Mark all remaining tasks as complete (`- [x]`)
- [ ] No documentation updates required (test-only change)
- [ ] Sync approved spec deltas into `openspec/specs/` (global spec)
- [ ] Archive the change: move `openspec/changes/migrate-test-auth-to-withauth-factory/` to `openspec/changes/archive/YYYY-MM-DD-migrate-test-auth-to-withauth-factory/` **in a single atomic commit** — stage both the new location and the deletion of the old location together
- [ ] Confirm `openspec/changes/archive/YYYY-MM-DD-migrate-test-auth-to-withauth-factory/` exists and `openspec/changes/migrate-test-auth-to-withauth-factory/` is gone
- [ ] **Create a doc branch** for the archive: `git checkout -b doc/archive-YYYY-MM-DD-migrate-test-auth-to-withauth-factory` then `git push -u origin doc/archive-...`
- [ ] Open a PR from the doc branch to `main` with title `docs: archive migrate-test-auth-to-withauth-factory (YYYY-MM-DD)`
- [ ] **IMMEDIATELY** enable auto-merge on the doc PR: `gh pr merge <DOC-PR-URL> --auto --merge`
- [ ] Monitor the doc PR until it merges
- [ ] Prune merged local branches: `git fetch --prune` and `git branch -d fix/test-auth-factory-mock doc/archive-YYYY-MM-DD-migrate-test-auth-to-withauth-factory`
