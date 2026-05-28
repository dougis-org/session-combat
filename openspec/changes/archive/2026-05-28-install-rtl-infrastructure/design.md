## Context

- Relevant architecture: Jest unit tests run via `jest.config.js` (env: node, setup: `jest.setup.ts`). Integration tests run via `jest.integration.config.js` (env: node, separate config — unaffected). Component tests live in `tests/unit/` as `.test.tsx` files and currently use a `createReactRoot` helper in `tests/unit/helpers/reactRoot.ts`.
- Dependencies: `ts-jest` for TypeScript transform, `@swc/jest` available. `jest.setup.ts` already wired via `setupFilesAfterEnv`.
- Interfaces/contracts touched: `jest.config.js` (testEnvironment), `jest.setup.ts` (new import), `package.json` (devDependencies), new smoke test file.

## Goals / Non-Goals

### Goals

- RTL packages available and importable in all unit tests
- `toBeInTheDocument` and other jest-dom matchers available without per-file import
- `jsdom` as the global jest environment so component tests don't need per-file overrides
- A passing smoke test for `CombatStatsRow` proves the full stack works

### Non-Goals

- Migrating existing tests to RTL
- Removing `@jest-environment jsdom` docblocks (that is #264)
- Enforcing RTL usage in CI/lint

## Decisions

### Decision 1: Switch global testEnvironment to jsdom

- Chosen: Change `testEnvironment` in `jest.config.js` from `"node"` to `"jsdom"`
- Alternatives considered: Keep `node` default, rely on per-file docblocks forever
- Rationale: All 80 non-component unit tests were audited — pure logic tests, API route tests (NextRequest-based), and storage tests are all safe under jsdom. jsdom is a superset; it doesn't break node-style code. Integration tests are isolated in their own config.
- Trade-offs: Slightly heavier test bootstrap per file; negligible at this scale.

### Decision 2: Smoke test targets CombatStatsRow

- Chosen: `tests/unit/CombatStatsRow.rtl.test.tsx` using RTL `render` + `screen` + jest-dom matchers
- Alternatives considered: A trivial new component; any other existing component
- Rationale: `CombatStatsRow` already has a manual test covering the same assertions — a side-by-side RTL version makes the before/after pattern obvious for contributors following the migration issues. The component is simple (props only, no async, no context) making it ideal for a smoke test.
- Trade-offs: Slight duplication with existing manual test; acceptable since the manual test stays until migration issues clean it up.

### Decision 3: jest-dom imported in jest.setup.ts

- Chosen: Add `import '@testing-library/jest-dom'` to the top of `jest.setup.ts`
- Alternatives considered: Per-file imports; a separate setup file
- Rationale: `jest.setup.ts` is already loaded via `setupFilesAfterEnv` in `jest.config.js`. Adding the import here makes jest-dom matchers available globally without any per-test boilerplate.
- Trade-offs: All tests get the extended matchers whether they use them or not — zero downside.

## Proposal to Design Mapping

- Proposal element: Install three RTL packages
  - Design decision: Decision 1, 2, 3 — packages are prerequisites for all three
  - Validation approach: `npm ls @testing-library/react` after install; smoke test imports confirm resolution

- Proposal element: Switch global env to jsdom
  - Design decision: Decision 1
  - Validation approach: Full `npm test` suite passes; no regressions

- Proposal element: Smoke test for CombatStatsRow
  - Design decision: Decision 2
  - Validation approach: `tests/unit/CombatStatsRow.rtl.test.tsx` passes in CI

## Functional Requirements Mapping

- Requirement: RTL packages importable in test files
  - Design element: `npm install --save-dev` three packages
  - Acceptance criteria reference: specs/rtl-setup.md — packages in devDependencies
  - Testability notes: Smoke test import will fail at compile time if packages missing

- Requirement: jest-dom matchers available globally
  - Design element: `import '@testing-library/jest-dom'` in `jest.setup.ts`
  - Acceptance criteria reference: specs/rtl-setup.md — `toBeInTheDocument` resolves without import
  - Testability notes: Smoke test uses `toBeInTheDocument`; TypeScript would error if types missing

- Requirement: jsdom as global default env
  - Design element: `testEnvironment: "jsdom"` in `jest.config.js`
  - Acceptance criteria reference: specs/rtl-setup.md — all existing tests pass
  - Testability notes: Full `npm test` run is the verification

- Requirement: Smoke test passes
  - Design element: `tests/unit/CombatStatsRow.rtl.test.tsx`
  - Acceptance criteria reference: specs/rtl-setup.md — smoke test in CI
  - Testability notes: Test itself is the criterion

## Non-Functional Requirements Mapping

- Requirement category: reliability
  - Requirement: No regressions in existing 138 tests
  - Design element: jsdom env safety audit (all non-component tests verified compatible)
  - Acceptance criteria reference: `npm test` exit 0
  - Testability notes: Run full suite before and after; compare counts

- Requirement category: operability
  - Requirement: New contributors can write RTL tests without extra config
  - Design element: Global jest-dom import + jsdom default env
  - Testability notes: No per-file boilerplate required for new RTL tests after this change

## Risks / Trade-offs

- Risk/trade-off: An untested file has a node-specific global that jsdom shadows
  - Impact: That test fails after env change
  - Mitigation: Full suite run required before merge; any failure is immediately visible

- Risk/trade-off: jest-dom peer dep conflict with current jest version
  - Impact: Setup file import error, all tests fail
  - Mitigation: Check peer deps during install; pin to compatible version if needed

## Rollback / Mitigation

- Rollback trigger: Any previously-passing test fails after the env change
- Rollback steps: Revert `testEnvironment` to `"node"` in `jest.config.js`; remove jest-dom import from `jest.setup.ts`; `npm uninstall` the three packages
- Data migration considerations: None — this is test infrastructure only
- Verification after rollback: `npm test` returns to prior passing state

## Operational Blocking Policy

- If CI checks fail: Do not merge. Investigate the failing test, determine if jsdom caused it, fix or revert.
- If security checks fail: Do not merge. Audit the new devDependencies with `npm audit`.
- If required reviews are blocked/stale: Ping reviewer after 24h; escalate to repo owner after 48h.
- Escalation path and timeout: Unblock within 48h or revert to unblock other work.

## Open Questions

No open questions. All decisions confirmed during exploration.
