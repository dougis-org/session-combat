## ADDED Requirements

This document details *changes* to requirements and is additive to the `design.md` document, not a replacement.

### Requirement: ADDED CombatSetupView renders setup combatant list

The system SHALL render the list of combatants in `setupCombatants` when the array is non-empty.

#### Scenario: Setup combatant names appear in the rendered output

- **Given** `useCombat` is mocked to return `setupCombatants` with two entries
- **When** `CombatSetupView` is rendered
- **Then** both combatant names are visible in the document

#### Scenario: Empty setupCombatants renders an empty list

- **Given** `useCombat` is mocked with `setupCombatants: []`
- **When** `CombatSetupView` is rendered
- **Then** no combatant name elements are present in the setup list

---

### Requirement: ADDED Start combat button dispatches startCombatWithSetupCombatants callback

The system SHALL call `startCombatWithSetupCombatants()` when the user clicks the "Start Combat" button.

#### Scenario: Clicking start combat invokes the callback

- **Given** `CombatSetupView` is rendered with a mocked `startCombatWithSetupCombatants` jest.fn()
- **When** the user clicks the "Start Combat" button
- **Then** the `startCombatWithSetupCombatants` mock is called exactly once

---

### Requirement: ADDED Add combatant button opens QuickCombatantModal

The system SHALL call `setShowCombatantModal(true)` when the user clicks the "Add Combatant" button.

#### Scenario: Clicking add combatant calls setShowCombatantModal with true

- **Given** `CombatSetupView` is rendered with a mocked `setShowCombatantModal` jest.fn()
- **When** the user clicks the "Add Combatant" button
- **Then** `setShowCombatantModal` is called with `true`

#### Scenario: QuickCombatantModal is visible when showCombatantModal is true

- **Given** `useCombat` is mocked with `showCombatantModal: true`
- **When** `CombatSetupView` is rendered
- **Then** the `QuickCombatantModal` is present in the document

---

### Requirement: ADDED Remove from setup calls removeCombatantFromSetup

The system SHALL call `removeCombatantFromSetup()` with the correct ID when the user removes a combatant from the setup list.

#### Scenario: Remove button calls the callback with the combatant ID

- **Given** `CombatSetupView` is rendered with one setup combatant and a mocked `removeCombatantFromSetup` jest.fn()
- **When** the user clicks the remove button for that combatant
- **Then** `removeCombatantFromSetup` is called with the combatant's ID

## MODIFIED Requirements

None. This is a new test file — no existing requirements are modified.

## REMOVED Requirements

None.

## Traceability

- Proposal element: CombatSetupView 0% coverage → Requirements: render, start combat, add modal, remove from setup
- Design decision 1 (tests/unit/components/) → all requirements in this file
- Design decision 3 (mock at module boundary) → all scenario Given clauses
- Requirements → Task: "Create tests/unit/components/CombatSetupView.test.tsx" in tasks.md

## Non-Functional Acceptance Criteria

### Requirement: Reliability

#### Scenario: Tests pass consistently in CI

- **Given** the test suite runs in a clean jsdom environment with no real network or timer dependencies
- **When** `npm test` executes `CombatSetupView.test.tsx`
- **Then** all tests pass on every run without flakiness
