## Context

- **Relevant architecture**: Integration testing environment (Jest, ts-jest, MongoDB test container/local instance).
- **Dependencies**: `@testcontainers/mongodb`, `mongodb` package.
- **Interfaces/contracts touched**:
  - `tests/integration/helpers/users.ts` (exporting a new helper function).
  - `tests/integration/permissions.test.ts` (consuming the new helper, removing old DB setup).
  - `tests/integration/campaign-global-api.integration.test.ts` (consuming the new helper, removing old DB setup).

## Goals / Non-Goals

### Goals

- Centralize MongoDB admin promotion logic in a reusable helper function.
- Clean up duplicate `MongoClient` setup/teardown boilerplate in integration test files.
- Enable easier migration to a shared server configuration in the future.

### Non-Goals

- Changing app-level database structures or production user model logic.
- Exposing a HTTP API endpoint to promote users to admin in production.
- Refactoring DB helper setups for unit tests or non-admin integration/E2E test files.

## Decisions

### Decision 1: Placement and Signature of the Helper

- **Chosen**: Export `makeUserAdmin(userId: string, mongoUri?: string, mongoDb?: string): Promise<void>` from [tests/integration/helpers/users.ts](../../../tests/integration/helpers/users.ts).
- **Alternatives considered**:
  - Create a new helper file `tests/integration/helpers/db.ts`.
  - Keep the helper inline but in a shared setup file.
- **Rationale**: `tests/integration/helpers/users.ts` already defines user-related test setup functions (`registerTestUser`). Promoting a user to admin is naturally part of the user setup lifecycle in integration tests.
- **Trade-offs**: Slightly increases the scope of `users.ts` but avoids file proliferation.

### Decision 2: MongoDB Client Lifecycle Management inside the Helper

- **Chosen**: Instantiate a new `MongoClient` inside `makeUserAdmin`, call `.connect()`, execute the update query, and guarantee disconnection by calling `.close()` inside a `finally` block.
- **Alternatives considered**:
  - Keep a singleton/global `MongoClient` in the helper.
- **Rationale**: Creating a single connection and tearing it down immediately is simple, stateless, and eliminates the risk of persistent connection leaks. The performance overhead of connecting/disconnecting once or twice in `beforeAll` is negligible (~a few milliseconds).
- **Trade-offs**: Small overhead of establishing a new TCP connection to Mongo per helper call.

## Proposal to Design Mapping

- **Proposal element**: Creation of `makeUserAdmin` helper.
  - **Design decision**: Decision 1 (Placement and Signature).
  - **Validation approach**: TypeScript compiler check and unit invocation in integration tests.
- **Proposal element**: Refactor `permissions.test.ts` to use helper.
  - **Design decision**: Decision 2 (Lifecycle Management).
  - **Validation approach**: Execute permissions tests using `npm run test:integration`.
- **Proposal element**: Refactor `campaign-global-api.integration.test.ts` to use helper.
  - **Design decision**: Decision 2 (Lifecycle Management).
  - **Validation approach**: Execute campaign global API tests using `npm run test:integration`.

## Functional Requirements Mapping

- **Requirement**: A registered user must be promoted to admin by updating their `isAdmin` flag in the `users` collection.
  - **Design element**: MongoDB update query `{ $set: { isAdmin: true } }` matched by `_id: new ObjectId(userId)`.
  - **Acceptance criteria reference**: `specs/integration-test-patterns/spec.md`.
  - **Testability notes**: Verified by ensuring the `isUserAdmin(userId)` checks return `true` after calling `makeUserAdmin`.

- **Requirement**: Throw clear, helpful error if user is not found.
  - **Design element**: Check `result.matchedCount === 0` in update query result, throw `Error` if 0.
  - **Acceptance criteria reference**: System-level stability.
  - **Testability notes**: Pass an invalid/unknown but valid-format `ObjectId` string to `makeUserAdmin` and assert it rejects.

## Non-Functional Requirements Mapping

- **Requirement category**: Reliability / Operability
  - **Requirement**: Ensure no database connections are leaked under any execution path (success or error).
  - **Design element**: Use `try { ... } finally { await client.close(); }` structure.
  - **Acceptance criteria reference**: Jest process exits cleanly without active handles warning.
  - **Testability notes**: Run integration tests and observe process exits.

## Risks / Trade-offs

- **Risk/trade-off**: Performance overhead of connection setup.
  - **Impact**: Negligible (less than 10ms per test file).
  - **Mitigation**: Acceptable given that this only runs during integration tests setup phases, not in production path.

## Rollback / Mitigation

- **Rollback trigger**: Test suite fails or experiences DB lockups due to helper-introduced regressions.
- **Rollback steps**: Git revert the commit adding the helper and consumption changes.
- **Data migration considerations**: None (no schema migrations are run).
- **Verification after rollback**: Run `npm run test:integration` to verify tests pass with old inline setups.

## Operational Blocking Policy

- **If CI checks fail**: Do not merge the PR. Identify compile, lint, or test failures and fix them.
- **If security checks fail**: Address vulnerabilities or permission issues prior to staging.
- **If required reviews are blocked/stale**: Address reviewer comments, request re-review, do not force-merge.
- **Escalation path and timeout**: Escalate to repository owner if block persists past 24 hours.

## Open Questions

None. All details of requirements and connection lifecycle management have been resolved.
