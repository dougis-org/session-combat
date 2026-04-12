## Context

- Relevant architecture:
  `lib/dndBeyondCharacterImport.ts` defines the current import contracts and
  normalization logic;
  `tests/fixtures/dndBeyondCharacter.ts` provides the shared source fixture;
  `tests/unit/import/dndBeyondCharacterImport.test.ts` performs extensive
  spread-based overrides against that fixture.
- Dependencies:
  The change depends on the current exported TypeScript contracts for
  `DndBeyondCharacterData` and the normalized `Character` shape.
- Interfaces/contracts touched:
  Test-facing use of `DndBeyondCharacterData`, modifier/action entry unions, and
  optional normalized fields such as `senses`, `savingThrows`, and `skills`.

## Goals / Non-Goals

### Goals

- Make the shared D&D Beyond fixture satisfy the current import contracts
  directly
- Preserve strict union typing for modifier and action overrides used in tests
- Keep test assertions explicit and type-safe when normalized fields are
  optional
- Remove the D&D Beyond fixture-related `tsc --noEmit` failures without changing
  runtime behavior

### Non-Goals

- Change production normalization behavior
- Relax the current import contract definitions
- Broaden scope to unrelated TypeScript cleanup outside the D&D Beyond failure
  cluster

## Decisions

### Decision 1: Type the shared fixture at the source contract boundary

- Chosen:
  Type the shared fixture data in `tests/fixtures/dndBeyondCharacter.ts`
  directly against the current import contract rather than relying on broad
  object-literal inference.
- Alternatives considered:
  Add per-test casts at each call site; loosen production contracts to accept
  wider shapes.
- Rationale:
  The shared fixture is the root of most failures. Fixing its type boundary once
  keeps the suite aligned with the source-of-truth contract and avoids repeated
  local workarounds.
- Trade-offs:
  The fixture file becomes slightly more explicit about contract details, but
  the rest of the tests become simpler and safer.

### Decision 2: Preserve nested unions through typed override helpers or aliases

- Chosen:
  Refactor test-local modifier/action overrides to use typed aliases derived
  from `DndBeyondCharacterData` instead of relying on object spread inference.
- Alternatives considered:
  Continue using inline literals and patch errors with `as const` or ad hoc
  casts throughout the suite.
- Rationale:
  Most TS2322/TS2345 failures come from nested literals widening from
  `"bonus"`/`"set"` to `string`. A typed helper or alias keeps override-heavy
  tests readable while preserving the intended unions.
- Trade-offs:
  The suite may gain a small amount of helper structure, but it removes a large
  amount of repeated type noise.

### Decision 3: Narrow optional normalized fields at assertion sites

- Chosen:
  Where tests assert on `result.character.senses`, `savingThrows`, or `skills`,
  introduce explicit narrowing before property access.
- Alternatives considered:
  Change `Character` to make those fields required everywhere; suppress errors
  with non-null assertions.
- Rationale:
  These properties are intentionally optional in the domain model. The tests
  should reflect that contract instead of forcing a stronger type than
  production guarantees.
- Trade-offs:
  Assertions become slightly more verbose, but the test intent remains aligned
  with the real API shape.

## Proposal to Design Mapping

- Proposal element: Re-type the shared fixture source
  - Design decision: Decision 1
  - Validation approach: targeted typecheck and import test runs
- Proposal element: Standardize modifier/action override patterns
  - Design decision: Decision 2
  - Validation approach: targeted unit tests that cover custom modifier/action
    overrides
- Proposal element: Replace unsafe optional-field assertions
  - Design decision: Decision 3
  - Validation approach: targeted unit tests plus `npx tsc --noEmit`
- Proposal element: Remove the D&D Beyond typecheck failure cluster
  - Design decision: Decisions 1 through 3
  - Validation approach: repo-wide typecheck filtered against the issue #138
    failure set

## Functional Requirements Mapping

- Requirement:
  D&D Beyond fixtures and helpers must match the current import contracts
  - Design element:
    Decisions 1 and 2
  - Acceptance criteria reference:
    `openspec/changes/align-dnd-beyond-fixture-contracts/specs/typecheck-validation/spec.md`
  - Testability notes:
    Validate through targeted import tests and repo-wide typecheck
- Requirement:
  Optional normalized fields must be asserted safely
  - Design element:
    Decision 3
  - Acceptance criteria reference:
    `openspec/changes/align-dnd-beyond-fixture-contracts/specs/typecheck-validation/spec.md`
  - Testability notes:
    Ensure assertions compile without non-null shortcuts and still verify the
    expected values

## Non-Functional Requirements Mapping

- Requirement category: reliability
  - Requirement:
    Repo-wide typecheck should produce a materially cleaner and more attributable
    failure signal after this change
  - Design element:
    Decisions 1 through 3
  - Acceptance criteria reference:
    Non-functional reliability criteria in the spec delta
  - Testability notes:
    Run `npx tsc --noEmit` and confirm the D&D Beyond fixture-related failures
    are removed
- Requirement category: operability
  - Requirement:
    Test maintenance should remain localized and readable rather than spread
    across many ad hoc casts
  - Design element:
    Decisions 1 and 2
  - Acceptance criteria reference:
    modified contract-alignment requirement in the spec delta
  - Testability notes:
    Review changed tests for a shared typed pattern rather than repeated
    one-off casts

## Risks / Trade-offs

- Risk/trade-off:
  Deriving nested helper types from `DndBeyondCharacterData` may be slightly
  awkward because modifier/action records are nullable and index-based.
  - Impact:
    Helper definitions may become harder to read if over-engineered.
  - Mitigation:
    Keep aliases minimal and colocated with the tests that use them.
- Risk/trade-off:
  The suite may still contain a few call-site-specific contract adjustments even
  after the shared fixture is typed.
  - Impact:
    The final cleanup may span more than one file despite having a single root
    cause.
  - Mitigation:
    Treat the fixture as the primary boundary fix, then only add local typing
    where a test intentionally constructs a contract edge case.

## Rollback / Mitigation

- Rollback trigger:
  The proposed cleanup makes the tests substantially less readable, or targeted
  import tests regress behavior while only attempting type cleanup.
- Rollback steps:
  Revert the fixture/test typing changes in this change set.
- Data migration considerations:
  None. This is test-only and should not affect persisted data.
- Verification after rollback:
  Re-run the targeted import tests and `npx tsc --noEmit` to confirm the repo is
  back to its prior state.

## Operational Blocking Policy

- If CI checks fail:
  Diagnose whether the failure is caused by the fixture cleanup or by an
  unrelated pre-existing issue, fix fixture/test regressions within scope, and
  document unrelated failures separately if discovered.
- If security checks fail:
  Treat as unexpected for a test-only change, verify no production code or data
  handling behavior was broadened, and resolve before merge.
- If required reviews are blocked/stale:
  Request maintainer review and pause apply until a human explicitly approves
  the proposal and subsequent implementation.
- Escalation path and timeout:
  Escalate to the repository maintainer if scope expands beyond fixture/test
  alignment or if repo-wide typecheck reveals a new unrelated blocker that
  meaningfully changes the change set.

## Open Questions

- None at proposal time. If implementation reveals a real production-contract
  inconsistency rather than stale test typing, the change must be paused and the
  proposal/specs/tasks updated before continuing.
