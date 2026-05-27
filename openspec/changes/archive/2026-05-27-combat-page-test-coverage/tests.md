---
name: tests
description: Tests for the combat-page-test-coverage change
---

# Tests

## Overview

This document outlines the tests for the `combat-page-test-coverage` change. All work follows a strict TDD process: write failing test → implement → refactor.

Both test files ARE the deliverable of this change. The TDD flow applies to each test case within `combatPage.test.tsx`, verified against the component under test.

## Testing Steps

For each test case:

1. **Write the failing test** — write the test case in `tests/unit/combat/combatPage.test.tsx` with mocks in place. Run `npm test -- --testPathPattern=combatPage` and confirm it fails (component not yet driven to the right state).
2. **Make it pass** — confirm the mock wiring is correct and the assertion matches the component's actual output.
3. **Refactor** — extract any duplication into helpers; ensure `makeUseCombat` factory is used consistently.

## Test Cases

### Task 1 — Central `useCombat` mock factory (`tests/unit/fixtures/useCombat.ts`)

- [ ] **Factory compiles:** `npx tsc --noEmit` passes — no missing fields relative to `UseCombatReturn`
- [ ] **Default state fields:** `makeUseCombat()` returns `loading: false`, `error: null`, `combatState: null`, `encounters: []`, `characters: []`, `parties: []`, `setupCombatants: []`
- [ ] **Default action fields are stubs:** All action fields (e.g. `startCombat`, `nextTurn`, `updateCombatant`) are `jest.fn()` instances
- [ ] **Overrides merge correctly:** `makeUseCombat({ loading: true }).loading === true`, all other fields at defaults

### Task 2 — `combatPage.test.tsx` test cases

- [ ] **Loading state:** When `useCombat` returns `makeUseCombat({ loading: true })`, container text contains `"Loading combat data..."` and neither `"CombatSetupView"` nor `"ActiveCombatView"` is present
- [ ] **Setup view:** When `useCombat` returns `makeUseCombat({ loading: false, combatState: null })`, container text contains `"CombatSetupView"` and does not contain `"ActiveCombatView"`
- [ ] **Active view:** When `useCombat` returns `makeUseCombat({ loading: false, combatState: MOCK_COMBAT_STATE })`, container text contains `"ActiveCombatView"` and does not contain `"CombatSetupView"`

### Task 3 — Coverage threshold

- [ ] **≥80% statement coverage on `app/combat/page.tsx`:** Confirmed via `npm test -- --testPathPattern=combatPage --coverage --collectCoverageFrom='app/combat/page.tsx'`

## Traceability

| Test case | Task | Spec scenario |
|---|---|---|
| Factory compiles | Task 1 | TypeScript catches interface drift |
| Default state/action fields | Task 1 | Factory returns a fully-typed default object |
| Overrides merge correctly | Task 1 | Factory applies overrides |
| Loading state | Task 2 | Loading spinner renders |
| Setup view | Task 2 | Setup view renders when no active combat |
| Active view | Task 2 | Active combat view renders |
| ≥80% coverage | Task 3 | (acceptance criterion in issue #243) |
