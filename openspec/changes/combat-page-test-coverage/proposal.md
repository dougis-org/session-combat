## GitHub Issues

- #243

## Why

- Problem statement: `app/combat/page.tsx` has 0% test coverage across all metrics despite being the entry point for the application's primary feature.
- Why now: The combat page is in active development; regressions in the setup→active transition or `useCombat` wiring would only be caught manually or by slow E2E tests.
- Business/user impact: Any breakage in the combat feature's conditional rendering goes undetected by the fast-feedback test suite.

## Problem Space

- Current behavior: No unit tests exist for `app/combat/page.tsx`. The three render branches (loading, setup, active) are exercised only by manual QA or Playwright E2E tests.
- Desired behavior: ≥80% statement coverage on `app/combat/page.tsx`, with fast unit tests that document the three branches and can be run locally in under a second.
- Constraints: Tests must mock at the module boundary (no real network calls, no real hook state). The `ProtectedRoute` wrapper must be mocked so tests drive `CombatContent` directly without auth. Mock pattern must follow the `createRoot` + `act` style used in `tests/unit/components/TargetActionModal.test.tsx`.
- Assumptions: `UseCombatReturn` (already exported from `lib/hooks/useCombat.ts`) is the canonical type for the central mock factory. No error render branch exists in the component and none will be added in this change.
- Edge cases considered: The loading branch (`combat.loading === true`) returns early before any child component renders — this is a distinct branch that requires its own test case.

## Scope

### In Scope

- New central fixture `tests/unit/fixtures/useCombat.ts` exporting `makeUseCombat(overrides?)` — a full typed factory covering all fields of `UseCombatReturn`
- New test file `tests/unit/combat/combatPage.test.tsx` covering the three render branches of `CombatContent`
- Mocks for `useCombat`, `useAuth`, `ProtectedRoute`, `CombatSetupView`, and `ActiveCombatView` at the module boundary

### Out of Scope

- Adding an error render branch to `app/combat/page.tsx`
- Tests for `CombatSetupView`, `ActiveCombatView`, or `useCombat` internals
- Integration or E2E tests for the combat page
- Coverage improvements for any other file

## What Changes

- `tests/unit/fixtures/useCombat.ts` — new file; central mock factory for `UseCombatReturn`
- `tests/unit/combat/combatPage.test.tsx` — new file; unit tests for `CombatPage` / `CombatContent`

## Risks

- Risk: `UseCombatReturn` interface drifts as the hook evolves, causing the factory to miss new fields.
  - Impact: New fields silently default to `undefined`; tests may pass while mocks are incomplete.
  - Mitigation: Factory is typed as `UseCombatReturn`, so TypeScript will error if required fields are missing.

- Risk: Child component mocks (`CombatSetupView`, `ActiveCombatView`) are too coarse and mask real render issues.
  - Impact: Tests pass even if the component passes wrong props.
  - Mitigation: Sentinel text is sufficient for coverage; prop-shape tests can be added in dedicated component test files.

## Open Questions

No unresolved ambiguity. All decisions confirmed during exploration:
- No error state to be added.
- Option A (test `CombatPage` with `ProtectedRoute` mocked) chosen over exporting `CombatContent`.
- Full mock factory with `jest.fn()` stubs using explicit `@jest/globals` imports.

## Non-Goals

- Achieving 100% coverage on the combat page
- Testing user interactions within `CombatSetupView` or `ActiveCombatView`
- Refactoring `app/combat/page.tsx`

## Change Control

If scope changes after proposal approval, update `proposal.md`, `design.md`,
`specs/**/*.md`, and `tasks.md` before implementation starts.
