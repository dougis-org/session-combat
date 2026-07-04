## GitHub Issues

- #52
- #42

## Why

- Problem statement: Phase 3a of Playwright regression tests requires comprehensive test coverage for monster import and encounter creation workflows.
- Why now: Previous phases of the test suite expansion are merged, and the monster import API is functional.
- Business/user impact: Enhances reliability and prevents regressions in core functionality for importing monsters and setting up encounters.

## Problem Space

- Current behavior: No dedicated Playwright regression tests exist for the monster import and encounter domains.
- Desired behavior: `monsters.spec.ts` and `encounters.spec.ts` thoroughly test valid/invalid imports, size limits (100MB), and encounter creation flows using existing helper actions.
- Constraints: The max file upload size constraint to test against is 100MB.
- Assumptions: `importMonster()` and `createEncounter()` helpers in `actions.ts` are fully functional and ready to be used.
- Edge cases considered: Uploading malformed JSON, uploading files exceeding the 100MB limit, missing required fields.

## Scope

### In Scope

- Creating `tests/e2e/monsters.spec.ts` with at least 5 tests covering valid imports, invalid JSON, oversized files (>100MB mock), format validation, and persistence.
- Creating `tests/e2e/encounters.spec.ts` with at least 3 tests covering encounter creation with imported monsters, form field interactions, and persistence.
- Creating `tests/e2e/fixtures/import-monster-variants.json` with necessary test data payloads.

### Out of Scope

- Writing combat screen regression tests (this will be handled in a subsequent phase).
- Refactoring or changing application source code.
- Modifying existing test domain files (e.g., `characters.spec.ts`, `combat.spec.ts`).

## What Changes

- Two new E2E test files: `monsters.spec.ts` and `encounters.spec.ts`.
- One new fixture file: `import-monster-variants.json`.

## Risks

- Risk: Properly simulating a >100MB file upload without slowing down the test runner or eating up memory.
  - Impact: Slow or flaky test suite.
  - Mitigation: Mock the file upload input or generate a sparse payload representing an oversized file to trigger the UI rejection efficiently.

## Open Questions

- Question: None at this time. All ambiguities (file size limits, domain file splitting) were resolved during exploration.
  - Needed from: N/A
  - Blocker for apply: no

## Non-Goals

- Refactoring the broader Playwright suite structure or fixing preexisting flaky tests outside of this phase's scope.

## Change Control

If scope changes after proposal approval, update `proposal.md`, `design.md`,
`specs/**/*.md`, and `tasks.md` before implementation starts.
