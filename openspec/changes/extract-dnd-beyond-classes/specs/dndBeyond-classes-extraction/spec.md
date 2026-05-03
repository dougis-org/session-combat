## ADDED Requirements

This document details *changes* to requirements and is additive to the `design.md` document, not a replacement.

### Requirement: ADDED Class and race normalizers module

The system SHALL provide `lib/import/dndBeyond-classes.ts` exporting `normalizeClasses`, `normalizeClassEntry`, and `normalizeRace` as named exports.

#### Scenario: normalizeClasses is exported

- **Given** `lib/import/dndBeyond-classes.ts` exists
- **When** `normalizeClasses` is imported and called with valid DnD Beyond class entries
- **Then** it returns a `CharacterClass[]` with merged multi-class entries, validated against `VALID_CLASSES`

#### Scenario: normalizeClassEntry is exported

- **Given** `lib/import/dndBeyond-classes.ts` exists
- **When** `normalizeClassEntry` is called with a class entry
- **Then** it returns `{ className: DnDClass; level: number } | null`, with unsupported classes returning `null` and emitting a warning

#### Scenario: normalizeRace is exported

- **Given** `lib/import/dndBeyond-classes.ts` exists
- **When** `normalizeRace` is called with a race name
- **Then** it returns a `DnDRace` via exact match, case-insensitive match, or substring fallback (sorted by length descending), emitting a warning on fallback

#### Scenario: Dependencies are imported from the correct foundation modules

- **Given** `lib/import/dndBeyond-classes.ts` is inspected
- **When** its import statements are reviewed
- **Then** `isPresent` and `createValidationError` are imported from `lib/import/dndBeyond-utils.ts`; `DnDClass`, `DnDRace`, `VALID_CLASSES`, `VALID_RACES`, `CharacterClass` are imported from `lib/types.ts`

## MODIFIED Requirements

### Requirement: MODIFIED Original file delegates class and race normalization

The system SHALL import `normalizeClasses`, `normalizeClassEntry`, and `normalizeRace` from `lib/import/dndBeyond-classes.ts` and no longer define them locally.

#### Scenario: No duplicate definitions in original file

- **Given** `lib/dndBeyondCharacterImport.ts` is inspected after extraction
- **When** searching for `function normalizeClasses`, `function normalizeClassEntry`, `function normalizeRace`
- **Then** none of these are defined in the original file; all are imported from `lib/import/dndBeyond-classes.ts`

#### Scenario: Existing character import behavior is preserved end-to-end

- **Given** the extraction is complete
- **When** all existing unit and integration tests for `dndBeyondCharacterImport` are run via `npm test`
- **Then** all tests pass with zero new failures

## REMOVED Requirements

### Requirement: REMOVED Local definition of class and race normalizers in dndBeyondCharacterImport.ts

Reason for removal: Functions extracted to `lib/import/dndBeyond-classes.ts` as part of the decomposition series.

## Traceability

- Proposal element "Create `lib/import/dndBeyond-classes.ts`" -> Requirement: ADDED Class and race normalizers module
- Design decision 1 (one file per domain) -> Requirement: ADDED Class and race normalizers module
- Design decision 2 (error factory from dndBeyond-utils) -> Requirement: ADDED Class and race normalizers module
- Requirement -> Task: Create `lib/import/dndBeyond-classes.ts`; update imports in `lib/dndBeyondCharacterImport.ts`; run full test suite

## Non-Functional Acceptance Criteria

### Requirement: Reliability

#### Scenario: TypeScript compilation passes

- **Given** new file exists and the original file's imports are updated
- **When** `tsc --noEmit` is run from the project root
- **Then** it exits with code 0 and no type errors

### Requirement: Reliability

#### Scenario: Full test suite passes

- **Given** all extractions are complete
- **When** `npm test` is run
- **Then** all tests pass; no tests are skipped or newly failing
