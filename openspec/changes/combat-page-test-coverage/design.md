## Context

- Relevant architecture: `app/combat/page.tsx` exports `CombatPage` (default), which wraps `CombatContent` in `ProtectedRoute`. `CombatContent` calls `useCombat()` and `useAuth()`, then conditionally renders `CombatSetupView` or `ActiveCombatView`.
- Dependencies: `lib/hooks/useCombat.ts` (exports `useCombat` and `UseCombatReturn`), `lib/hooks/useAuth.ts`, `lib/components/ProtectedRoute.tsx`, `lib/components/CombatSetupView.tsx`, `lib/components/ActiveCombatView.tsx`.
- Interfaces/contracts touched: `UseCombatReturn` (read-only; factory typed against the exported interface).

## Goals / Non-Goals

### Goals

- Three fast unit tests documenting the loading, setup, and active render branches of `CombatContent`
- A reusable `makeUseCombat` factory in `tests/unit/fixtures/useCombat.ts` typed against `UseCombatReturn`
- ≥80% statement coverage on `app/combat/page.tsx`

### Non-Goals

- Testing `CombatSetupView`, `ActiveCombatView`, `useCombat`, or `useAuth` internals
- Adding an error render branch to the component
- Modifying production code

## Decisions

### Decision 1: Test `CombatPage` (default export) with `ProtectedRoute` mocked

- Chosen: Mock `ProtectedRoute` as a pass-through (`({ children }) => <>{children}</>`), then render `CombatPage`.
- Alternatives considered: Export `CombatContent` and test it directly (Option B).
- Rationale: Tests the real module wiring — the same component tree that runs in production. No production code changes required.
- Trade-offs: One additional mock (`ProtectedRoute`), but negligible cost.

### Decision 2: Central `makeUseCombat` fixture factory

- Chosen: `tests/unit/fixtures/useCombat.ts` exports `makeUseCombat(overrides?: Partial<UseCombatReturn>): UseCombatReturn`. All action fields default to `jest.fn()` stubs; all state fields default to safe empty values. `jest` imported explicitly from `@jest/globals`.
- Alternatives considered: Inline partial mocks per test file; typed as `as UseCombatReturn` cast.
- Rationale: Typed factory catches interface drift at compile time. Central location enables reuse across future combat-related tests. Explicit `@jest/globals` import aligns with project convention (`TargetActionModal.test.tsx` line 6).
- Trade-offs: `jest.fn()` stubs in a fixture file require `@jest/globals` import — acceptable and consistent.

### Decision 3: `createRoot` + `act` test pattern (no RTL)

- Chosen: Follow the pattern in `tests/unit/components/TargetActionModal.test.tsx` — `createRoot`, `act`, direct DOM assertions via `container.textContent`.
- Alternatives considered: React Testing Library (`@testing-library/react`).
- Rationale: Consistency with the existing unit test suite. No new dependency needed.
- Trade-offs: Slightly more boilerplate than RTL, but the pattern is already established.

### Decision 4: Sentinel text for child component mocks

- Chosen: Mock `CombatSetupView` to render `<div>CombatSetupView</div>` and `ActiveCombatView` to render `<div>ActiveCombatView</div>`. Tests assert on these sentinel strings.
- Alternatives considered: Assert on props passed to child mocks.
- Rationale: Sufficient for branch coverage and render confidence. Prop-shape tests belong in dedicated component test files.
- Trade-offs: Does not verify prop correctness; acceptable given scope.

## Proposal to Design Mapping

- Proposal element: "mock at the module boundary"
  - Design decision: Decision 1 (ProtectedRoute pass-through) + Decision 2 (makeUseCombat factory) + Decision 4 (sentinel mocks)
  - Validation approach: `jest.mock` for all five modules; tests pass without network or real hook state

- Proposal element: "follow TargetActionModal.test.tsx pattern"
  - Design decision: Decision 3 (createRoot + act)
  - Validation approach: Test file structure mirrors TargetActionModal pattern

- Proposal element: "full mock factory with explicit @jest/globals imports"
  - Design decision: Decision 2
  - Validation approach: TypeScript compilation verifies UseCombatReturn coverage; explicit import verified by code review

## Functional Requirements Mapping

- Requirement: Loading branch renders "Loading combat data..." text
  - Design element: `makeUseCombat({ loading: true })` drives the guard clause
  - Acceptance criteria reference: `tests/unit/combat/combatPage.test.tsx` — "loading state" test
  - Testability notes: Assert `container.textContent` contains the loading string

- Requirement: Setup branch renders `CombatSetupView` when `combatState` is null
  - Design element: `makeUseCombat({ loading: false, combatState: null })`
  - Acceptance criteria reference: `tests/unit/combat/combatPage.test.tsx` — "setup view" test
  - Testability notes: Assert sentinel text "CombatSetupView" present

- Requirement: Active branch renders `ActiveCombatView` when `combatState` is non-null
  - Design element: `makeUseCombat({ loading: false, combatState: MOCK_COMBAT_STATE })`
  - Acceptance criteria reference: `tests/unit/combat/combatPage.test.tsx` — "active view" test
  - Testability notes: Assert sentinel text "ActiveCombatView" present; `MOCK_COMBAT_STATE` is a minimal `CombatState` object defined in the test file

## Non-Functional Requirements Mapping

- Requirement category: reliability
  - Requirement: Factory must not silently omit new fields as `UseCombatReturn` evolves
  - Design element: Factory return type is `UseCombatReturn` (not a cast); TypeScript errors on missing required fields
  - Acceptance criteria reference: TypeScript compilation in CI
  - Testability notes: Adding a required field to `UseCombatReturn` without updating the factory produces a compile error

- Requirement category: performance
  - Requirement: Tests run in under one second
  - Design element: All dependencies mocked; no real network, no real DB
  - Acceptance criteria reference: Jest unit test run time
  - Testability notes: Verified by `npm test -- --testPathPattern=combatPage`

## Risks / Trade-offs

- Risk/trade-off: `UseCombatReturn` adds a required field in the future
  - Impact: Compile error in fixture — forces fixture update before tests can run
  - Mitigation: This is intentional; the compile error is a feature, not a bug

- Risk/trade-off: `ProtectedRoute` mock is a pass-through and does not test auth-gating
  - Impact: If auth-gating logic is added to `CombatPage` itself, tests won't catch regressions
  - Mitigation: Auth-gating is tested in `ProtectedRoute`'s own tests; not the responsibility of this change

## Rollback / Mitigation

- Rollback trigger: Tests introduce flakiness or unexpected failures in CI
- Rollback steps: Delete `tests/unit/combat/combatPage.test.tsx`; `tests/unit/fixtures/useCombat.ts` can remain as it adds no runtime code
- Data migration considerations: None
- Verification after rollback: `npm test` passes green

## Operational Blocking Policy

- If CI checks fail: Investigate and fix before merging; do not merge with red tests
- If security checks fail: Not applicable (test-only change, no production code modified)
- If required reviews are blocked/stale: Ping reviewer after 48 hours; escalate to maintainer after 72 hours
- Escalation path and timeout: Tag `@dougis` if unresolved after 72 hours

## Open Questions

No open questions. All design decisions finalized during exploration session.
