---
name: tests
description: Tests for the change
---

# Tests

## Overview

Tests for the `fix-dice-animation-predetermined-faces` change (engine swap to
`@drdreo/dice-box-threejs`). Strict TDD: for each case write the failing test
first, make it pass with the smallest change, then refactor. Each case maps to a
task in `tasks.md` and an acceptance scenario in `specs/**/*.md`.

Test commands (see `package.json` / `AGENTS.md`):
`npm run test:unit`, `npm run test:integration`,
`npm run test:e2e -- tests/e2e/dice-roll-animation.spec.ts`,
`npm run test:regression`, `npm run typecheck`, `npm run build`.

## Testing Steps

For each task in `tasks.md`: write a failing test capturing the requirement,
confirm it fails for the right reason, write the simplest code to pass, refactor
while green.

## Test Cases

### Task E1 — Spike: confirm `@drdreo/dice-box-threejs` forced faces (throwaway, deleted before final commit)

- [ ] **T1.1** Drive the real package in a browser context: `roll("1d6@3")` →
  the returned `DiceResult` has `value === 3` and `reason === "forced"`. Maps to:
  design Decision 1.
- [ ] **T1.2** Same for `d4`, `d8`, `d10`, `d12`, `d20`, and `2d10@t,o`
  percentile including a `0`/`10` face. Maps to: Decision 1; scenario "Percentile
  face normalization".
- [ ] **T1.3** `roll("2d20@14,2+1d6@5")` → two `DiceSet`s (`d20`, `d6`) with
  forced values `[14, 2]` and `[5]`. Maps to: scenario "Engine returns dice in a
  different order".
- [ ] **T1.4** `roll` → `clearDice()` → drop reference → new `DiceBox` → `roll`
  again succeeds within one page (teardown is clean). Maps to: task E1 bullet 4.
- [ ] **T1.5** If forced faces are unreliable: record the negative result; this
  is the go/no-go gate for the detect-and-skip fallback. Maps to: task E1 STOP
  bullet.

### Task E2 — Swap the engine dependency and assets

- [ ] **T2.1** `package.json` / lockfile contain `@drdreo/dice-box-threejs`
  (exact `1.1.0`), `three`, `cannon-es`, and **no** `@3d-dice/dice-box`. Maps to:
  task E2; proposal "What Changes".
- [ ] **T2.2** After the asset-copy step, `public/dice-box-threejs/textures/`
  contains the engine's `.webp` texture files. Maps to: task E2 asset bullet.
- [ ] **T2.3** `types/dice-box.d.ts` no longer exists and `npm run typecheck`
  still passes. Maps to: task E2 / design Decision 5.

### Task E3 — Rewrite `useDiceAnimation`

- [ ] **T3.1** `useDiceAnimation.run()` with a mocked `DiceBox` (`initialize`
  resolving, `roll` resolving matching `DiceResults`, `clearDice` spy) → resolves
  `true`, `status` stays `idle`, `clearDice` called on teardown, no warn. Maps
  to: scenario "Settled faces match the decided roll".
- [ ] **T3.2** mocked `initialize()` rejecting → `run()` resolves `false`,
  `status` becomes `unsupported`, one `console.warn`, `clearDice` called. Maps
  to: base spec "Modal shows immediately when the dice engine is unsupported".
- [ ] **T3.3** mocked `roll()` rejecting → `run()` resolves `true`, `status`
  stays `idle`, `console.error` (malformed-roll message), box dropped. Maps to:
  NFAC "Diagnostics"; n125 transient split.
- [ ] **T3.4** `roll()` never resolving → `run()` resolves `true` at
  `ROLL_TIMEOUT_MS` (fake timers), box dropped. Maps to: base spec "Modal is
  revealed by the fallback timeout".
- [ ] **T3.5** WebGL unavailable (`hasWebGL()` stubbed false) → `run()` resolves
  `false`, `status` `unsupported`, probe runs once across multiple `run()`s. Maps
  to: base spec unsupported scenario.
- [ ] **T3.6** a second `run()` while one is active tears the first down
  (`clearDice` called, run token bumped) before starting the second. Maps to:
  design Decision 2 single-instance invariant.
- [ ] **T3.7** `DiceBox` is constructed with `baseScale ===
  diceAnimationScale(animatedDiceCount(built))` and `sounds: false`. Maps to:
  scenario "More than six dice shrink to fit the clear zone".
- [ ] **T3.8** `import('@drdreo/dice-box-threejs')` is dynamic — a static
  top-level import of the package does not appear in `useDiceAnimation.ts`
  (source/AST assertion or build-chunk assertion). Maps to: NFAC "Dice engine is
  not in the initial bundle".

### Task E4 — Capture and reconcile engine results

- [ ] **T4.1** `reconcileDiceFaces` — expected `d12:[4,3]`, settled `[4,3]` →
  match. Maps to: scenario "Settled faces match the decided roll".
- [ ] **T4.2** expected `d12:[4,3]`, settled `[7,3]` → mismatch. Maps to:
  scenario "Face mismatch reveals the result without showing a wrong tumble".
- [ ] **T4.3** expected `d20:[14,2] d6:[5]`, settled ordered `d6:5, d20:2,
  d20:14` → match (per-group multiset). Maps to: scenario "Engine returns dice in
  a different order".
- [ ] **T4.4** expected percentile `[10,10]`, settled `[0,0]` → match after
  normalization. Maps to: scenario "Percentile face normalization".
- [ ] **T4.5** expected 15 of 120 dice, settled 15 correct + 1 extra cocked-die
  result → match (compare only first `animatedDiceCount()` per group). Maps to:
  design "Risks / Trade-offs".
- [ ] **T4.6** `useDiceAnimation.run()` with mocked mismatched `DiceResults` →
  resolves `true`, `status` stays `idle`, exactly one mismatch `console.warn`
  with a message distinct from the malformed-roll `console.error` and the
  persistent-unsupported warning; `clearDice` called without a run-token bump.
  Maps to: scenario "Face mismatch reveals the result…" + NFAC "Diagnostics".
- [ ] **T4.7** two mismatched rolls in the same mounted hook → only one warn
  total. Maps to: NFAC "Diagnostics — logged once".
- [ ] **T4.8** after a mismatch roll, a second `run()` still attempts the engine
  import/roll (not short-circuited). Maps to: scenario "A mismatch does not
  disable later animations".
- [ ] **T4.9** the reconciliation path issues no `fetch` / XHR and no second
  `roll()` / `reroll()` call. Maps to: NFAC "Reconciliation adds no round-trip or
  network cost".
- [ ] **T4.10** with a mocked mismatch, the modal reveal happens well before
  `MODAL_REVEAL_FALLBACK_MS` (fake timers, `GlobalDiceFab` + overlay). Maps to:
  scenario "Face mismatch reveals the result…" + NFAC "Reliability".

### Task E5 — Retune the scale curve

- [ ] **T5.1** `diceAnimationScale`: `count <= 6` returns the retuned
  `DICE_BASE_SCALE`; the new base is calibrated to the new engine's `baseScale`
  units (documented constant, strictly positive). Maps to: scenario "More than
  six dice shrink to fit the clear zone".
- [ ] **T5.2** `diceAnimationScale`: monotonic non-increasing for counts
  1,6,7,10,15; `count > 6` strictly below base; never below `DICE_MIN_SCALE`;
  values `>= 15` clamp to the floor; non-positive → treated as 1. Maps to: same
  scenario.
- [ ] **T5.3** `useDiceAnimation` constructs `DiceBox` with the base scale for a
  6-die pool and a strictly smaller scale for a 10-die pool. Maps to: scenario
  "More than six dice shrink to fit the clear zone".

### Task E6 — Legibility: `+N more` on the readout

- [ ] **T6.1** `DiceRollOverlay`: per-die readout renders `4` and `3` for a
  `2d12 [4,3]` roll alongside the total `7`. Maps to: `dice-roll` spec "Visual
  result for standard dice pool".
- [ ] **T6.2** `DiceRollOverlay` for a 120-die pool → readout shows 15 die SVGs
  and a `+105 more` indicator; total text equals `built.total` for all 120. Maps
  to: `dice-roll` spec "Visual result for a pool larger than the animation cap".
- [ ] **T6.3** `DiceRollOverlay` with `disableAnimation` and with
  `animationStatus="unsupported"` → readout present in the immediately-shown
  modal. Maps to: `dice-roll` spec "Visual result is present on the non-animated
  reveal paths".
- [ ] **T6.4** `DiceRollOverlay` percentile (`percentileFaces [4,2]`) → readout
  shows the two d10 faces and total `42`. Maps to: `dice-roll` spec "Visual
  result for percentile roll".
- [ ] **T6.5** `DiceRollOverlay`: the total text rendered is exactly
  `built.total` on every reveal path. Maps to: scenario "Roll outcome is decided
  before the animation starts".
- [ ] **T6.6** `DiceRollOverlay`: no `fetch` / XHR triggered by the overlay
  (regression). Maps to: NFAC "Performance".

### Task E7 — E2E: assert settled faces

- [ ] **T7.1** E2E pool roll: read the engine's resolved per-die results (test
  hook / `onRollComplete` / the modal's per-die readout) and assert they equal
  the inline `[a, b]` values, not only the total. Maps to: scenario "Settled
  faces match the decided roll".
- [ ] **T7.2** E2E percentile: the two d10 faces shown decode to the modal total.
  Maps to: scenario "Percentile roll animates two d10s on their decided faces".
- [ ] **T7.3** E2E: existing Escape-dismiss and panel-stays-open assertions still
  pass (regression). Maps to: base spec "Dismissing the roll overlay leaves the
  dice panel open".
- [ ] **T7.4** E2E (CI-no-WebGL path): the result modal and per-die readout still
  appear via the instant path. Maps to: NFAC "Reliability".

### Task E8 — Wire-up, build, spec sync

- [ ] **T8.1** `npm run typecheck` passes with the new engine types and no
  `types/dice-box.d.ts`. Maps to: task E8.
- [ ] **T8.2** `npm run build` succeeds and a bundle inspection confirms
  `@drdreo/dice-box-threejs`, `three`, `cannon-es` are only in an async chunk.
  Maps to: NFAC "Dice engine is not in the initial bundle".
- [ ] **T8.3** SSR safety: importing `GlobalDiceFab` / `DiceRollOverlay` in a
  Node environment and server-rendering attempts no `document` / WebGL access.
  Maps to: base spec Reliability scenario.
- [ ] **T8.4** Visual check (manual, recorded in `design.md`): `2d12`, `2d20`,
  `d%`, `15d6` at 1280px and 375px — dice and readout readable, modal not
  obscured. Maps to: design Decisions 4 & 6.
- [ ] **T8.5** Full `npm run test:unit`, `npm run test:integration`,
  `npm run test:regression` all green. Maps to: Validation section.

### Regression / unchanged-behavior guards

- [ ] **T9.1** `dice-pool-shared-state` / `useDicePoolState` tests unchanged and
  green — `buildRoll` / `buildPercentileRoll` outputs untouched. Maps to:
  proposal "Out of Scope".
- [ ] **T9.2** `GlobalDiceFab` submits the same `formula` / `rolls` / `total` to
  `submitRoll` as before. Maps to: scenario "Roll outcome is decided before the
  animation starts".
- [ ] **T9.3** Existing modal-gating scenarios (hidden until settle, immediate on
  disabled/unsupported, fallback timeout reveal) still pass with the new engine.
  Maps to: base spec scenarios carried into the MODIFIED requirement.
- [ ] **T9.4** `toDiceBoxNotation` imports no RNG / `crypto` and is deterministic
  for a fixed `BuiltRoll` (purity guard, unchanged). Maps to: scenario "Roll
  outcome is decided before the animation starts".
