## ADDED Requirements

This document details *changes* to requirements and is additive to the `design.md` document, not a replacement.

### Requirement: ADDED Generic D&D math helpers module

The system SHALL provide `lib/import/utils.ts` exporting `getAbilityModifier` and `getProficiencyBonus` as named exports with no DnD Beyond-specific types in their signatures.

#### Scenario: Ability modifier calculation

- **Given** `lib/import/utils.ts` exists
- **When** `getAbilityModifier(10)` is called
- **Then** it returns `0` (standard D&D formula: `floor((score - 10) / 2)`)

#### Scenario: Proficiency bonus calculation

- **Given** `lib/import/utils.ts` exists
- **When** `getProficiencyBonus(1)` is called
- **Then** it returns `2`; when called with `5` it returns `3`; with `9` returns `4`

#### Scenario: No DnD Beyond types in signature

- **Given** `lib/import/utils.ts` is inspected
- **When** the function signatures of `getAbilityModifier` and `getProficiencyBonus` are reviewed
- **Then** neither function references any type from `DndBeyondCharacterData` or any other provider-specific type

## MODIFIED Requirements

### Requirement: MODIFIED Original file no longer defines generic math helpers

The system SHALL import `getAbilityModifier` and `getProficiencyBonus` from `lib/import/utils.ts` rather than defining them locally in `lib/dndBeyondCharacterImport.ts`.

#### Scenario: No duplicate definition

- **Given** `lib/dndBeyondCharacterImport.ts` is inspected after extraction
- **When** searching for `function getAbilityModifier` and `function getProficiencyBonus`
- **Then** neither definition exists in that file; both are imported from `lib/import/utils.ts`

## REMOVED Requirements

### Requirement: REMOVED Local definition of math helpers in dndBeyondCharacterImport.ts

Reason for removal: Functions extracted to `lib/import/utils.ts` to enable reuse across providers.

## Traceability

- Proposal element "Create `lib/import/utils.ts`" -> Requirement: ADDED Generic D&D math helpers module
- Design decision 1 (two-tier utility split) -> Requirement: ADDED Generic D&D math helpers module
- Requirement -> Task: Create `lib/import/utils.ts`; update imports in `lib/dndBeyondCharacterImport.ts`

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
- **Then** it imports nothing from `lib/import/dndBeyond-utils.ts`, `lib/import/dndBeyond-ability-scores.ts`, or `lib/dndBeyondCharacterImport.ts`
