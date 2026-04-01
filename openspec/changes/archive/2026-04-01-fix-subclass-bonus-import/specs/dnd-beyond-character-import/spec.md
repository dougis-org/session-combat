## MODIFIED Requirements

### Requirement: Imported data must be normalized and validated before storage

The system SHALL validate imported D&D Beyond data against the local character
model before persistence, SHALL coerce unsupported imported values to safe local
defaults where possible, and SHALL reject imports that cannot be normalized into
valid local data.

The system SHALL correctly incorporate all D&D Beyond modifier contributions to
HP and AC during normalization, including subclass features and item bonuses
expressed via `hit-points-per-level`, `hit-points`, and `unarmored-armor-class`
modifier subtypes.

#### Scenario: Missing optional fields are defaulted safely

- **WHEN** the source character omits local optional fields or omits required
  combat values that have safe existing app defaults
- **THEN** the system applies those safe defaults during normalization
- **THEN** the persisted character remains valid for the existing character and
  combat UI flows

#### Scenario: Unsupported values are coerced and reported

- **WHEN** imported fields contain values outside the app's supported enums or
  shapes and a safe local default exists
- **THEN** the system coerces those fields to safe defaults during normalization
- **THEN** the system returns a warning summary describing the fields that were
  normalized for the user

#### Scenario: Unsupported required data causes import failure

- **WHEN** the source data is missing required identity or class information, or
  contains values that cannot be normalized into the local character model even
  after safe-default coercion is attempted
- **THEN** the system rejects the import
- **THEN** the system does not persist a partial character record

#### Scenario: Unarmored AC includes set-type unarmored-armor-class modifiers

- **WHEN** a character has no equipped armor and one or more modifiers with
  `subType === "unarmored-armor-class"` and `type === "set"`
- **THEN** the normalized AC uses the highest such `set` value as the unarmored
  base offset (added to the base of 10) before adding the DEX modifier
- **THEN** the resulting AC equals `10 + max(set values) + sum(bonus values) + DEX modifier`

#### Scenario: Unarmored AC includes bonus-type unarmored-armor-class modifiers

- **WHEN** a character has no equipped armor and one or more modifiers with
  `subType === "unarmored-armor-class"` and `type === "bonus"`
- **THEN** each such modifier's value is added to the unarmored AC
- **THEN** the bonus stacks with any `set`-type unarmored-armor-class modifier

#### Scenario: Unarmored AC combines set and bonus unarmored modifiers

- **WHEN** a character has both `set` and `bonus` `unarmored-armor-class`
  modifiers and no equipped armor
- **THEN** the system applies `10 + max(set values) + sum(bonus values) + DEX modifier`
- **THEN** no modifier contribution is double-counted or omitted

#### Scenario: Max HP includes per-level hit point bonus modifiers

- **WHEN** a character has one or more modifiers with
  `subType === "hit-points-per-level"` and no HP override is set
- **THEN** each such modifier's value is multiplied by total character level
  and added to max HP
- **THEN** the total reflects the full hit-points-per-level bonus across all
  modifier groups

#### Scenario: Max HP includes flat hit point bonus modifiers

- **WHEN** a character has one or more modifiers with `subType === "hit-points"`
  and no HP override is set
- **THEN** each such modifier's fixed or numeric value is added to max HP

#### Scenario: HP override still takes precedence over all modifiers

- **WHEN** a character has `overrideHitPoints` set and also has
  `hit-points-per-level` or `hit-points` modifiers
- **THEN** the normalized max HP equals `overrideHitPoints` exactly
- **THEN** modifier-derived HP bonuses are not applied

## ADDED Requirements

### Requirement: D&D Beyond modifier types are fully modeled

The system's internal `DndBeyondModifier` interface SHALL model the `"set"`
modifier type as a recognized value alongside `"bonus"` and `"set-base"`, so
that all modifier shapes returned by the D&D Beyond character service are typed
correctly.

#### Scenario: Set-type modifiers are recognized at the type level

- **WHEN** the D&D Beyond character service returns a modifier with
  `type === "set"` (e.g. for `unarmored-armor-class`)
- **THEN** the modifier is handled by normalization logic without requiring a
  type cast or falling through unhandled
