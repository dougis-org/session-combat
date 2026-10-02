## Context

- Relevant architecture: Next.js API routes (`app/api/**`) call storage; Jest tests use `jest.mock()` to isolate them. `lib/storage.ts` exports a `storage` object whose methods delegate one-to-one to `lib/storage/*Repo.ts`.
- Dependencies: `savedContentRepo`, `shareRepo`, `campaignTemplateRepo`, `conditionCatalogRepo`, `encounterRepo`, `userPreferencesRepo`.
- Interfaces/contracts touched: import structure of 12 routes; mock targets of 10 tests. No public API contract changes.

## Goals / Non-Goals

### Goals

- Remove all `@/lib/storage` facade imports from `app/`.
- Remove all `jest.mock('@/lib/storage')` from `tests/unit/api/**`.

### Non-Goals

- Altering repo or facade implementations.

## Decisions

### Decision 1: Namespace imports of narrow repos

- Chosen: `import * as shareRepo from '@/lib/storage/shareRepo'`.
- Alternatives considered: named imports.
- Rationale: call sites stay `repo.method(...)`, matching #687 and existing code (`campaignRepo` in `campaigns/[id]/route.ts`); plays well with `jest.mock` automock.
- Trade-offs: none.

### Decision 2: One batch per domain, sequential PRs under parent #690

- Chosen: four sub-issues (#831–#834), one PR each, merged one at a time; #690 closes with the last.
- Alternatives considered: single large PR (22 files, 5+ domains); folding into domain migrations (those issues are already closed).
- Rationale: small reviewable diffs, mirrors the G5a/b/c pattern, isolates a bad mock to one batch.
- Trade-offs: four CI/review cycles.

### Decision 3: Per-repo `jest.mock` replaces the facade mock

- Chosen: `jest.mock('@/lib/storage/<repo>')` per repo the route uses; for `savedContent` the facade's nested object maps to the repo's top-level `list/create/update/remove`.
- Alternatives considered: `jest.spyOn`.
- Rationale: consistent with codebase hoisting pattern.
- Trade-offs: tests mocking multiple domains need multiple mock calls.

### Decision 4: Add validation to content routes in batch 1

- Chosen: use existing `lib/validation/` helpers in the content routes (owner-approved, to resolve Verity gate findings).
- Alternatives considered: waive findings; separate hotfix PR.
- Rationale: owner chose to fix in-place rather than waive.
- Trade-offs: batch 1 is not purely mechanical; invalid input now yields 400.

### Note: Batches 2 and 3 dropped

#832 and #833 were already completed by #828; scope reduced accordingly.

## Proposal to Design Mapping

- Proposal element: route import swaps -> Decision 1 -> validation: typecheck + route tests
- Proposal element: test re-mocking -> Decision 3 -> validation: `npm run test:unit`
- Proposal element: four batches -> Decision 2 -> validation: one PR per sub-issue, CI green

## Functional Requirements Mapping

- Requirement: routes use narrow repos -> Decision 1 -> Specs: Route handlers call narrow repos -> verify by existing route tests.
- Requirement: tests mock narrow repos -> Decision 3 -> Specs: Tests mock narrow repos -> verify by test run and grep.

## Non-Functional Requirements Mapping

- Requirement category: operability
  - Requirement: zero behavior change.
  - Design element: Decisions 1 and 3.
  - Acceptance criteria reference: Specs, Test Suite Isolation.
  - Testability notes: existing suite must pass unchanged in assertions.

## Risks / Trade-offs

- Risk/trade-off: wrong mock path leaks to DB or leaves methods unmocked.
  - Impact: CI failure.
  - Mitigation: run each touched test before and after; grep for residual `@/lib/storage'` mocks.

## Rollback / Mitigation

- Rollback trigger: unexpected DB errors or test failures on main after a batch merges.
- Rollback steps: revert that batch's PR.
- Data migration considerations: none.
- Verification after rollback: CI passes on the revert commit.

## Operational Blocking Policy

- If CI checks fail: fix imports/mocks and push.
- If security checks fail: N/A for this refactor.
- If required reviews are blocked/stale: ping code owners after 24 hours.
- Escalation path and timeout: N/A.

## Open Questions

- None.
