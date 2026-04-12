## GitHub Issues

- #138

## Why

- Problem statement:
  `npx tsc --noEmit` still reports a concentrated block of failures in the
  D&D Beyond import fixtures and tests because shared fixture objects are
  inferred too broadly for the current import contracts.
- Why now:
  Phase 1 cleanup isolated this remaining failure cluster, and issue #138 now
  defines a focused follow-up instead of leaving the repo-wide typecheck noisy.
- Business/user impact:
  A clean, trustworthy typecheck signal reduces review friction, makes strict
  typing sustainable in import code, and prevents test maintenance from pushing
  pressure back onto production contracts.

## Problem Space

- Current behavior:
  The shared fixture in `tests/fixtures/dndBeyondCharacter.ts` and many
  spread-based test overrides in
  `tests/unit/import/dndBeyondCharacterImport.test.ts` no longer satisfy the
  current `DndBeyondCharacterData` shape. Nested modifier and action literals
  widen to `string`, and assertions against optional normalized fields do not
  narrow before access.
- Desired behavior:
  Shared D&D Beyond fixtures should satisfy the current import contracts
  directly, test-local overrides should preserve those contracts without
  scattered unsafe casts, and `npx tsc --noEmit` should stop reporting this
  D&D Beyond fixture-related failure set.
- Constraints:
  The fix must stay centered on tests and fixtures. Production contracts in
  `lib/dndBeyondCharacterImport.ts` and `lib/types.ts` must not be loosened to
  silence type errors.
- Assumptions:
  The current import contracts are the source of truth, and the failures are
  due to test drift rather than an unresolved product requirement.
- Edge cases considered:
  Optional normalized fields such as `senses`, `savingThrows`, and `skills`
  remain intentionally optional on `Character`; shared fixture typing must still
  support override-heavy test cases; modifier/action groups may include custom
  keys while still requiring current entry unions.

## Scope

### In Scope

- Align `tests/fixtures/dndBeyondCharacter.ts` to the current
  `DndBeyondCharacterData` contract
- Refactor D&D Beyond import tests to preserve modifier/action unions when
  overriding nested fixture data
- Replace unsafe optional-field assertions in
  `tests/unit/import/dndBeyondCharacterImport.test.ts` with explicit narrowing
- Re-run repo-wide typecheck and targeted D&D Beyond import tests to confirm the
  failure cluster is removed

### Out of Scope

- Any production behavior change in the D&D Beyond import flow
- Loosening `DndBeyondCharacterData`, `DndBeyondModifier`, or
  `DndBeyondActionEntry` to accommodate stale tests
- Broader TypeScript cleanup outside the D&D Beyond fixture-related failures
- New D&D Beyond feature support beyond what the current import contracts
  already describe

## What Changes

- Introduce a dedicated OpenSpec change for the remaining D&D Beyond
  fixture-contract cleanup tracked in #138
- Re-type the shared D&D Beyond fixture source so it satisfies current import
  contracts directly
- Standardize test-local helper patterns for modifier/action overrides and
  optional normalized-field assertions
- Restore repo-wide typecheck clarity by removing the D&D Beyond fixture-related
  failure cluster isolated by phase 1

## Risks

- Risk:
  The cleanup could accidentally hide a real contract mismatch by overusing
  casts in tests.
  - Impact:
    Tests may compile while no longer validating the current import contracts.
  - Mitigation:
    Center the fix on typed shared fixtures and typed helpers, and treat
    repeated `as` casts as a design smell to avoid.
- Risk:
  Optional-field narrowing could become verbose and reduce test readability.
  - Impact:
    The tests may become harder to maintain even if they are correct.
  - Mitigation:
    Use small local variables or helper assertions that keep narrowing explicit
    without repeating boilerplate throughout the suite.
- Risk:
  Repo-wide typecheck may still surface unrelated failures after the D&D Beyond
  cluster is fixed.
  - Impact:
    Reviewers may assume #138 guarantees a fully green typecheck.
  - Mitigation:
    Define acceptance around removing the D&D Beyond fixture-related failures
    while still recording any newly discovered unrelated failures separately.

## Open Questions

- No unresolved scope questions remain. The change is limited to fixture/test
  alignment for the failure set described in #138, and production contracts stay
  unchanged.

## Non-Goals

- Refactoring the D&D Beyond importer beyond what is required for test-fixture
  alignment
- Reworking unrelated test suites while touching the import tests
- Weakening strict typing in production code to reduce maintenance cost in tests

## Change Control

If scope changes after proposal approval, update `proposal.md`, `design.md`,
`specs/**/*.md`, and `tasks.md` before implementation starts.

Proposal must be reviewed and explicitly approved by a human before design,
specs, tasks, or apply proceed.
