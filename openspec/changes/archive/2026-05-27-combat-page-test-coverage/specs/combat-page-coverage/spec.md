## ADDED Requirements

This document details *changes* to requirements and is additive to the `design.md` document, not a replacement.

### Requirement: ADDED Central `useCombat` mock factory

The system SHALL provide a typed factory function `makeUseCombat(overrides?)` in `tests/unit/fixtures/useCombat.ts` that returns a complete `UseCombatReturn` object with safe defaults and `jest.fn()` stubs for all action fields.

#### Scenario: Factory returns a fully-typed default object

- **Given** no overrides are passed
- **When** `makeUseCombat()` is called
- **Then** the returned object satisfies the `UseCombatReturn` type with `loading: false`, `error: null`, `combatState: null`, and all action fields as `jest.fn()` stubs

#### Scenario: Factory applies overrides

- **Given** an override object `{ loading: true }` is passed
- **When** `makeUseCombat({ loading: true })` is called
- **Then** the returned object has `loading: true` and all other fields at their defaults

#### Scenario: TypeScript catches interface drift

- **Given** a new required field is added to `UseCombatReturn`
- **When** the project is compiled
- **Then** TypeScript produces a compile error in `tests/unit/fixtures/useCombat.ts` until the factory is updated

---

### Requirement: ADDED Unit tests for `CombatPage` loading branch

The system SHALL have a test that verifies `CombatContent` renders the loading indicator when `useCombat` returns `loading: true`.

#### Scenario: Loading spinner renders

- **Given** `useCombat` returns `makeUseCombat({ loading: true })`
- **When** `CombatPage` is rendered
- **Then** the container text contains "Loading combat data..."
- **And** neither "CombatSetupView" nor "ActiveCombatView" sentinel text is present

---

### Requirement: ADDED Unit tests for `CombatPage` setup branch

The system SHALL have a test that verifies `CombatContent` renders `CombatSetupView` when `useCombat` returns `loading: false` and `combatState: null`.

#### Scenario: Setup view renders when no active combat

- **Given** `useCombat` returns `makeUseCombat({ loading: false, combatState: null })`
- **When** `CombatPage` is rendered
- **Then** the container text contains "CombatSetupView"
- **And** the container text does not contain "ActiveCombatView"

---

### Requirement: ADDED Unit tests for `CombatPage` active branch

The system SHALL have a test that verifies `CombatContent` renders `ActiveCombatView` when `useCombat` returns a non-null `combatState`.

#### Scenario: Active combat view renders

- **Given** `useCombat` returns `makeUseCombat({ loading: false, combatState: MOCK_COMBAT_STATE })` where `MOCK_COMBAT_STATE` is a minimal valid `CombatState`
- **When** `CombatPage` is rendered
- **Then** the container text contains "ActiveCombatView"
- **And** the container text does not contain "CombatSetupView"

---

## MODIFIED Requirements

None. No existing requirements are changed by this work.

## REMOVED Requirements

None.

## Traceability

- Proposal element "mock at module boundary" → Requirement: Central mock factory
- Proposal element "≥80% statement coverage" → Requirements: loading, setup, active branch tests
- Design decision 1 (CombatPage with ProtectedRoute mocked) → Requirements: all three branch tests
- Design decision 2 (makeUseCombat factory) → Requirement: Central mock factory
- Design decision 3 (createRoot + act) → Requirements: all three branch tests
- Design decision 4 (sentinel text) → Requirements: setup branch test, active branch test
- Requirement: Central mock factory → Task: Create `tests/unit/fixtures/useCombat.ts`
- Requirement: Loading/setup/active branch tests → Task: Create `tests/unit/combat/combatPage.test.tsx`

## Non-Functional Acceptance Criteria

### Requirement: Reliability

#### Scenario: Interface drift is caught at compile time

- **Given** `UseCombatReturn` gains a new required field
- **When** TypeScript compiles the project
- **Then** a compile error is raised in `tests/unit/fixtures/useCombat.ts`, not silently ignored

### Requirement: Performance

#### Scenario: Test suite runs fast

- **Given** all five module-level mocks are in place
- **When** `npm test -- --testPathPattern=combatPage` is run
- **Then** the three tests complete in under one second (no network, no DB, no real hook state)
