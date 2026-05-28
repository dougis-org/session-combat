## ADDED Requirements

This document details *changes* to requirements and is additive to the `design.md` document, not a replacement.

### Requirement: ADDED Normal damage reduces HP by full amount

The system SHALL call `onUpdate` with `hp` reduced by the exact input value when no damage type modifier applies.

#### Scenario: Normal damage (no type selected)

- **Given** a combatant with `hp: 30`, `maxHp: 30`, no damage modifiers
- **When** the user types `10` in the HP input and clicks "Damage"
- **Then** `onUpdate` is called with `{ hp: 20 }` (and `tempHp: 0`)

### Requirement: ADDED Resistance halves damage (rounded down)

The system SHALL call `onUpdate` with `hp` reduced by `floor(damage / 2)` when the combatant has resistance to the selected damage type.

#### Scenario: Fire resistance — odd damage

- **Given** a combatant with `hp: 30`, `maxHp: 30`, `damageResistances: ['fire']`
- **When** the user types `10`, selects damage type "fire", and clicks "Damage"
- **Then** `onUpdate` is called with `{ hp: 25 }` (10 / 2 = 5 damage)

#### Scenario: Fire resistance — zero damage on minimal input

- **Given** a combatant with `hp: 30`, `damageResistances: ['fire']`
- **When** the user types `1`, selects "fire", and clicks "Damage"
- **Then** `onUpdate` is called with `{ hp: 30 }` (floor(1/2) = 0 damage)

### Requirement: ADDED Immunity prevents all damage

The system SHALL call `onUpdate` with unchanged `hp` when the combatant is immune to the selected damage type.

#### Scenario: Fire immunity — no HP change

- **Given** a combatant with `hp: 30`, `damageImmunities: ['fire']`
- **When** the user types `20`, selects "fire", and clicks "Damage"
- **Then** `onUpdate` is not called (or is called with `{ hp: 30, tempHp: 0 }` — no change)

### Requirement: ADDED Vulnerability doubles damage

The system SHALL call `onUpdate` with `hp` reduced by `damage * 2` when the combatant is vulnerable to the selected damage type.

#### Scenario: Fire vulnerability — damage doubled

- **Given** a combatant with `hp: 30`, `damageVulnerabilities: ['fire']`
- **When** the user types `5`, selects "fire", and clicks "Damage"
- **Then** `onUpdate` is called with `{ hp: 20 }` (5 * 2 = 10 damage)

#### Scenario: Vulnerability — HP floored at 0

- **Given** a combatant with `hp: 5`, `damageVulnerabilities: ['fire']`
- **When** the user types `10`, selects "fire", and clicks "Damage"
- **Then** `onUpdate` is called with `{ hp: 0 }` (would be -15, clamped to 0)

## MODIFIED Requirements

None.

## REMOVED Requirements

None.

## Traceability

- Proposal element (damage application: normal/resistance/immunity/vulnerability) → all requirements above
- Design decision 2 (userEvent interactions) → all requirements above
- Requirements → Task T2 (damage application tests)

## Non-Functional Acceptance Criteria

### Requirement: Reliability

#### Scenario: Damage type select is accessible

- **Given** the damage type `<select>` element
- **When** queried by `aria-label="Damage type (for resistance/immunity/vulnerability)"`
- **Then** RTL can find and interact with it via `userEvent.selectOptions`
