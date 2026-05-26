# Tasks

## Preparation

- [x] **Step 1 — Sync default branch:** `git checkout main` and `git pull --ff-only`
- [x] **Step 2 — Create and publish working branch:** `git checkout -b refactor/consolidate-test-user-factory` then immediately `git push -u origin refactor/consolidate-test-user-factory`

## Execution

### 1. Update `tests/integration/helpers/users.ts`

- [x] Add import: `import { createTestUser } from "@/tests/integration/auth.test.helpers";`
- [x] Remove the `uniqueEmail` function entirely
- [x] Remove the `counter` and `pid` module-level variables (they existed only for `uniqueEmail`)
- [x] Rename `createTestUser` → `registerTestUser`
- [x] Replace the internal email generation call (`uniqueEmail(prefix)`) with `createTestUser(prefix).email`
- [x] Replace the internal password constant with `createTestUser(prefix).password` (or destructure both at once)
- [x] Verify exported API: only `registerTestUser` is exported (no `uniqueEmail`)
- [x] Verify: `tsc --noEmit` passes

### 2. Rename call sites in 12 test files (mechanical rename only)

For each file below, change `import { createTestUser }` → `import { registerTestUser }` and update all call sites from `createTestUser(` → `registerTestUser(`:

- [x] `tests/integration/api.integration.test.ts`
- [x] `tests/integration/api/parties.test.ts`
- [x] `tests/integration/api/sessions.test.ts`
- [x] `tests/integration/campaign-global-api.integration.test.ts`
- [x] `tests/integration/campaigns.integration.test.ts`
- [x] `tests/integration/characters/characterType.integration.test.ts`
- [x] `tests/integration/characters/gender.integration.test.ts`
- [x] `tests/integration/characters/softDelete.integration.test.ts`
- [x] `tests/integration/content.integration.test.ts`
- [x] `tests/integration/import/characterImport.integration.test.ts`
- [x] `tests/integration/monsters.integration.test.ts`
- [x] `tests/integration/permissions.test.ts`
- [x] Verify: `grep -r "createTestUser" tests/integration --include="*.ts" | grep "helpers/users"` returns zero matches
- [x] Verify: `tsc --noEmit` passes

### 3. Migrate `tests/integration/api/auth/login.test.ts`

- [x] Add import: `import { registerTestUser } from "@/tests/integration/helpers/users";`
- [x] Remove `createTestEmail` and `registerUser` from the `auth.test.helpers` import (keep `loginUser`, `assertSuccessResponse`, `assertErrorResponse`, `extractAuthCookie`, `parseJsonResponse`, `VALID_PASSWORD`, `INVALID_EMAILS`, `apiCall`)
- [x] Replace the 3 setup patterns — `const email = createTestEmail(...); await registerUser(baseUrl, email, VALID_PASSWORD);` — with `const { email, cookie: _ } = await registerTestUser(baseUrl, "<prefix>");` (use appropriate prefixes: `"user"`, `"wrong-password-test"`, `"missing-password"`)
  - Note: the non-existent user test at line 66 uses `createTestEmail` but does NOT call `registerUser` — replace that with `const nonexistentEmail = createTestEmail("nonexistent");` keeping the import from `auth.test.helpers.ts` or, preferably, inline a `createTestUser("nonexistent").email` call since the sync factory is in scope
- [x] Verify: `tsc --noEmit` passes
- [x] Verify: `grep "registerUser\|createTestEmail" tests/integration/api/auth/login.test.ts` returns zero matches (or only the nonexistent-user case if using `createTestUser` for email generation)

### 4. Fix `tests/integration/api/auth/register.test.ts` special-email strings

- [x] Lines 93-96: replace the three raw `Date.now()`-only email strings with collision-safe equivalents using the existing `createTestEmail` already imported from `auth.test.helpers.ts`:
  - `` `user+test-${Date.now()}@example.co.uk` `` → `createTestEmail("user+test").replace("@example.com", "@example.co.uk")`
  - `` `user-name-${Date.now()}@example.com` `` → `createTestEmail("user-name")`
  - `` `user_name_${Date.now()}@example.com` `` → `createTestEmail("user_name")`
- [x] The `createTestUser` import from `auth.test.helpers.ts` already present in this file stays (it is the sync data factory used by the parallel-safety test)
- [x] Verify: no collision-unsafe (bare `Date.now()@`) email patterns in `register.test.ts`
- [x] Verify: `tsc --noEmit` passes

### 5. Handle `tests/integration/api/auth/logout.test.ts`

- [x] Already imports `createTestUser` from `helpers/users.ts` — rename to `registerTestUser` (same mechanical rename as step 2)
- [x] Verify imports and call sites are consistent

### 6. Final verification

- [x] `grep -r "createTestUser" tests/integration --include="*.ts" | grep -v "auth.test.helpers.ts\|register.test.ts"` → zero matches
- [x] `grep -r "uniqueEmail" tests/integration --include="*.ts"` → zero matches
- [x] `grep -r "Date\.now()" tests/integration --include="*.ts"` → only non-email uses (campaign IDs, `createTestEmail` internals, `.co.uk` safe variant)
- [x] `tsc --noEmit` → passes

## Pre-Commit Code Review

- [x] **Before every commit**, spawn a dedicated sub-agent to run the `openspec-review-code` skill. Review its report and apply fixes for duplication, complexity, and completeness before committing.

## Validation

- [x] `npm run test:integration` — all integration tests pass
- [x] `npm run typecheck` (or `tsc --noEmit`) — zero type errors
- [x] `npm run build` — build succeeds
- [x] All verification greps from Execution step 6 pass
- [x] All completed tasks marked as complete

## Remote push validation

Verification requirements (all must pass before PR or pushing updates to a PR):

- **Integration tests** — `npm run test:integration`; all tests must pass
- **Build** — `npm run build`; must succeed with no errors
- If **ANY** of the above fail, you **MUST** iterate and address the failure

## PR and Merge

- [x] Ensure the `openspec-review-code` sub-agent was run before the final commit
- [x] Commit all changes to the working branch and push to remote
- [x] Open PR from `refactor/consolidate-test-user-factory` to `main`. PR body must include `Closes #222`
- [x] **IMMEDIATELY** enable auto-merge: `gh pr merge <PR-URL> --auto --merge` (NEVER use `--admin` to force the merge)
- [x] Wait 180 seconds for CI to start and agentic reviewers to post their comments
- [x] **Monitor PR comments** — poll for new comments autonomously; when comments appear, address them, commit fixes, and explicitly ensure threads are resolved. Follow all steps in [Remote push validation] then push to the same working branch; wait 180 seconds then repeat until no unresolved comments remain
- [x] **Monitor CI checks** — poll for check status autonomously using `gh pr checks <PR-URL> --json isRequired,state`; when any required (blocking) CI check fails, diagnose and fix, commit, follow Remote push validation steps, push; wait 180 seconds then repeat
- [x] **Poll for merge** — after each iteration run `gh pr view <PR-URL> --json state`; when `state` is `MERGED` proceed to Post-Merge; if `CLOSED` exit and notify the user

Ownership metadata:

- Implementer: (current session)
- Reviewer(s): (project maintainer)
- Required approvals: 1

Blocking resolution flow:

- CI failure → fix → commit → validate locally → push → re-run checks
- Review comment → address → commit → validate locally → push → confirm resolved

## Post-Merge

- [x] `git checkout main` and `git pull --ff-only`
- [x] Verify the merged changes appear on the default branch
- [x] Mark all remaining tasks as complete (`- [x]`)
- [x] Sync approved spec deltas into `openspec/specs/` (global spec)
- [x] Archive the change: move `openspec/changes/consolidate-test-user-factory/` to `openspec/changes/archive/2026-05-26-consolidate-test-user-factory/` — stage both copy and deletion in a single commit
- [x] Confirm `openspec/changes/archive/2026-05-26-consolidate-test-user-factory/` exists and `openspec/changes/consolidate-test-user-factory/` is gone
- [x] **Create a doc branch**: `git checkout -b doc/archive-2026-05-26-consolidate-test-user-factory` then `git push -u origin doc/archive-2026-05-26-consolidate-test-user-factory`
- [x] Open a PR from the doc branch to `main` with title `docs: archive consolidate-test-user-factory (2026-05-26)`
- [x] **IMMEDIATELY** enable auto-merge on the doc PR: `gh pr merge <DOC-PR-URL> --auto --merge`
- [x] Monitor the doc PR until it merges
- [x] Prune merged local branches: `git fetch --prune` and `git branch -d refactor/consolidate-test-user-factory doc/archive-2026-05-26-consolidate-test-user-factory`
