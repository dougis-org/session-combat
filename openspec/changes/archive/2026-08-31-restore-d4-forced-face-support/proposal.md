## GitHub Issues

- #627

## Why

- Problem statement: The 3D dice engine `@drdreo/dice-box-threejs@1.1.0` ignores
  `@` predetermined-face notation for **d4** (`box.roll("1d4@2")` rolls the die
  naturally and returns `reason: "natural"`; with a high `iterationLimit` the
  roll can hang). To ship `fix-dice-animation-predetermined-faces` (#624) the app
  worked around this: `toDiceBoxNotation` emits plain `Nd4` (no `@`) for d4
  groups, so any pool containing a d4 reconciles as a face mismatch and reveals
  through the instant path. The total and per-die readout are always correct, but
  **d4 pools never play the 3D tumble**.
- Why now: d4 is a real, frequently rolled D&D die — damage dice, plus
  Guidance / Bless / Bardic Inspiration are all d4. It is the only die size that
  silently skips the animation, which reads as a bug to players. The workaround
  code (`FORCEABLE_SIDES` carve-out, d4-specific reconcile-and-skip) is tracked
  tech debt that should be removed rather than left to ossify.
- Business/user impact: Visual consistency of the core dice-roll experience. No
  correctness impact today; this is polish plus debt paydown.

## Problem Space

- Current behavior:
  - `lib/dice/toDiceBoxNotation.ts` — `FORCEABLE_SIDES = {6,8,10,12,20}`; d4
    groups emit `Nd4` with `forced: false`.
  - `lib/dice/reconcileDiceFaces.ts` — d4 groups are still compared and are
    *expected* to mismatch; the mismatch routes the roll to the instant reveal.
  - `lib/dice/useDiceAnimation.ts` — drives the engine; percentile + multi-group
    handling already split into per-die-size `roll()` + `add()` calls.
  - Root cause (upstream): the engine forces faces by swapping geometry
    face-group material indices (`swapDiceFace`); d4 has a separate branch
    (`swapDiceFace_D4`) using modulo-4 material rotation and a full material
    rebuild, because a d4 reads its value from the up-vertex, not a single top
    face. That branch does not currently take effect for forced rolls.
- Desired behavior:
  - `box.roll("Nd4@…")` lands every d4 on its target face with `reason:
    "forced"` and no hang, in this app's headless-Chromium WebGL setup.
  - `toDiceBoxNotation` emits `@` notation for d4; `FORCEABLE_SIDES` includes 4.
  - The d4-specific reconcile-and-skip path is removed; d4 pools reconcile and
    animate like every other die size.
  - `tests/e2e/dice-roll-animation.spec.ts` covers a d4 pool settling on its
    predetermined faces.
- Constraints:
  - The fix must live in **this repo** — a vendored patch against
    `@drdreo/dice-box-threejs@1.1.0` — and must not depend on an upstream merge
    landing first. An upstream PR is also required, but as a parallel follow-up,
    not a blocker.
  - Keep the `DiceAnimation` contract (`status`, `run`, `teardown`) byte-for-byte
    (design Decision 2 of the archived change); reconciliation stays in the hook
    (single-engine invariant, n140 / n128).
  - Predetermined outcomes are generated and persisted before animation
    (n124 / dice-roll fairness decisions); the engine change is cosmetic only and
    must never alter `built.total` / `built.rolls` / `built.breakdown`.
  - Engine + assets remain self-hosted and lazy-loaded; no new randomness or
    network.
- Assumptions:
  - The d4 forcing defect is small enough to patch (a bug in `swapDiceFace_D4`'s
    index math or in the branch that decides whether to call it), not a
    fundamental d4 collider/geometry rewrite. **This is validated by the first
    task (spike) before any patch work.**
  - The reported hang on `"1d4@3"` with `iterationLimit: 20000` is caused by the
    engine failing to settle a d4 it cannot force — i.e. the same defect, not a
    separate bug. Also confirmed by the spike.
  - `patch-package` (or an equivalent postinstall patch mechanism) can be added
    to the toolchain and will run in CI before the e2e job.
- Edge cases considered:
  - Mixed pool `2d4 + 3d6` — d4 group forced via `roll()`, d6 group via `add()`
    (existing per-group path).
  - A d4 pool larger than `DICE_ANIM_CAP` (15) — capped like any other size.
  - d4 value `4` and value `1` (the extremes of the modulo rotation).
  - Cocked / extra-die results from the engine — the multiset reconcile already
    tolerates these.
  - Patch absent (fresh clone without postinstall) — behavior must degrade to a
    reconcile mismatch → instant reveal, never a hang. The `iterationLimit`
    bound in the hook is the backstop.

## Scope

### In Scope

- A spike (throwaway) confirming the d4 forcing defect, its size, and that the
  hang shares the same root cause.
- A vendored patch against `@drdreo/dice-box-threejs@1.1.0` restoring d4 `@`
  forcing, wired into install via `patch-package` postinstall.
- `lib/dice/toDiceBoxNotation.ts`: add `4` to `FORCEABLE_SIDES`; d4 groups emit
  `Nd4@…` with `forced: true`. Update the doc comment.
- `lib/dice/reconcileDiceFaces.ts`: remove the "d4 is expected to mismatch"
  carve-out wording; d4 now reconciles like any size (no code path may special-
  case `sides === 4`).
- `lib/dice/useDiceAnimation.ts`: only if the d4 group needs the same per-group
  `roll()`/`add()` handling the other sizes already get (verify; likely no
  change).
- `tests/e2e/dice-roll-animation.spec.ts`: add a d4 pool case asserting settled
  faces.
- Unit test updates for `toDiceBoxNotation` and `reconcileDiceFaces`.
- CI: ensure `patch-package` runs before unit + e2e jobs.
- An upstream PR to `drdreo/dice-box-threejs` (tracked as a follow-up task; the
  PR link recorded in this change before archive, merge not required).

### Out of Scope

- Upgrading `@drdreo/dice-box-threejs` past `1.1.0` or switching engines.
- Re-verifying forced faces for d6/d8/d10/d12/d20/percentile (already shipped).
- The mixed-die-size `+`-joined notation hang — already worked around by the
  per-group `roll()` + `add()` path in the shipped change.
- Any change to `disableAnimation` resolution, themes, sound, camera, or the
  15-die cap.
- Cross-client frame accuracy.

## What Changes

- New: `patches/@drdreo+dice-box-threejs+1.1.0.patch` + `patch-package`
  postinstall hook in `package.json`.
- Modified: `lib/dice/toDiceBoxNotation.ts`, `lib/dice/reconcileDiceFaces.ts`,
  possibly `lib/dice/useDiceAnimation.ts`.
- Modified: `tests/e2e/dice-roll-animation.spec.ts` and the affected unit tests.
- Modified: CI workflow(s) to run the postinstall patch step.
- Follow-up (outside this repo): PR to `drdreo/dice-box-threejs`.

## Risks

- Risk: The d4 defect turns out to be a deep collider/geometry problem, not a
  small index-math bug.
  - Impact: The patch balloons in size and maintenance cost; upstream is unlikely
    to accept a large speculative change.
  - Mitigation: The spike is the first task and is time-boxed. If the fix is not
    small, stop, update this proposal (Change Control), and either (a) accept the
    current shipped state and close #627 as won't-fix-yet, or (b) re-scope to an
    engine evaluation. No patch work begins until the spike says "small".

- Risk: `patch-package` patch silently fails to apply on a future `npm install`
  (lockfile churn, registry re-pack, Node version).
  - Impact: d4 forcing regresses to mismatch → instant reveal.
  - Mitigation: `patch-package` fails the install loudly by default; keep that
    behavior. The reconcile-and-instant-reveal fallback means a missing patch
    never produces a wrong total or a hang — only a missing animation. Add a unit
    assertion that the patched file contains the expected marker.

- Risk: New `iterationLimit` interaction — even with the patch, a forced d4 takes
  more solver iterations to settle than other dice and occasionally times out.
  - Impact: Occasional d4 pool falls back to instant reveal.
  - Mitigation: Measure settle iterations for d4 in the spike; the `ROLL_TIMEOUT`
    / `iterationLimit` bounds in the hook already cap this and route to the
    instant path — acceptable degradation, not a hang.

- Risk: E2E flake — asserting exact settled d4 faces in headless WebGL.
  - Impact: CI noise.
  - Mitigation: Mirror the existing settled-face assertion approach already used
    for d6/d20 in the same spec; assert the `[a, b]` breakdown line, not pixels.

## Open Questions

- Question: Is `patch-package` the right mechanism, or does the project prefer a
  pnpm/npm `overrides` + vendored file, or a thin wrapper module?
  - Needed from: repo owner (doug)
  - Blocker for apply: no — `patch-package` is the default assumption; design.md
    will lock it unless told otherwise.

- Question: Should the upstream PR be a hard gate on archiving this change, or
  just a recorded link?
  - Needed from: doug
  - Blocker for apply: no — assumed "recorded link, not a gate".

- All open questions raised during the #627 exploration were resolved by the
  requester: (1) investigate first — yes, via the spike task; (2) confirm the
  hang is the d4 defect — yes, in the spike; (3) fix if small, and d4 matters
  (Guidance/Inspiration) — yes; (4) fix in-repo, don't rely on upstream, but also
  push the upstream PR — yes.

## Non-Goals

- Making d4 forcing work in engines other than `@drdreo/dice-box-threejs@1.1.0`.
- Guaranteeing the upstream PR merges.
- Improving d4 physics realism or geometry beyond what forcing requires.
- Changing how non-d4 dice are planned, forced, or reconciled.

## Change Control

If scope changes after proposal approval, update `proposal.md`, `design.md`,
`specs/**/*.md`, and `tasks.md` before implementation starts.
