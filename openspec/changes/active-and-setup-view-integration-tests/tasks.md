# Tasks

## Preparation

- [x] **Step 1 — Sync default branch:** `git checkout main` and `git pull --ff-only`
- [x] **Step 2 — Create and publish working branch:** `git checkout -b test/active-and-setup-view-integration-tests` then immediately `git push -u origin test/active-and-setup-view-integration-tests`

## Execution

### 1. Create ActiveCombatView test file

- [x] Create `tests/unit/components/ActiveCombatView.test.tsx`
- [x] Add module-level mocks: `jest.mock('@/lib/hooks/useCombat', ...)` and `jest.mock('next/link', ...)`
- [x] Import `makeUseCombat` from `@/tests/unit/fixtures/useCombat`
- [x] Add `beforeEach` to configure `(useCombat as jest.Mock).mockReturnValue(makeUseCombat())`
- [x] Write scenario: renders combatant names from `getDisplayCombatants` (happy path)
- [x] Write scenario: empty combatant list when `getDisplayCombatants` returns `[]`
- [x] Write scenario: clicking "Next Turn" calls `nextTurn()` once
- [x] Write scenario: active combatant has a distinguishing CSS class/attribute
- [x] Write scenario: encounter description modal visible when `showEncounterDescription: true`
- [x] Write scenario: encounter description modal hidden when `showEncounterDescription: false`
- [x] Write scenario: confirming remove calls `removeCombatant` with correct ID
- [x] Verify: `npm test -- --testPathPattern=ActiveCombatView` passes

### 2. Create CombatSetupView test file

- [x] Create `tests/unit/components/CombatSetupView.test.tsx`
- [x] Add module-level mocks: `jest.mock('@/lib/hooks/useCombat', ...)` and `jest.mock('next/link', ...)`
- [x] Import `makeUseCombat` from `@/tests/unit/fixtures/useCombat`
- [x] Add `beforeEach` to configure `(useCombat as jest.Mock).mockReturnValue(makeUseCombat())`
- [x] Write scenario: renders setup combatant names from `setupCombatants` (happy path)
- [x] Write scenario: empty list when `setupCombatants: []`
- [x] Write scenario: clicking "Start Combat" calls `startCombatWithSetupCombatants()` once
- [x] Write scenario: clicking "Add Combatant" calls `setShowCombatantModal(true)`
- [x] Write scenario: `QuickCombatantModal` visible when `showCombatantModal: true`
- [x] Write scenario: clicking remove button calls `removeCombatantFromSetup` with correct ID
- [x] Verify: `npm test -- --testPathPattern=CombatSetupView` passes

### 3. Verify coverage targets

- [x] Run `npm test -- --coverage --collectCoverageFrom="lib/components/ActiveCombatView.tsx" --testPathPattern=ActiveCombatView`
- [x] Confirm `ActiveCombatView.tsx` statement coverage ≥ 60%
- [x] Run `npm test -- --coverage --collectCoverageFrom="lib/components/CombatSetupView.tsx" --testPathPattern=CombatSetupView`
- [x] Confirm `CombatSetupView.tsx` statement coverage ≥ 60%

## Pre-Commit Code Review

- [x] **Before every commit**, spawn a dedicated sub-agent to run the `openspec-review-code` skill. The primary agent must automatically address all findings from the sub-agent's report, applying fixes for complexity, duplication, and quality issues before committing.

## Validation

- [x] `npm test` — all unit tests pass
- [x] `npm run test:integration` — all integration tests pass (no regressions)
- [x] `npm run type-check` (or equivalent) — no TypeScript errors
- [x] `npm run build` — build succeeds
- [x] `npm run lint` — no lint errors

## Remote push validation

Verification requirements (all must pass before PR or pushing updates to a PR):

- **Unit tests** — `npm test`; all tests must pass
- **Integration tests** — `npm run test:integration`; all tests must pass
- **Build** — `npm run build`; must succeed with no errors
- if **ANY** of the above fail, you **MUST** iterate and address the failure

## PR and Merge

- [x] Ensure the `openspec-review-code` sub-agent was run and all findings were automatically addressed before the final commit
- [x] Commit all changes to `test/active-and-setup-view-integration-tests` and push to remote
- [ ] Open PR from `test/active-and-setup-view-integration-tests` to `main`. PR body must include `Closes #259`.
- [ ] **IMMEDIATELY** enable auto-merge: `gh pr merge <PR-URL> --auto --squash` (NEVER use `--admin` to force the merge)
- [ ] Wait 180 seconds for CI to start and agentic reviewers to post their comments
- [ ] **Monitor PR comments** — poll for new comments autonomously; when comments appear, address them, commit fixes, and explicitly ensure threads are resolved. Follow all steps in [Remote push validation] then push to the same working branch; wait 180 seconds then repeat until no unresolved comments remain
- [ ] **Monitor CI checks** — poll using `gh pr checks <PR-URL> --json name,state`; when any required check fails, diagnose and fix, commit, follow all steps in [Remote push validation], push, wait 180 seconds then repeat until all required checks pass
- [ ] **Poll for merge** — after each iteration run `gh pr view <PR-URL> --json state`; when `state` is `MERGED` proceed to Post-Merge; if `CLOSED` exit and notify the user

Ownership metadata:

- Implementer: claude
- Reviewer(s): dougis, automated reviewers (Copilot, Gemini, Codacy)
- Required approvals: 1 human approval

Blocking resolution flow:

- CI failure → fix → commit → validate locally → push → re-run checks
- Coverage check failure → add additional test scenarios to reach 60% → commit → push
- Review comment → address → commit → validate locally → push → confirm resolved

## Post-Merge

- [ ] `git checkout main` and `git pull --ff-only`
- [ ] Verify new test files appear on `main`
- [ ] Mark all remaining tasks as complete (`- [x]`)
- [ ] Sync approved spec deltas into `openspec/specs/` (global spec): copy `specs/active-combat-view.md` and `specs/combat-setup-view.md` to `openspec/specs/active-and-setup-view-integration-tests/`
- [ ] Archive the change: move `openspec/changes/active-and-setup-view-integration-tests/` to `openspec/changes/archive/YYYY-MM-DD-active-and-setup-view-integration-tests/` **in a single atomic commit** — stage both the new location and the deletion of the original
- [ ] Confirm `openspec/changes/archive/YYYY-MM-DD-active-and-setup-view-integration-tests/` exists and `openspec/changes/active-and-setup-view-integration-tests/` is gone
- [ ] **Create a doc branch**: `git checkout -b doc/archive-YYYY-MM-DD-active-and-setup-view-integration-tests` then `git push -u origin doc/archive-YYYY-MM-DD-active-and-setup-view-integration-tests`
- [ ] Open a PR from the doc branch to `main` with title `docs: archive active-and-setup-view-integration-tests (YYYY-MM-DD)`
- [ ] **IMMEDIATELY** enable auto-merge on the doc PR: `gh pr merge <DOC-PR-URL> --auto --squash`
- [ ] Monitor the doc PR until it merges (same loop — address comments and CI failures, push to doc branch, repeat)
- [ ] Prune merged local branches: `git fetch --prune` and `git branch -d test/active-and-setup-view-integration-tests doc/archive-YYYY-MM-DD-active-and-setup-view-integration-tests`
