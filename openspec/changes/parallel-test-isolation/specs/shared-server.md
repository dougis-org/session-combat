## ADDED Requirements

### Requirement: ADDED Single shared server per integration run

The system SHALL start exactly one MongoDB container and one Next.js server for the entire integration test run, managed via Jest `globalSetup` and `globalTeardown`.

#### Scenario: One server start per run

- **Given** the integration suite contains multiple test files
- **When** the suite runs to completion
- **Then** the log contains exactly one "Starting MongoDB container..." line and one "Next.js server is ready" line

#### Scenario: All test files share the same baseUrl

- **Given** `global.setup.ts` has set `process.env.TEST_BASE_URL`
- **When** any integration test file reads `process.env.TEST_BASE_URL`
- **Then** the value is a valid `http://localhost:<port>` URL pointing to the running Next.js server

### Requirement: ADDED Ephemeral database lifecycle

The system SHALL drop the entire test database at the start of `globalSetup` and again at the end of `globalTeardown`, guaranteeing a clean slate for every run.

#### Scenario: DB is empty at test start

- **Given** a previous run left records in the database
- **When** `global.setup.ts` completes its setup phase
- **Then** all collections in the test database are empty

#### Scenario: DB is dropped at teardown

- **Given** tests have created users, campaigns, characters, and other records
- **When** `global.teardown.ts` completes
- **Then** the test database no longer contains any of those records

#### Scenario: Mid-run kill leaves DB for next run's setup to clean

- **Given** the test process is killed before `globalTeardown` runs
- **When** the next run's `globalSetup` executes
- **Then** it drops any leftover data before starting tests, achieving the same clean state

## MODIFIED Requirements

### Requirement: MODIFIED Integration test files no longer manage their own server

Test files SHALL read `process.env.TEST_BASE_URL` for the server URL instead of calling `startTestServer()` or `setupTestServer()`.

#### Scenario: Test file uses shared baseUrl

- **Given** `global.setup.ts` has run and set `process.env.TEST_BASE_URL`
- **When** a test file's `beforeAll` executes
- **Then** it reads `process.env.TEST_BASE_URL` without starting a new server

#### Scenario: Missing TEST_BASE_URL throws a clear error

- **Given** `global.setup.ts` did not run (misconfigured jest config)
- **When** a test file's `beforeAll` reads `process.env.TEST_BASE_URL`
- **Then** it throws an error with a message indicating globalSetup was not wired correctly

## REMOVED Requirements

### Requirement: REMOVED Per-file server lifecycle via `startTestServer` / `setupTestServer`

Reason for removal: Replaced by shared server managed in `globalSetup` / `globalTeardown`. Per-file startup multiplied cost 3× and caused port races between files. `startTestServer`, `setupTestServer`, and `registerAndGetCookie` are removed from `tests/integration/helpers/server.ts`.

## Traceability

- Proposal element "Shared server (integration tests)" → Requirements: Single shared server, Ephemeral database lifecycle
- Design Decision 2 (globalSetup/globalTeardown) → Requirements: Single shared server, test files no longer manage server
- Design Decision 3 (DB wipe at start and end) → Requirement: Ephemeral database lifecycle
- Requirements → Tasks: Implement `global.setup.ts`, Implement `global.teardown.ts`, Update `jest.integration.config.js`, Migrate each test file

## Non-Functional Acceptance Criteria

### Requirement: Performance

#### Scenario: Faster suite startup

- **Given** the integration suite with 3+ test files
- **When** the suite completes
- **Then** total wall-clock time is less than before the change (1 container start vs. 3+)
