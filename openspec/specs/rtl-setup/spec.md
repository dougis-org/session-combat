## ADDED Requirements

This document details *changes* to requirements and is additive to the `design.md` document, not a replacement.

### Requirement: ADDED RTL packages installed

The system SHALL have `@testing-library/react`, `@testing-library/jest-dom`, and `@testing-library/user-event` listed in `devDependencies` in `package.json` and resolvable in `node_modules`.

#### Scenario: Packages present after install

- **Given** a clean checkout with `npm install` run
- **When** a test file imports `@testing-library/react`
- **Then** the import resolves without error and `render`, `screen` are available

#### Scenario: Packages absent before this change

- **Given** the codebase before this change
- **When** a test imports `@testing-library/react`
- **Then** Jest throws `Cannot find module '@testing-library/react'`

---

### Requirement: ADDED jest-dom matchers globally available

The system SHALL make jest-dom custom matchers (e.g. `toBeInTheDocument`, `toHaveTextContent`) available in all unit tests without per-file imports.

#### Scenario: Matcher resolves without import

- **Given** `jest.setup.ts` imports `@testing-library/jest-dom`
- **When** a test file calls `expect(element).toBeInTheDocument()` with no local import
- **Then** the assertion passes (or fails on content mismatch) — it does not throw `toBeInTheDocument is not a function`

#### Scenario: TypeScript recognises matcher types

- **Given** the project's `tsconfig.json` picks up types from installed packages
- **When** a test file uses `toBeInTheDocument` without explicit type import
- **Then** TypeScript compiles without error

---

### Requirement: ADDED smoke test for CombatStatsRow using RTL

The system SHALL have a passing RTL smoke test at `tests/unit/CombatStatsRow.rtl.test.tsx` that renders `CombatStatsRow` and asserts on visible text using `screen` queries and jest-dom matchers.

#### Scenario: Smoke test passes

- **Given** RTL packages are installed and jest-dom is configured
- **When** `npm run test:unit -- --testPathPattern=CombatStatsRow.rtl` is run
- **Then** all assertions pass and the test exits 0

#### Scenario: Smoke test uses RTL APIs exclusively

- **Given** the smoke test file
- **When** it is read
- **Then** it imports from `@testing-library/react`, uses `render` and `screen`, and uses `toBeInTheDocument` or equivalent jest-dom matchers — no `createRoot`, no `container.querySelector`

## MODIFIED Requirements

### Requirement: MODIFIED Jest global test environment

The system SHALL use `jsdom` as the default `testEnvironment` in `jest.config.js` so component tests can use browser globals (`document`, `window`) without per-file docblock overrides.

#### Scenario: All existing tests still pass under jsdom

- **Given** `jest.config.js` with `testEnvironment: "jsdom"`
- **When** `npm run test:unit` is run (full unit suite, excluding integration)
- **Then** all previously-passing tests still pass; no new failures introduced

#### Scenario: Integration tests are unaffected

- **Given** `jest.integration.config.js` retains its own `testEnvironment: "node"`
- **When** `npm run test:integration` is run
- **Then** all integration tests pass as before

## REMOVED Requirements

No requirements removed.

## Traceability

- Proposal: Install three RTL packages → Requirement: RTL packages installed
- Proposal: Add jest-dom import to jest.setup.ts → Requirement: jest-dom matchers globally available
- Proposal: Switch global env to jsdom → Requirement: Jest global test environment (MODIFIED)
- Proposal: Smoke test for CombatStatsRow → Requirement: Smoke test for CombatStatsRow
- Design Decision 1 → Requirement: Jest global test environment (MODIFIED)
- Design Decision 2 → Requirement: Smoke test for CombatStatsRow
- Design Decision 3 → Requirement: jest-dom matchers globally available
- All four requirements → tasks.md tasks 1–4

## Non-Functional Acceptance Criteria

### Requirement: Reliability

#### Scenario: No regressions after env change

- **Given** the full unit test suite (138 tests) was passing before this change
- **When** `npm run test:unit` is run after all changes are applied
- **Then** the same number of tests pass; zero new failures

### Requirement: Operability

#### Scenario: New RTL test requires no extra boilerplate

- **Given** RTL installed and jsdom as global env
- **When** a contributor creates a new `.test.tsx` file and imports from `@testing-library/react`
- **Then** the test runs with `render`, `screen`, and jest-dom matchers immediately available — no docblock, no local jest-dom import needed
