## GitHub Issues

- #264

## Why

- Problem statement: 52 test files carry a `@jest-environment jsdom` docblock that was required when the global Jest environment was `node`. 30 of those files also carry a per-file `IS_REACT_ACT_ENVIRONMENT = true` assignment. Both are now redundant: `jest.config.js` already sets `testEnvironment: "jsdom"` globally, and `jest.setup.ts` already sets `IS_REACT_ACT_ENVIRONMENT = true` globally.
- Why now: The prerequisite work (RTL install in #254, jest.config.js update) is complete. The boilerplate is pure noise that new contributors will copy into future test files, spreading the anti-pattern.
- Business/user impact: Cleaner test files, no misleading boilerplate, reduced cognitive overhead for contributors.

## Problem Space

- Current behavior: Every component test file opens with a `@jest-environment jsdom` docblock and most include `(globalThis as unknown as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true;` — both of which are already handled globally.
- Desired behavior: Test files contain only the test code itself; environment configuration lives exclusively in `jest.config.js` and `jest.setup.ts`.
- Constraints: `jest.setup.ts` must retain its `IS_REACT_ACT_ENVIRONMENT = true` line as the single canonical assignment.
- Assumptions: All 52 files with the docblock and all 30 files with the per-file assignment are safe to clean up — confirmed by the fact that `jest.config.js` already uses `testEnvironment: "jsdom"` and tests are currently passing.
- Edge cases considered:
  - `tests/unit/helpers/reactRoot.ts` — not a test file; `@jest-environment` docblocks have no effect on imported helper modules. Safe to remove.
  - `jest.integration.config.js` uses its own explicit `testEnvironment: "node"` — unaffected by this change.
  - Non-component unit tests (combat logic, validation, API routes) run under jsdom already and are unaffected.

## Scope

### In Scope

- Remove `@jest-environment jsdom` docblock from all 52 affected files
- Remove per-file `(globalThis as unknown as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true;` from all 30 affected test files
- Verify `npm test` passes with zero regressions after cleanup

### Out of Scope

- Migrating files that still use the `createReactRoot` helper to RTL (tracked in #355 and #356)
- Any changes to `jest.config.js` (already correct)
- Any changes to `jest.setup.ts` beyond preserving existing content
- Removing `IS_REACT_ACT_ENVIRONMENT` from `jest.setup.ts`

## What Changes

- 52 files: `@jest-environment jsdom` docblock comment block removed from the top
- 30 files (subset of the 52, plus some overlap): `IS_REACT_ACT_ENVIRONMENT` line removed
- `tests/unit/helpers/reactRoot.ts`: docblock removed (was never effective as a non-test file)
- No functional or behavioral changes — this is pure dead-code removal

## Risks

- Risk: A test file relied on the docblock being present for a reason not captured by the global config (e.g., a ts-jest transform quirk).
  - Impact: Test failure post-cleanup.
  - Mitigation: `npm test` must pass as the acceptance gate. Any failure is immediately visible and trivially reverted per-file.

- Risk: The count of affected files changes between analysis and implementation (new files added, files deleted).
  - Impact: Missed files or unnecessary edits.
  - Mitigation: Use `grep -rl` to enumerate files fresh at implementation time rather than hardcoding a list.

## Open Questions

No unresolved ambiguity. The expanded scope (also removing `IS_REACT_ACT_ENVIRONMENT`) was confirmed during exploration: `jest.setup.ts` line 7 already sets it globally, making all per-file assignments redundant.

## Non-Goals

- RTL migration of legacy `createReactRoot` tests (separate issues #355, #356)
- Enforcing a lint rule to prevent reintroduction (could be a follow-up)
- Touching integration test config

## Change Control

If scope changes after proposal approval, update `proposal.md`, `design.md`,
`specs/**/*.md`, and `tasks.md` before implementation starts.
