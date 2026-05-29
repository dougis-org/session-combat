---
name: tests
description: Tests for the active-and-setup-view-integration-tests change
---

# Tests

## Overview

This document outlines the test cases for the `active-and-setup-view-integration-tests` change. All work follows a strict TDD process: write a failing test, write the minimum code to pass it, then refactor.

Since this change *is* the tests (no production code changes), the TDD cycle applies to the test file structure itself: write the test shell with a failing assertion, fill in the render/interaction, confirm green.

## Testing Steps

For each test case below:

1. **Write a failing test** — add the `it(...)` block with the assertion before wiring up mocks/interactions. Run; expect failure.
2. **Wire up the mock/interaction** — configure `makeUseCombat` override and RTL interaction. Run; expect pass.
3. **Refactor** — extract repeated setup into `beforeEach` or helpers as patterns emerge.

## Test Cases

### Task 1 — `tests/unit/components/ActiveCombatView.test.tsx`

Spec reference: `openspec/changes/active-and-setup-view-integration-tests/specs/active-combat-view.md`

- [x] **ACT-1** Renders combatant names from `getDisplayCombatants`
  - Scenario: "Combatant names appear in the rendered output"
  - Mock: `getDisplayCombatants` returns `[{ name: 'Goblin', ... }, { name: 'Orc', ... }]`
  - Assert: `screen.getByText('Goblin')` and `screen.getByText('Orc')` present

- [x] **ACT-2** Empty combatant list renders no combatant elements
  - Scenario: "No combatants renders an empty list"
  - Mock: `getDisplayCombatants` returns `[]`, `combatState: null`
  - Assert: no combatant name elements in document

- [x] **ACT-3** Clicking "Next Turn" calls `nextTurn()` exactly once
  - Scenario: "Clicking next turn invokes the callback"
  - Mock: `nextTurn: jest.fn()`
  - Interact: `await userEvent.click(screen.getByRole('button', { name: /next turn/i }))`
  - Assert: `expect(nextTurn).toHaveBeenCalledTimes(1)`

- [x] **ACT-4** Active combatant has a visual indicator
  - Scenario: "Active combatant has a distinguishing marker"
  - Mock: `combatState.currentTurnIndex = 0`, `getDisplayCombatants` returns one combatant
  - Assert: active combatant element has expected class or `aria-current` attribute

- [x] **ACT-5** Encounter description modal visible when `showEncounterDescription: true`
  - Scenario: "Modal is visible when showEncounterDescription is true"
  - Mock: `makeUseCombat({ showEncounterDescription: true })`
  - Assert: modal content element is in the document

- [x] **ACT-6** Encounter description modal absent when `showEncounterDescription: false`
  - Scenario: "Modal is not visible when showEncounterDescription is false"
  - Mock: `makeUseCombat({ showEncounterDescription: false })`
  - Assert: modal content element is not present or has `hidden` attribute

- [x] **ACT-7** Confirming remove calls `removeCombatant` with correct ID
  - Scenario: "Confirming removal calls the callback"
  - Mock: `removeConfirmId: 'c1'`, `removeCombatant: jest.fn()`
  - Interact: `await userEvent.click(screen.getByRole('button', { name: /confirm/i }))`
  - Assert: `expect(removeCombatant).toHaveBeenCalledWith('c1')`

---

### Task 2 — `tests/unit/components/CombatSetupView.test.tsx`

Spec reference: `openspec/changes/active-and-setup-view-integration-tests/specs/combat-setup-view.md`

- [x] **CSV-1** Renders setup combatant names from `setupCombatants`
  - Scenario: "Setup combatant names appear in the rendered output"
  - Mock: `setupCombatants: [{ name: 'Fighter', ... }, { name: 'Rogue', ... }]`
  - Assert: `screen.getByText('Fighter')` and `screen.getByText('Rogue')` present

- [x] **CSV-2** Empty `setupCombatants` renders no combatant elements
  - Scenario: "Empty setupCombatants renders an empty list"
  - Mock: `setupCombatants: []`
  - Assert: no combatant name elements in setup list

- [x] **CSV-3** Clicking "Start Combat" calls `startCombatWithSetupCombatants()` exactly once
  - Scenario: "Clicking start combat invokes the callback"
  - Mock: `startCombatWithSetupCombatants: jest.fn()`
  - Interact: `await userEvent.click(screen.getByRole('button', { name: /start combat/i }))`
  - Assert: `expect(startCombatWithSetupCombatants).toHaveBeenCalledTimes(1)`

- [x] **CSV-4** Clicking "Add Combatant" calls `setShowCombatantModal(true)`
  - Scenario: "Clicking add combatant calls setShowCombatantModal with true"
  - Mock: `setShowCombatantModal: jest.fn()`
  - Interact: click the add combatant button
  - Assert: `expect(setShowCombatantModal).toHaveBeenCalledWith(true)`

- [x] **CSV-5** `QuickCombatantModal` visible when `showCombatantModal: true`
  - Scenario: "QuickCombatantModal is visible when showCombatantModal is true"
  - Mock: `makeUseCombat({ showCombatantModal: true })`
  - Assert: modal element or its title is present in the document

- [x] **CSV-6** Remove button calls `removeCombatantFromSetup` with correct ID
  - Scenario: "Remove button calls the callback with the combatant ID"
  - Mock: `setupCombatants: [{ id: 's1', name: 'Fighter', ... }]`, `removeCombatantFromSetup: jest.fn()`
  - Interact: click the remove button for 'Fighter'
  - Assert: `expect(removeCombatantFromSetup).toHaveBeenCalledWith('s1')`

---

### Task 3 — Coverage verification (no new test code)

- [x] **COV-1** `ActiveCombatView.tsx` statement coverage ≥ 60% after ACT-1 through ACT-7 pass
- [x] **COV-2** `CombatSetupView.tsx` statement coverage ≥ 60% after CSV-1 through CSV-6 pass
