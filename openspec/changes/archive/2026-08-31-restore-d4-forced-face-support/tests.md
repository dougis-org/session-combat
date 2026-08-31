---
name: tests
description: Tests for the change
---

# Tests

## Overview

This document outlines the tests for the `restore-d4-forced-face-support`
change. All work follows strict TDD: write a failing test, write the minimum
code to pass it, then refactor.

Spec reference:
`openspec/changes/restore-d4-forced-face-support/specs/global-dice-fab/spec.md`.

## Testing Steps

For each task in `tasks.md`:

1. **Write a failing test** that captures the task's requirement; run it and
   confirm it fails.
2. **Write the simplest code** to make it pass.
3. **Refactor** while keeping the test green.

## Test Cases

### Task 1 — Spike (throwaway, deleted before the final commit)

- [ ] **T1.1** Scratch Playwright/`*.spike.test.ts`: `box.roll("1d4@2")` in
  headless-Chromium WebGL currently returns `value !== 2` and `reason ===
  "natural"` — documents the defect. _(maps to spec "Forced d4 lands on its
  target face" — pre-fix state)_
- [ ] **T1.2** Spike: `box.roll("1d4@3")` with `iterationLimit: 20000` does not
  return within a bounded outer timeout — documents the hang. _(maps to spec
  "Forced d4 does not hang at a high iteration limit" — pre-fix state)_
- [ ] **T1.3** Spike: with the candidate patch applied in the page,
  `box.roll("1d4@2")` returns `{ value: 2, reason: "forced" }` and
  `box.roll("1d4@3")` at `iterationLimit: 20000` returns promptly. Records the
  forced-d4 settle-iteration count vs. a forced d6.
- [ ] **T1.4** Verify no `*.spike*` file remains after the spike concludes
  (checked in the Pre-Commit review).

### Task 2 — Vendor the patch via `patch-package`

- [ ] **T2.1** `patches/@drdreo+dice-box-threejs+1.1.0.patch` exists and is
  tracked by git. _(maps to spec "The 3D dice engine's d4 forced-face support is
  restored via a vendored patch")_
- [ ] **T2.2** After `rm -rf node_modules && npm ci`, the `postinstall`
  `patch-package` step exits 0 and the installed engine file contains the marker
  `/* d4-forced-face patch #627 */`. _(maps to spec "A guard test catches a
  silently absent patch")_
- [ ] **T2.3** `package.json` has `patch-package` in `devDependencies` and a
  `postinstall` script that runs it.

### Task 3 — `toDiceBoxNotation` forces d4 groups

- [ ] **T3.1** Unit: `toDiceBoxNotation` for a roll whose breakdown is `3d4`
  returns one group with `sides === 4`, `forced === true`, and `notation`
  matching `/^3d4@\d+,\d+,\d+$/`. _(maps to spec "MODIFIED Rolling…" — forced
  notation for every die size)_
- [ ] **T3.2** Unit: a `2d4+3d6` roll returns two groups, both `forced === true`,
  d4 notation `2d4@a,b` and d6 notation `3d6@c,d,e`. _(maps to spec "Mixed d4 +
  d6 pool forces both groups")_
- [ ] **T3.3** Unit (regression): existing d6/d8/d10/d12/d20 and percentile
  `toDiceBoxNotation` expectations still pass unchanged.
- [ ] **T3.4** Unit: `FORCEABLE_SIDES` contains `4` (guards against silent
  revert).

### Task 4 — `reconcileDiceFaces` / `useDiceAnimation`: no `sides === 4` carve-out

- [ ] **T4.1** Unit: `reconcileDiceFaces` returns `true` when a d4 group's
  settled faces are a multiset match for the predetermined values. _(maps to
  spec "reconcile treats all supported sizes uniformly")_
- [ ] **T4.2** Unit: `reconcileDiceFaces` returns `false` when a d4 group's
  settled faces do not match (e.g. expected `[2,4]`, settled `[1,4]`). _(maps to
  spec "Missing patch degrades to the instant reveal, never a hang")_
- [ ] **T4.3** Static check: `grep -rn "sides === 4"` / `"=== 4"` in `lib/dice/`
  finds no die-size special-casing (example comments referencing d4 allowed).
- [ ] **T4.4** Unit (`useDiceAnimation` mock surface): a built roll containing a
  d4 group drives the engine with `roll("Nd4@…")` for the first group and
  `add(...)` for subsequent groups — the same path as other sizes, no d4 branch.
- [ ] **T4.5** If Task 1 required raising the shared `iterationLimit`: unit
  asserts the new constant value and that it is applied for all die sizes (not
  d4-specific).

### Task 5 — CI patch ordering + marker guard test

- [ ] **T5.1** Unit (`tests/unit/dice/d4-engine-patch.test.ts`): reads the
  installed engine file and asserts it contains `/* d4-forced-face patch #627
  */`; on absence, fails with a message pointing at `npm ci` / `patch-package`.
  _(maps to spec "A guard test catches a silently absent patch")_
- [ ] **T5.2** CI config assertion (review + a lint/script check): the workflow
  runs `npm ci` (triggering `postinstall`) before the unit and e2e jobs, and no
  step passes `--ignore-scripts`. _(maps to spec "Install-time patch failure is
  visible in CI" and "Operability — CI applies the patch before tests")_
- [ ] **T5.3** Negative: temporarily removing/renaming the patch file makes
  `npm ci` exit non-zero (manual/local verification, documented in the PR).

### Task 6 — E2E: d4 pool settles on predetermined faces

- [ ] **T6.1** E2E (`tests/e2e/dice-roll-animation.spec.ts`): roll `3d4`, wait
  for the tumble, assert the per-die `[a, b, c]` breakdown line equals the
  predetermined faces and the tumble (not instant) path ran. _(maps to spec "d4
  pool animates on its decided faces then reveals the modal")_
- [ ] **T6.2** E2E: roll `2d4+3d6`, assert both groups settle on their
  predetermined faces and the modal total equals `built.total`. _(maps to spec
  "Mixed d4 + d6 pool forces both groups")_
- [ ] **T6.3** E2E: the `3d4` case completes within the spec's existing per-test
  wait budget. _(maps to spec NFAC "Forced d4 settles within the roll timeout
  budget")_
- [ ] **T6.4** E2E uses a free port for the test server (not 3000).

### Task 7 — Safe degradation when the patch is absent

- [ ] **T7.1** Unit: given an engine-reported d4 face mismatch, the overlay
  reconciliation routes to the instant reveal with the correct total, emits
  exactly one diagnostic event, and does not latch `status` to `unsupported`.
  _(maps to spec "Missing patch degrades to the instant reveal, never a hang"
  and Reliability "Recovery after a mismatched d4 tumble…")_
- [ ] **T7.2** Unit: `built.total` / `built.rolls` / `built.breakdown` are
  identical on the match and mismatch paths for a d4 pool. _(maps to spec
  "Roll outcome is decided before the animation starts" / Security NFAC)_

### Task 8 — Upstream PR

- [ ] **T8.1** Manual: the upstream PR URL is recorded in `tasks.md` and posted
  as a comment on issue #627. _(maps to spec ADDED Requirement — parallel PR, URL
  recorded; not a merge gate)_

### Task 9 — Acceptance coverage

- [ ] **T9.1** Every scenario in
  `specs/global-dice-fab/spec.md` (ADDED + MODIFIED + NFAC) is traceable to at
  least one test case above; this checklist item confirms the mapping.
