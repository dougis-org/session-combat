# Tasks

## Preparation

- [x] **Step 1 — Sync default branch:** `git checkout main` and `git pull --ff-only`
- [x] **Step 2 — Create and publish working branch:** `git checkout -b feat/migrate-toast-to-shared-component` then immediately `git push -u origin feat/migrate-toast-to-shared-component`

## Execution

### Task 1 — Update `useCombat.ts`

- [x] Import `useToast` from `lib/components/Toast.tsx`
- [x] Remove `useState` declaration for `toast` (line 35)
- [x] Remove `useEffect` auto-dismiss timer block (lines 96–102)
- [x] Add `const { toast, showToast } = useToast();` after the other hook calls
- [x] In the return object, replace `setToast` with `showToast`
- [x] In `UseCombatReturn` interface: remove `setToast` field (line 554), add `showToast: (message: string, type: 'success' | 'error') => void`
- [x] **Verify:** `tsc --noEmit` passes

### Task 2 — Update `lib/components/ActiveCombatView.tsx`

- [x] Import `Toast` from `lib/components/Toast.tsx`
- [x] Replace the inline toast block (lines 410–416) with `<Toast toast={toast} />`
- [x] Confirm `toast` is still destructured from `combat` (line 85) — no change needed there
- [x] **Verify:** `tsc --noEmit` passes

### Task 3 — Update `lib/components/QuickCombatantModal.tsx`

- [x] Import `useToast` and `Toast` from `lib/components/Toast.tsx`
- [x] Remove `useState` declaration for `toast` (line 35)
- [x] Remove `useEffect` auto-dismiss timer block (lines 38–43)
- [x] Remove `useEffect` from the import list if it is now unused
- [x] Add `const { toast, showToast } = useToast();` after the remaining `useState` calls
- [x] Rename `showToast` prop in `QuickCombatantModalProps` to `enableToast` (line 17)
- [x] Rename the destructured prop parameter to `enableToast` (line 30)
- [x] Update the 4 `setToast({...})` call sites to use `showToast(message, type)`:
  - `handleAddFromLibrary` success (line 146): `setToast({ message: ..., type: 'success' })` → `showToast(\`${newMonster.name} added successfully\`, 'success')`
  - `handleAddFromLibrary` error (line 154): → `showToast('Failed to add monster', 'error')`
  - `handleAddCharacterFromLibrary` success (line 167): → `showToast(\`${character.name} added successfully\`, 'success')`
  - `handleAddCharacterFromLibrary` error (line 178): → `showToast('Failed to add character', 'error')`
- [x] Update `if (showToast)` guards to `if (enableToast)` (lines 145, 166)
- [x] Replace inline toast div at the bottom of the JSX (lines 682–689) with `<Toast toast={toast} />`
- [x] **Verify:** `tsc --noEmit` passes

### Task 4 — Update test fixture and tests

- [x] In `tests/unit/fixtures/useCombat.ts`: rename `setToast: jest.fn()` to `showToast: jest.fn()`
- [x] In test files that render `<QuickCombatantModal showToast={...} />`: rename prop to `enableToast`
  - `tests/unit/components/QuickCombatantModal.test.tsx` — update all occurrences (lines ~91, 265)
- [x] **Verify:** `npm run test:unit` passes

## Pre-Commit Code Review

- [x] **Before every commit**, spawn a dedicated sub-agent to run the `openspec-review-code` skill. The primary agent must automatically apply all clearly-correct findings directly to the code — without stopping, without presenting the findings list to the user, and without asking for confirmation. Apply fixes, re-run tests to confirm they pass, then proceed to commit.

## Validation

- [x] `npm run test:unit` — all tests pass
- [x] `tsc --noEmit` — no type errors
- [x] `npm run build` — build succeeds
- [ ] Manually verify: open combat view and add a monster via the modal — success toast appears with correct style (green pill)
- [ ] Manually verify: error path renders error toast (red pill)
- [ ] All tasks above marked complete

## Remote push validation

Verification requirements (all must pass before PR or pushing updates to a PR):

- **Unit tests** — `npm run test:unit` — all tests must pass
- **Build** — `npm run build` — must succeed with no errors
- **Type check** — `tsc --noEmit` — must pass
- If **ANY** of the above fail, iterate and address the failure before pushing

## PR and Merge

- [x] Ensure the `openspec-review-code` sub-agent was run and all findings were automatically addressed before the final commit
- [x] Commit all changes to `feat/migrate-toast-to-shared-component` and push to remote
- [x] Open PR from `feat/migrate-toast-to-shared-component` to `main`. PR body must include: `Closes #389`
- [x] **IMMEDIATELY** enable auto-merge: `gh pr merge <PR-URL> --auto --squash` (NEVER use `--admin` to force the merge; always use `--squash`)
- [ ] Wait 180 seconds for CI to start and agentic reviewers to post their comments
- [ ] **Monitor PR comments** — poll for new comments autonomously; when comments appear, address them, commit fixes, resolve threads. Follow all steps in Remote push validation then push to `feat/migrate-toast-to-shared-component`; wait 180 seconds then repeat until no unresolved comments remain
- [ ] **Monitor CI checks** — poll for check status using `gh pr checks <PR-URL> --json isRequired,state`; when any required CI check fails, diagnose and fix, commit, follow Remote push validation, push, wait 180 seconds, repeat until all required checks pass
- [ ] **Poll for merge** — after each iteration run `gh pr view <PR-URL> --json state`; when `state` is `MERGED` proceed to Post-Merge; if `CLOSED` exit and notify the user

Ownership metadata:

- Implementer: dougis
- Reviewer(s): agentic reviewer
- Required approvals: 1

Blocking resolution flow:

- CI failure → fix → commit → validate locally → push → confirm thread resolved
- Review comment → address → commit → validate locally → push → confirm thread resolved

## Post-Merge

- [ ] `git checkout main` and `git pull --ff-only`
- [ ] Verify merged changes appear on `main`
- [ ] Mark all remaining tasks complete
- [ ] Sync approved spec delta: copy `openspec/changes/migrate-toast-to-shared-component/specs/toast-migration/spec.md` to `openspec/specs/toast-migration/spec.md`
- [ ] Archive the change: move `openspec/changes/migrate-toast-to-shared-component/` to `openspec/changes/archive/YYYY-MM-DD-migrate-toast-to-shared-component/` — stage both copy and deletion in a single commit
- [ ] Confirm `openspec/changes/archive/YYYY-MM-DD-migrate-toast-to-shared-component/` exists and `openspec/changes/migrate-toast-to-shared-component/` is gone
- [ ] **Create a doc branch:** `git checkout -b doc/archive-YYYY-MM-DD-migrate-toast-to-shared-component` then `git push -u origin doc/archive-YYYY-MM-DD-migrate-toast-to-shared-component`
- [ ] Open a PR from `doc/archive-YYYY-MM-DD-migrate-toast-to-shared-component` to `main` with title `docs: archive migrate-toast-to-shared-component (YYYY-MM-DD)`
- [ ] **IMMEDIATELY** enable auto-merge: `gh pr merge <DOC-PR-URL> --auto --squash`
- [ ] Monitor the doc PR until merged (address comments and CI failures on `doc/archive-*` branch, repeat)
- [ ] Prune merged local branches: `git fetch --prune` && `git branch -d feat/migrate-toast-to-shared-component doc/archive-YYYY-MM-DD-migrate-toast-to-shared-component`
