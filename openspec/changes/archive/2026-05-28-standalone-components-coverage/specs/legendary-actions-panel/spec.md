## ADDED Requirements

This document details *changes* to requirements and is additive to the `design.md` document, not a replacement.

### Requirement: ADDED LegendaryActionsPanel renders remaining count

The system SHALL display the remaining legendary action count from props.

#### Scenario: Renders remaining count from props

- **Given** a combatant with `legendaryActionCount: 3`, `legendaryActionsRemaining: 2`, and a non-empty `legendaryActions` array
- **When** `LegendaryActionsPanel` renders
- **Then** the text "2 remaining" (or equivalent) is visible in the DOM

#### Scenario: Returns null when legendaryActions is empty

- **Given** a combatant with `legendaryActions: []`
- **When** `LegendaryActionsPanel` renders
- **Then** nothing is rendered (component returns null)

#### Scenario: Zero remaining displays zero state

- **Given** a combatant with `legendaryActionCount: 3`, `legendaryActionsRemaining: 0`
- **When** `LegendaryActionsPanel` renders
- **Then** the text "0 remaining" (or equivalent) is visible

### Requirement: ADDED Spend button decrements remaining count

The system SHALL call `onUpdate` with a decremented remaining count when the spend/use button is clicked.

#### Scenario: Spend decrements remaining

- **Given** a combatant with `legendaryActionCount: 3`, `legendaryActionsRemaining: 2`
- **When** the user clicks the spend/decrement button (⚡ or equivalent)
- **Then** `onUpdate` is called with a payload reflecting `legendaryActionsRemaining: 1`

#### Scenario: Spend button is disabled at zero remaining

- **Given** a combatant with `legendaryActionCount: 3`, `legendaryActionsRemaining: 0`
- **When** `LegendaryActionsPanel` renders
- **Then** the spend button is disabled and `onUpdate` is not called

### Requirement: ADDED Restore button resets to full count

The system SHALL call `onUpdate` with full remaining count when the "Restore All" button is clicked.

#### Scenario: Restore resets to max

- **Given** a combatant with `legendaryActionCount: 3`, `legendaryActionsRemaining: 1`
- **When** the user clicks "Restore All" (`data-testid="legendary-action-restore"`)
- **Then** `onUpdate` is called with a payload reflecting `legendaryActionsRemaining: 3`

## MODIFIED Requirements

None.

## REMOVED Requirements

None.

## Traceability

- Proposal element (LegendaryActionsPanel spend/reset) → Requirements above
- Design decision 3 (`userEvent.setup()`) → all interaction scenarios
- Requirements → Task T1 (LegendaryActionsPanel tests)

## Non-Functional Acceptance Criteria

### Requirement: Reliability

#### Scenario: Tests pass in jsdom CI environment

- **Given** the jsdom test environment
- **When** `npm run test:unit` runs
- **Then** all `LegendaryActionsPanel` tests pass
