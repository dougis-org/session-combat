## Context

- **Relevant architecture:** Next.js API routes wrapped by `withAuth`/`withAuthAndParams` from `lib/middleware.ts`. Unit tests in `tests/unit/api/**` and `tests/unit/import/` test route handlers in isolation. Shared test utilities live in `tests/unit/helpers/route.test.helpers.ts`.
- **Dependencies:** Jest (test runner), `@/lib/middleware` (module being mocked), `tests/unit/helpers/route.test.helpers.ts` (shared helpers consumed by all affected files).
- **Interfaces/contracts touched:** Public API of `route.test.helpers.ts` — specifically the signatures of `itReturns401`, `itReturns401WithParams`, `itReturns500`, `itReturns500WithParams`, `itReturns404WithParams`, and `mockUnauthorized`.

## Goals / Non-Goals

### Goals

- Replace auto-mock of `@/lib/middleware` with an explicit factory mock that stubs `withAuth`/`withAuthAndParams` as pass-throughs
- Remove all route-level 401 tests (auth is tested in `middleware.test.ts`)
- Update shared helpers to not require a `mockedRequireAuth` argument
- Ensure all existing non-401 tests continue to pass without modification to application code

### Non-Goals

- Removing `requireAuth` from `lib/middleware.ts`
- Adding 503-branch tests to `middleware.test.ts`
- Changing any route handler implementation

## Decisions

### Decision 1: Factory mock shape for `withAuth` and `withAuthAndParams`

- **Chosen:**
  ```ts
  jest.mock("@/lib/middleware", () => ({
    withAuth: (handler: Function) => (req: NextRequest) => handler(req, MOCK_AUTH),
    withAuthAndParams: (handler: Function) => (req: NextRequest, ctx: any) =>
      handler(req, MOCK_AUTH, ctx.params),
  }));
  ```
  `MOCK_AUTH` is imported from `route.test.helpers.ts` — but because jest.mock factories run before imports are resolved, files must inline the auth payload or use `jest.mock` with a module-level variable.
  
  **Resolved approach:** inline `{ userId: "user-123", email: "user@example.com", tokenVersion: 0 }` in the factory, or import MOCK_AUTH after hoisting. The existing reference file (`users/search/route.unit.test.ts`) uses an inline userId string. Each file will inline the minimal payload needed.

- **Alternatives considered:** Keep `requireAuth` inside the factory (hybrid pattern from `characterImportRoute.test.ts`) — rejected because it keeps the deprecated symbol and unnecessary complexity.
- **Rationale:** Matches the already-approved pattern in `tests/unit/api/users/search/route.unit.test.ts`.
- **Trade-offs:** Slightly more verbose per-file mock factory vs. a single auto-mock line. Acceptable — the explicitness is the point.

### Decision 2: Remove `itReturns401`/`itReturns401WithParams` entirely

- **Chosen:** Delete both helpers and all call sites. Do not replace them with a new auth-failure helper.
- **Alternatives considered:** Rewrite helpers to test auth by using a module-level variable the factory reads — rejected as unnecessary complexity given `middleware.test.ts` covers this path fully.
- **Rationale:** Auth rejection is middleware's responsibility. Route tests should only verify business logic executes correctly when auth passes. User confirmed this decision in exploration.
- **Trade-offs:** Visible test count drops slightly. Offset by improved test accuracy.

### Decision 3: Update `itReturns500`/`itReturns500WithParams`/`itReturns404WithParams` signatures

- **Chosen:** Drop the `mockedRequireAuth: jest.Mock` parameter from all three. Remove the `mockedRequireAuth.mockReturnValue(MOCK_AUTH)` line inside each (auth is always-pass via factory).
- **Alternatives considered:** Keep the param as optional (`mockedRequireAuth?: jest.Mock`) for backwards compatibility — rejected, no reason to keep dead params.
- **Rationale:** Clean break; all call sites update in the same PR.
- **Trade-offs:** Breaking change to helper API. Acceptable since all consumers are in this repo and updated in the same change.

### Decision 4: `mockUnauthorized` helper

- **Chosen:** Delete `mockUnauthorized` from `route.test.helpers.ts`. It is only used by the deleted 401 helpers.
- **Alternatives considered:** Keep it for any ad-hoc use — no such use found by grep.
- **Rationale:** Dead code once 401 helpers are removed.
- **Trade-offs:** None.

## Proposal to Design Mapping

- **Proposal element:** Replace auto-mock with factory mock
  - **Design decision:** Decision 1 (factory shape)
  - **Validation approach:** `npx jest tests/unit` passes with no failures after migration

- **Proposal element:** Drop 401 tests from route files
  - **Design decision:** Decision 2 (delete helpers + call sites)
  - **Validation approach:** `grep -rn "itReturns401" tests/unit/` returns no results (excluding deleted lines)

- **Proposal element:** Drop `mockedRequireAuth` param from 500/404 helpers
  - **Design decision:** Decision 3 (signature update)
  - **Validation approach:** TypeScript compilation clean (`npx tsc --noEmit`)

- **Proposal element:** Remove `mockUnauthorized`
  - **Design decision:** Decision 4 (delete)
  - **Validation approach:** No remaining references in `tests/unit/` (grep)

## Functional Requirements Mapping

- **Requirement:** All route tests invoke handler with correct `AuthPayload`
  - **Design element:** Factory mock inlines `MOCK_AUTH`-equivalent payload
  - **Acceptance criteria reference:** specs/test-helpers.md, specs/route-test-files.md
  - **Testability notes:** Run jest and confirm handler assertions pass with expected userId

- **Requirement:** No test file imports `requireAuth` except `middleware.test.ts`
  - **Design element:** Remove import in all 23 files
  - **Acceptance criteria reference:** specs/route-test-files.md
  - **Testability notes:** `grep -rn "requireAuth" tests/unit/ | grep -v middleware.test.ts` → empty

- **Requirement:** Shared helpers compile without `mockedRequireAuth` param
  - **Design element:** Decision 3 signature update
  - **Acceptance criteria reference:** specs/test-helpers.md
  - **Testability notes:** `npx tsc --noEmit` clean

## Non-Functional Requirements Mapping

- **Requirement category:** reliability
  - **Requirement:** All existing non-401 tests continue to pass
  - **Design element:** Factory mock is a transparent pass-through; handler receives same `AuthPayload` shape as before
  - **Acceptance criteria reference:** specs/route-test-files.md
  - **Testability notes:** Full unit test suite green

- **Requirement category:** operability
  - **Requirement:** Migration is mechanical and reviewable in a single PR
  - **Design element:** Start with `route.test.helpers.ts`, then update files in directory groups
  - **Acceptance criteria reference:** tasks.md
  - **Testability notes:** PR diff shows consistent pattern across all files

## Risks / Trade-offs

- **Risk/trade-off:** Jest factory mock hoisting means `MOCK_AUTH` import may not be available inside the factory.
  - **Impact:** Runtime error if factory tries to reference an imported symbol.
  - **Mitigation:** Inline the auth payload directly in each factory (no import reference needed). The payload is a simple literal: `{ userId: "user-123", email: "user@example.com", tokenVersion: 0 }`.

- **Risk/trade-off:** A file uses `requireAuth` for something other than the mock pattern.
  - **Impact:** Would need a custom factory.
  - **Mitigation:** Grep of all 23 files confirms uniform pattern — no exceptions found.

## Rollback / Mitigation

- **Rollback trigger:** Tests fail in CI after the PR lands and the root cause is the factory mock change (not a pre-existing flake).
- **Rollback steps:** `git revert <merge-commit>` — change is entirely in test files, no application code changes.
- **Data migration considerations:** None — test-only change.
- **Verification after rollback:** `npx jest tests/unit` passes.

## Operational Blocking Policy

- **If CI checks fail:** Fix the failing tests before merging. Do not merge with failing unit tests. The migration is mechanical — failures indicate a file was missed or the factory shape needs adjustment.
- **If security checks fail:** Not applicable — test-only change touches no application code or secrets.
- **If required reviews are blocked/stale:** Ping reviewer after 24h. Escalate to repo maintainer after 48h.
- **Escalation path and timeout:** 48h stale review → merge with maintainer approval.

## Open Questions

No open questions. All decisions confirmed during the explore session before this proposal was created.
