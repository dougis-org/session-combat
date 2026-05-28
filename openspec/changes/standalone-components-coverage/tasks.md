# Tasks

## Preparation

- [ ] **Step 1 — Sync default branch:** `git checkout main` and `git pull --ff-only`
- [ ] **Step 2 — Create and publish working branch:** `git checkout -b feat/standalone-components-coverage` then immediately `git push -u origin feat/standalone-components-coverage`

## Execution

### T1 — LegendaryActionsPanel tests

- [ ] Create `tests/unit/components/LegendaryActionsPanel.test.tsx` with `@jest-environment jsdom` directive
- [ ] Add `jest.mock` for `next/link` and `next/navigation` before imports (follow PR 272 pattern exactly)
- [ ] Import `React`, `render`, `screen` from `@testing-library/react`, `userEvent` from `@testing-library/user-event`, `LegendaryActionsPanel` from `@/lib/components/LegendaryActionsPanel`
- [ ] Define `BASE_COMBATANT` fixture with `legendaryActions: [{ name: 'Claw', cost: 1, description: '' }]`, `legendaryActionCount: 3`, `legendaryActionsRemaining: 2`
- [ ] Define `renderPanel(overrides)` helper using RTL `render`
- [ ] Add `beforeEach(() => localStorage.clear())`
- [ ] Write test: renders remaining count text with `legendaryActionsRemaining: 2`
- [ ] Write test: returns null when `legendaryActions: []`
- [ ] Write test: shows zero state when `legendaryActionsRemaining: 0`
- [ ] Write test: spend button click calls `onUpdate` with decremented remaining
- [ ] Write test: "Restore All" button (`data-testid="legendary-action-restore"`) calls `onUpdate` with full count
- [ ] Run `npm run test:unit -- --testPathPattern=LegendaryActionsPanel` — confirm all pass

### T2 — LairActionsSlot tests

- [ ] Create `tests/unit/components/LairActionsSlot.test.tsx` with `@jest-environment jsdom` directive
- [ ] Add `jest.mock` for `next/link` and `next/navigation` before imports
- [ ] Import `React`, `render`, `screen` from `@testing-library/react`, `userEvent` from `@testing-library/user-event`, `LairActionsSlot` from `@/lib/components/LairActionsSlot`
- [ ] Define `BASE_COMBATANT` fixture with at least one `lairActions` entry with charges
- [ ] Define `renderSlot(overrides, props)` helper using RTL `render`
- [ ] Add `beforeEach(() => localStorage.clear())`
- [ ] Write test: inactive pill renders combatant name (`isActive: false`)
- [ ] Write test: inactive pill renders initiative (`isActive: false`)
- [ ] Write test: inactive pill has no "Restore All" button
- [ ] Write test: active panel renders combatant name (`isActive: true`)
- [ ] Write test: active panel has `data-testid="lair-action-restore-all"` button
- [ ] Write test: clicking "Restore All" calls `onUpdate` with restored charges
- [ ] Run `npm run test:unit -- --testPathPattern=LairActionsSlot` — confirm all pass

### T3 — InitiativeEntry tests

- [ ] Create `tests/unit/components/InitiativeEntry.test.tsx` with `@jest-environment jsdom` directive
- [ ] Add `jest.mock` for `next/link` and `next/navigation` before imports
- [ ] Import `React`, `render`, `screen` from `@testing-library/react`, `userEvent` from `@testing-library/user-event`, `InitiativeEntry` from `@/lib/components/InitiativeEntry`
- [ ] Define `BASE_COMBATANT` fixture with full `abilityScores` (dexterity: 14 for +2 modifier)
- [ ] Define `renderEntry(overrides, onSet, onClose)` helper using RTL `render`
- [ ] Add `beforeEach(() => localStorage.clear())`
- [ ] Add `beforeEach(() => jest.spyOn(window, 'alert').mockImplementation(() => {}))` and `afterEach(() => jest.restoreAllMocks())`
- [ ] Write test (roll mode): clicking Roll calls `onSet` with `{ roll, bonus, total, method: 'rolled' }` where `total` is in valid range
- [ ] Write test (roll mode): dex modifier "+2" is visible in UI
- [ ] Write test (roll mode): advantage toggle changes UI state
- [ ] Write test (dice mode): entering valid value (12) and confirming calls `onSet` with `roll: 12`
- [ ] Write test (dice mode): value `0` triggers `window.alert` and `onSet` not called
- [ ] Write test (dice mode): value `21` triggers `window.alert` and `onSet` not called
- [ ] Write test (total mode): entering `15` and confirming calls `onSet` with `total: 15`
- [ ] Write test (escape): Escape key calls `onClose` when `initiativeRoll` is already set
- [ ] Write test (escape): Escape key does NOT call `onClose` when no `initiativeRoll`
- [ ] Write test (dex display): negative modifier (dexterity: 8) shows "-1"
- [ ] Run `npm run test:unit -- --testPathPattern=InitiativeEntry` — confirm all pass

### T4 — CombatInfoIcon tests

- [ ] Create `tests/unit/components/CombatInfoIcon.test.tsx` with `@jest-environment jsdom` directive
- [ ] Add `jest.mock` for `next/link` and `next/navigation` before imports
- [ ] Import `React`, `render`, `screen` from `@testing-library/react`, `userEvent` from `@testing-library/user-event`, `CombatInfoIcon` from `@/lib/components/CombatInfoIcon`
- [ ] Define `ALIVE_PLAYER` and `DEAD_MONSTER` fixture combatants with `{ id, name, type, hp, ... }` shapes
- [ ] Define `renderIcon(combatants)` helper using RTL `render`
- [ ] Add `beforeEach(() => localStorage.clear())`
- [ ] Write test: icon/button element is present on mount
- [ ] Write test: tooltip panel is NOT in DOM before any click
- [ ] Write test: clicking icon shows tooltip panel
- [ ] Write test: clicking icon twice hides tooltip panel again
- [ ] Write test: after click, alive player's name is visible in panel
- [ ] Write test: after click, monster name is visible in panel
- [ ] Write test: dead combatant (hp: 0) appears in fallen/dead section of panel
- [ ] Run `npm run test:unit -- --testPathPattern=CombatInfoIcon` — confirm all pass

### T5 — Modal tests

- [ ] Create `tests/unit/components/Modal.test.tsx` with `@jest-environment jsdom` directive
- [ ] Add `jest.mock` for `next/link` and `next/navigation` before imports
- [ ] Import `React`, `render`, `screen` from `@testing-library/react`, `userEvent` from `@testing-library/user-event`, `Modal` from `@/lib/components/Modal`
- [ ] Add `beforeEach(() => localStorage.clear())`
- [ ] Write test: children rendered when `isOpen: true`
- [ ] Write test: title visible when `title` prop provided and `isOpen: true`
- [ ] Write test: close button click calls `onClose` once
- [ ] Write test: content NOT in DOM when `isOpen: false`
- [ ] Run `npm run test:unit -- --testPathPattern=Modal` — confirm all pass

### T6 — Coverage gate

- [ ] Run `npm run test:unit -- --coverage --collectCoverageFrom='lib/components/{LegendaryActionsPanel,LairActionsSlot,InitiativeEntry,CombatInfoIcon,Modal}.tsx'` and confirm each component reaches ≥80% statement coverage
- [ ] Confirm all pre-existing tests still pass (no regressions): `npm run test:unit`

## Pre-Commit Code Review

- [ ] **Before every commit**, spawn a dedicated sub-agent to run the `openspec-review-code` skill. Review its report and apply fixes for duplication, complexity, and completeness before committing.

## Validation

- [ ] Run `npm run test:unit` — all tests pass
- [ ] Run `npx tsc --noEmit` — no type errors
- [ ] Run `npm run build` — build succeeds
- [ ] ≥80% statement coverage confirmed for all 5 components
- [ ] All execution tasks marked complete

## Remote push validation

Verification requirements (all must pass before PR or pushing updates to a PR):

- **Unit tests** — `npm test`; all tests must pass
- **Type check** — `npx tsc --noEmit`; must succeed
- **Build** — `npm run build`; must succeed with no errors
- if **ANY** of the above fail, you **MUST** iterate and address the failure

## PR and Merge

- [ ] Ensure the `openspec-review-code` sub-agent was run before the final commit
- [ ] Commit all changes and push to `feat/standalone-components-coverage`
- [ ] Open PR from `feat/standalone-components-coverage` to `main`. PR body must include `Closes #257`.
- [ ] **IMMEDIATELY** enable auto-merge: `gh pr merge <PR-URL> --auto --squash` (NEVER use `--admin`)
- [ ] Wait 180 seconds for CI to start and agentic reviewers to post comments
- [ ] **Monitor PR comments** — poll autonomously; address, commit fixes, follow remote push validation, push, wait 180s, repeat until no unresolved comments
- [ ] **Monitor CI checks** — `gh pr checks <PR-URL> --json isRequired,state`; fix any required failures, commit, validate, push, wait 180s, repeat
- [ ] **Poll for merge** — `gh pr view <PR-URL> --json state`; when `MERGED` proceed to Post-Merge; if `CLOSED` notify user

Ownership metadata:

- Implementer: dougis
- Reviewer(s): automated CI + agentic reviewers
- Required approvals: 1

Blocking resolution flow:

- CI failure → diagnose → fix → commit → validate locally → push → re-run checks
- Review comment → address → commit → validate locally → push → confirm thread resolved

## Post-Merge

- [ ] `git checkout main` and `git pull --ff-only`
- [ ] Verify new test files appear on main
- [ ] Mark all remaining tasks complete (`- [x]`)
- [ ] No doc changes required — test-only change
- [ ] Sync approved spec deltas: copy `openspec/changes/standalone-components-coverage/specs/` contents into `openspec/specs/` (legendary-actions-panel, lair-actions-slot, initiative-entry, combat-info-icon, modal capability specs)
- [ ] Archive the change: move `openspec/changes/standalone-components-coverage/` to `openspec/changes/archive/YYYY-MM-DD-standalone-components-coverage/` — stage both copy and deletion in a single atomic commit
- [ ] Confirm archive exists and original change dir is gone
- [ ] **Create a doc branch:** `git checkout -b doc/archive-YYYY-MM-DD-standalone-components-coverage` then `git push -u origin doc/archive-YYYY-MM-DD-standalone-components-coverage`
- [ ] Open PR from doc branch to `main` with title `docs: archive standalone-components-coverage (YYYY-MM-DD)`
- [ ] **IMMEDIATELY** enable auto-merge on doc PR: `gh pr merge <DOC-PR-URL> --auto --squash`
- [ ] Monitor doc PR until merged (same loop as implementation PR)
- [ ] Prune merged local branches: `git fetch --prune` and `git branch -d feat/standalone-components-coverage doc/archive-YYYY-MM-DD-standalone-components-coverage`
