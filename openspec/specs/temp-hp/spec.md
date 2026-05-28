## ADDED Requirements

This document details *changes* to requirements and is additive to the `design.md` document, not a replacement.

### Requirement: ADDED Damage drains temp HP before real HP

The system SHALL absorb damage into `tempHp` first, reducing `hp` only after `tempHp` reaches zero.

#### Scenario: Damage fully absorbed by temp HP

- **Given** a combatant with `hp: 30`, `maxHp: 30`, `tempHp: 5`
- **When** the user types `3` and clicks "Damage"
- **Then** `onUpdate` is called with `{ hp: 30, tempHp: 2 }` (temp absorbs all damage)

#### Scenario: Damage partially absorbed — spillover hits real HP

- **Given** a combatant with `hp: 30`, `maxHp: 30`, `tempHp: 5`
- **When** the user types `8` and clicks "Damage"
- **Then** `onUpdate` is called with `{ hp: 27, tempHp: 0 }` (5 absorbed, 3 spills to real HP)

#### Scenario: Zero temp HP — all damage hits real HP

- **Given** a combatant with `hp: 30`, `maxHp: 30`, `tempHp: 0` (or no tempHp field)
- **When** the user types `10` and clicks "Damage"
- **Then** `onUpdate` is called with `{ hp: 20, tempHp: 0 }`

## MODIFIED Requirements

None.

## REMOVED Requirements

None.

## Traceability

- Proposal element (temp HP drain mechanics) → all requirements above
- Design decision 2 (userEvent interactions) → all requirements above
- Requirements → Task T3 (temp HP tests)

## Non-Functional Acceptance Criteria

None — temp HP behavior is purely functional with no performance or security implications.
