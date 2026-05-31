## GitHub Issues

- dougis-org/session-combat#262

## Why

- Problem statement: `CombatantCard.test.tsx` (486 lines) still uses the legacy `createRoot + act + container.querySelector` pattern. All new component tests use React Testing Library (RTL) as the project standard (established in #254). The file is also a single monolith covering unrelated concerns — badges, effects panel, presets, callbacks, and damage interactions — making it hard to navigate and costly to maintain.
- Why now: Both blockers are resolved — #254 (RTL infrastructure) is merged and #256 (HP/damage/condition coverage) is closed. The `CombatantCard.hp.test.tsx` file already models the correct RTL pattern. The original file is now the only component test file still on the old pattern.
- Business/user impact: Migrating removes the last legacy test pattern from component tests, reduces per-test maintenance overhead, and makes the test suite consistent and easier to extend.

## Problem Space

- Current behavior: `CombatantCard.test.tsx` uses `createRoot`, `act()`, `container.querySelectorAll`, and manual root teardown. It is 486 lines covering 7 unrelated describe blocks in one file.
- Desired behavior: All `CombatantCard` tests use RTL (`render`, `screen`, `userEvent`). The 486-line monolith is replaced by 3 focused files, and a shared test-helpers file eliminates fixture/render duplication.
- Constraints: `jest.mock` calls for `next/link` and `next/navigation` must remain at the top of each individual test file — Jest hoisting prevents centralising them.
- Assumptions: The `CombatantCard.hp.test.tsx` file (added by #256) is correct and complete; its `renderCard` helper is the right RTL pattern to standardise on.
- Edge cases considered: The `detail/remove callbacks` describe block passes optional props (`onShowDetails`, `onShowRemoveConfirm`) not used elsewhere. The shared `renderCard` helper's `extra` spread already handles this.

## Scope

### In Scope

- Migrate all 35 tests in `CombatantCard.test.tsx` to RTL
- Remove `IS_REACT_ACT_ENVIRONMENT = true` (no longer needed with RTL)
- Delete `CombatantCard.test.tsx` after migration is complete
- Create `tests/unit/components/CombatantCard.test-helpers.ts` with shared `BASE` fixture and `renderCard` helper
- Create `tests/unit/components/CombatantCard.badges.test.tsx` (badges + remove active effect — 10 tests)
- Create `tests/unit/components/CombatantCard.effects-panel.test.tsx` (panel toggle + preset application — 13 tests)
- Create `tests/unit/components/CombatantCard.callbacks.test.tsx` (callbacks + damage type select — 6 tests)
- Move Undo HP tests (6 tests) into `CombatantCard.hp.test.tsx`
- Update `CombatantCard.hp.test.tsx` to import shared helpers

### Out of Scope

- Changes to `CombatantCard.tsx` source code
- Adding new test coverage beyond what already exists
- Migrating any other component test files
- Changes to `jest.config.js` or `jest.setup.ts`

## What Changes

- **New file**: `tests/unit/components/CombatantCard.test-helpers.ts` — `BASE` fixture + `renderCard(overrides, onUpdate, extra)` shared by all 4 test files
- **New file**: `tests/unit/components/CombatantCard.badges.test.tsx` — 10 tests, RTL
- **New file**: `tests/unit/components/CombatantCard.effects-panel.test.tsx` — 13 tests, RTL; local `renderWithModifiers` / `openPanel` helpers
- **New file**: `tests/unit/components/CombatantCard.callbacks.test.tsx` — 6 tests, RTL
- **Modified file**: `tests/unit/components/CombatantCard.hp.test.tsx` — adds 6 Undo HP tests, imports shared helpers
- **Deleted file**: `tests/unit/components/CombatantCard.test.tsx`

## Risks

- Risk: RTL's async `userEvent` requires `await` — some tests in the old file use synchronous click patterns.
  - Impact: Tests could fail or produce false positives if not properly awaited.
  - Mitigation: Follow the `applyDamageHelper` pattern already established in `CombatantCard.hp.test.tsx` — `userEvent.setup()` + `await user.click()`.

- Risk: `screen` queries are global per test — RTL's `cleanup` between tests is automatic but relies on tests not sharing module-level state.
  - Impact: Leaking state between tests.
  - Mitigation: RTL auto-cleanup is already configured in `jest.setup.ts`; no manual teardown needed. Remove the old `beforeEach`/`afterEach` container setup entirely.

- Risk: Some old tests query by DOM structure (e.g. `container.querySelector('h3')`) where no semantic role exists.
  - Impact: May need `data-testid` attributes added to `CombatantCard.tsx` if no suitable role/label query exists.
  - Mitigation: Prefer `screen.getByText` or `screen.getByRole` first; add `data-testid` only as a last resort on a per-test basis.

## Open Questions

No unresolved ambiguity. All design decisions were confirmed during exploration:
- Shared helpers file: confirmed.
- `jest.mock` stays per-file: confirmed (Jest hoisting constraint).
- Undo HP tests move to `CombatantCard.hp.test.tsx`: confirmed.
- `IS_REACT_ACT_ENVIRONMENT` removed (not deferred): confirmed.

## Non-Goals

- Increasing coverage percentage beyond what #256 already achieved.
- Refactoring `CombatantCard.tsx` source.
- Migrating any other test files in this change.
- Adding a centralised `renderWithProviders` — the component has no context providers.

## Change Control

If scope changes after proposal approval, update `proposal.md`, `design.md`,
`specs/**/*.md`, and `tasks.md` before implementation starts.
