---
name: tests
description: Tests for the parallel-test-isolation change
---

# Tests

## Overview

This document outlines the tests for the `parallel-test-isolation` change. All work follows strict TDD: write a failing test first, then implement the minimum code to pass it, then refactor.

## Test Cases

### Task 1 — `tests/shared/port.ts`

- [ ] `getDirectoryBasePort()` returns a number between 20000 and 49999 for the current working directory
- [ ] `getDirectoryBasePort()` returns the same value on repeated calls from the same cwd (determinism)
- [ ] `getDirectoryBasePort()` returns different values for two distinct cwd strings (collision avoidance — test with at least 10 artificial paths, assert all results differ)
- [ ] `getDirectoryBasePort()` does not throw when cwd contains non-ASCII characters

### Task 2 — `playwright.config.ts`

- [ ] When `process.env.PORT` is unset, `testPort` equals `String(getDirectoryBasePort())` (not `"3000"`)
- [ ] When `process.env.PORT` is set to `"9000"`, `testPort` is `"9000"` (env override preserved)

### Task 3 — `tests/integration/helpers/users.ts`

- [ ] `uniqueEmail('owner')` returns a string matching `owner-w<id>-<n>@example.com`
- [ ] Two successive calls to `uniqueEmail('user')` return different emails (counter increments)
- [ ] `uniqueEmail` with `JEST_WORKER_ID=1` and `JEST_WORKER_ID=2` return emails with different `w<id>` segments
- [ ] `uniqueEmail` with `JEST_WORKER_ID` unset defaults to `w0` without throwing
- [ ] `createTestUser(baseUrl, 'test')` returns `{ email, password, cookie, userId }` with all fields populated
- [ ] `createTestUser` called twice returns two objects with distinct `email` and `userId` values
- [ ] `createTestUser` throws (or returns a clear error) if `baseUrl` is unreachable

### Task 4 — `tests/integration/global.setup.ts`

- [ ] After `globalSetup` runs, `process.env.TEST_BASE_URL` is set to a valid `http://localhost:<port>` URL
- [ ] After `globalSetup` runs, `process.env.MONGODB_URI` is set and points to the running container
- [ ] After `globalSetup` runs, a GET to `process.env.TEST_BASE_URL + '/api/health'` returns HTTP 200
- [ ] `globalSetup` emits a log line matching `[port-select] cwd=<path> port=<number>` to stdout
- [ ] After `globalSetup` drops the database, no collections exist in `session-combat-test`

### Task 5 — `tests/integration/global.teardown.ts`

- [ ] After `globalTeardown` runs, a GET to the previously running server URL returns a connection error (server stopped)
- [ ] After `globalTeardown` drops the database, no collections exist in `session-combat-test`

### Task 6 — `jest.integration.config.js`

- [ ] Running `npm run test:integration` with the updated config starts exactly one MongoDB container (verify via log count: `"Starting MongoDB container"` appears once)
- [ ] Running `npm run test:integration` with the updated config logs exactly one `[port-select]` line

### Task 7 — Deprecate/remove server helpers

- [ ] No integration test file (excluding `dedupeEngine`) imports `startTestServer`, `setupTestServer`, or `registerAndGetCookie` after migration
- [ ] TypeScript compiles without errors after removal (`tsc --noEmit`)

### Task 8 — Migrate integration test files

For each migrated file:
- [ ] `beforeAll` reads `process.env.TEST_BASE_URL` without starting a new server
- [ ] `beforeAll` throws a descriptive error if `TEST_BASE_URL` is not set
- [ ] All user creation calls use `createTestUser` with a meaningful prefix
- [ ] All tests in the file still pass after migration (`npm run test:integration`)

### Task 9 — `dedupeEngine` exclusion comment

- [ ] `tests/integration/import/dedupeEngine.integration.test.ts` contains a comment explaining it is self-contained, manages its own MongoDB container, and references issue #224
- [ ] `dedupeEngine` tests still pass after all other changes (`npm run test:integration`)

### Integration smoke test — parallel agent simulation

- [ ] Run `npm run test:integration` from two different terminal sessions with different `cwd` values simultaneously; both complete without EADDRINUSE errors
- [ ] Grep both outputs for `[port-select]`; confirm two distinct port numbers appear
