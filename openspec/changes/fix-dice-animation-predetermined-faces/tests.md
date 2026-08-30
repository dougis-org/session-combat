---
name: tests
description: Tests for the change
---

# Tests

## Overview

Tests for the `fix-dice-animation-predetermined-faces` change. Strict TDD: for
each case write the failing test first, make it pass with the smallest change,
then refactor. Each case maps to a task in `tasks.md` and an acceptance scenario
in `specs/global-dice-fab/spec.md`.

Test commands (see `package.json` / `AGENTS.md`):
`npm run test:unit`, `npm run test:integration`,
`npm run test:e2e -- tests/e2e/dice-roll-animation.spec.ts`,
`npm run test:regression`, `npm run typecheck`, `npm run build`.

## Testing Steps

For each task in `tasks.md`:

1. **Write a failing test** capturing the task's requirement; run it, confirm it
   fails for the right reason.
2. **Write the simplest code** to make it pass.
3. **Refactor** while keeping it green.

## Test Cases

### Task E1 — Spike: confirm the dice-box forced-results API

- [ ] **T1.1** (throwaway spike, deleted before final commit) Drive
  `@3d-dice/dice-box@1.1.4` with the candidate forced-results mechanism and
  assert a `d6` lands on a requested face. Maps to: design Decision 1.
- [ ] **T1.2** Same for `d12`, `d20`, and `2d10` percentile (including a `0`
  face). Maps to: design Decision 1; scenario "Percentile face normalization".
- [ ] **T1.3** Assert the observed `DiceBoxResult` shape (fields, ordering,
  percentile `0`/`10` encoding) matches the updated `types/dice-box.d.ts`. Maps
  to: task E1 last bullet.
- [ ] **T1.4** If no mechanism lands faces reliably: record the negative result;
  the spike "test" is the go/no-go gate for Decision 4. Maps to: task E1 STOP
  bullet.

### Task E2 — `toDiceBoxNotation` emits the forced-results argument

- [ ] **T2.1** `d4/d6/d8/d10/d12/d20` single die with value `3` → argument
  encodes exactly one die of that size forced to `3`. Maps to: scenario "Pool
  roll animates enlarged dice…"; task E2.
- [ ] **T2.2** Mixed pool `2d20 [14,2] + 1d6 [5]` with modifier `+3` → argument
  encodes 2×d20 forced to 14 and 2, 1×d6 forced to 5, and **no die for the
  modifier**. Maps to: scenario "Roll outcome is decided before the animation
  starts".
- [ ] **T2.3** Percentile `percentileFaces [4,2]` → two d10 forced to 4 and 2.
  Maps to: scenario "Percentile roll animates two enlarged d10s…".
- [ ] **T2.4** Percentile `00` → `percentileFaces [10,10]` → two d10 forced to
  the engine's encoding of `10`. Maps to: scenario "Percentile face
  normalization".
- [ ] **T2.5** 120-die `d6` pool → argument encodes exactly 15 dice;
  `animatedDiceCount` returns 15; a separate assertion confirms `built.total`
  for the full 120 is untouched. Maps to: scenario "Large pools animate a capped
  subset of 15".
- [ ] **T2.6** 15-die and 6-die pools → 15 and 6 dice encoded respectively
  (boundaries). Maps to: scenario "More than six dice shrink to fit the clear
  zone".
- [ ] **T2.7** `toDiceBoxNotation` imports no RNG / `crypto` and is
  deterministic for a fixed `BuiltRoll` (purity guard). Maps to: scenario "Roll
  outcome is decided before the animation starts".

### Task E3 — Capture and reconcile engine results

- [ ] **T3.1** `reconcileDiceFaces` — expected `d12:[4,3]`, settled `[4,3]` →
  match. Maps to: scenario "Settled faces match the decided roll".
- [ ] **T3.2** expected `d12:[4,3]`, settled `[7,3]` → mismatch. Maps to:
  scenario "Face mismatch reveals the result without showing a wrong tumble".
- [ ] **T3.3** expected `d20:[14,2] d6:[5]`, settled ordered `d6:5, d20:2,
  d20:14` → match (per-group multiset). Maps to: scenario "Engine returns dice
  in a different order".
- [ ] **T3.4** expected percentile `[10,10]`, settled `[0,0]` → match after
  normalization. Maps to: scenario "Percentile face normalization".
- [ ] **T3.5** expected 15 of 120 dice, settled returns 15 correct + 1 extra
  cocked-die result → match (compare only first `animatedDiceCount()` per group).
  Maps to: design "Risks / Trade-offs" multiset false-positive mitigation.
- [ ] **T3.6** `useDiceAnimation.run()` with a mocked `DiceBox` returning
  matching results → resolves `true`, `status` stays `idle`, no `console.warn`.
  Maps to: scenario "Settled faces match the decided roll".
- [ ] **T3.7** mocked `DiceBox` returning mismatched results → `run()` resolves
  `true`, `status` stays `idle`, exactly one mismatch `console.warn` with a
  message distinct from the malformed-roll `console.error` and the
  persistent-unsupported warning. Maps to: scenario "Face mismatch reveals the
  result…" + NFAC "Diagnostics".
- [ ] **T3.8** two mismatched rolls in the same mounted hook → only one warn
  total. Maps to: NFAC "Diagnostics — logged once".
- [ ] **T3.9** after a mismatch roll, a second `run()` still attempts the
  dice-box import/roll (not short-circuited). Maps to: scenario "A mismatch does
  not disable later animations".
- [ ] **T3.10** the reconciliation path issues no `fetch` / XHR and (no-reroll
  design) no second `roll()` / `reroll()` call. Maps to: NFAC "Reconciliation
  adds no round-trip or network cost".
- [ ] **T3.11** (reroll design only) mismatch → exactly one bounded `reroll()`
  pass; still-mismatched after it → transient path; whole `run()` resolves
  within the `ROLL_TIMEOUT_MS` budget (fake timers). Maps to: task E3 reroll
  bullet.
- [ ] **T3.12** with a mocked mismatch, the modal reveal happens well before
  `MODAL_REVEAL_FALLBACK_MS` (fake timers). Maps to: scenario "Face mismatch
  reveals the result…" + NFAC "Reliability — Recovery behavior".

### Task E4 — E2E: assert settled faces

- [ ] **T4.1** E2E pool roll: read the engine's resolved per-die results (test
  hook / `onRollComplete` / the modal's per-die readout) and assert they equal
  the inline `[a, b]` values, not only the total. Maps to: scenario "Settled
  faces match the decided roll".
- [ ] **T4.2** E2E percentile: the two d10 faces shown decode to the modal
  total. Maps to: scenario "Percentile readout shows the two d10 faces".
- [ ] **T4.3** E2E: existing Escape-dismiss and panel-stays-open assertions
  still pass (regression). Maps to: base spec "Dismissing the roll overlay
  leaves the dice panel open".
- [ ] **T4.4** E2E (CI-no-WebGL path): the result modal and per-die readout
  still appear via the instant path. Maps to: NFAC "Reliability — Recovery
  behavior".

### Task E5 — Legibility

- [ ] **T5.1** `diceAnimationScale`: `count <= 6` returns the raised
  `DICE_BASE_SCALE`; the new base is strictly greater than the previous value
  (12). Maps to: scenario "More than six dice shrink to fit the clear zone".
- [ ] **T5.2** `diceAnimationScale`: monotonic non-increasing for counts
  1,6,7,10,15; `count > 6` strictly below base; never below `DICE_MIN_SCALE`;
  values `>= 15` clamp to the floor. Maps to: same scenario.
- [ ] **T5.3** `useDiceAnimation` constructs `DiceBox` with the raised `scale`
  for a 6-die pool and a reduced `scale` for a 10-die pool. Maps to: scenario
  "Pool roll animates enlarged dice…".
- [ ] **T5.4** `DiceRollOverlay`: per-die readout renders `4` and `3` for a
  `2d12 [4,3]` roll alongside the total `7`. Maps to: scenario "Per-die values
  shown after a pool roll".
- [ ] **T5.5** `DiceRollOverlay` with `disableAnimation` → readout present in
  the immediately-shown modal. Maps to: scenario "Per-die readout is shown when
  animation is disabled".
- [ ] **T5.6** `DiceRollOverlay` with `animationStatus="unsupported"` → readout
  present immediately. Maps to: scenario "Per-die readout is shown when the dice
  engine is unsupported".
- [ ] **T5.7** `DiceRollOverlay` percentile (`percentileFaces [4,2]`) → readout
  shows the two d10 faces and total `42`. Maps to: scenario "Percentile readout
  shows the two d10 faces".
- [ ] **T5.8** `DiceRollOverlay` for a 120-die pool → readout shows 15 values
  and a "+105 more" indicator; total text equals `built.total` for all 120.
  Maps to: scenario "Large pool readout shows the animated subset and a
  remainder count".
- [ ] **T5.9** `DiceRollOverlay`: the total text rendered is exactly
  `built.total` on every reveal path (unchanged through the overlay). Maps to:
  scenario "Roll outcome is decided before the animation starts".
- [ ] **T5.10** `DiceRollOverlay`: no `fetch` / XHR triggered by the overlay
  (regression). Maps to: NFAC "Performance".
- [ ] **T5.11** Visual check (manual, recorded in `design.md`): `2d12`, `2d20`,
  `d%`, `15d6` at 1280px and 375px — dice and readout readable, modal not
  obscured. Maps to: scenario "Pool roll animates enlarged dice…" + design
  Decision 5.

### Task E6 — Wire-up and spec sync

- [ ] **T6.1** `npm run typecheck` passes with the new `toDiceBoxNotation` /
  `types/dice-box.d.ts` shapes. Maps to: task E6.
- [ ] **T6.2** SSR safety: importing `GlobalDiceFab` / `DiceRollOverlay` in a
  Node environment and server-rendering attempts no `document` access
  (regression of the base spec Reliability scenario). Maps to: base spec "No
  `document` access during server render".
- [ ] **T6.3** Full `npm run test:unit`, `npm run test:integration`,
  `npm run test:regression`, `npm run build` all green. Maps to: Validation
  section.

### Regression / unchanged-behavior guards

- [ ] **T7.1** `dice-pool-shared-state` / `useDicePoolState` tests unchanged and
  green — `buildRoll` / `buildPercentileRoll` outputs untouched. Maps to:
  proposal "Out of Scope".
- [ ] **T7.2** `GlobalDiceFab` submits the same `formula` / `rolls` / `total` to
  `submitRoll` as before. Maps to: scenario "Roll outcome is decided before the
  animation starts".
- [ ] **T7.3** Existing modal-gating scenarios (hidden until settle, immediate on
  disabled/unsupported, fallback timeout reveal) still pass with the new reveal
  paths. Maps to: base spec scenarios carried into the MODIFIED requirement.
