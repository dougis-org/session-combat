## Context

- Relevant architecture: Next.js API Routes (`app/api/**`) interacting with the database layer. Tests are written in Jest and use `jest.mock()` to intercept dependencies.
- Dependencies: `lib/storage.ts`, `lib/storage/sessionLogRepo.ts`, `lib/storage/rollRepo.ts`.
- Interfaces/contracts touched: The dependency injection / import structure for routes calling storage methods.

## Goals / Non-Goals

### Goals

- Replace all `import { storage }` with `import * as sessionLogRepo` and `import * as rollRepo` in the 4 impacted route handlers.
- Update the 5 unit test files to accurately mock the split repos instead of the god object.

### Non-Goals

- Refactoring the internal implementations of the repos.
- Modifying other domains attached to `storage.ts`.

## Decisions

### Decision 1: Direct Module Imports

- Chosen: Use `import * as sessionLogRepo from '@/lib/storage/sessionLogRepo'` and `import * as rollRepo from '@/lib/storage/rollRepo'`.
- Alternatives considered: Importing specific named functions (e.g. `import { saveSessionLog } from ...`).
- Rationale: Using namespace imports (`import * as repo`) keeps the call sites visually similar (`sessionLogRepo.saveSessionLog` instead of `storage.saveSessionLog`) and plays perfectly with Jest's module mocking capabilities without requiring object destructuring changes.
- Trade-offs: None. This is standard pattern in this codebase.

### Decision 2: Isolated Jest Mocks

- Chosen: Create separate `jest.mock('@/lib/storage/sessionLogRepo')` and `jest.mock('@/lib/storage/rollRepo')` calls in the test files.
- Alternatives considered: Using `jest.spyOn`.
- Rationale: The codebase relies on `jest.mock()` hoisting to intercept the entire module. Continuing this pattern ensures consistency.
- Trade-offs: Requires ensuring the mock correctly specifies the module path.

## Proposal to Design Mapping

- Proposal element: Updating route handlers
  - Design decision: Decision 1: Direct Module Imports
  - Validation approach: CI Typecheck and Route Handler Unit Tests

- Proposal element: Updating unit tests
  - Design decision: Decision 2: Isolated Jest Mocks
  - Validation approach: Unit test execution

## Functional Requirements Mapping

- Requirement: Route handlers must use `sessionLogRepo` for session operations and `rollRepo` for roll operations.
  - Design element: Decision 1
  - Acceptance criteria reference: Specs (no behavior change)
  - Testability notes: Verify via `npm run test:unit`.

## Non-Functional Requirements Mapping

- Requirement category: operability
  - Requirement: Pure mechanical refactor, zero logic changes.
  - Design element: Decision 1 & Decision 2
  - Acceptance criteria reference: Specs
  - Testability notes: The compiled output logic should be functionally identical. Verified via existing test suite.

## Risks / Trade-offs

- Risk/trade-off: Broken test mocks
  - Impact: Tests might hit the real database or fail due to unmocked functions.
  - Mitigation: Use precise `jest.mock()` strings and rely on the CI test suite to catch any failures.

## Rollback / Mitigation

- Rollback trigger: Merged code causes unexpected database connection errors or test failures on main.
- Rollback steps: Revert the PR using GitHub's "Revert" button.
- Data migration considerations: None.
- Verification after rollback: Ensure CI passes on the revert commit.

## Operational Blocking Policy

- If CI checks fail: The developer must fix the imports or mocks locally and push a new commit.
- If security checks fail: N/A for this refactor.
- If required reviews are blocked/stale: Ping code owners after 24 hours.
- Escalation path and timeout: N/A.

## Open Questions

- None.
