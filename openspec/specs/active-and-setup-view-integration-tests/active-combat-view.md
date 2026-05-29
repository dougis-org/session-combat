## ADDED Requirements

This document details *changes* to requirements and is additive to the `design.md` document, not a replacement.

### Requirement: ADDED ActiveCombatView renders combatant list

The system SHALL render the list of combatants returned by `getDisplayCombatants()` when `combatState` is populated.

#### Scenario: Combatant names appear in the rendered output

- **Given** `useCombat` is mocked to return a `combatState` with two combatants and `getDisplayCombatants` returns those combatants
- **When** `ActiveCombatView` is rendered
- **Then** both combatant names are visible in the document

#### Scenario: No combatants renders an empty list

- **Given** `useCombat` is mocked with `combatState: null` and `getDisplayCombatants` returning `[]`
- **When** `ActiveCombatView` is rendered
- **Then** no combatant name elements are present

---

### Requirement: ADDED Next turn button dispatches nextTurn callback

The system SHALL call `nextTurn()` when the user clicks the "Next Turn" button.

#### Scenario: Clicking next turn invokes the callback

- **Given** `ActiveCombatView` is rendered with a mocked `nextTurn` jest.fn()
- **When** the user clicks the "Next Turn" button
- **Then** the `nextTurn` mock is called exactly once

---

### Requirement: ADDED Active combatant is visually distinguished

The system SHALL render the active combatant with a visual indicator distinguishing it from inactive combatants.

#### Scenario: Active combatant has a distinguishing marker

- **Given** `combatState` has `currentTurnIndex` pointing to combatant at index 0
- **When** `ActiveCombatView` is rendered
- **Then** the first combatant element has a CSS class or attribute indicating it is active

---

### Requirement: ADDED Encounter description modal is controlled by showEncounterDescription

The system SHALL render the encounter description modal when `showEncounterDescription` is `true` and hide it when `false`.

#### Scenario: Modal is visible when showEncounterDescription is true

- **Given** `useCombat` is mocked with `showEncounterDescription: true`
- **When** `ActiveCombatView` is rendered
- **Then** the encounter description modal content is visible in the document

#### Scenario: Modal is not visible when showEncounterDescription is false

- **Given** `useCombat` is mocked with `showEncounterDescription: false`
- **When** `ActiveCombatView` is rendered
- **Then** the encounter description modal content is not present or hidden

---

### Requirement: ADDED Remove combatant confirm flow triggers removeCombatant

The system SHALL call `removeCombatant()` when the user confirms the remove action.

#### Scenario: Confirming removal calls the callback

- **Given** `ActiveCombatView` is rendered with `removeConfirmId` set to a combatant ID and a mocked `removeCombatant`
- **When** the user clicks the confirm remove button
- **Then** `removeCombatant` is called with the expected combatant ID

## MODIFIED Requirements

None. This is a new test file — no existing requirements are modified.

## REMOVED Requirements

None.

## Traceability

- Proposal element: ActiveCombatView 0% coverage → Requirements: render, nextTurn, active highlight, modal, remove
- Design decision 1 (tests/unit/components/) → all requirements in this file
- Design decision 3 (mock at module boundary) → all scenario Given clauses
- Requirements → Task: "Create tests/unit/components/ActiveCombatView.test.tsx" in tasks.md

## Non-Functional Acceptance Criteria

### Requirement: Reliability

#### Scenario: Tests pass consistently in CI

- **Given** the test suite runs in a clean jsdom environment with no real network or timer dependencies
- **When** `npm test` executes `ActiveCombatView.test.tsx`
- **Then** all tests pass on every run without flakiness
