## GitHub Issues

- #259

## Why

- Problem statement: `ActiveCombatView.tsx` (403 lines) and `CombatSetupView.tsx` (193 lines) have 0% coverage. These are the two top-level orchestrator components that wire all combat UI together — bugs in their prop threading, modal triggers, and callback dispatch are currently undetectable.
- Why now: All four blocker issues (#254 RTL infra, #256 CombatantCard, #257 standalone components, #258 QuickCombatantModal) are now closed. This is Wave 3 of the Testing Quality Initiative (#242).
- Business/user impact: The combat flow is the primary user interaction surface. Regressions in turn advancement, combatant removal, or modal triggers would be high-visibility and currently undetected by CI.

## Problem Space

- Current behavior: Both components have 0% statement coverage. No tests exist for the orchestration layer.
- Desired behavior: Both components reach ≥ 60% statement coverage. Key user flows (render, turn advance, modal open/close, remove combatant) are exercised by automated tests.
- Constraints: `UseCombatReturn` has 50 members. Unit testing at full isolation would require mocking all 50. Instead, mock the `useCombat` hook at the module boundary and render child components for real — one mock, realistic rendering.
- Assumptions: The `makeUseCombat` factory at `tests/unit/fixtures/useCombat.ts` is complete and covers all 50 members of `UseCombatReturn`. Child components (`CombatantCard`, `InitiativeEntry`, `LairActionsSlot`, etc.) are already covered by their own tests.
- Edge cases considered: Components that depend on `combatState` being null vs. populated; `setupCombatants` being empty vs. non-empty; modal open/close state toggling via boolean flags in the hook return.

## Scope

### In Scope

- `tests/unit/components/ActiveCombatView.test.tsx` — new test file
- `tests/unit/components/CombatSetupView.test.tsx` — new test file
- Reuse of `tests/unit/fixtures/useCombat.ts` (`makeUseCombat`) as the mock factory

### Out of Scope

- No new shared helper file (the existing fixture already serves this purpose)
- No changes to `jest.config.js` or `jest.integration.config.js`
- No migration of existing tests
- No tests for child components (covered separately)

## What Changes

- New file: `tests/unit/components/ActiveCombatView.test.tsx`
- New file: `tests/unit/components/CombatSetupView.test.tsx`

## Risks

- Risk: Child components render for real and may themselves require additional mocking (e.g., `next/link`, Next.js router).
  - Impact: Test setup complexity could be higher than expected.
  - Mitigation: `next/link` mock is a one-liner already used elsewhere in the test suite. Other child components were explicitly tested first (#256, #257, #258) to ensure they render cleanly in isolation.
- Risk: Coverage target of ≥ 60% may not be reachable with the scenarios listed if conditional branches are numerous.
  - Impact: Acceptance criteria not met.
  - Mitigation: The issue analysis shows the listed scenarios map to the major uncovered code paths. If 60% is not reachable, add scenarios for remaining branches before closing.

## Open Questions

No unresolved ambiguity. The approach, file locations, fixture reuse, and test scope were all confirmed during the explore session preceding this proposal.

## Non-Goals

- End-to-end tests for the combat flow
- Testing the `useCombat` hook itself (covered by `tests/unit/combat/combatPage.test.tsx`)
- Migrating existing combat tests to RTL

## Change Control

If scope changes after proposal approval, update `proposal.md`, `design.md`,
`specs/**/*.md`, and `tasks.md` before implementation starts.
