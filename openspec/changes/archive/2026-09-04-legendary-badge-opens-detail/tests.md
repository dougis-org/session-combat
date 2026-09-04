---
name: tests
description: Tests for the change
---

# Tests

## Overview

Tests for the `legendary-badge-opens-detail` change. Strict TDD (fail → pass → refactor).

Component-level only (React Testing Library + Jest, `npm run test:unit` — the repo has **no** `npm test` script). No new E2E specs; the existing `tests/e2e/combat.spec.ts` legendary specs locate the badge by `data-testid` and assert text, so they must stay green after `span → button` with no edit.

jsdom does **not** implement `Element.prototype.scrollIntoView` — every test that renders `CombatantDetailPanel` (or `ActiveCombatView`) with the legendary focus request MUST set `Element.prototype.scrollIntoView = jest.fn()` in `beforeEach` and restore it in `afterEach`.

Test files:

- `tests/unit/components/CombatantCard.legendary-badge.test.tsx` (new) — reuses `renderCard` from `tests/unit/components/CombatantCard.test-helpers.ts`.
- `tests/unit/components/CombatantDetailPanel.focusSection.test.tsx` (new).
- An existing `ActiveCombatView` unit test file (extended) for the end-to-end wiring.

## Testing Steps

For each task in `tasks.md`: (1) write a failing test capturing the requirement, run it, confirm it fails; (2) write the simplest code to pass; (3) refactor while green.

## Test Cases

### Task: Widen `onShowDetails` + convert badge to a button (spec: "Badge renders for legendary monster")

- [ ] **TC1** — `{ legendaryActionCount: 3, legendaryActionsRemaining: 2 }`: `screen.getByTestId('legendary-action-badge')` has `tagName === 'BUTTON'` and `type === 'button'`. _Fails first: currently a `<span>`._
- [ ] **TC2** — Same: queryable as `screen.getByRole('button', { name: /legendary actions/i })`.
- [ ] **TC3** — Same: `toHaveTextContent('2/3')` — content regression guard.

### Task: Wire the badge onClick (spec: "Activating the badge opens the detail panel focused on legendary actions")

- [ ] **TC4** — With a `jest.fn()` `onShowDetails` via `renderCard`: clicking the badge calls it exactly once with `(combatant.id, expect.objectContaining({ top: expect.any(Number), left: expect.any(Number) }), { focusSection: 'legendary' })`. (`getBoundingClientRect` returns zeros under jsdom — assert shape/types, and assert the third arg exactly.)
- [ ] **TC5** — Badge focused, `userEvent.keyboard('{Enter}')` → `onShowDetails` called with the `{ focusSection: 'legendary' }` third arg.
- [ ] **TC6** — Badge focused, `userEvent.keyboard(' ')` → same. (TC5/TC6 pass for free with a native `<button>`; they lock in keyboard operability against a regression to `span` + `onClick`.)
- [ ] **TC7** — Name button (`CombatantCard.tsx:483-486`) still calls `onShowDetails` with **two** args (no third arg / third arg `undefined`) — the name-button contract is unchanged.

### Task: Graceful behavior without a handler (spec: "Badge is inert when no detail-panel handler is supplied")

- [ ] **TC8** — Card rendered **without** `onShowDetails`: `expect(() => userEvent.click(badge)).not.toThrow()`, no unhandled rejection, no side effects.

### Task: Badge visibility + legendary-only (spec: "Badge absent for non-legendary combatants")

- [ ] **TC9** — `legendaryActionCount: 0` → `queryByTestId('legendary-action-badge')` is `null`.
- [ ] **TC10** — `legendaryActionCount: undefined` → `null`.
- [ ] **TC11** — `legendaryActionCount: undefined` **and** a non-empty `lairActions` array → still `null` (legendary-only; no lair affordance).

### Task: `CombatantDetailPanel` focusSection prop + anchor + scroll/focus effect (spec: ADDED "Detail panel focuses the legendary section on request")

- [ ] **TC12** — `beforeEach`: `Element.prototype.scrollIntoView = jest.fn()`. Render `<CombatantDetailPanel focusSection="legendary">` for a combatant with `legendaryActionCount: 3` and non-empty `legendaryActions`. Then: `scrollIntoView` was called; and `getByTestId('detail-legendary-section').contains(document.activeElement)` is `true`.
- [ ] **TC13** — Render the same panel with **no** `focusSection`: `scrollIntoView` **not** called; `document.activeElement` is not inside `detail-legendary-section`.
- [ ] **TC14** — `focusSection="legendary"` + combatant with `legendaryActions: []` (so `LegendaryActionsPanel` renders null): `expect(render).not.toThrow()`; panel still renders its header; `scrollIntoView` either not called or called harmlessly (assert no throw, not the call).
- [ ] **TC15** — Reliability: temporarily `delete (Element.prototype as any).scrollIntoView`; render with `focusSection="legendary"` → no throw (guarded optional call).
- [ ] **TC16** — `CombatantDetailPanelProps` type gains `focusSection?: 'legendary'` only (optional); a `tsc` check / type-level test confirms existing usages compile unchanged.

### Task: `ActiveCombatView` wiring (spec: MODIFIED scenario + "Opening the panel from the name control does not force scroll or focus")

- [ ] **TC17** — Mock `scrollIntoView`. Render active combat containing a legendary combatant; click its `legendary-action-badge`; the `CombatantDetailPanel` appears (`getByRole('heading', { name: combatant.name })` or the panel testid) and `scrollIntoView` was called.
- [ ] **TC18** — Same setup; open the panel via the combatant-name control instead; the panel appears but `scrollIntoView` was **not** called and focus is not forced into the legendary section.
- [ ] **TC19** — Close the badge-opened panel, then re-open via the badge; `scrollIntoView` is called again (confirms `detailFocusSection` is cleared on close, so each open is an `undefined → 'legendary'` transition).

### Task: Remove dead imports (spec: traceability note — static check)

- [ ] **TC20** — CI static assertion (not Jest): `grep -n "LegendaryActionsPanel\\|LairActionsSlot" lib/components/CombatantCard.tsx` returns nothing; `npm run lint` reports no `no-unused-vars` for that file.

### Regression / non-functional

- [ ] **TC21** — Full `tests/unit/components/CombatantCard.*`, `CombatantDetailPanel.*`, and `ActiveCombatView` suites pass. `CombatantCard.hp.test.tsx:263-264` (`getByTestId` + `toHaveTextContent('2/3')`) passes unchanged.
- [ ] **TC22** — `npm run typecheck` passes; `git diff` shows `onShowDetails` widened additively (no existing call site edited) and `CombatantDetailPanelProps` only gained an optional prop. (NFAC "Backward-compatible contract".)
- [ ] **TC23** — `tests/e2e/combat.spec.ts` legendary specs (~L391-461) pass with no edit.
- [ ] **TC24** — Manual/visual (`openwolf designqc` / screenshots): badge keeps amber styling + gains a hover/focus affordance; no card-header layout shift vs `main`; badge-open scrolls & focuses the legendary section; name-open does not.

## Traceability

| Test case | tasks.md task | specs scenario |
|-----------|---------------|----------------|
| TC1–TC3 | Convert badge to a button | Badge renders for legendary monster |
| TC4–TC6 | Wire badge onClick | Activating the badge opens the detail panel focused on legendary actions; NFAC Accessibility → Badge is operable without a pointer |
| TC7 | Widen `onShowDetails` (additive) | Opening the panel from the name control does not force scroll or focus; NFAC Backward-compatible contract |
| TC8 | Graceful behavior without a handler | Badge is inert when no detail-panel handler is supplied |
| TC9–TC11 | Badge visibility + legendary-only | Badge absent for non-legendary combatants |
| TC12 | CombatantDetailPanel scroll/focus effect | Panel opens focused on the legendary section |
| TC13, TC18 | ActiveCombatView / panel opt-in | Panel opens normally without a focus request; Opening the panel from the name control does not force scroll or focus |
| TC14, TC15 | Anchor + effect guards | Focus request with no legendary content is a safe no-op; NFAC Reliability → Graceful degradation of scroll/focus |
| TC16, TC22 | focusSection prop typing / additive contract | NFAC Backward-compatible contract |
| TC17, TC19 | ActiveCombatView wiring | Activating the badge opens the detail panel focused on legendary actions |
| TC20 | Remove dead imports | (traceability note — static check) |
| TC21, TC23 | Validation / Remote push validation | NFAC Backward-compatible contract |
| TC24 | Validation (`designqc`) | Design Decisions 2 & 4 |
