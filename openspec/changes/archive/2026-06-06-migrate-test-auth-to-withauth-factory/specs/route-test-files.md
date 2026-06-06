## MODIFIED Requirements

This document details *changes* to requirements and is additive to the `design.md` document, not a replacement.

### Requirement: MODIFIED middleware mock in all 23 affected route test files

Each affected test file SHALL mock `@/lib/middleware` using an explicit factory that stubs `withAuth` and (where used) `withAuthAndParams` as pass-throughs, rather than using `jest.mock("@/lib/middleware")` auto-mock.

#### Scenario: Route handler executes during test

- **Given** a test file with `jest.mock("@/lib/middleware", () => ({ withAuth: (handler) => (req) => handler(req, MOCK_AUTH) }))`
- **When** the route handler is invoked in a test
- **Then** the handler function body executes (not a jest.fn() no-op)

#### Scenario: No `requireAuth` import in affected files

- **Given** any of the 23 affected test files after migration
- **When** `grep -n "requireAuth" <file>` is run
- **Then** zero matches (no import, no jest.mocked reference, no mock setup)

### Requirement: MODIFIED `itReturns500` / `itReturns404WithParams` call sites

Each call site in the 23 affected files SHALL omit the `mockedRequireAuth` argument to match the updated helper signatures.

#### Scenario: Call site compiles without type error

- **Given** an updated test file that calls `itReturns500(handler, makeReq, setupError)`
- **When** TypeScript compilation runs
- **Then** no type error is reported for that call

## REMOVED Requirements

### Requirement: REMOVED `itReturns401` / `itReturns401WithParams` call sites

Reason for removal: Route tests no longer test auth rejection. Each call site is deleted outright (not replaced).

## Traceability

- Proposal element "replace auto-mock with factory mock" → MODIFIED middleware mock requirement
- Proposal element "drop 401 tests" → REMOVED `itReturns401` / `itReturns401WithParams` call sites
- Design decision 1 (factory shape) → MODIFIED middleware mock requirement
- Design decision 2 (delete 401 helpers) → REMOVED call sites
- Design decision 3 (drop mockedRequireAuth param) → MODIFIED call sites
- MODIFIED middleware mock → Tasks: update-campaigns-tests, update-characters-tests, update-combat-tests, update-content-tests, update-encounters-tests, update-monsters-tests, update-misc-tests

## Non-Functional Acceptance Criteria

### Requirement: Reliability

#### Scenario: Full unit test suite passes after migration

- **Given** all 23 files updated with factory mocks and helper call sites corrected
- **When** `npx jest --config jest.config.js tests/unit` is run
- **Then** all tests pass, zero failures

#### Scenario: No `requireAuth` references remain outside `middleware.test.ts`

- **Given** the completed migration
- **When** `grep -rn "requireAuth" tests/unit/ | grep -v middleware.test.ts` is run
- **Then** zero lines output
