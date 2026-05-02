## ADDED Requirements

This document details *changes* to requirements and is additive to the `design.md` document, not a replacement.

### Requirement: ADDED DedupEngine Test Layering

The dedupeEngine import tests SHALL be organized by layer to ensure fast, reliable, and accurate testing.

#### Scenario: Transform validation at unit level

- **Given** a creature with an invalid transform (e.g., empty name)
- **When** `importMonstersFromOpen5E` is called
- **Then** the result SHALL have `errors: 1`
- **And** the result SHALL have `inserted: 0`
- **And** no monster SHALL be saved to storage

#### Scenario: Insert when not duplicate (integration)

- **Given** no monster named "Goblin" with source "open5e" exists in MongoDB
- **When** `importMonstersFromOpen5E` is called with a valid Goblin creature
- **Then** the result SHALL have `inserted: 1`
- **AND** the monster SHALL be retrievable from MongoDB by name and source

#### Scenario: Skip when duplicate exists (integration)

- **Given** a monster "Goblin" with source "open5e" already exists in MongoDB
- **When** `importMonstersFromOpen5E` is called with a Goblin creature of the same name and source
- **Then** the result SHALL have `skipped: 1`
- **AND** `inserted: 0`
- **AND** only one monster "Goblin" with source "open5e" SHALL exist in MongoDB

#### Scenario: Multiple monsters processed (unit)

- **Given** a mock client returning multiple valid creatures
- **When** `importMonstersFromOpen5E` is called
- **Then** each valid, non-duplicate creature SHALL be inserted
- **AND** the result SHALL reflect the correct count of insertions

### Requirement: ADDED Broken Test Removal

The test file `tests/unit/import/dedupeEngine.test.ts` SHALL NOT contain tests with mock/assertion mismatches.

#### Scenario: No contradictory mocks

- **Given** a test that mocks `findMonsterByNameAndSource` to return an existing monster
- **When** the test asserts the result
- **Then** the assertions SHALL be consistent with an existing monster (skipped, not inserted)

## MODIFIED Requirements

### Requirement: MODIFIED Deduplication Engine

The system SHALL prevent duplicate entries when syncing from open5e. This requirement is unchanged from the original specification at `openspec/specs/dedupe-logic/spec.md`. This change does not modify the requirement itself, only ensures correct test coverage for it.

## REMOVED Requirements

### Requirement: REMOVED Conflicting Test Scenario

The test scenario "skips monster when transform is invalid (not when it exists)" at `tests/unit/import/dedupeEngine.test.ts` lines 80-91 SHALL be removed.

Reason for removal: The test had a mock/assertion mismatch making it impossible to pass. The scenarios it attempted to test are already covered by other tests.

## Traceability

- Proposal element: Fix broken test
  - Requirement: Broken Test Removal
  - Design decision: Remove conflicting test
- Proposal element: Move persistence tests to integration
  - Requirement: DedupEngine Test Layering
  - Design decision: Create integration test with real MongoDB
- Proposal element: Keep error-on-invalid as unit test
  - Requirement: DedupEngine Test Layering - Transform validation at unit level
  - Design decision: Keep lines 107-118 in unit tests
- Design decision: Use direct function call in integration tests
  - Requirement: DedupEngine Test Layering - Skip when duplicate exists (integration)
  - Design decision: Integration test pattern for library functions
- Requirement (original): Deduplication Engine
  - Traceability: Tests validate this requirement at appropriate layers

## Non-Functional Acceptance Criteria

### Requirement: Performance

#### Scenario: Unit test execution time

- **Given** running the unit test suite for dedupeEngine
- **When** tests execute
- **Then** unit tests SHALL complete in under 5 seconds total
- **AND** no unit test SHALL require MongoDB or external services

### Requirement: Reliability

#### Scenario: Test determinism

- **Given** running dedupeEngine tests multiple times
- **When** tests execute
- **Then** results SHALL be consistent across runs
- **AND** no tests SHALL have race conditions or timing dependencies