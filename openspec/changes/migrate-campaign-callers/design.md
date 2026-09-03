## Context

- Relevant architecture: The `lib/storage.ts` god-object facade provides storage access for all domain entities. `lib/storage/campaignRepo.ts` is the narrow implementation of Campaign domain storage methods.
- Dependencies: None added or removed.
- Interfaces/contracts touched: Calling patterns in multiple API routes, scripts, and tests.

## Goals / Non-Goals

### Goals

- Migrate 9 Campaign-specific storage methods to be imported directly from `@/lib/storage/campaignRepo` across all callers in the codebase.
- Maintain a passing test suite by correctly updating all `jest.mock("@/lib/storage")` setups.

### Non-Goals

- Refactoring non-Campaign methods in `storage.ts`.
- Changing the internal implementation logic of the Campaign storage methods.

## Decisions

### Decision 1: Direct File Imports

- Chosen: Use `import * as campaignRepo from '@/lib/storage/campaignRepo';`.
- Alternatives considered: Exposing it via a new grouped object `storage.campaign`.
- Rationale: Follows the established Epic #499 pattern to bypass the god-object entirely and force narrow dependencies per file.
- Trade-offs: Callers that use multiple domains (e.g. Campaign and Party) will have multiple storage imports. This is desirable for explicit dependencies but slightly more verbose.

### Decision 2: Mocking Strategy in Tests

- Chosen: Wherever `storage` is mocked via `jest.mock("@/lib/storage")` and campaign methods are referenced, add `jest.mock("@/lib/storage/campaignRepo")` and migrate the campaign mocks.
- Alternatives considered: Using `jest.requireActual` or mocking deeply.
- Rationale: Safest, most explicit way to ensure isolated unit testing.
- Trade-offs: Tedious update required across ~24 test files.

## Proposal to Design Mapping

- Proposal element: Migrate 9 campaign methods
  - Design decision: Direct File Imports
  - Validation approach: All application code compiles and tests pass.
- Proposal element: Update test files
  - Design decision: Mocking Strategy in Tests
  - Validation approach: `npm test` passes without errors.

## Functional Requirements Mapping

- Requirement: No behavior change in Campaign APIs
  - Design element: Direct File Imports
  - Acceptance criteria reference: All tests pass.
  - Testability notes: Verify by running the full test suite.

## Non-Functional Requirements Mapping

- Requirement category: operability
  - Requirement: Decrease god-object coupling
  - Design element: Direct File Imports
  - Acceptance criteria reference: `lib/storage.ts` imports for campaign methods are completely removed from callers.
  - Testability notes: Verify with `grep` that `storage.loadCampaigns` etc are no longer used.

## Risks / Trade-offs

- Risk/trade-off: Missing a test file mock update.
  - Impact: CI will fail during test runs.
  - Mitigation: Let the TypeScript compiler and Jest runner find the missed files. Iterative fixing.

## Rollback / Mitigation

- Rollback trigger: Merged code causes unexpected runtime failures on campaign routes.
- Rollback steps: Revert the PR using standard git tooling.
- Data migration considerations: N/A. No data model changes.
- Verification after rollback: Run standard regression tests.

## Operational Blocking Policy

- If CI checks fail: Developer must address compilation/test errors before merge.
- If security checks fail: Unlikely for a pure refactor, but would block merge.
- If required reviews are blocked/stale: Ping codeowners for Epic #499.
- Escalation path and timeout: N/A.

## Open Questions

- None.
