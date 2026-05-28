## ADDED Requirements

This document details *changes* to requirements and is additive to the `design.md` document, not a replacement.

### Requirement: ADDED HP bar width reflects hp/maxHp ratio

The system SHALL render `data-testid="health-bar"` with an inline `width` style proportional to `hp / (maxHp + tempHp)`.

#### Scenario: Full HP

- **Given** a combatant with `hp: 30`, `maxHp: 30`, no temp HP
- **When** `CombatantCard` renders
- **Then** the element with `data-testid="health-bar"` has `style.width` of `"100%"`

#### Scenario: Half HP

- **Given** a combatant with `hp: 15`, `maxHp: 30`, no temp HP
- **When** `CombatantCard` renders
- **Then** `data-testid="health-bar"` has `style.width` of approximately `"50%"`

#### Scenario: Near-zero HP (less than 25% threshold)

- **Given** a combatant with `hp: 5`, `maxHp: 30`, no temp HP
- **When** `CombatantCard` renders
- **Then** `data-testid="health-bar"` has `style.width` less than `"25%"`

### Requirement: ADDED Dead state indicator visible when hp ≤ 0

The system SHALL display a ☠️ emoji in the combatant name heading when `hp <= 0`.

#### Scenario: HP is zero — dead indicator shown

- **Given** a combatant with `hp: 0`, `maxHp: 30`
- **When** `CombatantCard` renders
- **Then** the `<h3>` heading contains the text `☠️`

#### Scenario: HP is positive — dead indicator absent

- **Given** a combatant with `hp: 1`, `maxHp: 30`
- **When** `CombatantCard` renders
- **Then** the `<h3>` heading does not contain `☠️`

### Requirement: ADDED Temp HP bar renders when tempHp > 0

The system SHALL render `data-testid="temp-hp-bar"` only when `tempHp > 0`.

#### Scenario: Temp HP present

- **Given** a combatant with `tempHp: 5`, `maxHp: 30`
- **When** `CombatantCard` renders
- **Then** an element with `data-testid="temp-hp-bar"` is present in the DOM

#### Scenario: No temp HP

- **Given** a combatant with no `tempHp` (or `tempHp: 0`)
- **When** `CombatantCard` renders
- **Then** no element with `data-testid="temp-hp-bar"` is present

## MODIFIED Requirements

None.

## REMOVED Requirements

None.

## Traceability

- Proposal element (HP bar width/color) → Requirement: HP bar width reflects hp/maxHp ratio
- Proposal element (dead state) → Requirement: Dead state indicator visible when hp ≤ 0
- Proposal element (temp HP bar) → Requirement: Temp HP bar renders when tempHp > 0
- Design decision 3 (inline style assertion) → HP bar width requirement
- Design decision 4 (emoji text content) → Dead state requirement
- Requirements → Task T1 (HP display tests)

## Non-Functional Acceptance Criteria

### Requirement: Reliability

#### Scenario: Tests pass in jsdom CI environment

- **Given** the jsdom test environment (Tailwind classes not applied)
- **When** `npm test` runs
- **Then** all HP display tests pass without relying on computed CSS color values
