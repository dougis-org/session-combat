---
name: tests
description: Tests for the improve-dice-roll-animation change
---

# Tests

## Overview

This document outlines the tests for the `improve-dice-roll-animation` change. All work follows strict TDD: write a failing test, write the minimum code to pass, refactor. Every case below maps to a task in `openspec/changes/archive/2026-08-30-improve-dice-roll-animation/tasks.md` and an acceptance scenario in `openspec/changes/archive/2026-08-30-improve-dice-roll-animation/specs/global-dice-fab/spec.md`.

## Testing Steps

For each task in `tasks.md`:

1. **Write a failing test** capturing the task's behavior; run it and confirm it fails.
2. **Write code to pass the test** — the simplest change that makes it green.
3. **Refactor** while keeping the test green and the existing suites green.

Test files:

- `tests/unit/lib/dice/toDiceBoxNotation.test.ts` (extend existing if present, else add)
- `tests/unit/lib/dice/diceAnimationScale.test.ts` (new) — or co-located with the `useDiceAnimation` suite
- `tests/unit/lib/dice/useDiceAnimation.test.ts` (extend)
- `tests/unit/components/DiceRollOverlay.test.tsx` (extend)
- `tests/unit/components/GlobalDiceFab.test.tsx` (extend)

## Test Cases

### Task E1 — `DICE_ANIM_CAP` lowered to 15 (spec: "Large pools animate a capped subset of 15")

- [ ] `toDiceBoxNotation` for a `120d6` built roll produces notation whose die count sums to exactly 15.
- [ ] `toDiceBoxNotation` for a `15d6` roll produces 15 dice (boundary, unchanged).
- [ ] `toDiceBoxNotation` for a `6d6` roll produces 6 dice (below cap, unchanged).
- [ ] `DICE_ANIM_CAP` exported constant equals `15`.
- [ ] Existing `toDiceBoxNotation` predetermined-faces tests still pass (percentile `2d10@t,o`, mixed groups, modifier never a die).

### Task E2 — `diceAnimationScale(count)` pure curve (spec: "More than six dice shrink to fit the clear zone")

- [ ] `diceAnimationScale(1) === DICE_BASE_SCALE`.
- [ ] `diceAnimationScale(6) === DICE_BASE_SCALE`.
- [ ] `diceAnimationScale(7) < DICE_BASE_SCALE`.
- [ ] `diceAnimationScale(10) < diceAnimationScale(7)` (or `<=` if the curve plateaus) and `< DICE_BASE_SCALE`.
- [ ] `diceAnimationScale(15) <= diceAnimationScale(10)` and `>= DICE_MIN_SCALE`.
- [ ] The curve is monotonically non-increasing across `count = 1..15`.
- [ ] `diceAnimationScale` never returns below `DICE_MIN_SCALE` for any `count` up to 15.

### Task E3 — dice-box configured for size + completion timing (spec: sizing clause; "Modal shows immediately when the dice engine is unsupported")

- [ ] `useDiceAnimation.run` constructs `DiceBox` with a `scale` equal to `diceAnimationScale(animatedCount)` where `animatedCount` is the capped animated die count for the built roll (mock the `@3d-dice/dice-box` module and assert on constructor args).
- [ ] For a 6-die roll, the `scale` passed is `DICE_BASE_SCALE`.
- [ ] For a 12-die roll, the `scale` passed is `< DICE_BASE_SCALE`.
- [ ] `run()`'s returned promise does not resolve until the mocked `box.roll()` resolves.
- [ ] When WebGL is unavailable, `run()` resolves promptly and `status` becomes `'unsupported'` (existing behavior preserved).
- [ ] When the dynamic `import('@3d-dice/dice-box')` rejects, `run()` resolves promptly, `status` becomes `'unsupported'`, and it logs once (existing behavior preserved).
- [ ] A transient `box.roll()` rejection tears down without latching `status` to `'unsupported'` (existing behavior preserved).

### Task E4 — bounded, centered dice canvas region (spec: centered-region + landing clauses; "Pool roll animates larger centered dice then reveals the modal")

- [ ] `DiceRollOverlay` (animation enabled) renders the canvas mount (`#dice-roll-canvas`) as a bounded element — its className no longer contains `inset-0` and it is not the full-viewport backdrop.
- [ ] The canvas mount and the (eventually revealed) modal are siblings inside a single horizontally-centered container, with the canvas appearing before the modal in DOM order.
- [ ] The canvas mount retains `pointer-events-none` and the `DICE_ROLL_CANVAS_ID` id.
- [ ] `onCanvasReady` still fires exactly once with the canvas container when animation is enabled.

### Task E5 — modal gated on completion + fallback timeout (spec: gating + fallback clauses)

- [ ] With animation enabled and the completion signal pending, `queryByRole('dialog')` for the roll result is `null` while the tumble is "in progress"; the inline result is not part of this component but the modal is absent.
- [ ] After the completion signal fires, the dialog is present and shows `built.total`.
- [ ] With `disableAnimation` true, the dialog is present on first render (no waiting) and no canvas mount is rendered.
- [ ] With animation `status === 'unsupported'`, the dialog is present immediately and no tumble is attempted.
- [ ] Using fake timers: completion signal never fires; after `MODAL_REVEAL_FALLBACK_MS` the dialog appears with `built.total`, the canvas host stays mounted but collapses to `hidden` (no teardown by the timeout).
- [ ] Closing the overlay (Escape / outside-click) or a new roll releases the dice engine via `useDiceAnimation`'s single-instance teardown.
- [ ] Changing the `built` prop to a new roll resets the gate: the dialog disappears until the new completion signal (or fallback) fires.
- [ ] Escape key (capture phase) closes only the overlay — `onClose` is called, `stopPropagation` prevents the panel's document-level handler (regression guard for the unchanged "Dismissing the roll overlay leaves the dice panel open" requirement).
- [ ] Outside-click closes only the overlay; click inside the modal does not.
- [ ] Focus moves into the dialog when it is revealed; focus is restored to the previously focused element on close.

### Task E6 — completion signal wired from `GlobalDiceFab` (spec: outcome-decided clause; "Pool roll animates larger centered dice then reveals the modal", "Roll outcome is decided before the animation starts")

- [ ] Rolling a `2d20+1d6` pool with modifier `+3` (mock `useDiceAnimation` so completion is controllable): the inline `formula → [rolls] = total` line renders immediately; the overlay modal is absent until the mocked animation completes; then the modal shows a total equal to the built roll's `total`.
- [ ] The total shown in the modal and the inline line equals `built.total` for a `120d6` pool even though only 15 dice animate.
- [ ] A percentile roll: modal (once revealed) shows the decoded 1..100 value equal to `built.total`; the animated notation is `2d10@<tens>,<ones>`.
- [ ] A second roll while an overlay is open tears down the first overlay and shows exactly one overlay, with the modal re-gated (absent until the new completion).
- [ ] `built.total` / `built.rolls` are not mutated by opening, animating, or closing the overlay.
- [ ] No `fetch` / XHR is issued by the overlay/animation path in tests (the shared-submit path is separate and only runs when `sendToChat` + presence).

### Non-functional (spec: NFAC Reliability / Performance)

- [ ] Reliability: fake-timer test — animation enabled, completion promise never resolves; the fallback timeout reveals the modal with the correct total without tearing the engine down (same as E5 fallback case); a separate case asserts close/new-roll releases the engine.
- [ ] Performance: for `120d6`, the notation passed to `box.roll()` contains at most 15 dice, and the overlay issues no network request of its own.

### Regression (existing suites must stay green)

- [ ] All existing cases in `tests/unit/components/DiceRollOverlay.test.tsx`, `tests/unit/components/GlobalDiceFab.test.tsx`, `tests/unit/lib/dice/useDiceAnimation.test.ts` pass unchanged except where a case explicitly asserted the old `inset-0` canvas, the always-present modal, or `DICE_ANIM_CAP === 30` — those are updated to the new behavior as part of the TDD cycle for E1/E4/E5.
