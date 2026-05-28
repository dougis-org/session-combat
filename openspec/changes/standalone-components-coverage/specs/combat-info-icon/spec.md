## ADDED Requirements

This document details *changes* to requirements and is additive to the `design.md` document, not a replacement.

### Requirement: ADDED CombatInfoIcon renders an icon button

The system SHALL render a clickable icon element when given a combatants array.

#### Scenario: Icon renders with combatants

- **Given** `CombatInfoIcon` receives a non-empty `combatants` array
- **When** the component renders
- **Then** a button or interactive element is present in the DOM

### Requirement: ADDED Tooltip is hidden by default

The system SHALL not show the info tooltip/panel on initial render.

#### Scenario: Tooltip hidden on mount

- **Given** `CombatInfoIcon` renders with a combatants array
- **When** no interaction has occurred
- **Then** the combatant detail panel (tooltip) is not visible in the DOM

### Requirement: ADDED Clicking the icon shows the tooltip

The system SHALL show the combatant info panel when the icon is clicked.

#### Scenario: Click shows tooltip

- **Given** `CombatInfoIcon` renders with a combatants array and the tooltip is hidden
- **When** the user clicks the icon
- **Then** the combatant info panel becomes visible in the DOM

### Requirement: ADDED Clicking again hides the tooltip

The system SHALL hide the combatant info panel when the icon is clicked a second time.

#### Scenario: Second click hides tooltip

- **Given** the tooltip is currently visible
- **When** the user clicks the icon again
- **Then** the combatant info panel is no longer visible in the DOM

### Requirement: ADDED Combatant names appear in the expanded panel

The system SHALL render combatant names from the provided array in the info panel when visible.

#### Scenario: Player combatant name shown in panel

- **Given** `CombatInfoIcon` receives `combatants: [{ name: 'Elara', type: 'player', hp: 20, ... }]`
- **When** the user clicks the icon to show the panel
- **Then** "Elara" is visible in the DOM

#### Scenario: Monster combatant name shown in panel

- **Given** `CombatInfoIcon` receives a monster combatant with `name: 'Goblin'` and `hp: 5`
- **When** the user clicks the icon to show the panel
- **Then** "Goblin" is visible in the DOM

#### Scenario: Dead combatant (hp <= 0) grouped separately

- **Given** `CombatInfoIcon` receives a combatant with `hp: 0`
- **When** the user clicks the icon to show the panel
- **Then** the combatant appears in the dead/fallen section of the panel

## MODIFIED Requirements

None.

## REMOVED Requirements

None.

## Traceability

- Proposal element (CombatInfoIcon tooltip toggle + rendered fixture output) → Requirements above
- Design decision 5 (toggle + fixture render, role/text queries) → all scenarios
- Design decision 3 (`userEvent.setup()`) → all interaction scenarios
- Requirements → Task T4 (CombatInfoIcon tests)

## Non-Functional Acceptance Criteria

### Requirement: Reliability

#### Scenario: Tests pass without data-testid on tooltip container

- **Given** the tooltip container has no `data-testid`
- **When** tests query by role or text content
- **Then** RTL finds the elements correctly without production code changes
