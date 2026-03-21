## Context

Authentication is currently untested (0% coverage in `lib/auth.ts` and `/api/auth/*` routes). This module is the highest-priority runtime-critical code because it gates access to all other features and any vulnerabilities or bugs directly impact user security and system availability. The proposal calls for comprehensive unit and integration tests following TDD: write failing tests first, then implement test logic, measuring the coverage delta as success.

Current state:
- `lib/auth.ts` handles token generation, validation, and session management
- `/api/auth/*` routes handle registration, login, logout flows
- Tests use Jest for unit tests and jest-testcontainers for integration tests with real MongoDB
- Coverage uploaded to Codacy via lcov.info artifacts

## Goals / Non-Goals

**Goals:**
- Establish TDD pattern: write failing unit tests for `lib/auth.ts` edge cases and error paths
- Establish integration test pattern: test `/api/auth/*` routes with real database and session state
- Measure and document coverage baseline before/after to validate Wave 1 success (target: 80% net line coverage)
- Unblock Wave 2 work (character, party, encounter routes) by validating auth is trustworthy
- Ensure all tests are parallel-safe (runnable concurrently in CI without shared state)

**Non-Goals:**
- Refactoring auth module for better testability (use current API as-is)
- Changing any user-facing auth behavior or security policy
- Security testing (password hashing verification, rate-limiting, brute-force) → deferred to security hardening phase
- Load/performance testing → separate effort
- Coverage for dependent modules (handled in Wave 2)

## Decisions

### Decision 1: Use TDD with Jest for unit tests, integration tests with test containers and real MongoDB

**Approach:** Write failing unit tests first in `tests/unit/lib/auth.test.ts`, implement the test assertions, then write integration tests in `tests/integration/api/auth/*.test.ts` that use test containers with real MongoDB. All tests SHALL be parallel-safe (independent setup/teardown, no shared state).

**Rationale:**
- TDD forces thoughtful test design before implementation reveals shortcuts
- Real database for integration tests ensures session/credential logic works against actual persistence layer
- Test containers guarantee isolation between CI runs and enable parallel test execution without conflicts
- Existing jest + testcontainers setup is proven in repo; reuse it
- Parallel safety unblocks concurrent test execution, reducing feedback loop time
- Simplifies debugging because test failures correspond to real behavior, not mock mismatches

**Alternatives considered:**
- Mocking MongoDB → Rejected because auth token/session state interactions with DB are too complex to mock safely
- Using in-memory database → Rejected because it doesn't validate against actual Mongoose schema

**Testability notes:**
- Unit tests validate token functions (generation, validation, expiry) in isolation
- Integration tests validate route handlers call auth functions correctly and side-effects (user creation, token storage) persist
- Coverage tools measure both unit and integration test execution

### Decision 2: Structure tests by module: auth functions separate from route handlers; internal functions tested centrally

**Approach:** Keep `tests/unit/lib/auth.test.ts` focused on auth module functions (generateToken, validateToken, etc., including internal/private functions if widely used). Keep `tests/integration/api/auth/register.test.ts`, `login.test.ts`, `logout.test.ts` for route-specific logic and database interactions.

**Rationale:**
- Separates concerns: units test functions, integration tests test API contracts
- Centralized testing of internal functions improves maintainability (test behavior once, reuse in route tests)
- Makes debugging easier (if a test fails, you know whether it's the function or the route)
- Reduces duplicate test code (don't repeat token validation in every route test)

**Testability notes:**
- Unit tests use mocked context (no database, no HTTP); test internal/private functions if they're central to behavior
- Integration tests use real MongoDB test containers, HTTP requests to routes, assertions on database state
- Fresh user data generated per test (no shared state); seeded catalog data (Monsters, characters) acceptable as read-only reference
- Coverage reported per file; auth module coverage counted separately from route coverage

### Decision 3: Measure baseline coverage before/after

**Approach:** Before starting, capture `coverage/coverage-summary.json` showing current auth module coverage (should be 0%). After tests pass, re-run coverage and record the delta. Document in a closure summary for issue #72.

**Rationale:**
- Proves progress objectively
- Establishes measurement discipline so Wave 2+ can be compared
- Validates that the test suite actually exercises the code (coverage must move)

**Testability notes:**
- Run `npm run test:unit -- --coverage` and `npm run test:integration -- --coverage` separately, merge results with existing coverage script
- Compare baseline to final to document success

## Risks / Trade-offs

**Risk: Auth tests expose bugs in current implementation**
- Mitigation: TDD approach (tests first) means bugs become explicit as test failures before code ships
- Acceptable because we're raising the bar intentionally

**Risk: Integration tests slow down local development**
- Mitigation: Keep unit tests fast (no database), run integration tests separately; CI runs both
- Developers can run `npm run test:unit` for fast local feedback

**Risk: MongoDB test container flakiness in CI**
- Mitigation: Re-use existing integration test infrastructure (testcontainers already in use for other suites)
- Use health checks and retries (already configured in CI workflow)
- Timeout at 10 minutes maximum for parallel execution (prevents infinite loops from test hangs)

**Risk: Testing brittle message strings instead of error codes**
- Mitigation: Test error codes and responses, NEVER test message strings. If implementation returns pass/fail boolean, accept it and don't create test failures around it.

**Risk: Scope creeps to session/refresh token logic not currently in scope**
- Mitigation: Change control in proposal; any scope expansion requires re-approval

## Migration Plan

No migration required. Tests are additive; no existing code removal or deprecation. New test files coexist alongside existing Playwright regression tests and zero-coverage silence.

## Resolved Questions (from user feedback)

1. **Security scope:** Password hashing verification and security hardening deferred to later phase. Wave 1 covers token validation, credential checks, and session state.
2. **Coverage target:** 80% net line coverage across unit + integration tests combined.
3. **Test container usage:** SHALL use test containers for integration tests; no MongoDB mocking.
4. **Parallel safety:** All tests must be parallel-safe; each test sets up and tears down its own state. Parallel execution timeout: 10 minutes max (to prevent infinite loops; performance tuning deferred).
5. **Unit test scope:** Tests SHALL cover internal and private functions if widely used; centralized testing of internal behavior is a good practice for maintainability.
6. **Test data generation:** Tests SHALL generate fresh user data for each test run (no shared state). Seeded/catalog data (Monsters, characters, etc) may be read-only reference data.
7. **Error testing approach:** Tests SHALL align with actual implementation returns (e.g., test numeric error codes as returned, not message strings). NEVER create test failures if current implementation returns pass/fail boolean — accept current behavior as contract.
