## GitHub Issues

- #254

## Why

- Problem statement: All component tests use a manual `createRoot` + `act` + `container.querySelectorAll` pattern. React Testing Library is not installed. New tests cannot follow the RTL standard that was chosen as the project default.
- Why now: Issue #254 was created to unblock all future component test coverage and migration work. No new component tests should be written until RTL is available.
- Business/user impact: Without RTL installed, contributors writing component tests must use the verbose manual pattern, and CI cannot enforce the RTL-based assertion style (`toBeInTheDocument`, `getByRole`, etc.).

## Problem Space

- Current behavior: `@testing-library/react`, `@testing-library/jest-dom`, and `@testing-library/user-event` are absent from `package.json`. `jest.setup.ts` does not import jest-dom matchers. The jest global env is `node`; 38 component test files individually override it with `@jest-environment jsdom` docblocks.
- Desired behavior: The three RTL packages are installed, jest-dom matchers are available globally, `jest.setup.ts` imports them, and a passing smoke test proves the stack works end-to-end.
- Constraints: All 138 existing tests must continue to pass. Integration tests run under their own `jest.integration.config.js` (already `testEnvironment: "node"`) and must not be affected.
- Assumptions: jsdom is safe as the global default for all unit tests — pure logic tests and API route tests (which use `NextRequest`, not `node-fetch`) are unaffected by jsdom globals.
- Edge cases considered: `clientStorage.test.ts` manually overrides `localStorage` via `Object.defineProperty`; this still works under jsdom because jsdom's `localStorage` is configurable.

## Scope

### In Scope

- Install `@testing-library/react`, `@testing-library/jest-dom`, `@testing-library/user-event` as devDependencies
- Add `import '@testing-library/jest-dom'` to `jest.setup.ts`
- Switch `jest.config.js` `testEnvironment` from `node` to `jsdom`
- Write one RTL smoke test for `CombatStatsRow` (parallel to its existing manual test)
- Verify all existing tests pass

### Out of Scope

- Migrating any existing component tests to RTL (tracked in follow-up issues)
- Removing per-file `@jest-environment jsdom` docblocks (tracked in #264)
- Writing RTL tests for any other component

## What Changes

- `package.json` — three new devDependencies
- `package-lock.json` — updated by npm install
- `jest.setup.ts` — one new import line
- `jest.config.js` — `testEnvironment` value changed to `"jsdom"`
- `tests/unit/CombatStatsRow.rtl.test.tsx` — new smoke test file

## Risks

- Risk: jsdom as global default breaks a currently-passing node-env test
  - Impact: CI red, blocks merge
  - Mitigation: All non-component unit tests were audited — pure logic, API route (NextRequest-based), and integration tests are all safe. Run full suite before merging.

- Risk: jest-dom version incompatibility with current jest/ts-jest setup
  - Impact: Setup file fails to load, all tests fail
  - Mitigation: Use current stable versions; check peer dependency matrix before installing.

## Open Questions

No unresolved ambiguity. Scope, target component, and env strategy were all confirmed during exploration.

## Non-Goals

- Replacing or deprecating the existing manual `createReactRoot` helper (it stays until migration issues remove it)
- Enforcing RTL in linting or CI rules (future concern)
- Adding RTL to Playwright/e2e tests

## Change Control

If scope changes after proposal approval, update `proposal.md`, `design.md`,
`specs/**/*.md`, and `tasks.md` before implementation starts.
