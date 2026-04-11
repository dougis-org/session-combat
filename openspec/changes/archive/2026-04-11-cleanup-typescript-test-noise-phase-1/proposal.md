## GitHub Issues

- #135
- #138

## Why

- Problem statement:
  `npx tsc --noEmit` currently reports a mixed set of unrelated test typing
  failures, which makes TypeScript output noisy and less useful as a validation
  signal for current work.
- Why now:
  The issue was identified during follow-up to PR #133, and the current failure
  set has a clear split between straightforward non-D&D cleanup and a larger
  D&D Beyond fixture-contract alignment effort.
- Business/user impact:
  Restoring a cleaner typecheck signal reduces review friction, makes regressions
  easier to spot, and lowers the cost of using `tsc --noEmit` as a routine
  quality gate.

## Problem Space

- Current behavior:
  The repository-wide typecheck fails on several stale tests and test helpers.
  Some failures are small fixture or helper drifts, while a larger cluster comes
  from D&D Beyond import fixtures that are inferred too broadly for the current
  contracts.
- Desired behavior:
  Phase 1 should remove the non-D&D test noise so the remaining TypeScript
  failures are smaller, more focused, and mostly isolated to the D&D Beyond
  fixture work tracked separately.
- Constraints:
  Production types must not be loosened just to silence tests. The cleanup
  should stay limited to test code, test helpers, and safe test-only patterns.
- Assumptions:
  The non-D&D failures are mechanically fixable without design changes to
  production behavior. The D&D Beyond fixture alignment remains a separate
  follow-up tracked in #138.
- Edge cases considered:
  Optional normalized fields must still be asserted safely after cleanup; auth
  mocks must satisfy the current `AuthPayload` shape; env overrides in tests
  must avoid direct mutation patterns that TypeScript now rejects.

## Scope

### In Scope

- Clean up non-D&D typecheck failures in:
  `tests/unit/combat/conditionExpiry.test.ts`,
  `tests/unit/combat/damageResistance.test.ts`,
  `tests/unit/helpers/route.test.helpers.ts`,
  `tests/unit/import/characterImportRoute.test.ts`,
  `tests/unit/import/charactersPageImport.test.ts`,
  `tests/unit/import/dndBeyondCharacterServer.test.ts`, and
  `tests/integration/monsterUpload.test.ts`
- Update stale combat fixtures to match current exported domain types
- Tighten test helper return types where callers now expect narrower async
  behavior
- Refactor read-only env handling in tests to a safe pattern
- Replace unsafe optional-property assertions and partial `Response` casts with
  type-safe test patterns

### Out of Scope

- Narrowing shared D&D Beyond fixtures to the current
  `DndBeyondCharacterData` contract
- The bulk of failures in `tests/unit/import/dndBeyondCharacterImport.test.ts`
- Any production behavior changes unrelated to test/type hygiene

## What Changes

- Isolate issue #135 to the non-D&D cleanup phase and leave D&D Beyond fixture
  alignment to dependent issue #138
- Update the affected non-D&D tests and helpers so they match current exported
  contracts
- Re-establish `npx tsc --noEmit` as a more actionable signal by removing the
  straightforward noise first

## Risks

- Risk:
  Cleanup work could accidentally change test intent rather than just fixing
  typing drift.
  - Impact:
    Tests may still compile but stop guarding the behavior they were meant to
    cover.
  - Mitigation:
    Keep changes narrowly aligned to current domain contracts and retain the
    original behavioral assertions.
- Risk:
  The issue split could leave ambiguity about whether phase 1 is considered
  complete before repo-wide typecheck is fully green.
  - Impact:
    Reviewers may expect `tsc --noEmit` to pass completely when phase 1 only
    reduces the failure set.
  - Mitigation:
    Be explicit in specs and tasks that phase 1 removes the non-D&D failures and
    isolates the remaining D&D Beyond work to #138.

## Open Questions

- No unresolved scope questions remain. Phase 1 is defined as removing the
  non-D&D failures only, with the remaining D&D Beyond fixture-contract work
  delegated to #138.

## Non-Goals

- Solving the D&D Beyond fixture-contract alignment in the same change
- Weakening strict typing in production code to make tests compile
- Refactoring unrelated test suites while touching these files

## Change Control

If scope changes after proposal approval, update `proposal.md`, `design.md`,
`specs/**/*.md`, and `tasks.md` before implementation starts.
