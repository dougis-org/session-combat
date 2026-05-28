## GitHub Issues

- #257

## Why

- Problem statement: Five components — `LegendaryActionsPanel`, `LairActionsSlot`, `InitiativeEntry`, `CombatInfoIcon`, and `Modal` — sit at 0% test coverage. These are used in the active combat flow and have no automated safety net against regressions.
- Why now: RTL infrastructure (#254) is closed and the first RTL tests landed in PR 272 (`CombatantCard.hp.test.tsx`). The pattern is established; this is the next wave of coverage work in the Testing Quality Initiative.
- Business/user impact: Silent regressions in the combat UI (initiative, legendary actions, lair actions, info display, modals) could go undetected. These components are exercised every session.

## Problem Space

- Current behavior: All five components have 0% statement coverage. No test files exist for them. All existing tests in `tests/unit/components/` use the legacy `createRoot`/`act`/`container.querySelector` pattern.
- Desired behavior: Each component reaches ≥80% statement coverage. Tests use RTL (`render`, `screen`, `userEvent`) following the PR 272 pattern. One new test file per component.
- Constraints: No production code changes. Tests must pass in CI (`npm run test:unit`). Must follow the RTL patterns from PR 272 exactly (see Design).
- Assumptions: RTL packages (`@testing-library/react`, `@testing-library/jest-dom`, `@testing-library/user-event`) are installed. `jest.setup.ts` imports `@testing-library/jest-dom`. Both confirmed by #254 and PR 272.
- Edge cases considered: `InitiativeEntry` has local `useState` (3 modes) and a `document.keydown` effect — integration-style testing is appropriate. `CombatInfoIcon` has baked-in combatant grouping logic inside the component body — tested via rendered output with known fixture; pure extraction tracked in #274. `LairActionsSlot` has two render paths (`isActive` true/false).

## Scope

### In Scope

- `tests/unit/components/LegendaryActionsPanel.test.tsx` — new RTL test file
- `tests/unit/components/LairActionsSlot.test.tsx` — new RTL test file
- `tests/unit/components/InitiativeEntry.test.tsx` — new RTL test file (integration-style)
- `tests/unit/components/CombatInfoIcon.test.tsx` — new RTL test file
- `tests/unit/components/Modal.test.tsx` — new RTL test file
- ≥80% statement coverage per component as the acceptance gate

### Out of Scope

- Migrating existing tests from the legacy `createRoot` pattern to RTL
- Extracting combatant grouping logic from `CombatInfoIcon` (tracked in #274)
- Raising coverage in any other component
- Production code changes of any kind

## What Changes

- 5 new test files in `tests/unit/components/`
- No changes to production code or existing test files

## Risks

- Risk: `InitiativeEntry` calls `Math.random` via `buildInitiativeRoll` — rolled initiative is non-deterministic.
  - Impact: Low — the `roll` mode result can be asserted within valid range (1–20 + bonus), or `Math.random` can be spied on.
  - Mitigation: Assert result is within valid range for roll mode; use manual/dice entry modes for deterministic path tests.
- Risk: `InitiativeEntry` calls `window.alert` on invalid dice input.
  - Impact: Low — jsdom does not render alert dialogs but the call throws without a mock.
  - Mitigation: Spy on `window.alert` with `jest.spyOn` in relevant tests.
- Risk: `CombatInfoIcon` renders combatant grouping logic inline — tests depend on the internal rendering shape.
  - Impact: Low — tests use known fixtures and assert on rendered text/role queries; brittle only if the rendering template changes significantly.
  - Mitigation: Use minimal fixtures and prefer role/text queries over DOM structure assertions.
- Risk: jsdom does not process Tailwind classes — color/style assertions are unreliable.
  - Impact: Low — no test in scope needs to assert CSS color values.
  - Mitigation: Assert on text content, ARIA roles, `data-testid` attributes, and inline styles only.

## Open Questions

No unresolved ambiguity. Components, patterns (PR 272), infrastructure (#254), and coverage targets (#257) are all confirmed.

## Non-Goals

- Achieving 100% coverage on any component
- Refactoring production code to make components easier to test
- Adding `data-testid` attributes to production markup (use role/text queries instead, per RTL idiom)

## Change Control

If scope changes after proposal approval, update `proposal.md`, `design.md`,
`specs/**/*.md`, and `tasks.md` before implementation starts.
