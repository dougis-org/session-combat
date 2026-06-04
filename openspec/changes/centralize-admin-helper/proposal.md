## GitHub Issues

- #223

## Why

- **Problem statement**: Integration tests require direct MongoDB access to promote users to admin by setting `isAdmin: true` directly in the database. This couples tests to the DB schema, duplicates raw connection boilerplate across multiple integration test files, and increases the migration surface area for shared-server test isolation.
- **Why now**: We are preparing for parallel test isolation and potential shared server setups (e.g., issue #220). Removing raw, dispersed DB connections in tests is a critical prerequisite to simplify the migration of our test environment and avoid connection leaks.
- **Business/user impact**: Improved codebase maintainability, faster test migration, robust integration test setup, and avoidance of resource leaks (MongoClient not closed properly).

## Problem Space

- **Current behavior**:
  - `tests/integration/campaign-global-api.integration.test.ts` and `tests/integration/permissions.test.ts` both import `MongoClient` and `ObjectId`, connect to MongoDB using `process.env.MONGODB_URI` and `process.env.MONGODB_DB`, find the registered test user, and set `isAdmin: true` in the `users` collection.
  - The tests must independently call `mongoClient.close()` in an `afterAll` hook, which is prone to connection leakage if tests crash or if teardown is missed.
- **Desired behavior**:
  - Test files do not need direct MongoDB access or connection management to promote users to admin.
  - They invoke a unified helper `makeUserAdmin(userId: string): Promise<void>` (or similar) from `tests/integration/helpers/users.ts`.
  - The helper manages the database client lifecycle (connect, update, disconnect) transparently and cleanly.
- **Constraints**:
  - Must run within the Jest integration test environment.
  - Must reuse existing environment variables (`process.env.MONGODB_URI` and `process.env.MONGODB_DB`).
- **Assumptions**:
  - The test environment will always have `process.env.MONGODB_URI` and `process.env.MONGODB_DB` set (which they are, via global setup).
  - Users are registered using `registerTestUser` before promotion, and we have their valid `userId` string.
- **Edge cases considered**:
  - Target user does not exist in the database: the helper should throw a clear error instead of failing silently.
  - MongoDB connection string is missing or malformed: helper must reject with a meaningful error message.
  - Connection teardown must always run, even if the update query throws an error.

## Scope

### In Scope

- Creation of `makeUserAdmin` helper in `tests/integration/helpers/users.ts`.
- Refactoring `tests/integration/permissions.test.ts` to use the helper.
- Refactoring `tests/integration/campaign-global-api.integration.test.ts` to use the helper.
- Elimination of raw MongoClient/ObjectId imports and connect/close lifecycles in both test files.

### Out of Scope

- Adding an API endpoint for admin promotion (this remains a longer-term consideration).
- Refactoring non-admin database interactions in other test suites (e.g., E2E, mock cleanups, or password resets).
- Migration of integration tests to a shared server.

## What Changes

- **Add**: `makeUserAdmin` helper to `tests/integration/helpers/users.ts`.
- **Modify**: `tests/integration/permissions.test.ts` to use the helper and remove MongoClient connection logic.
- **Modify**: `tests/integration/campaign-global-api.integration.test.ts` to use the helper and remove MongoClient connection logic.

## Risks

- **Risk**: The helper could leak connections if the `finally` block fails to execute.
  - **Impact**: Port exhaustion or test environment database freezing due to too many open connections.
  - **Mitigation**: Wrap the connection logic in a strict `try/finally` block ensuring `client.close()` is always called.
- **Risk**: Slower tests if a new client is spun up and torn down for every helper call.
  - **Impact**: Minor test execution overhead.
  - **Mitigation**: Admin promotion is done once per test suite run (in `beforeAll` or for a single test case), so the overhead is negligible (a few milliseconds).

## Open Questions

- **Question**: Should the helper function signature accept the connection string or read from `process.env`?
  - **Needed from**: Developer / Design review.
  - **Blocker for apply**: No. (We design it to accept an optional `mongoUri` defaulting to `process.env.MONGODB_URI` to satisfy both local usage and flexibility for future refactorings).

- **Question**: Are there any unresolved ambiguities in the requirement?
  - **Needed from**: Requester.
  - **Blocker for apply**: No. (The requirements are fully clear).

## Non-Goals

- Creating a public-facing admin promotion API route.
- Changing the schema or mechanism of how admin status is represented (it remains `isAdmin: true` in the user document).

## Change Control

If scope changes after proposal approval, update `proposal.md`, `design.md`,
`specs/**/*.md`, and `tasks.md` before implementation starts.
