## GitHub Issues

- #355

## Why

- Problem statement: Four component test files (`LairForm`, `CharacterMiniSummary`, `LairActionsSlot`, `CombatStatsRow`) still use the legacy `createReactRoot` / `act` / `container.querySelector` pattern from before React Testing Library (RTL) was installed in #254. These pre-RTL tests are inconsistent with every other component test in the project and use a lower-quality assertion style (`container.textContent.toContain`) that doesn't verify accessibility semantics or component roles.
- Why now: The prerequisite work is complete — RTL is installed (#254), `jest.config.js` uses `jsdom` globally, and the boilerplate cleanup (#264) is in progress. These 4 files are the next logical step.
- Business/user impact: Consistent test patterns across the codebase reduce cognitive overhead, make it easier to write new tests correctly, and improve test quality by using role- and label-based queries.

## Problem Space

- Current behavior: The 4 files import `createReactRoot` / `unmountReactRoot` from `tests/unit/helpers/reactRoot.ts`, manually set up a DOM container, wrap renders in `act()`, and assert using `container.textContent` or `container.querySelector`.
- Desired behavior: All 4 files use RTL `render` / `screen` queries with `getByRole`, `getByText`, `getByTestId`, etc., and `userEvent.setup()` for interactions — consistent with the rest of the component test suite.
- Constraints:
  - `tests/unit/components/CampaignEditor.test.tsx` also imports `createReactRoot` and is tracked separately in #356; `reactRoot.ts` must NOT be deleted in this change.
  - Interaction tests must use `userEvent.setup()` per test (project convention — see `CombatantCard.callbacks.test.tsx`, `ActiveCombatView.test.tsx`).
  - All existing test assertions must be preserved (no test removal, no narrowing of coverage).
- Assumptions: RTL and `@testing-library/user-event` are already installed and configured.
- Edge cases considered:
  - `LairForm` and `LairActionsSlot` use `async act(() => { root.render(...) })` — RTL's `render` is synchronous and handles `act` internally; the async wrapping is unnecessary after migration.
  - `LairForm` finds buttons via `querySelectorAll('button').find(b => b.textContent?.includes('Add Lair'))` — this must be replaced with `screen.getByRole('button', { name: /Add Lair/ })`.
  - `CharacterMiniSummary` tests a `fetch` spy — this is a unit-level concern unrelated to RTL and should be preserved as-is.

## Scope

### In Scope

- Migrate `tests/unit/CombatStatsRow.test.tsx` to RTL
- Migrate `tests/unit/CharacterMiniSummary.test.tsx` to RTL
- Migrate `tests/unit/LairForm.test.tsx` to RTL
- Migrate `tests/unit/LairActionsSlot.test.tsx` to RTL
- Use `screen.getByRole`, `screen.getByText`, `screen.getByTestId`, `screen.getByLabelText` (Option B: embrace RTL idioms)
- Use `userEvent.setup()` per-test for click/interaction assertions (project convention)
- Verify `npm run test:unit` passes with zero regressions after all 4 migrations

### Out of Scope

- Migrating `tests/unit/components/CampaignEditor.test.tsx` (tracked in #356)
- Deleting `tests/unit/helpers/reactRoot.ts` (still needed by `CampaignEditor.test.tsx`)
- Changes to `jest.config.js`, `jest.setup.ts`, or any other configuration
- Adding new test cases beyond what currently exists

## What Changes

- `tests/unit/CombatStatsRow.test.tsx`: replace `createReactRoot`/`act` setup with RTL `render`; replace `container.textContent.toContain` with `screen.getByText` / `toBeInTheDocument`
- `tests/unit/CharacterMiniSummary.test.tsx`: same pattern; also preserve `global.fetch` spy test
- `tests/unit/LairForm.test.tsx`: replace setup; replace `querySelectorAll('button').find(...)` with `screen.getByRole('button', { name: /.../ })`; replace `btn.click()` with `userEvent.setup()` + `await user.click(btn)`
- `tests/unit/LairActionsSlot.test.tsx`: replace setup; replace `container.querySelector('[data-testid="..."]')` with `screen.getByTestId`; replace `el.click()` with `userEvent.setup()` + `await user.click(el)`

## Risks

- Risk: RTL's `cleanup` (automatic after each test) may surface issues if components have global side effects that the old manual `unmountReactRoot` was masking.
  - Impact: Low — tests would fail loudly rather than silently.
  - Mitigation: Run full unit test suite after each file migration to catch regressions early.
- Risk: `getByRole` queries require correct ARIA roles in components; if a button lacks accessible text the query will throw.
  - Impact: Low — the components use standard HTML elements with visible text.
  - Mitigation: Inspect rendered output if a query fails; fall back to `getByTestId` for elements without accessible names.

## Open Questions

No unresolved ambiguity. Decisions confirmed in exploration:
- Query style: Option B (role/semantic RTL queries) ✅
- Interaction library: `userEvent.setup()` per test (matches project convention) ✅
- `reactRoot.ts` deletion: deferred — `CampaignEditor.test.tsx` still uses it ✅

## Non-Goals

- Improving test coverage beyond the current test cases
- Refactoring the components under test
- Updating `reactRoot.ts` itself
- Migrating integration tests

## Change Control

If scope changes after proposal approval, update `proposal.md`, `design.md`,
`specs/**/*.md`, and `tasks.md` before implementation starts.
