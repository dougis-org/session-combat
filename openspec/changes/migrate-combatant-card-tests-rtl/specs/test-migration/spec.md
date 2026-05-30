## ADDED Requirements

This document details *changes* to requirements and is additive to the `design.md` document, not a replacement.

### Requirement: ADDED Shared test helpers module

The system SHALL have a single `CombatantCard.test-helpers.ts` file that exports `BASE` and `renderCard` used by all `CombatantCard` test files.

#### Scenario: BASE fixture is the single source of truth

- **Given** the `CombatantCard.test-helpers.ts` file exists
- **When** `grep -r "const BASE" tests/unit/components/CombatantCard` is run
- **Then** exactly one result is returned (in `test-helpers.ts`)

#### Scenario: renderCard is importable and functional

- **Given** `CombatantCard.test-helpers.ts` exports `renderCard`
- **When** a test file imports and calls `renderCard({})` 
- **Then** a `CombatantCard` component renders into the jsdom without error

### Requirement: ADDED Focused badge/effects test file

The system SHALL have `CombatantCard.badges.test.tsx` covering stat modifier badges and active effect removal using RTL exclusively.

#### Scenario: All badge tests pass with RTL queries

- **Given** `CombatantCard.badges.test.tsx` exists with 10 tests
- **When** `jest tests/unit/components/CombatantCard.badges.test.tsx` is run
- **Then** all 10 tests pass and no `createRoot` import is present in the file

### Requirement: ADDED Focused effects-panel test file

The system SHALL have `CombatantCard.effects-panel.test.tsx` covering panel toggle and preset application using RTL exclusively.

#### Scenario: All effects-panel tests pass with RTL queries

- **Given** `CombatantCard.effects-panel.test.tsx` exists with 13 tests
- **When** `jest tests/unit/components/CombatantCard.effects-panel.test.tsx` is run
- **Then** all 13 tests pass and no `createRoot` import is present in the file

### Requirement: ADDED Focused callbacks/damage test file

The system SHALL have `CombatantCard.callbacks.test.tsx` covering detail/remove callbacks and damage type select using RTL exclusively.

#### Scenario: All callback and damage tests pass with RTL queries

- **Given** `CombatantCard.callbacks.test.tsx` exists with 6 tests
- **When** `jest tests/unit/components/CombatantCard.callbacks.test.tsx` is run
- **Then** all 6 tests pass and no `createRoot` import is present in the file

## MODIFIED Requirements

### Requirement: MODIFIED CombatantCard.hp.test.tsx includes Undo HP tests

The system SHALL include 6 Undo HP tests in `CombatantCard.hp.test.tsx`, migrated from the legacy file.

#### Scenario: Undo HP tests colocated with HP lifecycle tests

- **Given** `CombatantCard.hp.test.tsx` has been updated
- **When** `jest tests/unit/components/CombatantCard.hp.test.tsx` is run
- **Then** tests including "Undo HP button is disabled when history is empty" pass

#### Scenario: Undo HP tests use RTL async pattern

- **Given** the Undo HP describe block in `CombatantCard.hp.test.tsx`
- **When** any test in the block is inspected
- **Then** interactions use `await user.click(...)` via `userEvent.setup()`, not `act(() => { ... .click() })`

## REMOVED Requirements

### Requirement: REMOVED CombatantCard.test.tsx (legacy monolith)

Reason for removal: Replaced by three focused RTL test files (`badges`, `effects-panel`, `callbacks`) plus Undo HP tests moved to `hp` file. All 35 tests are preserved in the new structure.

### Requirement: REMOVED IS_REACT_ACT_ENVIRONMENT global flag

Reason for removal: Required only for the manual `createRoot` pattern. RTL wraps renders in `act` internally; the flag is unnecessary and misleading in RTL-based test files.

## Traceability

- Proposal: "Migrate all 35 tests to RTL" → Requirements: badge, effects-panel, callbacks, Undo HP scenarios
- Proposal: "Create shared test-helpers.ts" → Requirement: Shared test helpers module
- Proposal: "Delete CombatantCard.test.tsx" → Requirement: REMOVED CombatantCard.test.tsx
- Design Decision 1 (shared helpers) → Requirement: Shared test helpers module → Tasks: create-test-helpers, update-hp-file-imports
- Design Decision 2 (jest.mock per-file) → No spec scenario needed (Jest constraint, not a behavior)
- Design Decision 3 (userEvent) → Requirement: Undo HP RTL async pattern → Tasks: migrate-*-tests
- Design Decision 4 (Undo HP in hp file) → Requirement: MODIFIED CombatantCard.hp.test.tsx → Tasks: migrate-undo-hp
- Design Decision 5 (file naming) → Requirements: all ADDED file requirements → Tasks: create-badges-file, create-effects-panel-file, create-callbacks-file

## Non-Functional Acceptance Criteria

### Requirement: Coverage does not decrease

#### Scenario: Coverage gate

- **Given** all new test files exist and `CombatantCard.test.tsx` is deleted
- **When** `npm run test:unit -- --coverage` is run
- **Then** statement coverage for `CombatantCard.tsx` is equal to or greater than the pre-migration baseline

### Requirement: Reliability — tests pass in isolation

#### Scenario: No cross-file state leakage

- **Given** any single new test file
- **When** run in isolation via `jest <filename>` with no other test files
- **Then** all tests in that file pass without setup from other files

### Requirement: Operability — legacy imports absent

#### Scenario: No createRoot in migrated files

- **Given** migration is complete
- **When** `grep -r "createRoot" tests/unit/components/CombatantCard` is run
- **Then** zero results are returned
