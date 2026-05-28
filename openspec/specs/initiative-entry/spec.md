## ADDED Requirements

This document details *changes* to requirements and is additive to the `design.md` document, not a replacement.

### Requirement: ADDED Roll mode generates initiative and calls onSet

The system SHALL call `onSet` with a valid initiative roll object when the Roll button is clicked in roll mode.

#### Scenario: Roll mode — onSet called with valid total

- **Given** `InitiativeEntry` renders in default `roll` mode with a combatant that has a dex modifier
- **When** the user clicks the "Roll" button
- **Then** `onSet` is called with `{ roll, bonus, total, method: 'rolled' }` where `total` is within valid range

#### Scenario: Advantage toggle affects the roll label/state

- **Given** `InitiativeEntry` renders in roll mode
- **When** the user clicks the advantage toggle
- **Then** the advantage state is reflected in the UI (e.g., advantage indicator visible)

### Requirement: ADDED Dice mode validates input range 1–20

The system SHALL reject dice entry values outside 1–20 with an alert and not call `onSet`.

#### Scenario: Dice mode — valid roll calls onSet

- **Given** `InitiativeEntry` renders and the user switches to dice entry mode
- **When** the user types `12` in the dice roll input and confirms
- **Then** `onSet` is called with `{ roll: 12, bonus, total, method: 'manual' }`

#### Scenario: Dice mode — value below 1 shows alert

- **Given** `InitiativeEntry` in dice mode with `window.alert` spied on
- **When** the user types `0` and confirms
- **Then** `window.alert` is called and `onSet` is not called

#### Scenario: Dice mode — value above 20 shows alert

- **Given** `InitiativeEntry` in dice mode with `window.alert` spied on
- **When** the user types `21` and confirms
- **Then** `window.alert` is called and `onSet` is not called

### Requirement: ADDED Total mode sets initiative by direct value

The system SHALL call `onSet` with the entered total when the user submits in total mode.

#### Scenario: Total mode — direct value calls onSet

- **Given** `InitiativeEntry` renders and the user switches to total entry mode
- **When** the user types `15` and confirms
- **Then** `onSet` is called with a payload containing `total: 15` and `method: 'manual'`

### Requirement: ADDED Escape key closes when initiative already set

The system SHALL call `onClose` when the Escape key is pressed and the combatant already has an `initiativeRoll`.

#### Scenario: Escape closes when initiative exists

- **Given** `InitiativeEntry` renders with a combatant that has `initiativeRoll` set and an `onClose` handler
- **When** the user presses the Escape key
- **Then** `onClose` is called

#### Scenario: Escape does nothing when no initiative set

- **Given** `InitiativeEntry` renders with a combatant that has no `initiativeRoll` and an `onClose` handler
- **When** the user presses the Escape key
- **Then** `onClose` is not called

### Requirement: ADDED Dex modifier is reflected in the UI

The system SHALL display the dex initiative bonus from the combatant's ability scores.

#### Scenario: Positive dex modifier shown

- **Given** a combatant with `dexterity: 16` (modifier +3)
- **When** `InitiativeEntry` renders
- **Then** "+3" (or equivalent) is visible in the UI

#### Scenario: Negative dex modifier shown

- **Given** a combatant with `dexterity: 8` (modifier -1)
- **When** `InitiativeEntry` renders
- **Then** "-1" (or equivalent) is visible in the UI

## MODIFIED Requirements

None.

## REMOVED Requirements

None.

## Traceability

- Proposal element (InitiativeEntry integration-style, 3 modes) → Requirements above
- Design decision 4 (integration-style, separate describes per mode, `Math.random` range assertion, alert spy) → all scenarios
- Design decision 3 (`userEvent.setup()`) → all interaction scenarios
- Requirements → Task T3 (InitiativeEntry tests)

## Non-Functional Acceptance Criteria

### Requirement: Reliability

#### Scenario: Tests pass in jsdom CI environment with mocked alert

- **Given** `window.alert` is spied on and `Math.random` returns values in the valid d20 range
- **When** `npm test` runs
- **Then** all `InitiativeEntry` tests pass without throwing
