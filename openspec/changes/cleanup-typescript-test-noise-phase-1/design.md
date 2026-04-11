## Context

- Relevant architecture:
  The failures are limited to repo test code and test helpers under `tests/`.
  The affected suites exercise combat utilities, route helpers, import routes,
  server-side D&D import fetch wrappers, and monster upload validation. The
  source contracts they rely on live in `lib/types.ts`,
  `lib/dndBeyondCharacterImport.ts`, and `lib/validation/monsterUpload.ts`.
- Dependencies:
  TypeScript strict mode in `tsconfig.json`, Jest test suites, Next.js request
  and response types, and existing OpenSpec issue split between #135 and #138.
- Interfaces/contracts touched:
  `CombatantState`, `ActiveDamageEffect`, route handler helper signatures,
  `AuthPayload`, safe `Response` mock patterns, and optional `CreatureStats`
  properties used in tests. Phase 1 does not change D&D Beyond fixture
  contracts; that remains in #138.

## Goals / Non-Goals

### Goals

- Remove the non-D&D `tsc --noEmit` failures tracked in #135
- Keep the cleanup limited to test files and test-only helper patterns
- Preserve existing behavioral intent while aligning tests to current exported
  contracts
- Leave the remaining D&D Beyond fixture failures clearly isolated to #138

### Non-Goals

- Making repo-wide `tsc --noEmit` fully green in this change
- Reworking the shared D&D Beyond fixtures or
  `tests/unit/import/dndBeyondCharacterImport.test.ts`
- Loosening production types to accommodate stale tests

## Decisions

### Decision 1: Fix stale non-D&D tests by aligning them to current exported types

- Chosen:
  Update the affected tests to match the current domain contracts instead of
  changing production code.
- Alternatives considered:
  Relax production types or suppress type errors in tests.
- Rationale:
  The failures reflect test drift, not product behavior changes. Production
  contracts should remain the source of truth.
- Trade-offs:
  Test fixtures may become slightly more explicit, but the typecheck signal
  becomes more trustworthy.

### Decision 2: Restrict phase 1 to a bounded non-D&D failure set

- Chosen:
  Phase 1 resolves only the failures in the listed non-D&D files and leaves the
  D&D Beyond fixture-contract work to #138.
- Alternatives considered:
  Keep one broad change that also includes the D&D Beyond fixture cleanup.
- Rationale:
  The D&D Beyond bucket dominates the remaining errors and has different design
  concerns. Splitting the work reduces review ambiguity and shortens the path to
  a cleaner typecheck signal.
- Trade-offs:
  `tsc --noEmit` may still fail after phase 1, but the remaining failures are
  deliberate and easier to reason about.

### Decision 3: Use safer test-only patterns for env overrides, async handlers,
and response mocks

- Chosen:
  Replace direct read-only env mutation patterns, broad handler unions, and
  structural `Response` casts with patterns that satisfy current platform and
  TypeScript constraints.
- Alternatives considered:
  Continue using ad hoc casts or `as any`.
- Rationale:
  These failures are mechanical and should be fixed with test-only hygiene, not
  by weakening type safety.
- Trade-offs:
  Some helper code becomes slightly more verbose, but it centralizes safe test
  conventions.

## Proposal to Design Mapping

- Proposal element: Remove non-D&D test noise only
  - Design decision: Decision 2
  - Validation approach: `npx tsc --noEmit` should no longer report the bounded
    non-D&D failures listed in #135
- Proposal element: Keep production types strict
  - Design decision: Decision 1
  - Validation approach: test files change without corresponding type loosening
    in `lib/`
- Proposal element: Replace unsafe test patterns
  - Design decision: Decision 3
  - Validation approach: targeted tests/helpers compile cleanly under strict
    TypeScript

## Functional Requirements Mapping

- Requirement:
  Non-D&D test fixtures and helpers match current exported contracts
  - Design element:
    Decisions 1 and 3
  - Acceptance criteria reference:
    `specs/typecheck-validation/spec.md`
  - Testability notes:
    Verified by `npx tsc --noEmit` and targeted unit/integration tests for the
    touched suites
- Requirement:
  Phase 1 stops before D&D Beyond fixture alignment
  - Design element:
    Decision 2
  - Acceptance criteria reference:
    `specs/typecheck-validation/spec.md`
  - Testability notes:
    Remaining failures, if any, should be attributable to the D&D Beyond work
    tracked in #138

## Non-Functional Requirements Mapping

- Requirement category: reliability
  - Requirement:
    TypeScript output remains a dependable signal for unrelated changes
  - Design element:
    Decisions 1 and 2
  - Acceptance criteria reference:
    `specs/typecheck-validation/spec.md`
  - Testability notes:
    Verify the bounded failure reduction via repo-wide typecheck
- Requirement category: operability
  - Requirement:
    Test-only patterns for env overrides and mocks remain maintainable
  - Design element:
    Decision 3
  - Acceptance criteria reference:
    `specs/typecheck-validation/spec.md`
  - Testability notes:
    Review helper readability and targeted suite pass/fail behavior

## Risks / Trade-offs

- Risk/trade-off:
  Narrow phase 1 may be misread as promising a fully green typecheck.
  - Impact:
    Reviewers may think the work is incomplete even when it matches the approved
    issue split.
  - Mitigation:
    Keep proposal/spec/tasks explicit that phase 1 removes only the non-D&D
    failures and defers the rest to #138.
- Risk/trade-off:
  Test fixture cleanup could accidentally alter behavioral coverage.
  - Impact:
    Tests may compile while no longer protecting the original scenario.
  - Mitigation:
    Preserve assertions, change only the minimum needed fixture/helper typing,
    and run the targeted suites in addition to typecheck.

## Rollback / Mitigation

- Rollback trigger:
  The cleanup changes production behavior, meaningfully weakens assertions, or
  causes new regressions in the touched suites.
- Rollback steps:
  Revert the phase 1 test/helper changes as a unit, restore the previous test
  files, and reopen the cleanup under a narrower patch if needed.
- Data migration considerations:
  None. This change is limited to tests and test helpers.
- Verification after rollback:
  Re-run the targeted test suites and `npx tsc --noEmit` to confirm the repo is
  back to the pre-change state.

## Operational Blocking Policy

- If CI checks fail:
  Stop and fix the failing test/helper cleanup before merging. Do not treat
  unrelated D&D Beyond failures as phase 1 regressions if they are already
  tracked in #138.
- If security checks fail:
  Investigate whether the failure is introduced by the change; remediate before
  merge or pause the PR if the finding is unrelated but blocking.
- If required reviews are blocked/stale:
  Clarify whether the review is objecting to scope, implementation quality, or
  the #135/#138 split, and update artifacts before continuing.
- Escalation path and timeout:
  Escalate to the human reviewer/requester if the implementation drifts toward
  D&D Beyond fixture work or if the phase boundary becomes contested.

## Open Questions

- None. Phase 1 scope is explicitly limited to removing the non-D&D failures.
