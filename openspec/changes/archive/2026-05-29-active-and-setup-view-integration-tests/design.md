## Context

- Relevant architecture: `ActiveCombatView` and `CombatSetupView` are the two top-level orchestrator components in the combat feature. Both receive the full `UseCombatReturn` interface (50 members) as props, spread from the `useCombat` hook called in `app/combat/page.tsx`. Child components (`CombatantCard`, `InitiativeEntry`, `LairActionsSlot`, `LegendaryActionsPanel`, `CombatInfoIcon`, `Modal`, `QuickCombatantModal`) render inside them.
- Dependencies: `@testing-library/react`, `@testing-library/jest-dom`, `@testing-library/user-event` (all installed via #254). `jest.setup.ts` already imports `@testing-library/jest-dom`. `jest.config.js` uses `testEnvironment: jsdom`.
- Interfaces/contracts touched: `UseCombatReturn` (lib/hooks/useCombat.ts), `makeUseCombat` factory (tests/unit/fixtures/useCombat.ts).

## Goals / Non-Goals

### Goals

- Achieve ≥ 60% statement coverage for both `ActiveCombatView.tsx` and `CombatSetupView.tsx`
- Exercise key user flows via RTL: render, turn advance, modal triggers, combatant removal
- Reuse the existing `makeUseCombat` fixture without duplication

### Non-Goals

- Testing `useCombat` hook logic (covered elsewhere)
- 100% coverage — only major orchestration paths are required
- E2E or API-layer testing

## Decisions

### Decision 1: Test placement in tests/unit/components/

- Chosen: `tests/unit/components/ActiveCombatView.test.tsx` and `tests/unit/components/CombatSetupView.test.tsx`
- Alternatives considered: `tests/integration/components/` (as suggested in the GitHub issue)
- Rationale: These tests mock `useCombat` at the module boundary and render child components for real — no real persistence layer, no server, no database. That is a unit test by the project's definition. The `integration` label in the issue referred to the testing strategy (one mock, real children), not the test tier.
- Trade-offs: Runs under `npm test` only, not `npm run test:integration`. This is correct — the integration suite is for API/server tests with a real database.

### Decision 2: Reuse makeUseCombat from tests/unit/fixtures/useCombat.ts

- Chosen: Import `makeUseCombat` directly from `@/tests/unit/fixtures/useCombat`
- Alternatives considered: Creating a new `tests/integration/helpers/makeCombatReturn.ts` (as specified in the issue)
- Rationale: The fixture already exists, is complete (all 50 members), and is already used by `tests/unit/combat/combatPage.test.tsx`. Duplicating it adds maintenance burden with no benefit.
- Trade-offs: None — the existing factory is a direct fit.

### Decision 3: Mock useCombat at module boundary, render children for real

- Chosen: `jest.mock('@/lib/hooks/useCombat', () => ({ useCombat: jest.fn() }))` with `(useCombat as jest.Mock).mockReturnValue(makeUseCombat(overrides))` per test
- Alternatives considered: Mocking all child components; full shallow rendering
- Rationale: One mock at the hook boundary tests the wiring between the hook contract and the rendered UI in a realistic way. Child components are already tested in their own files.
- Trade-offs: If a child component has a rendering bug it could cause false failures. Mitigated by having child component tests pass in CI before this work begins.

### Decision 4: Mock next/link

- Chosen: `jest.mock('next/link', () => ({ default: ({ children }: any) => children }))`
- Rationale: Next.js router is not available in jsdom. This is a standard pattern already present in the test suite.
- Trade-offs: None.

## Proposal to Design Mapping

- Proposal element: Tests in `tests/unit/components/` using unit jest config
  - Design decision: Decision 1
  - Validation approach: Files picked up by `jest.config.js` glob `**/tests/**/*.test.(ts|tsx)`
- Proposal element: Reuse `makeUseCombat` fixture, no new helper
  - Design decision: Decision 2
  - Validation approach: Import resolves; TypeScript compilation succeeds
- Proposal element: Mock hook at module boundary, render children for real
  - Design decision: Decision 3
  - Validation approach: RTL `render`, `screen` queries, `userEvent` interactions

## Functional Requirements Mapping

- Requirement: ActiveCombatView renders combatant list in initiative order
  - Design element: `makeUseCombat({ combatState: mockState })` + `getDisplayCombatants` mock
  - Acceptance criteria reference: specs/active-combat-view.md
  - Testability notes: RTL `screen.getByText` on combatant names
- Requirement: Next turn button calls `nextTurn()`
  - Design element: `userEvent.click` on "Next Turn" button; assert `nextTurn` mock called
  - Acceptance criteria reference: specs/active-combat-view.md
  - Testability notes: Button accessible by role
- Requirement: Encounter description modal opens/closes
  - Design element: `setShowEncounterDescription` mock; re-render with `showEncounterDescription: true`
  - Acceptance criteria reference: specs/active-combat-view.md
  - Testability notes: Modal content visible/hidden based on prop
- Requirement: CombatSetupView renders setup combatant list
  - Design element: `makeUseCombat({ setupCombatants: [...] })`
  - Acceptance criteria reference: specs/combat-setup-view.md
  - Testability notes: RTL `screen.getByText` on combatant names
- Requirement: Start combat button calls `startCombatWithSetupCombatants()`
  - Design element: `userEvent.click` on "Start Combat"; assert mock called
  - Acceptance criteria reference: specs/combat-setup-view.md
  - Testability notes: Button accessible by role
- Requirement: Add combatant button calls `setShowCombatantModal(true)`
  - Design element: `userEvent.click` on add button; assert mock called with `true`
  - Acceptance criteria reference: specs/combat-setup-view.md
  - Testability notes: Button accessible by role or text

## Non-Functional Requirements Mapping

- Requirement category: reliability
  - Requirement: Tests must pass consistently in CI without flakiness
  - Design element: No timers, no real async I/O; all mocks return synchronous values
  - Acceptance criteria reference: All tests green in CI
  - Testability notes: `userEvent` setup/cleanup per test via `beforeEach`

## Risks / Trade-offs

- Risk/trade-off: Child component rendering may surface unexpected dependency requirements
  - Impact: Additional mocks needed (e.g., CSS modules, SVG imports)
  - Mitigation: `jest.config.js` already has moduleNameMapper and transform configured for the project; same patterns used in existing component tests

## Rollback / Mitigation

- Rollback trigger: New test files cause existing tests to fail or CI to break
- Rollback steps: Delete the two new test files; no production code is touched
- Data migration considerations: None
- Verification after rollback: `npm test` green

## Operational Blocking Policy

- If CI checks fail: Investigate and fix before merging; do not use `--no-verify` or admin merge
- If security checks fail: Same — fix the root cause
- If required reviews are blocked/stale: Ping reviewers; do not self-merge without review
- Escalation path and timeout: If blocked for >2 business days, raise in the project channel

## Open Questions

No open questions. All decisions confirmed during explore session.
