## ADDED Requirements

This document details *changes* to requirements and is additive to the `design.md` document, not a replacement.

### Requirement: ADDED DnD Beyond shared helpers module

The system SHALL provide `lib/import/dndBeyond-utils.ts` exporting `ABILITY_ID_MAP`, `ABILITY_KEYS`, `indexStatValues`, `resolveAbilityScore`, and `sumModifierBonusesBySubtype` as named exports.

#### Scenario: ABILITY_ID_MAP is accessible

- **Given** `lib/import/dndBeyond-utils.ts` exists
- **When** `ABILITY_ID_MAP` is imported and inspected
- **Then** it maps stat IDs 1–6 to the six D&D ability names: `strength`, `dexterity`, `constitution`, `intelligence`, `wisdom`, `charisma`

#### Scenario: sumModifierBonusesBySubtype aggregates correctly

- **Given** `lib/import/dndBeyond-utils.ts` exists
- **When** `sumModifierBonusesBySubtype` is called with a list of modifiers
- **Then** it returns the same result as the original implementation in `lib/dndBeyondCharacterImport.ts` (behavior unchanged)

#### Scenario: Module imports from utils.ts if needed

- **Given** `lib/import/dndBeyond-utils.ts` is inspected
- **When** its import statements are reviewed
- **Then** any dependency on generic D&D math is imported from `lib/import/utils.ts`, not redefined inline

## MODIFIED Requirements

### Requirement: MODIFIED Original file no longer defines DnD Beyond shared helpers

The system SHALL import `ABILITY_ID_MAP`, `ABILITY_KEYS`, `indexStatValues`, `resolveAbilityScore`, and `sumModifierBonusesBySubtype` from `lib/import/dndBeyond-utils.ts` rather than defining them locally.

#### Scenario: No duplicate definitions in original file

- **Given** `lib/dndBeyondCharacterImport.ts` is inspected after extraction
- **When** searching for `function sumModifierBonusesBySubtype`, `function indexStatValues`, `function resolveAbilityScore`, `const ABILITY_ID_MAP`, `const ABILITY_KEYS`
- **Then** none of these are defined in the original file; all are imported from `lib/import/dndBeyond-utils.ts`

## REMOVED Requirements

### Requirement: REMOVED Local definition of DnD Beyond shared helpers in dndBeyondCharacterImport.ts

Reason for removal: Helpers extracted to `lib/import/dndBeyond-utils.ts` to serve as the shared foundation for the full dndBeyond-* extraction series (issues 150–159).

## Traceability

- Proposal element "Create `lib/import/dndBeyond-utils.ts`" -> Requirement: ADDED DnD Beyond shared helpers module
- Design decision 1 (two-tier utility split) -> Requirement: ADDED DnD Beyond shared helpers module
- Requirement -> Task: Create `lib/import/dndBeyond-utils.ts`; update imports in `lib/dndBeyondCharacterImport.ts`

## Non-Functional Acceptance Criteria

### Requirement: Reliability

#### Scenario: TypeScript compilation passes

- **Given** the extraction is complete
- **When** `tsc --noEmit` is run from the project root
- **Then** it exits with code 0 and no type errors

### Requirement: Reliability

#### Scenario: Import direction is one-way

- **Given** `lib/import/dndBeyond-utils.ts` exists
- **When** its imports are inspected
- **Then** it does not import from `lib/import/dndBeyond-ability-scores.ts` or `lib/dndBeyondCharacterImport.ts` (no reverse dependencies)
