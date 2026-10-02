## ADDED Requirements

This document details *changes* to requirements and is additive to the [`design.md`](../../design.md) document, not a replacement.

### Requirement: ADDED Prompt to end combat when a side is finished

The system SHALL prompt the user to end combat when every monster is at 0 HP or less, or when every player is dead, and SHALL end combat without a further confirmation when the user accepts.

#### Scenario: Monsters defeated prompt

- **Given** an active combat with two monsters and one player
- **When** the last standing monster reaches `hp <= 0`
- **Then** an "End combat?" prompt is shown naming that all monsters are defeated

#### Scenario: Players-only combat does not prompt

- **Given** an active combat containing only players
- **When** the combat is displayed
- **Then** no end-combat prompt is shown

#### Scenario: TPK prompt

- **Given** an active combat where every player has `lifeState: 'dead'` and a monster is alive
- **When** the combatants are evaluated
- **Then** the end-combat prompt is shown

#### Scenario: Dying players do not trigger

- **Given** every player is at 0 HP with `lifeState: 'dying'` or `'stable'` and a monster is alive
- **When** the combatants are evaluated
- **Then** no end-combat prompt is shown

#### Scenario: Lair ignored

- **Given** all monsters are down and a `lair` combatant has `hp` above 0
- **When** the combatants are evaluated
- **Then** the monsters-defeated prompt is shown

#### Scenario: Confirm ends combat

- **Given** the prompt is open
- **When** the user chooses Yes
- **Then** `endCombat()` is called exactly once and the "End Combat?" confirm dialog is not shown

#### Scenario: Dismissal respected

- **Given** the user chose No on the prompt
- **When** combatant state changes but the condition still holds
- **Then** the prompt is not shown again

#### Scenario: Re-arm

- **Given** the user chose No and the condition later clears (e.g. a monster is added or revived)
- **When** the condition becomes true again
- **Then** the prompt is shown again

## MODIFIED Requirements

None.

## REMOVED Requirements

None.

## Traceability

- Proposal element -> Requirement: Derive suggestion, prompt once, Yes direct -> Prompt to end combat when a side is finished
- Design decision -> Requirement: Decisions 1-3 -> same requirement
- Requirement -> Task(s): Tasks 2-4 in `tasks.md`

## Non-Functional Acceptance Criteria

### Requirement: Operability

#### Scenario: Keyboard dismissal

- **Given** the prompt is open
- **When** the user presses Escape
- **Then** the prompt closes and counts as a No (see "Dismissal respected")
