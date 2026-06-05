## Context

- Relevant architecture: Jest config (`jest.config.js`) sets `testEnvironment: "jsdom"` globally. `jest.setup.ts` runs via `setupFilesAfterEnv` and sets `IS_REACT_ACT_ENVIRONMENT = true` globally. These make per-file overrides redundant.
- Dependencies: No runtime code changes. Only test infrastructure files affected.
- Interfaces/contracts touched: None. This is dead-code removal with no behavioral change.

## Goals / Non-Goals

### Goals

- Remove `@jest-environment jsdom` docblock from all 52 files that carry it
- Remove per-file `IS_REACT_ACT_ENVIRONMENT = true` from all 30 test files that carry it
- Confirm zero test regressions via `npm run test:unit && npm run test:integration`

### Non-Goals

- Migrating `createReactRoot` usages to RTL (#355, #356)
- Adding lint rules against reintroduction
- Modifying `jest.config.js` or `jest.setup.ts`

## Decisions

### Decision 1: Use grep to enumerate files at implementation time

- Chosen: Run `grep -rl "@jest-environment jsdom"` and `grep -rl "IS_REACT_ACT_ENVIRONMENT"` fresh at implementation time to get the definitive file lists.
- Alternatives considered: Hardcode the 52/30 file lists from analysis.
- Rationale: File counts can drift between analysis and implementation (new files added, files deleted). Fresh grep is authoritative.
- Trade-offs: Slightly more work per task step; eliminates risk of missed or extra edits.

### Decision 2: Remove the entire docblock comment block, not just the annotation line

- Chosen: Remove the full `/** @jest-environment jsdom */` block (including surrounding `/**` and `*/` delimiters) as a single unit.
- Alternatives considered: Remove only the `@jest-environment jsdom` line and leave empty comment delimiters.
- Rationale: Empty `/** */` blocks are noise. The docblock exists solely for the environment annotation; without it the whole block is dead.
- Trade-offs: Slightly larger diff; cleaner result.

### Decision 3: Leave the IS_REACT_ACT_ENVIRONMENT line in jest.setup.ts

- Chosen: Keep `jest.setup.ts` line 7 as-is.
- Alternatives considered: Remove it from setup too since RTL sets it internally.
- Rationale: `jest.setup.ts` is the canonical configuration location. Removing it from the setup file is a separate, independent decision not in scope for this cleanup.
- Trade-offs: One line of technically-redundant code remains; tradeoff is zero risk of breakage.

### Decision 4: Treat reactRoot.ts the same as test files for the docblock removal

- Chosen: Remove `@jest-environment jsdom` from `tests/unit/helpers/reactRoot.ts`.
- Alternatives considered: Leave it since it's a helper, not a test.
- Rationale: The docblock was never effective there (Jest environment docblocks only apply to test runner files, not imported modules). Removing it eliminates misleading noise.
- Trade-offs: None. No behavioral effect either way.

## Proposal to Design Mapping

- Proposal element: Remove `@jest-environment jsdom` from 52 files
  - Design decision: Decision 1 (grep enumeration), Decision 2 (full block removal)
  - Validation approach: `grep -rl "@jest-environment jsdom"` returns 0 results after cleanup; `npm run test:unit && npm run test:integration` passes

- Proposal element: Remove per-file `IS_REACT_ACT_ENVIRONMENT` from 30 files
  - Design decision: Decision 1 (grep enumeration), Decision 3 (keep in setup)
  - Validation approach: `grep -rl "IS_REACT_ACT_ENVIRONMENT" tests/` returns 0 results; `npm run test:unit && npm run test:integration` passes

- Proposal element: `tests/unit/helpers/reactRoot.ts` docblock removal
  - Design decision: Decision 4
  - Validation approach: File no longer contains `@jest-environment` annotation

## Functional Requirements Mapping

- Requirement: All 52 `@jest-environment jsdom` docblocks removed
  - Design element: grep-driven enumeration + full block removal
  - Acceptance criteria reference: specs/cleanup.md — no `@jest-environment jsdom` in any file
  - Testability notes: Verified by `grep -r "@jest-environment jsdom" tests/` returning no results

- Requirement: All 30 per-file `IS_REACT_ACT_ENVIRONMENT` assignments removed
  - Design element: grep-driven enumeration + line removal
  - Acceptance criteria reference: specs/cleanup.md — no per-file IS_REACT_ACT_ENVIRONMENT in tests/
  - Testability notes: Verified by `grep -r "IS_REACT_ACT_ENVIRONMENT" tests/` returning no results

- Requirement: `npm run test:unit && npm run test:integration` passes with zero regressions
  - Design element: No behavioral change; pure dead-code removal
  - Acceptance criteria reference: specs/cleanup.md — full test suite passes
  - Testability notes: Run `npm run test:unit && npm run test:integration` after all file edits are complete

## Non-Functional Requirements Mapping

- Requirement category: operability
  - Requirement: Change is fully reversible via git
  - Design element: Only file content edits; no schema migrations, config changes, or package installs
  - Acceptance criteria reference: All changes are in tracked files
  - Testability notes: `git diff` shows only docblock/line removals

## Risks / Trade-offs

- Risk/trade-off: A test file was inadvertently relying on the per-file docblock to override a different environment
  - Impact: Test failure post-cleanup
  - Mitigation: `npm run test:unit && npm run test:integration` is the acceptance gate; any failure is immediately attributable to a specific file and trivially re-added

## Rollback / Mitigation

- Rollback trigger: Any test failure in `npm run test:unit && npm run test:integration` after cleanup
- Rollback steps: `git checkout -- <failing-test-file>` to restore the docblock/line for that file; rerun `npm run test:unit && npm run test:integration` to confirm
- Data migration considerations: None
- Verification after rollback: `npm run test:unit && npm run test:integration` passes

## Operational Blocking Policy

- If CI checks fail: Investigate the failing test; restore the docblock/assignment for that specific file only; do not revert the entire cleanup
- If security checks fail: N/A — no security-relevant changes
- If required reviews are blocked/stale: Ping reviewer; change is mechanical and low-risk
- Escalation path and timeout: If a test cannot be fixed within the PR, revert that single file and open a follow-up issue

## Open Questions

No open questions. All scope and approach decisions are resolved.
