## ADDED Requirements

### Requirement: Playwright E2E tests use the environment-provided MongoDB
The Playwright test suite SHALL NOT start its own MongoDB container. It SHALL rely on `MONGODB_URI` and `MONGODB_DB` environment variables being set before the test run (in CI: via job-level `env:` pointing to the Docker service; locally: via the developer's own MongoDB instance). The `global.setup.ts` file SHALL be simplified to a no-op or removed, and `global.teardown.ts` SHALL be removed. The `playwright.config.ts` SHALL remove the `globalSetup` and `globalTeardown` references if both files are removed.

#### Scenario: CI run uses Docker-service MongoDB
- **WHEN** Playwright tests run in CI with `MONGODB_URI=mongodb://localhost:27017` set at the job level
- **THEN** the Next.js dev server (started by `webServer`) connects to that MongoDB
- **AND** the test helpers (e.g., `clearTestCollections`) connect to the same MongoDB
- **AND** no additional MongoDB container is started by the test suite

#### Scenario: Missing MONGODB_URI fails clearly
- **WHEN** Playwright tests are run without `MONGODB_URI` set in the environment
- **THEN** the test setup SHALL emit a clear error message explaining that `MONGODB_URI` must be set
- **AND** the test run SHALL fail immediately rather than silently proceeding with an incorrect default

#### Scenario: Local run uses developer's MongoDB
- **WHEN** a developer runs `npm run test:regression` locally with `MONGODB_URI` pointing to their local MongoDB
- **THEN** the test suite uses that connection without starting any additional container

### Requirement: Integration tests share a server bootstrap utility
Integration test files (`api.integration.test.ts`, `monsters.integration.test.ts`) SHALL import a shared `startTestServer` / `stopTestServer` helper from `tests/integration/helpers/server.ts` rather than each independently copying the MongoDB-container and Next.js spawn logic.

#### Scenario: Server helper starts a fresh stack per test file
- **WHEN** a Jest integration test file calls `await startTestServer()` in `beforeAll`
- **THEN** a MongoDB container is started and a Next.js process is spawned on an available port
- **AND** the helper waits until the health endpoint responds before returning
- **AND** the helper returns `{ baseUrl, cleanup }` so the test file can make requests and tear down cleanly

#### Scenario: Server helper cleans up on teardown
- **WHEN** a Jest integration test file calls `await cleanup()` in `afterAll`
- **THEN** the Next.js process is terminated and the MongoDB container is stopped
- **AND** no orphaned processes or containers are left running after the test suite completes
