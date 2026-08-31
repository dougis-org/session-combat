---
name: tests
description: Tests for the change
---

# Tests

## Overview

This document outlines the tests for the `enhance-dice-modal-numeric-readout`
change. All work follows a strict TDD (Test-Driven Development) process: every
behaviour below gets a failing test first, then the minimal implementation to
make it pass, then a refactor pass while keeping it green.

The change is presentational and client-only. It rewrites `StaticRollResult` in
`lib/components/dice/DiceRollOverlay.tsx` so the result modal's per-die readout is
a plain numeric echo of each rolled value with a small `d{sides}` / `d%` size
tag, with no die-face SVG, no pips, and no number-over-icon overlay. No roll
generation, RNG, persistence, network, or a11y-announcement behaviour changes.

Primary test target: `tests/unit/components/DiceRollOverlay.test.tsx`.
Secondary: `tests/e2e/dice-roll-animation.spec.ts` (selector-only adjustment if
it keys off an icon; per-die **value** assertions unchanged).

Commands (from `package.json`):

- Unit: `npm run test:unit` (`jest --testPathPattern='tests/unit' --coverage`)
- Integration: `npm run test:integration`
- E2E / regression: `npm run test:e2e` / `npm run test:regression`
- Type check: `npm run typecheck`
- Lint: `npm run lint`
- Build: `npm run build`

## Testing Steps

For each task in `tasks.md`:

1. **Write a failing test:** before writing any implementation code, write a test
   that captures the requirements of the task. Run it and confirm it fails for
   the expected reason (assertion failure, not a setup error).
2. **Write code to pass the test:** write the simplest code in
   `DiceRollOverlay.tsx` that makes the test pass.
3. **Refactor:** improve structure (extract the shared chip sub-component / class
   constant per task E6) while the test stays green.

Ordering: E1 → E2 → E3 run red-green-refactor individually; E4 (dead imports) is
verified by lint + typecheck; E5 is the test work itself; E6 is a refactor step
guarded by the already-green E1–E3 tests.

## Test-Case → Task → Acceptance-Scenario Map

| # | Test case | Task | Acceptance scenario (`specs/global-dice-fab/spec.md`) |
|---|-----------|------|------------------------------------------------------|
| 1 | Pool readout renders one `die-face` element per die with text = `breakdown[i].value` | E1 | Result modal per-die readout shows numeric values with a size tag |
| 2 | Each pool chip shows a visible `d{sides}` label as text (not tooltip-only) | E1 | Result modal per-die readout shows numeric values with a size tag |
| 3 | Mixed pool `2d20 + 1d6` → chips `14`,`2`,`5` with labels `d20`,`d20`,`d6`; total line = `built.total` | E1 | Result modal per-die readout shows numeric values with a size tag |
| 4 | Result `role="dialog"` subtree contains no die-face/shape `<svg>` and no pip pattern | E1 | Result modal readout renders no die-face graphic |
| 5 | No die value is rendered as an absolutely-positioned overlay on top of an icon | E1 | Result modal readout renders no die-face graphic |
| 6 | `breakdown` entry with an unmapped `sides` value renders the same numeric `die-face` + `d{sides}` chip; no `data-testid="fallback-die"` box | E1, E2(E6) | Unknown die size renders through the same numeric path |
| 7 | Percentile roll `percentileFaces: [7, 0]` → two chips reading `70` and `0` | E2 | Percentile result modal readout shows two numeric face chips |
| 8 | Each percentile chip has a `d%` label; no `DiceD10Icon` / die-face SVG in dialog | E2 | Percentile result modal readout shows two numeric face chips |
| 9 | Percentile total line shows decoded value equal to `built.total` | E2 | Percentile result modal readout shows two numeric face chips |
| 10 | `mt-2` nudge is gone from the percentile cells (regression guard on markup) | E2 | Percentile result modal readout shows two numeric face chips |
| 11 | `20d6` pool → exactly 15 `die-face` chips rendered | E3 | Large pools still cap the readout at 15 with a remainder note |
| 12 | `20d6` pool → `data-testid="dice-readout-remainder"` reads `+5 more` | E3 | Large pools still cap the readout at 15 with a remainder note |
| 13 | `20d6` pool → total shown = sum of all 20 dice + modifier (full-pool total, not capped) | E3 | Large pools still cap the readout at 15 with a remainder note |
| 14 | Pool of exactly 15 → 15 chips and **no** remainder note | E3 | Large pools still cap the readout at 15 with a remainder note (boundary) |
| 15 | Readout DOM is identical when modal is revealed via animation-complete, animation-disabled, engine-unsupported, and fallback-timeout paths | E1–E3 | Readout is identical across modal reveal paths |
| 16 | Per-die values shown always equal `built.breakdown` values regardless of engine-settled faces | E1 | Roll outcome is decided before the animation starts |
| 17 | `sr-only` `role="status" aria-live="polite"` region text is `"{formula} rolled {total}"` a tick after mount (unchanged) | E1, E4 | NFAC Operability → Screen-reader announcement is unchanged |
| 18 | Production build introduces no new module/chunk/asset/network request; modal render emits no die-face `<svg>` (node count not greater than before) | E4 | NFAC Performance → No new runtime cost |
| 19 | `git grep -n -E "DIE_ICONS\|DiceD10Icon\|die-face\|fallback-die\|dice-readout-remainder" tests/` — every hit is reviewed and updated/kept intentionally | E5 | (coverage completeness for all scenarios above) |
| 20 | Existing `DieGlyph` / `DiePoolButton` / `dice-iconography` tests pass unchanged (no regression from removing the import) | E4 | MODIFIED requirement final non-alteration clause |
| 21 | E2E `dice-roll-animation.spec.ts` per-die **value** assertions still pass; any icon-based selector for modal dice is replaced with the `die-face` text/testid selector | E5 | Roll outcome is decided before the animation starts; Modal stays hidden until the tumble settles |
| 22 | Pool chip and percentile chip render through one shared sub-component / class constant (no duplicated markup) — asserted structurally or via a shared testid/class | E6 | Unknown die size renders through the same numeric path (single presentation path) |

## Test Cases

### E1 — Rewrite `StaticRollResult` (pool path)

- [ ] **TC1** — Given a built roll with `breakdown` `[{sides:20,value:14},{sides:20,value:2},{sides:6,value:5}]`, when `StaticRollResult` is rendered inside the revealed modal, then exactly three `data-testid="die-face"` elements exist with visible text `14`, `2`, `5`.
- [ ] **TC2** — Given the same render, then each `die-face` element is accompanied by visible text `d20`, `d20`, `d6` respectively (query the rendered text, not a `title`/`aria-label` only).
- [ ] **TC3** — Given the same render, then the total line below the readout shows `built.total`.
- [ ] **TC4** — Given any pool roll modal is revealed, when the `role="dialog"` subtree is queried, then `dialog.querySelectorAll('svg')` returns no element that represents a rolled die's face/shape and there is no pip-pattern node.
- [ ] **TC5** — Given the same render, then no `die-face` element (or its value) is an absolutely-positioned (`position: absolute` / `absolute` class) overlay layered on an icon.
- [ ] **TC6** — Given a `breakdown` entry `{sides:7,value:4}` (no dedicated icon), when the modal is revealed, then it renders one `die-face` chip with text `4` and a `d7` label, and no element with `data-testid="fallback-die"` exists.
- [ ] **TC16** — Given a built roll whose `breakdown` values differ from the faces the mocked engine "settles" on, when the modal is revealed, then the `die-face` texts equal the `breakdown` values (engine-settled faces are never read for the readout).
- [ ] **TC17** — Given the overlay is mounted for a roll with formula `2d20 + 1d6` and total `21`, when the `sr-only` `role="status"` region is read after the existing ~50ms tick, then its text is `"2d20 + 1d6 rolled 21"` (assertion copied from the pre-change test; must not need editing).

### E2 — Percentile path

- [ ] **TC7** — Given a percentile built roll with `percentileFaces: [7, 0]` (decoded `70`), when the modal is revealed, then the readout shows two numeric chips with visible text `70` and `0`.
- [ ] **TC8** — Given the same render, then each chip has a visible `d%` label and the `role="dialog"` subtree contains no `DiceD10Icon` / die-face `<svg>`.
- [ ] **TC9** — Given the same render, then the total line shows the decoded value equal to `built.total` (e.g. `70`).
- [ ] **TC10** — Given the percentile render, then neither percentile chip wrapper carries the `mt-2` class (regression guard that the icon-centering nudge was removed).

### E3 — Keep the cap and `+N more`

- [ ] **TC11** — Given a `20d6` pool whose `breakdown` has 20 entries, when the modal is revealed, then exactly 15 `data-testid="die-face"` chips render.
- [ ] **TC12** — Given the same render, then a `data-testid="dice-readout-remainder"` element reads `+5 more`.
- [ ] **TC13** — Given the same render, then the total shown equals the sum of all 20 dice plus any modifier (full-pool `built.total`), not the sum of the first 15.
- [ ] **TC14** — Given a pool of exactly 15 dice, when the modal is revealed, then 15 chips render and there is **no** `data-testid="dice-readout-remainder"` element.

### E4 — Drop dead imports / no runtime cost

- [ ] **TC18a** — `npm run lint` reports no `no-unused-vars` / unused-import finding for `DIE_ICONS`, `DiceD10Icon`, or `DieSides` in `DiceRollOverlay.tsx`.
- [ ] **TC18b** — `npm run typecheck` is clean.
- [ ] **TC18c** — `npm run build` succeeds and the build output introduces no new chunk/asset versus `main` (manual diff of the build manifest / `.next` chunk list).
- [ ] **TC20** — `npm run test:unit` shows the existing `DieGlyph` / `DiePoolButton` and any `dice-iconography` tests passing with no edits (the shared `lib/components/icons/dice.tsx` module is untouched).

### E5 — Test sweep

- [ ] **TC19** — Run `git grep -n -E "DIE_ICONS|DiceD10Icon|die-face|fallback-die|dice-readout-remainder" tests/`; for every hit, either update it to the numeric-readout expectation or record why it stays. No modal-icon assertion remains.
- [ ] **TC21** — `npm run test:e2e -- dice-roll-animation.spec.ts` passes; if the spec located result-modal dice via an icon selector, it now uses the `die-face` testid/text; all per-die **value** and modal-visibility-gating assertions are unchanged.

### E6 — De-duplicate pool vs percentile chip

- [ ] **TC22** — After refactor, the pool chip and percentile chip are produced by one shared presentational unit (sub-component or shared className constant); a test asserts both chip kinds expose the same structural hook (e.g. a common `data-testid` prefix or class) so future drift is caught. E1–E3 tests remain green.

### Reveal-path invariance (spans E1–E3)

- [ ] **TC15** — Parametrised test: render the overlay for one fixed built roll through each reveal trigger — `disableAnimation: true`, `animationStatus: 'unsupported'`, `animationSettled` (animation-complete), and the bounded fallback-timeout — and assert the serialized per-die readout subtree (chips, values, size tags, `+N more`) is identical across all four.

## Coverage Confirmation

Every acceptance scenario in `specs/global-dice-fab/spec.md` is covered:

| Acceptance scenario | Covering test case(s) |
|---------------------|------------------------|
| Result modal per-die readout shows numeric values with a size tag | TC1, TC2, TC3 |
| Result modal readout renders no die-face graphic | TC4, TC5 |
| Unknown die size renders through the same numeric path | TC6, TC22 |
| Percentile result modal readout shows two numeric face chips | TC7, TC8, TC9, TC10 |
| Large pools still cap the readout at 15 with a remainder note | TC11, TC12, TC13, TC14 |
| Readout is identical across modal reveal paths | TC15 |
| Roll outcome is decided before the animation starts | TC16, TC21 |
| Modal stays hidden until the tumble settles | TC21 (existing gating assertions, unchanged) |
| Modal shows immediately when animation is disabled | TC15 (disabled-path branch), existing test unchanged |
| Large pools animate a capped subset of 15 | Existing animation-cap test, unchanged (readout side covered by TC11) |
| NFAC Performance → No new runtime cost | TC18c |
| NFAC Reliability → Readout is identical across reveal paths | TC15 |
| NFAC Operability → Screen-reader announcement is unchanged | TC17 |
| MODIFIED requirement non-alteration clause (`DieGlyph`/`DiePoolButton`/`DIE_ICONS`) | TC20 |
