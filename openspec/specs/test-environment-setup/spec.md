## Purpose
Define reliable test environment setup expectations for integration and E2E test infrastructure.

## Requirements

### Requirement: Integration tests use a shared globalSetup server

Integration tests SHALL use a single shared MongoDB container + Next.js process for the entire Jest run, started in `tests/integration/global.setup.ts` and torn down in `tests/integration/global.teardown.ts`. Individual test files SHALL NOT start their own MongoDB containers or Next.js processes.

#### Scenario: Single server for all integration tests

- **WHEN** `npm run test:integration` runs
- **THEN** exactly one MongoDB container and one Next.js process are started (in `globalSetup`)
- **AND** all test files share that server via `process.env.TEST_BASE_URL`
- **AND** both are stopped in `globalTeardown`

#### Scenario: Shared database is clean at run start and end

- **WHEN** `globalSetup` starts
- **THEN** the test database is dropped before any test file runs
- **AND** `globalTeardown` drops the database again after all tests complete

### Requirement: Port isolation via directory hash

The integration test server SHALL derive its port from a djb2 hash of `process.cwd()` mapped to the range 20000–49999. If the derived port is occupied, the system SHALL probe up to 4 sequential offsets before failing.

#### Scenario: Different directories use different ports

- **GIVEN** two agents running in different working directories
- **WHEN** each runs `getDirectoryPort()`
- **THEN** the returned ports differ, eliminating cross-agent port collision

#### Scenario: Port stays within range including offsets

- **GIVEN** any working directory path
- **WHEN** `getDirectoryPort()` is called
- **THEN** the returned port is between 20000 and 49999 inclusive (base uses `hash % 29996` to leave room for up to 4 offsets)

### Requirement: Parallel-safe user factory

`tests/integration/helpers/users.ts` SHALL provide `createTestUser(baseUrl, prefix?)` that generates a unique email guaranteed collision-free across test files within the same run. The email format SHALL include worker ID and process PID to survive module-registry resets between files.

#### Scenario: Emails are unique across test files

- **GIVEN** two test files both call `createTestUser(baseUrl, 'user')`
- **WHEN** Jest resets the module registry between files (counter resets to 0)
- **THEN** the PID component ensures the two `user-w0-p<pid>-1@example.com` addresses differ across runs and use distinct DB records

### Requirement: Playwright E2E tests inherit the derived port

`playwright.config.ts` SHALL set `process.env.PORT` to the directory-derived port when `PORT` is not already set, ensuring both the `baseURL` and the `webServer` child process use the same port.

#### Scenario: Local e2e run uses derived port

- **WHEN** a developer runs `npx playwright test` without setting `PORT`
- **THEN** `process.env.PORT` is set to `getDirectoryBasePort()` before the webServer spawns
- **AND** `npm run dev` starts on that port and Playwright connects to it

#### Scenario: CI e2e run respects explicit PORT

- **WHEN** CI sets `PORT=3000` explicitly
- **THEN** `playwright.config.ts` leaves `process.env.PORT` unchanged and uses 3000

### Requirement: No boilerplate jest-environment or IS_REACT_ACT_ENVIRONMENT in unit test files

Unit test files (matched by `jest.config.js`, under `tests/unit/`) SHALL NOT contain `@jest-environment jsdom` docblock comments or per-file `IS_REACT_ACT_ENVIRONMENT = true` assignments. These are set globally by `jest.config.js` (`testEnvironment: "jsdom"`) and `jest.setup.ts` respectively. Integration test files under `tests/integration/` MAY retain `@jest-environment jsdom` overrides where required, as `jest.integration.config.js` uses `testEnvironment: "node"`.

#### Scenario: No redundant docblocks in unit tests

- **GIVEN** any file under `tests/unit/`
- **WHEN** `grep -r "@jest-environment jsdom" tests/unit/` is run
- **THEN** the command returns no matches

#### Scenario: No redundant IS_REACT_ACT_ENVIRONMENT assignments

- **GIVEN** any file under `tests/`
- **WHEN** `grep -r "IS_REACT_ACT_ENVIRONMENT" tests/` is run
- **THEN** the command returns no matches (the single canonical assignment lives in `jest.setup.ts` line 7)

### Requirement: DnD Beyond mock server started in globalSetup

The DnD Beyond character service mock SHALL be started in `globalSetup` so the Next.js process inherits `DND_BEYOND_CHARACTER_SERVICE_BASE_URL` at spawn time. Individual test files SHALL NOT start their own mock server instance for the character import tests.
