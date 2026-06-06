## GitHub Issues

- #340

## Why

- **Problem statement:**
  28 unit test files mock the deprecated `requireAuth` helper directly via `jest.mock("@/lib/middleware")`. This auto-mocks the middleware module, which causes the route handlers under test to bypass the actual `withAuth` and `withAuthAndParams` wrappers entirely. As a result, the `checkAuth` token version database check is never executed, creating a silent coverage gap where authentication rejection and the 503 "Service unavailable" error branch are not verified in unit tests.
- **Why now:**
  Correcting this mocking pattern closes the coverage gap and ensures authentication checks are fully executed up to the boundary in all route tests.
- **Business/user impact:**
  Improves confidence in route authentication logic, prevents regression bugs in `withAuth` wrappers, and eliminates deprecated `requireAuth` mocking boilerplate.

## Problem Space

- **Current behavior:**
  Unit tests mock `requireAuth` globally via `jest.mock("@/lib/middleware")` and stub its return value. The route handlers are exported wrapped in `withAuth(handler)` or `withAuthAndParams(handler)`. Since `withAuth` is auto-mocked, the route under test runs without executing the real wrapper code.
- **Desired behavior:**
  Route unit tests explicitly mock `withAuth` and `withAuthAndParams` as factories that delegate to the real route handler while injecting a mocked user payload based on a shared state variable (`mockAuthState`).
- **Constraints:**
  - Route business logic tests must remain isolated and fast. They must not contact the database.
  - Test files must not import `requireAuth` from `@/lib/middleware` (except `middleware.test.ts`).
- **Assumptions:**
  - Route unit tests only need to verify route behavior when authenticated (success/business logic) and unauthenticated (401 response).
  - High-fidelity checking of `withAuth` logic (token verification, DB connection errors, stale tokens) is already covered in `tests/unit/lib/middleware.test.ts` and does not need to be duplicated in every route test.
- **Edge cases considered:**
  - Route handlers with dynamic parameters (e.g. `[id]`) wrapped in `withAuthAndParams` need to receive their params correctly at test execution time.
  - Seeding database tests (like `campaigns.members.test.ts`) that test route imports must use the same wrapper mock pattern.
  - Utility/helper tests (like `api-helpers.test.ts`) that test `requireAdmin` directly should mock `requireAuth` locally without importing it.

## Scope

### In Scope

- Introduce a shared `mockAuthState` object in `tests/unit/helpers/route.test.helpers.ts`.
- Update the shared route test helper functions (`itReturns401`, `itReturns500`, `itReturns401WithParams`, `itReturns404WithParams`, `itReturns500WithParams`) in `route.test.helpers.ts` to manipulate `mockAuthState.payload` rather than configuring a mocked `requireAuth`.
- Replace the `@/lib/middleware` mocks in the 28 affected unit test files with a factory that dynamically mocks `withAuth`/`withAuthAndParams` based on `mockAuthState`.
- Eliminate all imports and references to `requireAuth` from the affected unit tests.
- Verify that all unit tests continue to pass.

### Out of Scope

- Adding or modifying functional business logic in `lib/middleware.ts`.
- Adding new route-level behavior tests beyond fixing the mocking boundary.

## What Changes

- `tests/unit/helpers/route.test.helpers.ts`: Add `mockAuthState` and update assertion helpers.
- 28 unit test files: Update `jest.mock("@/lib/middleware")` mock factory, remove `requireAuth` imports/references, update assertion calls.

## Risks

- **Risk:**
  Updating 28 unit tests simultaneously may introduce syntax errors or break test suites.
  - **Impact:** Moderate (temporary test suite breakage).
  - **Mitigation:** Update files incrementally, verifying syntax and running tests in groups using `npm run test:unit`.

## Open Questions

- No unresolved ambiguity exists. The desired design and implementation steps are fully aligned with the issue description.

## Non-Goals

- Deprecating or refactoring `requireAdmin` helper logic.
- Rewriting user registration, login, or session storage flows.

## Change Control

If scope changes after proposal approval, update `proposal.md`, `design.md`, `specs/**/*.md`, and `tasks.md` before implementation starts.
