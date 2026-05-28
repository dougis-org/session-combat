## ADDED Requirements

This document details *changes* to requirements and is additive to the `design.md` document, not a replacement.

### Requirement: ADDED Active conditions display with count

The system SHALL render a button showing the condition count when the combatant has at least one condition.

#### Scenario: Conditions button shows count

- **Given** a combatant with `conditions: [{ id: 'c1', name: 'Poisoned' }]`
- **When** `CombatantCard` renders
- **Then** a button with text matching `"Conditions (1)"` is visible

#### Scenario: No conditions — conditions button absent

- **Given** a combatant with `conditions: []`
- **When** `CombatantCard` renders
- **Then** no button matching `"Conditions"` is present

### Requirement: ADDED Condition list expands on click

The system SHALL toggle a condition list panel when the conditions count button is clicked.

#### Scenario: Expand condition list

- **Given** a combatant with one condition and the conditions panel collapsed
- **When** the user clicks the "Conditions (1)" button
- **Then** the condition name (e.g., "Poisoned") is visible in the DOM

### Requirement: ADDED Removing a condition calls onUpdate with filtered array

The system SHALL call `onUpdate` with a `conditions` array that excludes the removed condition when the user clicks "Remove" on a condition.

#### Scenario: Remove the only condition

- **Given** a combatant with `conditions: [{ id: 'c1', name: 'Poisoned' }]` and the panel expanded
- **When** the user clicks the "Remove" button next to "Poisoned"
- **Then** `onUpdate` is called with `{ conditions: [] }`

#### Scenario: Remove one of multiple conditions

- **Given** a combatant with two conditions (`Poisoned`, `Blinded`) and the panel expanded
- **When** the user clicks "Remove" next to "Poisoned"
- **Then** `onUpdate` is called with `{ conditions: [{ id: 'c2', name: 'Blinded', ... }] }`

## MODIFIED Requirements

None.

## REMOVED Requirements

None.

## Traceability

- Proposal element (condition display and toggle) → all requirements above
- Design decision 5 (text + button queries) → all requirements above
- Requirements → Task T4 (conditions tests)

## Non-Functional Acceptance Criteria

### Requirement: Reliability

#### Scenario: Condition queries work without data-testid

- **Given** condition elements have no `data-testid` attributes
- **When** tests query by role and text content
- **Then** RTL finds the elements correctly without production code changes
