## Why

The current integration and Playwright E2E test suites produce false failures that erode developer trust: flaky `networkidle` waits time out in CI, integration tests silently accept 401 responses as passing, and a MongoDB environment mismatch between the Playwright global setup and the CI Docker service means the app and test helpers sometimes talk to different databases. Until the suite is reliably green, failures cannot be taken seriously.

## What Changes

- Remove the Playwright `globalSetup` MongoDB container bootstrap (conflicts with CI Docker service; the app's webServer already uses the correct DB)
- Replace all `waitForLoadState("networkidle")` calls with explicit element-based waits that have clear success/failure semantics
- Eliminate `.catch(() => {})` and `.catch(() => console.warn(...))` error suppression in E2E helpers — surface failures instead of hiding them
- Add per-test DB cleanup (`clearTestCollections`) in a Playwright `beforeEach` hook so parallel tests start from a known clean state
- Refactor the two overlapping spec files (`regression.spec.ts` and `registration.spec.ts`) into a single, organised suite, removing duplicate coverage
- Replace brittle selectors (exact text strings, Tailwind class checks) with `data-testid` attributes and semantic role queries
- Fix integration tests to register a user and authenticate before calling protected endpoints, so assertions reflect real behaviour rather than passthrough 401s
- Consolidate the duplicate server-bootstrap pattern across `api.integration.test.ts` and `monsters.integration.test.ts` into a shared test setup utility
- Remove acceptance of 500 and 409 as valid registration responses in integration tests

## Capabilities

### New Capabilities
- `test-environment-setup`: Reliable, consistent test environment configuration — correct MongoDB wiring for both local and CI runs, no duplicate container startup, env var propagation that matches what the app actually uses
- `e2e-test-patterns`: Standardised Playwright patterns — explicit element waits, `data-testid` selectors, per-test DB isolation, and no silent error suppression in helpers
- `integration-test-patterns`: Integration tests that authenticate properly, assert meaningful status codes, and share a single server-bootstrap helper rather than each file spinning up its own stack

### Modified Capabilities
<!-- No existing spec files — all capabilities are new -->

## Impact

- `tests/e2e/global.setup.ts` / `global.teardown.ts` — simplified or removed (no testcontainer needed)
- `tests/e2e/helpers/actions.ts` — replace `networkidle` waits and remove error suppression
- `tests/e2e/regression.spec.ts` + `tests/e2e/registration.spec.ts` — merged and deduplicated
- `tests/e2e/helpers/db.ts` — wired into Playwright `beforeEach` for per-test cleanup
- `tests/integration/api.integration.test.ts` + `tests/integration/monsters.integration.test.ts` — shared bootstrap, real auth, meaningful assertions
- `playwright.config.ts` — remove globalSetup/globalTeardown references if setup is eliminated
- Application source: add `data-testid` attributes to key UI elements targeted by tests
- CI: no changes needed (existing Docker service and env vars are already correct)
