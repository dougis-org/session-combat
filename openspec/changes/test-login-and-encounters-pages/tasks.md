# Tasks

## Preparation

- [x] **Step 1 — Sync default branch:** `git checkout main` and `git pull --ff-only`
- [x] **Step 2 — Create and publish working branch:** `git checkout -b test/login-and-encounters-pages` then immediately `git push -u origin test/login-and-encounters-pages`

## Execution

### Phase 1 — Source refactor (TDD prerequisite: make components importable)

- [x] **Task 1.1 — Export EncountersContent**
  - In `app/encounters/page.tsx`, add `export` to `function EncountersContent()`
  - Verify: `grep "export function EncountersContent" app/encounters/page.tsx` returns a match

- [x] **Task 1.2 — Extract EncounterEditor to its own file**
  - Create `app/encounters/EncounterEditor.tsx` with `'use client';` directive
  - Move the `EncounterEditor` function (lines ~192–413 of `page.tsx`) into the new file as a named export
  - Add all required imports to `EncounterEditor.tsx`: `useState`, `useEffect`, `Modal`, `QuickCombatantModal`, `useAuth`, `Encounter`, `Monster`, `MonsterTemplate` from `@/lib/types`
  - Import `MonsterEditor` from `app/encounters/page.tsx` (it remains in `page.tsx` for now — no extraction per scope)
  - In `app/encounters/page.tsx`, remove the `EncounterEditor` function body and add `import { EncounterEditor } from './EncounterEditor'`
  - Verify TypeScript compiles: `npx tsc --noEmit`
  - Verify app builds: `npm run build`

- [x] **Task 1.3 — Confirm existing tests still pass after refactor**
  - Run `npm run test:unit`
  - All previously passing tests must continue to pass before writing new tests

### Phase 2 — Write failing tests first (TDD: red phase)

> Write all test files with the full set of described test cases. Run them and confirm they fail (or error) before implementing anything. This validates the test setup and mock wiring.

- [x] **Task 2.1 — Write LoginPage.test.tsx (failing)**
  - Create `tests/unit/components/LoginPage.test.tsx`
  - Add `jest.mock` calls at top for `next/navigation`, `next/link`, `@/lib/hooks/useAuth`
  - Implement all test cases from `specs/login-page/spec.md`:
    - Renders email input, password input, submit button
    - Blocks submit + shows error when email is empty
    - Blocks submit + shows error when password is empty
    - Blocks submit + shows error when email format is invalid
    - Calls `login(email, password)` on valid submit
    - Calls `router.replace('/campaigns')` on successful login
    - Shows `useAuth` error string on failed login
    - Calls `router.replace('/campaigns')` when `isAuthenticated` is true on mount
  - Run `npm run test:unit -- --testPathPattern LoginPage` and confirm tests run (fail gracefully, not error out)

- [x] **Task 2.2 — Write EncountersPage.test.tsx (failing)**
  - Create `tests/unit/components/EncountersPage.test.tsx`
  - Add `jest.mock` calls for `next/link`, `@/lib/hooks/useAuth`, `@/lib/components/ProtectedRoute`, `@/app/encounters/EncounterEditor` (mock as `() => null`)
  - Import `EncountersContent` from `@/app/encounters/page`
  - Implement all test cases from `specs/encounters-page/spec.md`:
    - Renders encounter list after fetch
    - Shows empty state when list is empty
    - Renders "Add New Encounter" button
    - Handles fetch error gracefully
    - Delete: confirm=true → DELETE request sent + list refreshed
    - Delete: confirm=false → no DELETE request
  - Use `Response as FetchResponse` from `node-fetch` for mock responses (consistent with `CampaignsPage.test.tsx`)
  - Run `npm run test:unit -- --testPathPattern EncountersPage` and confirm tests run

- [x] **Task 2.3 — Write EncounterEditor.test.tsx (failing)**
  - Create `tests/unit/components/EncounterEditor.test.tsx`
  - Add `jest.mock` calls for `@/lib/hooks/useAuth`, `@/lib/components/QuickCombatantModal`, `@/lib/components/Modal`
  - Import `EncounterEditor` from `@/app/encounters/EncounterEditor`
  - Define a `BASE_ENCOUNTER` fixture matching the `Encounter` type
  - Implement all test cases from `specs/encounter-editor/spec.md`:
    - Shows "Create Encounter" when `isNew={true}`
    - Shows "Edit Encounter" when `isNew={false}`
    - Name and description fields pre-populated from encounter prop
    - Save button disabled when name is empty
    - Save button enabled when name is non-empty
    - Clicking Save calls `onSave` with merged encounter shape
    - Clicking Cancel calls `onCancel`
    - Shows "No monsters added yet." when monsters array is empty
    - Shows monster name + Edit/Delete buttons when monsters present
    - "Add Combatant" button is present
  - Run `npm run test:unit -- --testPathPattern EncounterEditor` and confirm tests run

### Phase 3 — Make tests pass (TDD: green phase)

> At this point all tests are written. The source refactor in Phase 1 should already make most tests pass. Phase 3 is for fixing any remaining failures discovered in Phase 2.

- [x] **Task 3.1 — Fix any mock wiring issues discovered in Phase 2**
  - Address any `jest.mock` shape mismatches (e.g. `useAuth` mock not providing `user.userId`)
  - Address any missing import aliases or module resolution issues
  - Re-run `npm run test:unit` after each fix

- [x] **Task 3.2 — Ensure all three new test files pass**
  - Run `npm run test:unit -- --testPathPattern "LoginPage|EncountersPage|EncounterEditor"`
  - All tests must be green before proceeding

## Pre-Commit Code Review

- [x] **Before every commit**, spawn a dedicated sub-agent to run the `openspec-review-code` skill. The primary agent must automatically address all findings from the sub-agent's report, applying fixes for complexity, duplication, and quality issues before committing.

## Validation

- [x] Run `npm run test:unit` — all tests pass (including the three new files)
- [x] Run `npx tsc --noEmit` — no TypeScript errors
- [x] Run `npm run build` — build succeeds
- [x] Run `npm run lint` (if configured) — no new lint errors
- [x] Verify `tests/unit/components/LoginPage.test.tsx`, `EncountersPage.test.tsx`, and `EncounterEditor.test.tsx` exist and are non-empty
- [x] Verify `app/encounters/EncounterEditor.tsx` exists as a named export
- [x] Verify `EncountersContent` is a named export from `app/encounters/page.tsx`

## Remote push validation

Verification requirements (all must pass before PR or pushing updates to a PR):

- **Unit tests** — `npm run test:unit`; all tests must pass
- **Integration tests** — run the project's integration test suite; all tests must pass
- **Build** — `npm run build`; must succeed with no errors
- if **ANY** of the above fail, you **MUST** iterate and address the failure

## PR and Merge

- [x] Ensure the `openspec-review-code` sub-agent was run and all findings were automatically addressed before the final commit
- [x] Commit all changes to the working branch and push to remote
- [x] Open PR from `test/login-and-encounters-pages` to `main`. PR body **MUST** include `Closes #377`
- [x] **IMMEDIATELY** enable auto-merge: `gh pr merge <PR-URL> --auto --merge` (NEVER use `--admin`)
- [ ] Wait 180 seconds for CI to start and agentic reviewers to post their comments
- [ ] **Monitor PR comments** — poll for new comments autonomously; address each one, commit fixes, follow all steps in Remote push validation, push, wait 180 seconds, repeat until no unresolved comments remain
- [ ] **Monitor CI checks** — poll using `gh pr checks <PR-URL> --json isRequired,state`; fix any required failing checks, commit, validate locally, push, wait 180 seconds, repeat
- [ ] **Poll for merge** — after each iteration run `gh pr view <PR-URL> --json state`; when `state` is `MERGED` proceed to Post-Merge; if `CLOSED` exit and notify the user

Ownership metadata:

- Implementer: (assigned agent)
- Reviewer(s): (project lead)
- Required approvals: 1

Blocking resolution flow:

- CI failure → fix → commit → validate locally → push → re-run checks
- Review comment → address → commit → validate locally → push → confirm resolved

## Post-Merge

- [ ] `git checkout main` and `git pull --ff-only`
- [ ] Verify the merged changes appear on the default branch
- [ ] Mark all remaining tasks as complete (`- [x]`)
- [ ] Update repository documentation impacted by the change (e.g. CONTRIBUTING.md if test conventions changed)
- [ ] Sync approved spec deltas into `openspec/specs/` (global spec)
- [ ] Archive the change: move `openspec/changes/test-login-and-encounters-pages/` to `openspec/changes/archive/YYYY-MM-DD-test-login-and-encounters-pages/` **in a single atomic commit** — stage both the new location and the deletion of the old location together
- [ ] Confirm `openspec/changes/archive/YYYY-MM-DD-test-login-and-encounters-pages/` exists and `openspec/changes/test-login-and-encounters-pages/` is gone
- [ ] **Create a doc branch** for the archive and spec updates: `git checkout -b doc/archive-YYYY-MM-DD-test-login-and-encounters-pages` then `git push -u origin doc/archive-YYYY-MM-DD-test-login-and-encounters-pages`
- [ ] Open a PR from the doc branch to `main` with title `docs: archive test-login-and-encounters-pages (YYYY-MM-DD)` — **do NOT push directly to `main`**
- [ ] **IMMEDIATELY** enable auto-merge on the doc PR: `gh pr merge <DOC-PR-URL> --auto --merge`
- [ ] Monitor the doc PR until it merges (same loop as implementation PR)
- [ ] Prune merged local branches: `git fetch --prune` and `git branch -d test/login-and-encounters-pages doc/archive-YYYY-MM-DD-test-login-and-encounters-pages`
