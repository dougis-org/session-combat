## GitHub Issues

- #263
- #254 (prerequisite — closed)
- #264 (related — `@jest-environment jsdom` docblock removal)
- #343 (CampaignEditor migration — tracked separately)

## Why

- **Problem statement:** Three page-level component test files (`SessionsPage`, `PartiesPage`, `CampaignsPage`) use a manual `createRoot` + `act` render pattern. This pattern requires per-test DOM setup/teardown, IS_REACT_ACT_ENVIRONMENT global mutation, and low-level DOM queries that are brittle and don't reflect how users interact with the UI.
- **Why now:** RTL infrastructure (#254) is now installed and configured. Wave 4 of the Testing Quality Initiative is unblocked. The three files are small enough to migrate together in one change.
- **Business/user impact:** Improved test maintainability and reliability. RTL queries by role and text align tests with user-visible behavior, making regressions easier to catch and false positives harder to introduce.

## Problem Space

- **Current behavior:** Tests use `createRoot(container)` + `act(() => root.render(...))`, find elements via `querySelectorAll('button').find(b => b.textContent.includes(...))`, and assert via `container.textContent.toContain(...)`. Async interactions use `await act(async () => { btn.click() })`.
- **Desired behavior:** Tests use `render()` from `@testing-library/react`, find elements via `screen.getByRole(...)` / `screen.getByText(...)`, assert via `.toBeInTheDocument()`, and interact via `await userEvent.click(...)`.
- **Constraints:** All existing test cases must be preserved — no test count reduction. No coverage regression.
- **Assumptions:** `@testing-library/react` and `@testing-library/user-event` are already installed (confirmed via #254). The `jest.setup.ts` already imports `@testing-library/jest-dom` for matcher support.
- **Edge cases considered:** `PartiesPage` uses `querySelectorAll('[aria-label^="Member section:"]')` — this aria-label pattern must be preserved or migrated to an equivalent RTL query. `CampaignsPage` has a pending-fetch / loading-state test that needs `screen.findBy*` for async resolution.

## Scope

### In Scope

- `tests/unit/components/SessionsPage.test.tsx` — full RTL migration
- `tests/unit/components/PartiesPage.test.tsx` — full RTL migration
- `tests/unit/components/CampaignsPage.test.tsx` — full RTL migration
- Removing `IS_REACT_ACT_ENVIRONMENT` global mutations from all three files
- Removing `@jest-environment jsdom` docblocks (overlaps with #264; fine to do here)
- Updating/removing helper imports (`setupUiTest`, `createReactRoot`, `uiTestSetup`)

### Out of Scope

- `CampaignEditor.test.tsx` — tracked in #343
- Modifying any production (non-test) component files
- Deleting `uiTestSetup.ts` — other test files still consume it
- Migrating other test files not listed above

## What Changes

- `tests/unit/components/SessionsPage.test.tsx` — rewritten to use RTL render, screen queries, userEvent
- `tests/unit/components/PartiesPage.test.tsx` — rewritten to use RTL render, screen queries, userEvent
- `tests/unit/components/CampaignsPage.test.tsx` — rewritten to use RTL render, screen queries, userEvent; async patterns use `findBy*`

## Risks

- Risk: A migrated query doesn't find the same element the old DOM query did, and the test passes but tests the wrong thing.
  - Impact: False positive — existing behavior silently untested.
  - Mitigation: Run tests before and after; verify test count stays constant; cross-check assertions against what the component actually renders.

- Risk: `PartiesPage` aria-label query changes meaning when migrated to RTL.
  - Impact: Tests pass but no longer cover the aria-label contract.
  - Mitigation: Confirm the RTL query selects the same elements before removing the old query.

- Risk: `CampaignsPage` async tests become flaky if `findBy*` timeouts are too short.
  - Impact: Intermittent CI failures.
  - Mitigation: Use `screen.findBy*` (default 1000ms timeout) and verify fetch mocks resolve synchronously via `Promise.resolve(...)`.

## Open Questions

No unresolved ambiguity. All three files have been inspected and their patterns catalogued. The migration approach is confirmed.

## Non-Goals

- Improving coverage beyond what already exists
- Adding new test cases
- Changing component source files
- Migrating `uiTestSetup.ts` itself to RTL

## Change Control

If scope changes after proposal approval, update `proposal.md`, `design.md`,
`specs/**/*.md`, and `tasks.md` before implementation starts.
