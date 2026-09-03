---
name: tests
description: Tests for the change
---

# Tests

## Overview

This document outlines the tests for the `legendary-badge-opens-detail` change. All work follows strict TDD (fail → pass → refactor).

Scope is component-level only (React Testing Library + Jest, run via `npm run test:unit` — the repo has **no** `npm test` script). No new E2E tests; the existing `tests/e2e/combat.spec.ts` legendary specs locate the badge by `data-testid` and assert text content, so they continue to pass after the `span → button` change with no edit.

Target test file: `tests/unit/components/CombatantCard.legendary-badge.test.tsx` (new), reusing the `renderCard` helper from `tests/unit/components/CombatantCard.test-helpers.ts` (the same helper used by `CombatantCard.callbacks.test.tsx`).

## Testing Steps

For each task in `tasks.md`:

1.  **Write a failing test** capturing the requirement; run it; confirm it fails.
2.  **Write the simplest code** to make it pass.
3.  **Refactor** while keeping tests green.

## Test Cases

### Task: Convert badge to a button (spec scenario: "Badge renders for legendary monster")

- [ ] **TC1** — Given a combatant with `legendaryActionCount: 3`, `legendaryActionsRemaining: 2`, when the card renders, then `screen.getByTestId('legendary-action-badge')` is an element with `tagName === 'BUTTON'` and `type === 'button'`.
  - _Fails first because:_ the badge is currently a `<span>`.
- [ ] **TC2** — Same combatant: the badge is queryable as `screen.getByRole('button', { name: /legendary actions/i })` (accessible name via `aria-label`).
- [ ] **TC3** — Same combatant: the badge still has `textContent` `⚡ 2/3` (i.e. `toHaveTextContent('2/3')`) — content regression guard.

### Task: Wire the badge onClick to `onShowDetails` (spec scenario: "Activating the badge opens the detail panel")

- [ ] **TC4** — Given `onShowDetails` is a `jest.fn()` passed via `renderCard`, when the user clicks the badge, then `onShowDetails` is called exactly once with the combatant's `id` as the first argument and a `{ top: number, left: number }` object as the second. (Mirror `CombatantCard.callbacks.test.tsx:26-32`; `getBoundingClientRect` returns zeros under jsdom — assert on shape/types, not values.)
- [ ] **TC5** — Given the badge is focused, when the user presses `Enter` (`userEvent.keyboard('{Enter}')`), then `onShowDetails` is called with the combatant's `id`.
- [ ] **TC6** — Given the badge is focused, when the user presses `Space` (`userEvent.keyboard(' ')`), then `onShowDetails` is called with the combatant's `id`. (TC5/TC6 pass for free once the element is a native `<button>` — they exist to lock in keyboard operability and would regress if someone reverts to `span` + `onClick`.)

### Task: Graceful behavior without a handler (spec scenario: "Badge is inert when no detail-panel handler is supplied")

- [ ] **TC7** — Given the card is rendered **without** an `onShowDetails` prop, when the user clicks the badge, then no error is thrown and the test completes (assert `expect(() => userEvent.click(badge)).not.toThrow()` / no unhandled rejection).

### Task: Badge visibility guard (spec scenario: "Badge absent for non-legendary combatants")

- [ ] **TC8** — Given a combatant with `legendaryActionCount: 0`, when the card renders, then `screen.queryByTestId('legendary-action-badge')` is `null`.
- [ ] **TC9** — Given a combatant with `legendaryActionCount` `undefined`, when the card renders, then `screen.queryByTestId('legendary-action-badge')` is `null`. (Guards that the `span → button` swap kept the `(combatant.legendaryActionCount ?? 0) > 0` condition.)

### Task: Remove dead imports (spec traceability: static check, no runtime scenario)

- [ ] **TC10** — Static assertion in CI, not a Jest test: `grep -n "LegendaryActionsPanel\|LairActionsSlot" lib/components/CombatantCard.tsx` returns no matches, and `npm run lint` reports no `no-unused-vars` for `lib/components/CombatantCard.tsx`.

### Regression / non-functional

- [ ] **TC11** — `npm run test:unit` for the full `tests/unit/components/CombatantCard.*` and `ActiveCombatView` suites passes unchanged. Specifically `CombatantCard.hp.test.tsx:263-264` (`getByTestId('legendary-action-badge')` + `toHaveTextContent('2/3')`) still passes with no edit.
- [ ] **TC12** — `npm run typecheck` passes and a `git diff` of the `CombatantCardProps` type shows no added/removed props (operability NFAC: "No prop-contract change").
- [ ] **TC13** — Manual/visual (`openwolf designqc` or screenshot): the badge keeps its amber styling and adds a visible hover/focus affordance; the card header row shows no layout shift versus `main`.

## Traceability

| Test case | tasks.md task | specs scenario |
|-----------|---------------|----------------|
| TC1, TC2, TC3 | Convert badge to a button | Badge renders for legendary monster |
| TC4, TC5, TC6 | Wire badge onClick to `onShowDetails` | Activating the badge opens the detail panel; Accessibility → Badge is operable without a pointer |
| TC7 | Graceful behavior without a handler | Badge is inert when no detail-panel handler is supplied |
| TC8, TC9 | Badge visibility guard | Badge absent for non-legendary combatants |
| TC10 | Remove dead imports | (traceability note — static check) |
| TC11, TC12 | Validation / Remote push validation | NFAC Operability → No prop-contract change and existing suites stay green |
| TC13 | Validation (`designqc`) | Design Decision 2 trade-off (layout shift) |
