## Purpose
Define the type-safety guarantees for alignment fields across core domain entities.

## Requirements

### Requirement: Character alignment uses DnDAlignment
The system SHALL type `Character.alignment` as `DnDAlignment | undefined` rather than `string | undefined`.

#### Scenario: Invalid string assignment is rejected at compile time
- **GIVEN** `Character.alignment` is typed as `DnDAlignment`
- **WHEN** code attempts to assign an arbitrary string value
- **THEN** TypeScript reports a type error

### Requirement: MonsterTemplate alignment uses DnDAlignment
The system SHALL type `MonsterTemplate.alignment` as `DnDAlignment | undefined`.

#### Scenario: MonsterTemplate alignment accepts canonical values
- **GIVEN** a `MonsterTemplate`
- **WHEN** its alignment is assigned a canonical D&D alignment value
- **THEN** the assignment type-checks successfully

### Requirement: Monster alignment uses DnDAlignment
The system SHALL type `Monster.alignment` as `DnDAlignment | undefined`.

#### Scenario: D&D Beyond normalization remains compatible
- **GIVEN** `normalizeAlignment()` returns `DnDAlignment | undefined`
- **WHEN** its result is assigned to an entity alignment field
- **THEN** the code compiles without additional casts
