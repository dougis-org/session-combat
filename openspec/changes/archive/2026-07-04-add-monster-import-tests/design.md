## Context

- Relevant architecture: Playwright End-to-End testing suite, domain-driven structure.
- Dependencies: Playwright framework, existing helper functions in `tests/e2e/helpers/actions.ts`.
- Interfaces/contracts touched: E2E testing layer for Monster Import and Encounter Creation workflows.

## Goals / Non-Goals

### Goals

- Implement comprehensive E2E test coverage for monster import and encounter workflows.
- Integrate smoothly with existing CI configurations (`npm run test:regression`).
- Structure tests into clean domain-specific files (`monsters.spec.ts`, `encounters.spec.ts`).

### Non-Goals

- Combat screen tests (Phase 3b).
- Application code refactoring.

## Decisions

### Decision 1: Domain-Driven Test File Split

- Chosen: Create two separate domain test files (`monsters.spec.ts` and `encounters.spec.ts`).
- Alternatives considered: Adding all new regression tests to a monolithic `regression.spec.ts` file.
- Rationale: Aligns with the project's existing test structure (e.g., `characters.spec.ts`, `parties.spec.ts`), improving maintainability and isolation.
- Trade-offs: Slightly more boilerplate across two files instead of one.

### Decision 2: Handling 5MB File Size Limit Test

- Chosen: Generate a sparse payload dynamically in Playwright to simulate a >5MB file upload (the application's `MAX_FILE_SIZE = 5 * 1024 * 1024` limit in `MonsterImportContent`).
- Alternatives considered: Committing a >5MB JSON fixture file to the repository.
- Rationale: Checking in large files to Git impacts clone times and repository size. Dynamic buffer generation tests the UI rejection logic safely without file system artifacts.
- Trade-offs: May not test backend upload limits if the UI handles the rejection entirely, but this is acceptable for UI-focused E2E tests.

## Proposal to Design Mapping

- Proposal element: Two new E2E test files (`monsters.spec.ts`, `encounters.spec.ts`)
  - Design decision: Decision 1
  - Validation approach: Both test files pass successfully in the Playwright runner.
- Proposal element: Testing oversized files (>5MB mock)
  - Design decision: Decision 2
  - Validation approach: Test verifies the UI error state when a mocked >5MB file is attached.

## Functional Requirements Mapping

- Requirement: Monster Import Flow (valid, invalid, format limits)
  - Design element: `monsters.spec.ts` tests using a shared fixture and inline payloads.
  - Acceptance criteria reference: Monster specifications (valid JSON, invalid JSON, 5MB limit, persistence).
  - Testability notes: Verified by Playwright runner.

- Requirement: Encounter Creation Flow (create with imports, persistence)
  - Design element: `encounters.spec.ts`
  - Acceptance criteria reference: Encounter specifications.
  - Testability notes: Verified by Playwright runner using the `createEncounter()` helper.

## Non-Functional Requirements Mapping

- Requirement category: performance
  - Requirement: Ensure tests execute efficiently and do not bloat the repository.
  - Design element: Decision 2 (Handling 5MB File Size Limit Test).
  - Acceptance criteria reference: Tests pass without hanging.
  - Testability notes: Validate execution time locally and in CI.

## Risks / Trade-offs

- Risk/trade-off: Mocking file size limits instead of actually uploading real >5MB files.
  - Impact: Could potentially hide backend misconfiguration if backend is supposed to handle the limit rejection and UI fails to catch it.
  - Mitigation: Ensure UI logic is robust enough to catch it before submitting.

## Rollback / Mitigation

- Rollback trigger: Merged tests cause persistent flakiness or CI pipeline failures on the main branch.
- Rollback steps: Revert the test addition PR.
- Data migration considerations: N/A (test code only).
- Verification after rollback: Verify that `npm run test:regression` passes stably in CI.

## Operational Blocking Policy

- If CI checks fail: Diagnose and fix failing test suites before merge.
- If security checks fail: Review and address any exposed vulnerabilities in added dependencies.
- If required reviews are blocked/stale: Ping project maintainers.
- Escalation path and timeout: Re-request review after 24 hours.

## Open Questions

- None.
