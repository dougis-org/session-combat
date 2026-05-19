## ADDED Requirements

This document details *changes* to requirements and is additive to the `design.md` document, not a replacement.

### Requirement: ADDED D&D Beyond HTTP mock server helper

The system SHALL provide a reusable D&D Beyond HTTP mock server at `tests/mocks/dndBeyond/server.ts` that integration tests can use without duplicating server lifecycle code.

#### Scenario: Integration test sets up mock server via helper

- **Given** an integration test imports `createDndBeyondMockServer` from `tests/mocks/dndBeyond/server.ts`
- **When** `setup()` is called in `beforeAll`
- **Then** a real HTTP server is listening on a random port and `DND_BEYOND_CHARACTER_SERVICE_BASE_URL` is set to point at it

#### Scenario: Integration test tears down mock server via helper

- **Given** a mock server was started via `setup()`
- **When** `teardown()` is called in `afterAll`
- **Then** the server is closed and no port remains open

## MODIFIED Requirements

### Requirement: MODIFIED characterImport integration test uses shared mock server helper

The system SHALL use `createDndBeyondMockServer` from `tests/mocks/dndBeyond/server.ts` instead of an inline `createServer` block.

#### Scenario: Character import integration test runs identically after refactor

- **Given** the inline server block is replaced with the helper
- **When** the integration test suite runs
- **Then** all existing assertions pass without modification

## REMOVED Requirements

### Requirement: REMOVED Inline `createServer` in characterImport.integration.test.ts

Reason for removal: Extracted to `tests/mocks/dndBeyond/server.ts` for reusability and to enforce the `tests/helpers/` (data) vs `tests/mocks/` (HTTP servers) split.

## Traceability

- Proposal element "Inline D&D Beyond HTTP server in integration test" -> Requirement: ADDED D&D Beyond HTTP mock server helper
- Design decision 2 (setup/teardown factory) -> Requirement: ADDED D&D Beyond HTTP mock server helper
- Design decision 3 (helpers vs mocks split) -> Requirement: MODIFIED characterImport integration test uses shared mock server helper
- Requirements -> Tasks: "Create tests/mocks/dndBeyond/server.ts" and "Update characterImport.integration.test.ts" in tasks.md

## Non-Functional Acceptance Criteria

### Requirement: Operability

#### Scenario: No new package dependencies

- **Given** the refactor is complete
- **When** `package.json` is inspected
- **Then** no new entries appear in `dependencies` or `devDependencies`
