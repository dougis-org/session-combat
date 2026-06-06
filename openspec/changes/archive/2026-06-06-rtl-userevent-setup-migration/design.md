## Context

- Relevant architecture: Unit tests live under `tests/unit/` and run with `npm run test:unit` (Jest + jsdom). RTL (`@testing-library/react`) and `@testing-library/user-event` v14 are already installed. 18 test files already use `userEvent.setup()` as the reference pattern.
- Dependencies: No new dependencies. No production code touched.
- Interfaces/contracts touched: Only the test interaction layer — how tests drive DOM events.

## Goals / Non-Goals

### Goals

- Replace all static `userEvent.*()` calls in 5 files with instance calls on a `user` obtained from `userEvent.setup()`
- Choose the least-boilerplate scoping strategy per file (inline vs `beforeEach`)
- Ensure `npm run test:unit` passes with no regressions after migration

### Non-Goals

- Changing assertions, test coverage, or component logic
- Enforcing the pattern via lint rules
- Migrating the 18 already-compliant files

## Decisions

### Decision 1: Inline `const user` vs `beforeEach` at describe scope

- Chosen: Inline `const user = userEvent.setup()` for files where only one test needs user interaction; `beforeEach` describe-scope `let user` for files where multiple tests need it.
- Alternatives considered: Always `beforeEach` (uniform but adds unnecessary describe-scope state to single-test cases); always inline (repetitive for CampaignsPage with 3 affected tests).
- Rationale: Reduces duplication where it exists, keeps tests self-contained where it doesn't. Matches the goal of reducing boilerplate while meeting standards.
- Trade-offs: Slight inconsistency across files, but the per-file choice is deterministic and documented.

### Decision 2: File-by-file migration order

- Chosen: Migrate each file independently and verify `npm run test:unit` passes before moving to the next.
- Alternatives considered: All files in one commit (faster but harder to bisect if a test breaks).
- Rationale: Isolates regressions to a single file. Given the mechanical nature of the change, a single PR with all 5 files is fine, but tasks are ordered sequentially.
- Trade-offs: Slightly more verification steps, but each is cheap (unit tests are fast).

## Proposal to Design Mapping

- Proposal element: 5 files using static `userEvent` API
  - Design decision: Decision 1 (inline vs beforeEach per file)
  - Validation approach: `npm run test:unit` green after each file

- Proposal element: Risk of async timing regressions
  - Design decision: Decision 2 (sequential file migration with per-file test run)
  - Validation approach: Full `npm run test:unit` after all 5 files done

## Functional Requirements Mapping

- Requirement: No static `userEvent.*()` calls remain in any test file
  - Design element: Replace all 11 static calls across 5 files
  - Acceptance criteria reference: specs/migration-pattern.md
  - Testability notes: `grep -r "userEvent\.\(click\|type\|selectOptions\)" tests/` should return empty

- Requirement: All existing tests continue to pass
  - Design element: Mechanical replacement only — no assertion changes
  - Acceptance criteria reference: specs/migration-pattern.md
  - Testability notes: `npm run test:unit` exit code 0

## Non-Functional Requirements Mapping

- Requirement category: reliability
  - Requirement: No flaky tests introduced by timing changes
  - Design element: `userEvent.setup()` uses the same defaults as the static API; no config needed
  - Acceptance criteria reference: specs/migration-pattern.md
  - Testability notes: Run `npm run test:unit` twice; results must be stable

## Risks / Trade-offs

- Risk/trade-off: `userEvent.setup()` instance behaves identically to static calls for these simple interactions (click, type, selectOptions), so timing regressions are very unlikely
  - Impact: Low
  - Mitigation: Per-file test verification

## Rollback / Mitigation

- Rollback trigger: `npm run test:unit` failures that cannot be resolved in the PR
- Rollback steps: Revert the affected file(s) to the static API call; the change is a pure text substitution so revert is trivial
- Data migration considerations: None — test-only change
- Verification after rollback: `npm run test:unit` passes

## Operational Blocking Policy

- If CI checks fail: Fix failing tests before merging; do not merge with red CI
- If security checks fail: N/A — no production code changed
- If required reviews are blocked/stale: Ping reviewer; all PR review threads must be resolved before merge (project ruleset)
- Escalation path and timeout: If blocked >2 days, re-raise in issue #369

## Open Questions

No open questions. All design decisions are resolved.
