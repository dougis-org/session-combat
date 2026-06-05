## ADDED Requirements

This document details *changes* to requirements and is additive to the `design.md` document, not a replacement.

### Requirement: MODIFIED Component test infrastructure — 4 files use RTL (AC1)

The system SHALL render all 4 migrated test components using RTL `render` from `@testing-library/react` with no manual container setup.

#### Scenario: CombatStatsRow renders with RTL

- **Given** `CombatStatsRow.test.tsx` is migrated
- **When** the test suite runs
- **Then** `render(<CombatStatsRow ... />)` is called with no `createReactRoot`, no `act` wrapper, and no manual container variable

#### Scenario: CharacterMiniSummary renders with RTL

- **Given** `CharacterMiniSummary.test.tsx` is migrated
- **When** the test suite runs
- **Then** `render(<CharacterMiniSummary ... />)` is called and RTL's automatic cleanup runs after each test

#### Scenario: LairForm renders with RTL

- **Given** `LairForm.test.tsx` is migrated
- **When** the test suite runs
- **Then** `render(<LairForm ... />)` is called synchronously with no `await act(async () => ...)` wrapper

#### Scenario: LairActionsSlot renders with RTL

- **Given** `LairActionsSlot.test.tsx` is migrated
- **When** the test suite runs
- **Then** `render(<LairActionsSlot ... />)` is called and `beforeEach`/`afterEach` setup blocks are removed

---

### Requirement: MODIFIED Component test assertions use semantic RTL queries (AC1, AC4)

The system SHALL query rendered output using `screen.getByRole`, `screen.getByText`, `screen.getByTestId`, or equivalent RTL screen queries — not `container.textContent`, `container.querySelector`, or `container.querySelectorAll`.

#### Scenario: Text-content assertions replaced

- **Given** a migrated test previously asserting `container.textContent.toContain('X')`
- **When** the assertion runs
- **Then** it uses `screen.getByText(/X/)` + `toBeInTheDocument()` or `toHaveTextContent`

#### Scenario: Button found by role, not text scan

- **Given** `LairForm.test.tsx` migrated
- **When** the test queries for the "Add Lair" button
- **Then** it uses `screen.getByRole('button', { name: /Add Lair/i })` rather than `querySelectorAll('button').find(...)`

#### Scenario: data-testid elements found via `getByTestId`

- **Given** `LairActionsSlot.test.tsx` migrated
- **When** a test queries an element by `data-testid`
- **Then** it uses `screen.getByTestId('...')` rather than `container.querySelector('[data-testid="..."]')`

---

### Requirement: MODIFIED Click interactions use `userEvent.setup()` (AC4)

The system SHALL simulate user interactions using `userEvent.setup()` instantiated per test, consistent with project convention.

#### Scenario: Click interaction in LairForm

- **Given** `LairForm.test.tsx` migrated
- **When** a test clicks the "Add Lair" button
- **Then** it calls `const user = userEvent.setup()` inside the test, then `await user.click(button)`, and the `onConfirm` mock receives exactly 1 call

#### Scenario: Click interaction in LairActionsSlot

- **Given** `LairActionsSlot.test.tsx` migrated
- **When** a test clicks an action button
- **Then** it calls `const user = userEvent.setup()` inside the test and `await user.click(el)`, with the mock receiving the expected arguments

---

## MODIFIED Requirements

### Requirement: MODIFIED No `createReactRoot` imports in the 4 migrated files (AC2)

The system SHALL have zero imports from `@/tests/unit/helpers/reactRoot` in the 4 migrated test files.

#### Scenario: Import removed post-migration

- **Given** any of the 4 migrated test files
- **When** `grep "reactRoot" tests/unit/LairForm.test.tsx tests/unit/CharacterMiniSummary.test.tsx tests/unit/LairActionsSlot.test.tsx tests/unit/CombatStatsRow.test.tsx` is run
- **Then** the command returns no matches

---

## REMOVED Requirements

### Requirement: REMOVED Manual DOM container lifecycle

Reason for removal: `createReactRoot` setup (`let container`, `let root`, `beforeEach`, `afterEach` with `unmountReactRoot`) is replaced by RTL's automatic render and cleanup. This pattern is no longer required in the 4 migrated files.

---

## Traceability

- Proposal element "Replace createReactRoot/act setup" → Requirement AC1 (RTL render)
- Proposal element "Replace container.textContent assertions" → Requirement AC1/AC4 (semantic queries)
- Proposal element "Replace querySelectorAll button find" → Requirement AC4 (getByRole)
- Proposal element "Replace btn.click() interactions" → Requirement AC4 (userEvent.setup)
- Proposal element "No reactRoot imports" → Requirement AC2
- Design Decision 1 (semantic queries) → AC1, AC4
- Design Decision 2 (userEvent.setup) → AC4
- Design Decision 3 (drop async act) → AC1
- Design Decision 4 (keep reactRoot.ts) → not a test requirement; enforced by scope boundary
- AC1 → Task: migrate each file (4 tasks)
- AC2 → Task: verify no reactRoot import (per-file + final grep)
- AC3 → Task: run full unit test suite
- AC4 → Task: code review against CombatantCard.callbacks.test.tsx pattern

---

## Non-Functional Acceptance Criteria

### Requirement: Maintainability

#### Scenario: Pattern consistency

- **Given** any of the 4 migrated files
- **When** compared to `tests/unit/components/CombatantCard.callbacks.test.tsx`
- **Then** the import style, query style, and interaction style are consistent (same RTL imports, `userEvent.setup()` per test, `screen.*` queries)

### Requirement: Reliability

#### Scenario: Zero regressions in unit test suite (AC3)

- **Given** all 4 files are migrated
- **When** `npm run test:unit` is executed
- **Then** all tests pass with the same number of passing tests as before migration (no tests removed or newly skipped)
