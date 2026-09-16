## ADDED Requirements

This document details *changes* to requirements and is additive to the [`design.md`](../../design.md) document, not a replacement.

### Requirement: ADDED Monster combat cards expose a quick d20 roll button

The system SHALL render a quick-roll button, using the same d20 icon as the global dice tool, inside the `quick-rolls` section of a combatant card WHEN the combatant's type is `monster`.

#### Scenario: Monster card renders the quick-roll button

- **Given** a combat card is rendered for a combatant with `type: 'monster'`
- **When** the card mounts
- **Then** the `quick-rolls` section of that card contains a button with an accessible name identifying it as a d20/attack roll control, displaying the same icon as the global dice tool's trigger

#### Scenario: Non-monster combatant does not render the quick-roll button

- **Given** a combat card is rendered for a combatant with `type: 'player'`, and separately for a combatant with `type: 'lair'`
- **When** each card mounts
- **Then** the `quick-rolls` section of that card renders no quick-roll button

### Requirement: ADDED Quick roll produces an immediate, unmodified d20 result

The system SHALL roll exactly one twenty-sided die with no modifier WHEN the quick-roll button is activated, and SHALL display that result without attempting any roll animation.

#### Scenario: Quick roll shows an immediate unmodified d20 result

- **Given** a monster combat card with its quick-roll button visible
- **When** the DM clicks the button
- **Then** exactly one d20 value is rolled, the result modal appears immediately (no animation/tumble is attempted), and the displayed formula and total reflect an unmodified `1d20` roll equal to the rolled value

#### Scenario: Quick roll does not affect other card state

- **Given** a monster combat card with existing HP, condition, targeting, and death-save state
- **When** the DM activates the quick-roll button and dismisses the resulting modal
- **Then** the combatant's HP, conditions, targeting selections, and death-save state are unchanged from before the roll

### Requirement: ADDED Quick roll is local and ephemeral

The system SHALL NOT submit the quick roll to session chat, the rolls API, or any persisted roll history.

#### Scenario: Quick roll is never submitted or persisted

- **Given** a monster combat card, with or without an active session/campaign presence
- **When** the DM activates the quick-roll button
- **Then** no network request is made and no session-chat roll submission occurs as a result of that click

### Requirement: ADDED Repeated quick rolls show only the latest result

The system SHALL replace, rather than stack, the displayed roll result WHEN the quick-roll button is activated again while a prior result is still shown.

#### Scenario: Repeated quick rolls replace rather than stack

- **Given** a monster combat card whose quick-roll button was just activated and its result modal is showing
- **When** the DM activates the quick-roll button again before dismissing the modal
- **Then** exactly one result modal is present afterward, showing only the second roll's value

## Traceability

- Proposal element: "Reuse existing dice primitives... rather than introducing new roll/display mechanisms" -> Requirement: ADDED Monster combat cards expose a quick d20 roll button; ADDED Quick roll produces an immediate, unmodified d20 result
- Proposal element: "Must not persist or share this roll" -> Requirement: ADDED Quick roll is local and ephemeral
- Proposal element: "Monster" means `CombatantState.type === 'monster'` -> Requirement: ADDED Monster combat cards expose a quick d20 roll button
- Proposal element: "Rapid repeated clicks on the same card's button" edge case -> Requirement: ADDED Repeated quick rolls show only the latest result
- Design decision: Decision 1 (gate on `combatant.type === 'monster'`) -> Requirement: ADDED Monster combat cards expose a quick d20 roll button
- Design decision: Decisions 2 & 3 (rollDie + hand-built BuiltRoll + disableAnimation overlay) -> Requirement: ADDED Quick roll produces an immediate, unmodified d20 result; ADDED Quick roll is local and ephemeral
- Design decision: Decision 4 (single replaced state slot) -> Requirement: ADDED Repeated quick rolls show only the latest result
- Requirement: ADDED Monster combat cards expose a quick d20 roll button -> Task(s): implement button + gating, add rendering tests
- Requirement: ADDED Quick roll produces an immediate, unmodified d20 result -> Task(s): implement roll handler + BuiltRoll construction + overlay wiring, add roll-behavior tests
- Requirement: ADDED Quick roll is local and ephemeral -> Task(s): verify no shared-submission import/usage, add non-submission test
- Requirement: ADDED Repeated quick rolls show only the latest result -> Task(s): implement single-slot replace state, add repeated-click test

## Non-Functional Acceptance Criteria

> NFAC scenarios below do not duplicate the functional scenarios above; access-control style behavior (monster-only rendering) is already fully covered by "Scenario: Non-monster combatant does not render the quick-roll button" and is not repeated here.

### Requirement: Performance

#### Scenario: No animation load is incurred

- **Given** a monster combat card
- **When** the quick-roll button is activated
- **Then** no dice animation engine, canvas, or related asset is imported, initialized, or mounted as part of showing the result

### Requirement: Security

See functional scenario: "Quick roll is never submitted or persisted" (covers the only access/trust-boundary concern for this change — no new network surface or write path is introduced).

### Requirement: Reliability

#### Scenario: Independent per-card roll state

- **Given** two monster combat cards rendered simultaneously in the same combat
- **When** the quick-roll button is activated on one card
- **Then** the other card's quick-roll state (visible/hidden result) is unaffected
