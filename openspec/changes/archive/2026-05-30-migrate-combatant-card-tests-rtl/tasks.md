# Tasks

## Preparation

- [x] **Step 1 — Sync default branch:** `git checkout main` and `git pull --ff-only`
- [x] **Step 2 — Create and publish working branch:** `git checkout -b refactor/migrate-combatant-card-tests-rtl` then immediately `git push -u origin refactor/migrate-combatant-card-tests-rtl`

## Execution

### E1 — Create shared test helpers

- [x] Create `tests/unit/components/CombatantCard.test-helpers.ts` exporting:
  - `BASE: CombatantState` fixture (identical to the one in `CombatantCard.test.tsx` and `CombatantCard.hp.test.tsx`)
  - `renderCard(overrides, onUpdate, extra)` using RTL `render` — match the signature already in `CombatantCard.hp.test.tsx`
- [x] Verify: `npx tsc --noEmit` passes with no errors on the new file

### E2 — Update CombatantCard.hp.test.tsx

- [x] Replace the local `BASE` fixture and `renderCard` function with imports from `CombatantCard.test-helpers.ts`
- [x] Append the 6 Undo HP tests from `CombatantCard.test.tsx` (the `CombatantCard – Undo HP button` describe block), converted to RTL:
  - `act(() => { findButton(...).click() })` → `await user.click(screen.getByRole(...))` using `userEvent.setup()`
  - `setHpInput(value)` helper → `await user.clear(input); await user.type(input, value)` via userEvent
  - `container.querySelector('[data-testid="undo-hp-change"]')` → `screen.getByTestId('undo-hp-change')`
- [x] Verify: `jest tests/unit/components/CombatantCard.hp.test.tsx` — all tests pass

### E3 — Create CombatantCard.badges.test.tsx

- [x] Create `tests/unit/components/CombatantCard.badges.test.tsx` with:
  - `jest.mock` blocks for `next/link` and `next/navigation` (must be at top, before imports)
  - RTL imports: `render`, `screen` from `@testing-library/react`
  - Import `BASE` and `renderCard` from `./CombatantCard.test-helpers`
  - Migrate `CombatantCard – stat damage modifier badges` describe block (9 tests):
    - `container.querySelector('h3')?.textContent` → `screen.getByRole('heading', { level: 3 })` or `screen.getByText`
    - `container.textContent` → `screen.getByText(...)` or `expect(screen.queryByText(...)).not.toBeInTheDocument()`
    - `container.querySelector('button[aria-label="..."]')` → `screen.getByRole('button', { name: /.../ })`
  - Migrate `CombatantCard – remove active effect` describe block (1 test)
- [x] Verify: `jest tests/unit/components/CombatantCard.badges.test.tsx` — all 10 tests pass

### E4 — Create CombatantCard.effects-panel.test.tsx

- [x] Create `tests/unit/components/CombatantCard.effects-panel.test.tsx` with:
  - `jest.mock` blocks for `next/link` and `next/navigation`
  - RTL imports: `render`, `screen` from `@testing-library/react`; `userEvent` from `@testing-library/user-event`
  - Import `BASE` and `renderCard` from `./CombatantCard.test-helpers`
  - Local helpers (file-scoped):
    - `renderWithModifiers(overrides, onUpdate)` — calls `renderCard` with `damageResistances: ['fire']`
    - `openPanel(overrides, onUpdate)` — calls `renderWithModifiers` then `await user.click(screen.getByRole('button', { name: /\+ Add effect/i }))`
  - Migrate `CombatantCard – effects panel toggle` describe block (4 tests)
  - Migrate `CombatantCard – preset application` describe block (9 tests):
    - `findButton(text)` → `screen.getByRole('button', { name: /text/i })`
    - `container.textContent` → `screen.getByText(...)` / `screen.queryByText(...)`
    - All interactions `async/await` with userEvent
- [x] Verify: `jest tests/unit/components/CombatantCard.effects-panel.test.tsx` — all 13 tests pass

### E5 — Create CombatantCard.callbacks.test.tsx

- [x] Create `tests/unit/components/CombatantCard.callbacks.test.tsx` with:
  - `jest.mock` blocks for `next/link` and `next/navigation`
  - RTL imports: `render`, `screen` from `@testing-library/react`; `userEvent` from `@testing-library/user-event`
  - Import `BASE` and `renderCard` from `./CombatantCard.test-helpers`
  - Migrate `CombatantCard – detail/remove callbacks` describe block (2 tests):
    - Use `renderCard({}, jest.fn(), { onShowDetails })` / `renderCard({}, jest.fn(), { onShowRemoveConfirm })` via the `extra` param
    - `container.querySelector('[data-testid="combatant-detail-toggle"]')` → `screen.getByTestId('combatant-detail-toggle')`
    - `container.querySelector('button[title="Remove combatant"]')` → `screen.getByRole('button', { name: /remove combatant/i })` or `screen.getByTitle('Remove combatant')`
  - Migrate `CombatantCard – damage type select` describe block (4 tests):
    - Native setter pattern for `<select>` → `await user.selectOptions(screen.getByLabelText(...), value)` via userEvent
    - Native setter pattern for `<input>` → `await user.clear(input); await user.type(input, value)`
- [x] Verify: `jest tests/unit/components/CombatantCard.callbacks.test.tsx` — all 6 tests pass

### E6 — Delete legacy file

- [x] Delete `tests/unit/components/CombatantCard.test.tsx`
- [x] Verify: `grep -r "createRoot" tests/unit/components/CombatantCard` — zero results
- [x] Verify: `grep -r "IS_REACT_ACT_ENVIRONMENT" tests/unit/components/CombatantCard` — zero results

## Pre-Commit Code Review

- [x] **Before every commit**, spawn a dedicated sub-agent to run the `openspec-review-code` skill. The primary agent must automatically address all findings from the sub-agent's report, applying fixes for complexity, duplication, and quality issues before committing.

## Validation

- [x] `npm run test:unit` — all tests pass
- [x] `npx tsc --noEmit` — no type errors
- [x] `jest tests/unit/components/CombatantCard.badges.test.tsx` — 10 tests pass
- [x] `jest tests/unit/components/CombatantCard.effects-panel.test.tsx` — 13 tests pass
- [x] `jest tests/unit/components/CombatantCard.callbacks.test.tsx` — 6 tests pass
- [x] `jest tests/unit/components/CombatantCard.hp.test.tsx` — all tests pass (including 6 new Undo HP)
- [x] `grep -r "createRoot" tests/unit/components/CombatantCard` — zero results
- [x] `npm run test:unit -- --coverage` — `CombatantCard.tsx` coverage equal or greater than pre-migration baseline
- [x] All completed tasks marked as complete

## Remote push validation

Verification requirements (all must pass before PR or pushing updates to a PR):

- **Unit tests** — `npm run test:unit` — all tests must pass
- **Build** — `npm run build` — build must succeed with no errors
- if **ANY** of the above fail, you **MUST** iterate and address the failure

## PR and Merge

- [x] Ensure the `openspec-review-code` sub-agent was run and all findings were automatically addressed before the final commit
- [x] Commit all changes to the working branch and push to remote
- [x] Open PR from `refactor/migrate-combatant-card-tests-rtl` to `main`. PR body must include `Closes #262`.
- [x] **IMMEDIATELY** enable auto-merge: `gh pr merge <PR-URL> --auto --squash` (NEVER use `--admin` to force the merge; ALWAYS use `--squash`)
- [x] Wait 180 seconds for CI to start and agentic reviewers to post their comments
- [x] **Monitor PR comments** — poll for new comments autonomously; when comments appear, address them, commit fixes, and explicitly ensure threads are resolved. Follow all steps in Remote push validation then push to the same working branch; wait 180 seconds then repeat until no unresolved comments remain
- [x] **Monitor CI checks** — poll for check status autonomously using `gh pr checks <PR-URL> --json isRequired,state`; when any required CI check fails, diagnose and fix, commit, follow Remote push validation, push, wait 180 seconds, repeat
- [x] **Poll for merge** — after each iteration run `gh pr view <PR-URL> --json state`; when `state` is `MERGED` proceed to Post-Merge; if `CLOSED` exit and notify the user

Ownership metadata:

- Implementer: dougis
- Reviewer(s): agentic CI reviewers
- Required approvals: 1

Blocking resolution flow:

- CI failure → fix → commit → validate locally → push → re-run checks
- Security finding → remediate → commit → validate locally → push → re-scan
- Review comment → address → commit → validate locally → push → confirm resolved

## Post-Merge

- [x] `git checkout main` and `git pull --ff-only`
- [x] Verify the merged changes appear on the default branch
- [x] Mark all remaining tasks as complete (`- [x]`)
- [x] Update repository documentation impacted by the change (update `.wolf/anatomy.md` for new/deleted test files)
- [x] Sync approved spec deltas into `openspec/specs/`
- [x] Archive the change: move `openspec/changes/migrate-combatant-card-tests-rtl/` to `openspec/changes/archive/YYYY-MM-DD-migrate-combatant-card-tests-rtl/` **in a single commit** — stage both the new location and deletion of the old location together
- [x] Confirm `openspec/changes/archive/YYYY-MM-DD-migrate-combatant-card-tests-rtl/` exists and `openspec/changes/migrate-combatant-card-tests-rtl/` is gone
- [x] **Create a doc branch**: `git checkout -b doc/archive-YYYY-MM-DD-migrate-combatant-card-tests-rtl` then `git push -u origin doc/archive-YYYY-MM-DD-migrate-combatant-card-tests-rtl`
- [x] Open a PR from the doc branch to `main` with title `docs: archive migrate-combatant-card-tests-rtl (YYYY-MM-DD)`
- [x] **IMMEDIATELY** enable auto-merge on the doc PR: `gh pr merge <DOC-PR-URL> --auto --squash`
- [ ] Monitor the doc PR until it merges (same loop — address comments and CI failures, push to doc branch, repeat)
- [ ] Prune merged local branches: `git fetch --prune` and `git branch -d refactor/migrate-combatant-card-tests-rtl doc/archive-YYYY-MM-DD-migrate-combatant-card-tests-rtl`
