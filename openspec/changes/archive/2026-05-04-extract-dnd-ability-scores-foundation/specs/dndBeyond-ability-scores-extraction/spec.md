## ADDED Requirements

This document details *changes* to requirements and is additive to the `design.md` document, not a replacement.

### Requirement: ADDED Ability score and HP normalizers module

The system SHALL provide `lib/import/dndBeyond-ability-scores.ts` exporting `normalizeAbilityScores`, `normalizeMaxHp`, and `normalizeCurrentHp` as named exports.

#### Scenario: normalizeAbilityScores is exported

- **Given** `lib/import/dndBeyond-ability-scores.ts` exists
- **When** `normalizeAbilityScores` is imported and called with valid DnD Beyond character data
- **Then** it returns an `AbilityScores` object with the same values as the original implementation (behavior unchanged)

#### Scenario: normalizeMaxHp is exported

- **Given** `lib/import/dndBeyond-ability-scores.ts` exists
- **When** `normalizeMaxHp` is called with valid character data, ability scores, level, and modifiers
- **Then** it returns the same HP value as the original implementation

#### Scenario: normalizeCurrentHp is exported

- **Given** `lib/import/dndBeyond-ability-scores.ts` exists
- **When** `normalizeCurrentHp` is called with character data and a max HP value
- **Then** it returns a value clamped to `[0, maxHp]`, consistent with the original implementation

#### Scenario: Dependencies are imported from the correct foundation modules

- **Given** `lib/import/dndBeyond-ability-scores.ts` is inspected
- **When** its import statements are reviewed
- **Then** `getAbilityModifier` is imported from `lib/import/utils.ts` and `sumModifierBonusesBySubtype`, `ABILITY_ID_MAP`, `indexStatValues`, `resolveAbilityScore` are imported from `lib/import/dndBeyond-utils.ts`

## MODIFIED Requirements

### Requirement: MODIFIED Original file delegates ability score and HP logic

The system SHALL import `normalizeAbilityScores`, `normalizeMaxHp`, and `normalizeCurrentHp` from `lib/import/dndBeyond-ability-scores.ts` and no longer define them locally.

#### Scenario: No duplicate definitions in original file

- **Given** `lib/dndBeyondCharacterImport.ts` is inspected after extraction
- **When** searching for `function normalizeAbilityScores`, `function normalizeMaxHp`, `function normalizeCurrentHp`
- **Then** none of these are defined in the original file; all are imported from `lib/import/dndBeyond-ability-scores.ts`

#### Scenario: Existing character import behavior is preserved end-to-end

- **Given** the extraction is complete
- **When** all existing unit and integration tests for `dndBeyondCharacterImport` are run via `npm test`
- **Then** all tests pass with zero new failures

## REMOVED Requirements

### Requirement: REMOVED Local definition of ability score and HP normalizers in dndBeyondCharacterImport.ts

Reason for removal: Functions extracted to `lib/import/dndBeyond-ability-scores.ts` as part of the decomposition series.

## Traceability

- Proposal element "Create `lib/import/dndBeyond-ability-scores.ts`" -> Requirement: ADDED Ability score and HP normalizers module
- Design decision 2 (flat naming) -> Requirement: ADDED Ability score and HP normalizers module
- Design decision 3 (original retains public exports) -> Requirement: MODIFIED Original file delegates ability score and HP logic
- Requirement -> Task: Create `lib/import/dndBeyond-ability-scores.ts`; update imports in `lib/dndBeyondCharacterImport.ts`; run full test suite

## Non-Functional Acceptance Criteria

### Requirement: Reliability

#### Scenario: TypeScript compilation passes

- **Given** all three new files exist and the original file's imports are updated
- **When** `tsc --noEmit` is run from the project root
- **Then** it exits with code 0 and no type errors

### Requirement: Reliability

#### Scenario: Full test suite passes

- **Given** all extractions are complete
- **When** `npm test` is run
- **Then** all tests pass; no tests are skipped or newly failing
