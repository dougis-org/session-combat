## ADDED Requirements

This document details *changes* to requirements and is additive to the
`design.md` document, not a replacement.

### Requirement: ADDED D&D Beyond fixture-contract cleanup can complete as a
focused typecheck change

The system SHALL allow the D&D Beyond fixture-contract cleanup tracked in #138
to be completed as a focused test-maintenance change without requiring
production import behavior changes.

#### Scenario: D&D Beyond fixture-related typecheck failures are removed

- **Given** the repository contains the #138 cleanup changes
- **When** `npx tsc --noEmit` is run from the project root
- **Then** TypeScript no longer reports the D&D Beyond fixture-related failures
  from `tests/fixtures/dndBeyondCharacter.ts` or
  `tests/unit/import/dndBeyondCharacterImport.test.ts`

#### Scenario: Production contracts remain the source of truth

- **Given** the D&D Beyond fixture cleanup is implemented
- **When** the change is reviewed
- **Then** the fix is centered on fixture and test alignment
- **And** `lib/dndBeyondCharacterImport.ts` contract definitions are not widened
  solely to silence test failures

## MODIFIED Requirements

### Requirement: MODIFIED test fixtures and helpers must match current exported
contracts

The system SHALL keep D&D Beyond import fixtures and tests aligned with the
current exported import and normalized-character contracts.

#### Scenario: Shared D&D Beyond fixtures satisfy the current import contract

- **Given** the shared fixture file constructs a representative imported
  character payload
- **When** the fixture is consumed by import tests
- **Then** the fixture satisfies `DndBeyondCharacterData` directly
- **And** nested modifier and action entries use the current allowed unions
  rather than widened `string` values

#### Scenario: Import tests preserve contract safety in override-heavy cases

- **Given** the import unit tests override nested modifier, action, race, stat,
  or inventory data from the shared fixture
- **When** those tests are typechecked
- **Then** the overrides preserve the current contract shape without repeated
  unsafe casts
- **And** optional normalized fields are narrowed explicitly before property
  assertions

## REMOVED Requirements

### Requirement: REMOVED tolerance for stale D&D Beyond fixture typing drift

Reason for removal:
The repository should no longer tolerate known stale D&D Beyond fixture and
test patterns that obscure whether import-contract regressions are real.

#### Scenario: Stale D&D Beyond fixture drift is treated as a failure

- **Given** a D&D Beyond import test uses a fixture shape that no longer matches
  the exported import contract
- **When** `npx tsc --noEmit` is run
- **Then** the mismatch is treated as a failure to be corrected in fixtures or
  tests rather than excused as pre-existing noise

## Traceability

- Proposal element -> Requirement:
  re-type the shared fixture source -> MODIFIED test fixtures and helpers must
  match current exported contracts
- Proposal element -> Requirement:
  remove the D&D Beyond failure cluster -> ADDED D&D Beyond fixture-contract
  cleanup can complete as a focused typecheck change
- Design decision -> Requirement:
  Decision 1 -> shared fixtures satisfy the current import contract
- Design decision -> Requirement:
  Decision 2 -> override-heavy tests preserve current unions
- Design decision -> Requirement:
  Decision 3 -> optional normalized fields are narrowed explicitly
- Requirement -> Task(s):
  ADDED/MODIFIED/REMOVED requirements -> tasks 1 through 6 in `tasks.md`

## Non-Functional Acceptance Criteria

### Requirement: Performance

#### Scenario: No new runtime work is introduced

- **Given** this change touches fixtures and tests only
- **When** the project is built and typechecked
- **Then** the change introduces no new production runtime behavior
- **And** validation cost remains limited to normal compile and test execution

### Requirement: Security

#### Scenario: Contract cleanup does not weaken import enforcement

- **Given** the change updates only fixtures, tests, and typed helper patterns
- **When** the import flow is reviewed
- **Then** no auth, fetch, or normalization guard in production code is weakened
  to accommodate the tests

### Requirement: Reliability

#### Scenario: Typecheck output becomes more attributable

- **Given** a maintainer runs repo-wide typecheck after the #138 cleanup
- **When** a failure remains
- **Then** the D&D Beyond fixture-related failure cluster is no longer part of
  the output
- **And** any remaining failures are easier to attribute to separate work
