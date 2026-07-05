## ADDED Requirements

This document details *changes* to requirements and is additive to the [`design.md`](../../changes/archive/2026-07-04-add-monster-import-tests/design.md) document, not a replacement.

### Requirement: ADDED Monster Import Regression Tests

The system SHALL verify the monster import functionality through automated Playwright regression tests.

#### Scenario: Valid JSON Import

- **Given** the user is on the monster import page
- **When** the user uploads a valid monster JSON file using the import form
- **Then** the monster is successfully imported, persisted, and displayed in the application

#### Scenario: Invalid JSON Import Rejection

- **Given** the user is on the monster import page
- **When** the user uploads a malformed or invalid JSON file
- **Then** the UI displays an appropriate error message and prevents the import

#### Scenario: 5MB File Size Rejection

- **Given** the user is on the monster import page
- **When** the user attempts to upload a file whose simulated size exceeds 5MB (the application's `MAX_FILE_SIZE` limit)
- **Then** the UI immediately rejects the file and displays an error without attempting the upload

### Requirement: ADDED Encounter Creation Regression Tests

The system SHALL verify the encounter creation functionality through automated Playwright regression tests.

#### Scenario: Create Encounter with Imported Monster

- **Given** an authenticated user who has imported a monster
- **When** the user creates a new encounter and adds the imported monster
- **Then** the encounter is successfully created and persisted with the correct data

## MODIFIED Requirements

None.

## REMOVED Requirements

None.

## Traceability

- Proposal element -> Requirement: Two new E2E test files -> ADDED Monster Import Regression Tests, ADDED Encounter Creation Regression Tests
- Design decision -> Requirement: Decision 1 (Domain-driven split) -> Maps to both ADDED requirements
- Design decision -> Requirement: Decision 2 (Mock file size) -> Maps to 5MB File Size Rejection scenario
- Requirement -> Task(s): To be defined in `tasks.md`

## Non-Functional Acceptance Criteria

> **Important:** NFAC scenarios MUST NOT duplicate scenarios already expressed in the functional requirements sections above (ADDED/MODIFIED/REMOVED). If a functional scenario already covers a given behavior (e.g., access-control rejection, error handling), cross-reference it here instead of repeating it. Only include NFAC scenarios that express genuinely new, non-functional behaviors (latency budgets, throughput limits, recovery SLOs, audit logging, etc.).

### Requirement: Performance

#### Scenario: Test Execution Latency

- **Given** the Playwright test runner executing the regression suite
- **When** it encounters the 5MB file size limit test
- **Then** it completes the test execution near-instantaneously by using an in-memory `Buffer.alloc` rather than committing or reading a large file from disk

### Requirement: Security

See functional scenarios: Invalid JSON Import Rejection.

### Requirement: Reliability

#### Scenario: Test Suite Stability

- **Given** the CI environment running `npm run test:regression`
- **When** the tests execute on the main branch
- **Then** the new `monsters.spec.ts` and `encounters.spec.ts` tests pass consistently without flakiness (achieving >95% pass rate as per issue #52 criteria)
