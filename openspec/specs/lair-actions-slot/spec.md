## ADDED Requirements

This document details *changes* to requirements and is additive to the base design document ([design.md](../../changes/archive/2026-05-28-standalone-components-coverage/design.md)), not a replacement.

### Requirement: ADDED LairActionsSlot renders inactive pill

The system SHALL render a compact pill with the lair combatant's name and initiative when `isActive` is false.

#### Scenario: Inactive pill shows name and initiative

- **Given** a combatant with `name: "Ancient Dragon"`, `initiative: 5`, and `isActive: false`
- **When** `LairActionsSlot` renders
- **Then** the text "Ancient Dragon" is visible and "Init 5" (or equivalent) is visible

#### Scenario: Inactive pill does not show action buttons

- **Given** a combatant with `isActive: false`
- **When** `LairActionsSlot` renders
- **Then** no "Restore All" button is present in the DOM

### Requirement: ADDED LairActionsSlot renders active expanded panel

The system SHALL render the full lair action panel with spend and restore controls when `isActive` is true.

#### Scenario: Active panel shows combatant name

- **Given** a combatant with `name: "Ancient Dragon"`, `isActive: true`
- **When** `LairActionsSlot` renders
- **Then** the combatant name "Ancient Dragon" appears in the expanded panel

#### Scenario: Active panel shows Restore All button

- **Given** a combatant with `isActive: true` and at least one lair action
- **When** `LairActionsSlot` renders
- **Then** a button with `data-testid="lair-action-restore-all"` is present

### Requirement: ADDED Restore all charges calls onUpdate

The system SHALL call `onUpdate` with all lair action charges restored when "Restore All" is clicked.

#### Scenario: Restore all restores charges

- **Given** a combatant with `isActive: true` and a lair action with depleted charges
- **When** the user clicks the "Restore All" button
- **Then** `onUpdate` is called with all lair action charges at their maximum values

### Requirement: ADDED onNextTurn is callable from active panel

The system SHALL call `onNextTurn` when the appropriate next-turn control is activated in the active state.

> **Note:** Test coverage for this scenario was deferred from this change (T2 covers render and restore only). A future change should add the corresponding test case.

#### Scenario: Active panel exposes next turn trigger

- **Given** a combatant with `isActive: true` and an `onNextTurn` callback
- **When** the user interacts with the next-turn control
- **Then** `onNextTurn` is called

## MODIFIED Requirements

None.

## REMOVED Requirements

None.

## Traceability

- Proposal element (LairActionsSlot two render paths) → Requirements above
- Design decision 6 (separate describes per `isActive`) → all scenarios
- Design decision 3 (`userEvent.setup()`) → all interaction scenarios
- Requirements → Task T2 (LairActionsSlot tests)

## Non-Functional Acceptance Criteria

### Requirement: Reliability

#### Scenario: Tests pass in jsdom CI environment

- **Given** the jsdom test environment
- **When** `npm run test:unit` runs
- **Then** all `LairActionsSlot` tests pass
