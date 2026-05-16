## ADDED Requirements

This document details *changes* to requirements and is additive to the `design.md` document, not a replacement.

### Requirement: ADDED dndBeyond-defenses module

The system SHALL provide `normalizeImmunities`, `normalizeByModifierType`, and `normalizeLanguages` as named exports from `lib/import/dndBeyond-defenses.ts`.

#### Scenario: Immunities are split by damage vs condition type

- **Given** a list of DnD Beyond modifier objects where some have `type === "immunity"` and subTypes that are damage types (e.g., `"fire"`) and others are condition types (e.g., `"charmed"`)
- **When** `normalizeImmunities(modifiers)` is called
- **Then** the result contains `damageImmunities` with titleized damage type labels and `conditionImmunities` with titleized condition labels, with no overlap

#### Scenario: Resistances and vulnerabilities are normalized by modifier type

- **Given** a list of DnD Beyond modifier objects including entries with `type === "resistance"` and `type === "vulnerability"`
- **When** `normalizeByModifierType(modifiers, "resistance")` and `normalizeByModifierType(modifiers, "vulnerability")` are called
- **Then** each returns a deduped array of titleized labels for the given type only

#### Scenario: Languages are extracted and deduplicated

- **Given** a list of DnD Beyond modifier objects including entries with `type === "language"` and varying `subType` or `friendlySubtypeName` values
- **When** `normalizeLanguages(modifiers)` is called
- **Then** the result is a deduped array of titleized language strings with no blanks

#### Scenario: friendlySubtypeName takes precedence over subType

- **Given** a modifier with both `friendlySubtypeName: "Bludgeoning"` and `subType: "bludgeoning"`
- **When** any of the three normalizers processes that modifier
- **Then** `"Bludgeoning"` is used (not a titleized version of `subType`)

## MODIFIED Requirements

### Requirement: MODIFIED dndBeyondCharacterImport no longer defines defenses normalizers locally

The system SHALL import `normalizeImmunities`, `normalizeByModifierType`, and `normalizeLanguages` from `lib/import/dndBeyond-defenses.ts` rather than defining them as local private functions.

#### Scenario: Character import behavior is unchanged

- **Given** a valid DnD Beyond character JSON with immunities, resistances, vulnerabilities, and languages
- **When** the full character import pipeline runs
- **Then** the resulting `Character` object has identical `damageImmunities`, `conditionImmunities`, `damageResistances`, `damageVulnerabilities`, and `languages` values as before the refactor

## REMOVED Requirements

### Requirement: REMOVED local definition of defenses normalizers in dndBeyondCharacterImport.ts

Reason for removal: Functions are now maintained in `lib/import/dndBeyond-defenses.ts`. The local definitions are replaced by an import.

## Traceability

- Proposal element "New file `lib/import/dndBeyond-defenses.ts`" → Requirement: ADDED dndBeyond-defenses module
- Proposal element "No import from main file" → Design decision 1 (local interface) → Requirement: ADDED dndBeyond-defenses module
- Design decision 3 (import path) → Requirement: MODIFIED dndBeyondCharacterImport
- Requirement ADDED dndBeyond-defenses module → Tasks: create file, write exports
- Requirement MODIFIED dndBeyondCharacterImport → Tasks: update imports, remove local definitions

## Non-Functional Acceptance Criteria

### Requirement: Reliability

#### Scenario: No behavior change at runtime

- **Given** an existing passing test suite for character import
- **When** the extraction is applied and `npm test` is run
- **Then** all tests pass with zero failures and zero behavior differences

### Requirement: Operability (no circular dependency)

#### Scenario: TypeScript compilation succeeds

- **Given** the new `lib/import/dndBeyond-defenses.ts` imports only from `lib/import/utils.ts`
- **When** `tsc --noEmit` is run
- **Then** compilation succeeds with no errors and no circular dependency warnings
