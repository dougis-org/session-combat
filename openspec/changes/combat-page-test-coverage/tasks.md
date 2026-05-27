# Tasks

## Preparation

- [x] **Step 1 — Sync default branch:** `git checkout main` and `git pull --ff-only`
- [x] **Step 2 — Create and publish working branch:** `git checkout -b feat/combat-page-test-coverage` then immediately `git push -u origin feat/combat-page-test-coverage`

## Execution

### Task 1 — Create central `useCombat` mock factory

Create `tests/unit/fixtures/useCombat.ts` with a `makeUseCombat(overrides?)` factory function typed against `UseCombatReturn`. Use explicit `import { jest } from '@jest/globals'`. All action fields default to `jest.fn()` stubs; state fields default to safe empty values (see design.md Decision 2).

**Verification:** `npx tsc --noEmit` passes with no errors in `tests/unit/fixtures/useCombat.ts`

### Task 2 — Create `tests/unit/combat/` directory and `combatPage.test.tsx`

Create `tests/unit/combat/combatPage.test.tsx` using the `createRoot` + `act` pattern from `tests/unit/components/TargetActionModal.test.tsx`. Include:

- Module-level mocks for `@/lib/hooks/useCombat`, `@/lib/hooks/useAuth`, `@/lib/components/ProtectedRoute`, `@/lib/components/CombatSetupView`, `@/lib/components/ActiveCombatView`
- `ProtectedRoute` mocked as a pass-through: `({ children }) => <>{children}</>`
- `CombatSetupView` mocked to render `<div>CombatSetupView</div>`
- `ActiveCombatView` mocked to render `<div>ActiveCombatView</div>`
- A minimal `MOCK_COMBAT_STATE: CombatState` fixture defined inline
- Three test cases: loading state, setup view, active view (see spec scenarios)

**Verification:** `npm test -- --testPathPattern=combatPage` — all three tests pass

### Task 3 — Verify coverage threshold

Run coverage for the combat page file and confirm ≥80% statement coverage.

**Verification:** `npm test -- --testPathPattern=combatPage --coverage --collectCoverageFrom='app/combat/page.tsx'` — statements ≥80%

## Pre-Commit Code Review

- [x] **Before every commit**, spawn a dedicated sub-agent to run the `openspec-review-code` skill. Review its report and apply fixes for duplication, complexity, and completeness before committing.

## Validation

- [ ] `npm test -- --testPathPattern=combatPage` — all three tests pass
- [ ] `npx tsc --noEmit` — no TypeScript errors
- [ ] `npm run build` — build succeeds
- [ ] Coverage ≥80% on `app/combat/page.tsx`
- [ ] All execution tasks marked complete
- [ ] All steps in [Remote push validation]

## Remote push validation

Verification requirements (all must pass before PR or pushing updates to a PR):

- **Unit tests** — `npm test` — all tests must pass
- **Integration tests** — `npm run test:integration` — all tests must pass
- **Build** — `npm run build` — must succeed with no errors
- if **ANY** of the above fail, you **MUST** iterate and address the failure

## PR and Merge

- [ ] Ensure the `openspec-review-code` sub-agent was run before the final commit
- [ ] Commit all changes to `feat/combat-page-test-coverage` and push to remote
- [ ] Open PR from `feat/combat-page-test-coverage` to `main`. PR body **must** include `Closes #243`.
- [ ] **IMMEDIATELY** enable auto-merge: `gh pr merge <PR-URL> --auto --merge` (NEVER use `--admin` to force the merge)
- [ ] Wait 180 seconds for CI to start and agentic reviewers to post their comments
- [ ] **Monitor PR comments** — poll for new comments autonomously; address, commit, validate locally, push; wait 180 seconds then repeat until no unresolved comments remain
- [ ] **Monitor CI checks** — poll using `gh pr checks <PR-URL> --json isRequired,state`; fix any required failures, commit, validate locally, push; wait 180 seconds then repeat
- [ ] **Poll for merge** — `gh pr view <PR-URL> --json state`; when `MERGED` proceed to Post-Merge; if `CLOSED` exit and notify the user

Ownership metadata:

- Implementer: doug@dougis.com
- Reviewer(s): automated CI + code review agents
- Required approvals: 1

Blocking resolution flow:

- CI failure → fix → commit → validate locally → push → re-run checks
- Security finding → remediate → commit → validate locally → push → re-scan
- Review comment → address → commit → validate locally → push → confirm resolved

## Post-Merge

- [ ] `git checkout main` and `git pull --ff-only`
- [ ] Verify `tests/unit/fixtures/useCombat.ts` and `tests/unit/combat/combatPage.test.tsx` appear on `main`
- [ ] Mark all remaining tasks as complete (`- [x]`)
- [ ] No documentation updates required (test-only change)
- [ ] Sync approved spec deltas: copy `openspec/changes/combat-page-test-coverage/specs/combat-page-coverage/spec.md` to `openspec/specs/combat-page-coverage/spec.md`
- [ ] Archive the change: move `openspec/changes/combat-page-test-coverage/` to `openspec/changes/archive/YYYY-MM-DD-combat-page-test-coverage/` — stage both the new location and deletion in a **single commit**
- [ ] Confirm `openspec/changes/archive/YYYY-MM-DD-combat-page-test-coverage/` exists and `openspec/changes/combat-page-test-coverage/` is gone
- [ ] **Create a doc branch:** `git checkout -b doc/archive-YYYY-MM-DD-combat-page-test-coverage` then `git push -u origin doc/archive-YYYY-MM-DD-combat-page-test-coverage`
- [ ] Open PR from doc branch to `main` with title `docs: archive combat-page-test-coverage (YYYY-MM-DD)`
- [ ] **IMMEDIATELY** enable auto-merge on the doc PR: `gh pr merge <DOC-PR-URL> --auto --merge`
- [ ] Monitor the doc PR until merged (same loop as implementation PR)
- [ ] Prune merged local branches: `git fetch --prune` and `git branch -d feat/combat-page-test-coverage doc/archive-YYYY-MM-DD-combat-page-test-coverage`
