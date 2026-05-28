# Tasks

## Preparation

- [x] **Step 1 — Sync default branch:** `git checkout main` and `git pull --ff-only`
- [x] **Step 2 — Create and publish working branch:** `git checkout -b feat/combatant-card-hp-coverage` then immediately `git push -u origin feat/combatant-card-hp-coverage`

## Execution

### T1 — HP display tests

- [x] Create `tests/unit/components/CombatantCard.hp.test.tsx` with `@jest-environment jsdom` directive and RTL imports (`render`, `screen` from `@testing-library/react`, `userEvent` from `@testing-library/user-event`)
- [x] Define `BASE` fixture (same shape as existing test file) and a `renderCard(overrides)` helper using RTL `render`
- [x] Write test: full HP → `data-testid="health-bar"` has `style.width: "100%"`
- [x] Write test: half HP → width ≈ 50%
- [x] Write test: near-zero HP → width < 25%
- [x] Write test: `hp: 0` → `<h3>` heading contains `☠️`
- [x] Write test: `hp: 1` → `<h3>` heading does not contain `☠️`
- [x] Write test: `tempHp: 5` → `data-testid="temp-hp-bar"` is present
- [x] Write test: no tempHp → `data-testid="temp-hp-bar"` is absent
- [x] Run `npm run test:unit -- --testPathPattern=CombatantCard.hp` to confirm all pass

### T2 — Damage application tests

- [x] Write test: normal damage (no type) → `onUpdate` called with `{ hp: 20 }` (30 - 10)
- [x] Write test: fire resistance → `onUpdate` called with `{ hp: 25 }` (10 / 2 = 5 damage)
- [x] Write test: fire immunity → `onUpdate` called with unchanged HP (`{ hp: 30, tempHp: 0 }` — component always calls onUpdate even on no-op)
- [x] Write test: fire vulnerability → `onUpdate` called with `{ hp: 20 }` (5 * 2 = 10 damage)
- [x] Write test: vulnerability floors HP at 0 (no negative HP)
- [x] Run `npm run test:unit -- --testPathPattern=CombatantCard.hp` to confirm all pass

### T3 — Temp HP drain tests

- [x] Write test: damage ≤ tempHp → `onUpdate` called with `{ hp: 30, tempHp: 2 }` (3 damage into 5 temp)
- [x] Write test: damage > tempHp → `onUpdate` called with `{ hp: 27, tempHp: 0 }` (8 damage into 5 temp + 3 spill)
- [x] Write test: tempHp: 0 → all damage hits real HP → `{ hp: 20, tempHp: 0 }`
- [x] Run `npm run test:unit -- --testPathPattern=CombatantCard.hp` to confirm all pass

### T4 — Conditions tests

- [x] Write test: `conditions: [{ id: 'c1', name: 'Poisoned' }]` → button "Conditions (1)" is present
- [x] Write test: `conditions: []` → no "Conditions" button present
- [x] Write test: click "Conditions (1)" → "Poisoned" text appears in DOM
- [x] Write test: expand panel → click "Remove" → `onUpdate` called with `{ conditions: [] }`
- [x] Write test: two conditions → remove first → `onUpdate` called with array containing only second
- [x] Run `npm run test:unit -- --testPathPattern=CombatantCard.hp` to confirm all pass

### T5 — Coverage verification

- [x] Run `npm run test:unit -- --coverage --collectCoverageFrom='lib/components/CombatantCard.tsx' --testPathPattern=CombatantCard` and confirm branch coverage ≥ 65%
- [x] Confirm existing `CombatantCard.test.tsx` tests still pass (no regressions)

## Pre-Commit Code Review

- [ ] **Before every commit**, spawn a dedicated sub-agent to run the `openspec-review-code` skill. Review its report and apply fixes for duplication, complexity, and completeness before committing.

## Validation

- [x] Run `npm run test:unit` — all tests pass
- [x] Run `npx tsc --noEmit` — no type errors
- [x] Run `npm run build` — build succeeds
- [x] Branch coverage for `CombatantCard.tsx` ≥ 65% confirmed
- [x] All execution tasks marked complete

## Remote push validation

Verification requirements (all must pass before PR or pushing updates to a PR):

- **Unit tests** — `npm test`; all tests must pass
- **Type check** — `npx tsc --noEmit`; must succeed
- **Build** — `npm run build`; must succeed with no errors
- if **ANY** of the above fail, you **MUST** iterate and address the failure

## PR and Merge

- [x] Ensure the `openspec-review-code` sub-agent was run before the final commit
- [x] Commit all changes and push to `feat/combatant-card-hp-coverage`
- [x] Open PR from `feat/combatant-card-hp-coverage` to `main`. PR body must include `Closes #256`.
- [x] **IMMEDIATELY** enable auto-merge: `gh pr merge <PR-URL> --auto --merge` (NEVER use `--admin`)
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
- [ ] Verify `tests/unit/components/CombatantCard.hp.test.tsx` appears on main
- [ ] Mark all remaining tasks complete (`- [x]`)
- [ ] No doc changes required — test-only change
- [ ] Sync approved spec deltas: copy `openspec/changes/combatant-card-hp-coverage/specs/` contents into `openspec/specs/` (hp-display, damage-application, temp-hp, conditions capability specs)
- [ ] Archive the change: move `openspec/changes/combatant-card-hp-coverage/` to `openspec/changes/archive/YYYY-MM-DD-combatant-card-hp-coverage/` — stage both copy and deletion in a single atomic commit
- [ ] Confirm archive exists and original change dir is gone
- [ ] **Create a doc branch:** `git checkout -b doc/archive-YYYY-MM-DD-combatant-card-hp-coverage` then `git push -u origin doc/archive-YYYY-MM-DD-combatant-card-hp-coverage`
- [ ] Open PR from doc branch to `main` with title `docs: archive combatant-card-hp-coverage (YYYY-MM-DD)`
- [ ] **IMMEDIATELY** enable auto-merge on doc PR
- [ ] Monitor doc PR until merged (same loop as implementation PR)
- [ ] Prune merged local branches: `git fetch --prune` and `git branch -d feat/combatant-card-hp-coverage doc/archive-YYYY-MM-DD-combatant-card-hp-coverage`
