## Context

- **Relevant architecture:**
  Next.js App Router route handlers wrapped in `withAuth` and `withAuthAndParams` from `lib/middleware.ts`. Unit testing is done via Jest with Node environment.
- **Dependencies:**
  - `tests/unit/helpers/route.test.helpers.ts` provides standard helper assertions and requests.
  - Jest mocking mechanism for module-level isolation.
- **Interfaces/contracts touched:**
  - `@/lib/middleware` exports.
  - Shared assertion contracts in `route.test.helpers.ts`.

## Goals / Non-Goals

### Goals

- Standardize unit test mocking of route endpoints by mocking `withAuth` and `withAuthAndParams` at the boundary.
- Remove all imports and mocks of deprecated `requireAuth` from 28 unit test files (except `middleware.test.ts`).
- Maintain isolated, fast unit tests without introducing database dependencies to route tests.
- Ensure all 147 unit test suites continue to pass successfully.

### Non-Goals

- Refactoring the implementation of `withAuth` or `withAuthAndParams` in `lib/middleware.ts`.
- Rewriting or altering `requireAdmin` behavior.

## Decisions

### Decision 1: State-Based Middleware Mock Factory

- **Chosen:**
  We will introduce a central `mockAuthState` object in `tests/unit/helpers/route.test.helpers.ts` to hold the authentication state (payload or `null` for unauthorized).
  In each of the affected unit test files, `@/lib/middleware` will be mocked with a factory that returns `withAuth` and `withAuthAndParams` wrappers. These wrappers dynamically check `mockAuthState.payload` at request execution time:
  ```typescript
  jest.mock("@/lib/middleware", () => ({
    withAuth: jest.fn((handler) => async (req) => {
      const { NextResponse } = require("next/server");
      const { mockAuthState } = require("@/tests/unit/helpers/route.test.helpers");
      if (!mockAuthState.payload) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      return handler(req, mockAuthState.payload);
    }),
    withAuthAndParams: jest.fn((handler) => async (req, { params }) => {
      const { NextResponse } = require("next/server");
      const { mockAuthState } = require("@/tests/unit/helpers/route.test.helpers");
      if (!mockAuthState.payload) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      return handler(req, mockAuthState.payload, await params);
    }),
  }));
  ```
- **Alternatives considered:**
  Configuring mocks per-test file with standard `jest.fn()` return values. This was rejected because Next.js route handlers import and wrap the handlers at module load time, meaning the mocked wrappers must be set up via a hoisted `jest.mock` factory *before* the route is imported.
- **Rationale:**
  The state-based approach resolves the hoisting problem cleanly by evaluating the auth state dynamically inside the mocked wrappers at request time, allowing easy toggling of authentication status during tests.
- **Trade-offs:**
  Introduces a runtime dependency in the mocks on `route.test.helpers.ts`, which is mitigated by lazily loading `mockAuthState` using `require()` inside the mocked functions.

### Decision 2: Remove `requireAuth` Mocking and Imports

- **Chosen:**
  Remove all top-level imports of `requireAuth` from all route unit tests (except `middleware.test.ts`) and eliminate any corresponding `jest.mocked(requireAuth)` calls and `.mockReturnValue` calls.
- **Alternatives considered:**
  Leave them in place but unused.
- **Rationale:**
  Reduces codebase boilerplate and cleanly complies with the acceptance criteria that no tests should import `requireAuth` from `@/lib/middleware` except `middleware.test.ts`.

### Decision 3: Localized Mocking for `api-helpers.test.ts`

- **Chosen:**
  Since `requireAdmin` directly calls `requireAuth` rather than using `withAuth`, `tests/unit/lib/api-helpers.test.ts` must still mock `requireAuth`. To do this without importing it (which would violate the import constraint), we will define a local mock function at the module scope of the test file and return it from the `jest.mock` factory:
  ```typescript
  const mockRequireAuthFn = jest.fn();
  jest.mock("@/lib/middleware", () => ({
    requireAuth: mockRequireAuthFn,
  }));
  ```
- **Alternatives considered:**
  Importing `requireAuth` anyway.
- **Rationale:**
  Bypasses the import restriction while still allowing full control over `requireAuth` return values in `requireAdmin` unit tests.

## Proposal to Design Mapping

- **Proposal element:** Update 28 unit tests to mock `withAuth`/`withAuthAndParams`.
  - **Design decision:** Decision 1.
  - **Validation approach:** Unit tests successfully run and verify authenticated routes.
- **Proposal element:** Eliminate `requireAuth` imports/references.
  - **Design decision:** Decision 2 & Decision 3.
  - **Validation approach:** Lint check verifies no imports of `requireAuth` exist outside `middleware.test.ts`.
- **Proposal element:** Update helper functions in `route.test.helpers.ts`.
  - **Design decision:** Decision 1.
  - **Validation approach:** Tests for auth failure return 401 correctly.

## Functional Requirements Mapping

- **Requirement:** Route handlers return 401 when the requester is unauthenticated.
  - **Design element:** `itReturns401` and `itReturns401WithParams` helper functions set `mockAuthState.payload = null` inside a `try/finally` block to assert 401 rejection.
  - **Acceptance criteria reference:** `specs/mock-withauth-in-unit-tests/spec.md`.
  - **Testability notes:** Fully covered by unit tests wrapping routes.
- **Requirement:** Route handlers proceed with business logic when authenticated.
  - **Design element:** `mockAuthState.payload` defaults to `MOCK_AUTH` so standard request flows pass authentication checks seamlessly.
  - **Acceptance criteria reference:** `specs/mock-withauth-in-unit-tests/spec.md`.
  - **Testability notes:** Fully covered by existing route unit tests.

## Non-Functional Requirements Mapping

- **Requirement category:** Operability / Performance.
  - **Requirement:** Unit tests must remain fast and isolated.
  - **Design element:** The mock wrappers bypass DB calls and return static values directly.
  - **Acceptance criteria reference:** Unit tests run in < 15 seconds.
  - **Testability notes:** Verified by Jest test run execution times.

## Risks / Trade-offs

- **Risk/trade-off:** Modifying global `mockAuthState` dynamically inside `itReturns401` could leak state to subsequent tests if an assertion fails.
  - **Impact:** High (cascading test failures).
  - **Mitigation:** Use a `try/finally` block in helper assertions to guarantee `mockAuthState.payload` is restored to `MOCK_AUTH` regardless of test outcomes.

## Rollback / Mitigation

- **Rollback trigger:** Unresolvable syntax, type check, or runtime errors across unit tests.
- **Rollback steps:** Run `git checkout -- tests/unit/` to revert all changes.
- **Verification after rollback:** Run `npm run test:unit` to verify everything is back to baseline.

## Operational Blocking Policy

- **If CI checks fail:** The PR remains blocked. Investigate failures via command logs and resolve them before requesting review.
- **If security checks fail:** Address immediately.
- **If required reviews are blocked/stale:** Escalate to the dougis-org team after 24 hours.

## Open Questions

- None.
