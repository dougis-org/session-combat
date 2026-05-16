## ADDED Requirements

This document details *changes* to requirements and is additive to the `design.md` document, not a replacement.

### Requirement: ADDED Generic import helpers module

The system SHALL provide `lib/import/utils.ts` exporting string deduplication, string formatting, and damage type validation utilities as named exports.

#### Scenario: String deduplication

- **Given** `lib/import/utils.ts` exists
- **When** `dedupeStrings(["a", "b", "a", null, "c", "b"])` is called
- **Then** it returns `["a", "b", "c"]` (falsy values filtered, Set-based dedup)

#### Scenario: String titleization with hyphen handling

- **Given** `lib/import/utils.ts` exists
- **When** `titleize("half-elf")` is called
- **Then** it returns `"Half Elf"`; `titleize("warrior_cleric")` returns `"Warrior Cleric"`

#### Scenario: Canonical damage type names

- **Given** `lib/import/utils.ts` exists
- **When** `DAMAGE_TYPE_NAMES` is inspected
- **Then** it is a readonly Set containing: "acid", "bludgeoning", "cold", "fire", "force", "lightning", "necrotic", "piercing", "poison", "psychic", "radiant", "slashing", "thunder" (13 canonical D&D damage types)

#### Scenario: Damage type modifier identification

- **Given** `lib/import/utils.ts` exists
- **When** `isDamageTypeModifier({ subType: "fire" })` is called
- **Then** it returns `true`; when called with `{ subType: "saving-throws" }` it returns `false`

#### Scenario: Modifier category normalization

- **Given** `lib/import/utils.ts` exists
- **When** `normalizeModifierCategory("fire-damage")` is called
- **Then** it returns `"fire damage"` (lowercase, hyphens to spaces)

### Requirement: ADDED DAMAGE_TYPE_NAMES as central canonical reference

`DAMAGE_TYPE_NAMES` in `lib/import/utils.ts` SHALL be the single source of truth for damage type validation, usable by any API provider (D&D Beyond, Open5E, etc.).

#### Scenario: Damage type validation across providers

- **Given** `DAMAGE_TYPE_NAMES` is used by both D&D Beyond import and Open5E adapter
- **When** either provider returns a damage type string
- **Then** the same `DAMAGE_TYPE_NAMES` Set validates it without provider-specific copies

## MODIFIED Requirements

### Requirement: MODIFIED Original file no longer defines generic helpers

The system SHALL import `dedupeStrings`, `titleize`, `DAMAGE_TYPE_NAMES`, `isDamageTypeModifier`, and `normalizeModifierCategory` from `lib/import/utils.ts` rather than defining them locally in `lib/dndBeyondCharacterImport.ts`.

#### Scenario: No duplicate definitions

- **Given** `lib/dndBeyondCharacterImport.ts` is inspected after extraction
- **When** searching for `function dedupeStrings`, `function titleize`, `const DAMAGE_TYPE_NAMES`, `function isDamageTypeModifier`, `function normalizeModifierCategory`
- **Then** none of these definitions exist in that file; all are imported from `lib/import/utils.ts`

#### Scenario: Helpers still used internally

- **Given** `lib/dndBeyondCharacterImport.ts` is inspected after extraction
- **When** searching for usages of the 5 helpers
- **Then** they are still called within the file (via imported references), preserving all normalization behavior

## REMOVED Requirements

### Requirement: REMOVED Local definition of helpers in dndBeyondCharacterImport.ts

Reason for removal: Functions and constants extracted to `lib/import/utils.ts` to enable reuse across providers and prevent coupling between future domain extractions and the original file.

## Traceability

- Proposal element "Move helpers to utils.ts" -> Requirement: ADDED Generic import helpers module
- Design decision 1 (target file is utils.ts) -> Requirement: ADDED Generic import helpers module
- Design decision 2 (original imports, does not re-export) -> Requirement: MODIFIED Original file no longer defines generic helpers
- Design decision 1 (DAMAGE_TYPE_NAMES is canonical D&D) -> Requirement: ADDED DAMAGE_TYPE_NAMES as central canonical reference
- Requirement -> Task: Add 5 helpers to `lib/import/utils.ts`; update imports in `lib/dndBeyondCharacterImport.ts`

## Non-Functional Acceptance Criteria

### Requirement: Reliability

#### Scenario: TypeScript compilation passes

- **Given** the extraction is complete
- **When** `tsc --noEmit` is run from the project root
- **Then** it exits with code 0 and no type errors

### Requirement: Reliability

#### Scenario: No circular imports

- **Given** `lib/import/utils.ts` is the leaf-level utility module
- **When** its imports are inspected
- **Then** it imports nothing from other `lib/import/` modules or `lib/dndBeyondCharacterImport.ts`

### Requirement: Operability

#### Scenario: All 13 canonical damage types present

- **Given** `DAMAGE_TYPE_NAMES` is inspected
- **When** the Set is enumerated
- **Then** it contains exactly: acid, bludgeoning, cold, fire, force, lightning, necrotic, piercing, poison, psychic, radiant, slashing, thunder