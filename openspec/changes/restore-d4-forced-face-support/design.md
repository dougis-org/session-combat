## Context

- Relevant architecture:
  - `lib/dice/toDiceBoxNotation.ts` — pure mapping from a `BuiltRoll` to a
    `DiceRollPlan` (per-die-size `DiceGroupPlan[]`). `FORCEABLE_SIDES` decides
    which groups get `@` notation and `forced: true`.
  - `lib/dice/reconcileDiceFaces.ts` — pure multiset comparison of predetermined
    faces vs. the faces the engine settled on; a mismatch routes the roll to the
    instant reveal.
  - `lib/dice/useDiceAnimation.ts` — owns the single engine instance, lazy import
    under timeout, `initialize()` / `roll()` / `add()` / `clearDice()`, the three
    bounded phases, and failure classification (persistent vs transient, n129).
    Drives the first die-size group with `roll()`, each remaining group with
    `add()` (the engine hangs on `+`-joined multi-size notation).
  - `@drdreo/dice-box-threejs@1.1.0` — vendored Three.js dice engine, assets
    copied under `public/`. Forces faces by swapping geometry face-group material
    indices (`swapDiceFace`), with a dedicated `swapDiceFace_D4` branch.
- Dependencies:
  - New dev dependency: `patch-package` (+ `postinstall` script).
  - New file: `patches/@drdreo+dice-box-threejs+1.1.0.patch`.
  - CI workflows that run `npm ci` must execute the postinstall patch step before
    unit and e2e jobs.
- Interfaces/contracts touched:
  - `DiceGroupPlan` / `DiceRollPlan` shapes are unchanged; only the values
    produced for `sides === 4` change (`forced: true`, `notation` gains `@…`).
  - `DiceAnimation` contract (`status`, `run(built, container)`, `teardown()`) is
    unchanged.
  - No change to `BuiltRoll`, `built.total`, `built.rolls`, `built.breakdown`, or
    any persisted roll data.

## Goals / Non-Goals

### Goals

- `box.roll("Nd4@v1,…")` lands each d4 on its `@` value with `reason: "forced"`
  and no hang, in this app's headless-Chromium WebGL setup, via an in-repo patch.
- `toDiceBoxNotation` emits `Nd4@…` (`forced: true`); `reconcileDiceFaces` treats
  d4 identically to every other size (no `sides === 4` branch anywhere).
- d4 pools play the 3D tumble on their predetermined faces.
- E2E asserts a d4 pool settling on its faces.
- An upstream PR to `drdreo/dice-box-threejs` is opened and its link recorded.

### Non-Goals

- Upgrading past `@drdreo/dice-box-threejs@1.1.0` or switching engines.
- Re-verifying d6/d8/d10/d12/d20/percentile forcing.
- Fixing the `+`-joined multi-size notation hang (already worked around).
- d4 physics/geometry realism beyond what forcing requires.
- Making the upstream PR merge a precondition for archiving this change.

## Decisions

### Decision 1: Time-boxed spike before any patch work

- Chosen: The first implementation task is a throwaway spike (Playwright page,
  real WebGL) that:
  1. Reproduces `box.roll("1d4@2")` → `reason: "natural"`, wrong value.
  2. Locates the defect in the vendored `@drdreo/dice-box-threejs@1.1.0` source
    — the `swapDiceFace_D4` branch and/or the code path that decides whether to
    invoke it during a forced roll — and classifies it as **small** (index math
    / branch condition, a patch under ~30 lines) or **deep** (collider or
    geometry rework).
  3. Confirms the `"1d4@3"` + `iterationLimit: 20000` hang disappears once the d4
    is actually forced (i.e. same root cause), and records the settle-iteration
    count for a forced d4 vs. a d6.
  4. Produces a candidate patch diff proven to work in the spike page.
- The spike is deleted before the final commit; its findings are appended to this
  design's "Open Questions" resolution and to `tasks.md`.
- Alternatives considered:
  - Patch straight away from a reading of the upstream source: rejected — the
    archived `fix-dice-animation-predetermined-faces` bug came from assuming an
    engine feature worked without end-to-end verification.
- Rationale: Bounds the blast radius; gives a hard go/no-go before committing to
  a vendored patch and an upstream PR.
- Trade-offs: One extra task; kept time-boxed.

### Decision 2: Fix in-repo via `patch-package`; upstream PR is a parallel follow-up

- Chosen: Add `patch-package` as a dev dependency with a `postinstall` script;
  commit `patches/@drdreo+dice-box-threejs+1.1.0.patch` containing the d4 forcing
  fix. The app depends only on the local patch. Separately, fork
  `drdreo/dice-box-threejs`, apply the same fix with an upstream d4-forcing test,
  and open a PR; record the PR URL in `tasks.md` / `proposal.md` before archive.
  When (if) the PR merges and a release ships, a later change bumps the version
  and drops the patch.
- Alternatives considered:
  - npm/pnpm `overrides` pointing at a git fork: rejected — ties installs to a
    personal fork's availability and a moving SHA; harder to review than a diff.
  - Thin wrapper module that monkey-patches `swapDiceFace_D4` at runtime:
    rejected — fragile against minification/internal renames, and hides the
    change from anyone reading the engine.
  - Wait for upstream: rejected explicitly by the requester — the app must work
    without an upstream merge.
- Rationale: A committed `.patch` is small, reviewable, fails loudly if it stops
  applying, and is the standard bridge pattern.
- Trade-offs: `postinstall` runs on every install; the patch must be re-based if
  the version ever changes (guarded by the exact-version filename).

### Decision 3: `toDiceBoxNotation` — add `4` to `FORCEABLE_SIDES`, nothing else

- Chosen: Change `FORCEABLE_SIDES` from `{6,8,10,12,20}` to `{4,6,8,10,12,20}`
  and rewrite the doc comment to state d4 forcing is restored via the vendored
  patch (reference this change). The existing branch then emits
  `${n}d4@${values.join(',')}` with `forced: true` automatically. Percentile path
  unchanged.
- Alternatives considered:
  - A separate `D4_FORCEABLE` flag toggled by patch presence: rejected —
    over-engineered; a missing patch is already handled safely by reconcile
    (Decision 4).
- Rationale: Minimal diff; the abstraction was built for exactly this.
- Trade-offs: None material.

### Decision 4: `reconcileDiceFaces` — delete the d4 carve-out; missing patch still degrades safely

- Chosen: Remove the doc-comment paragraph that says d4 groups "are expected to
  mismatch". No executable branch keys on `sides === 4` today, so the only change
  is wording plus updated tests. Behavior: with the patch present, d4 groups
  match and animate; with the patch absent (fresh clone, `postinstall` skipped),
  d4 groups mismatch → instant reveal, exactly as today. Never a wrong total,
  never a hang (the hook's `iterationLimit` / `ROLL_TIMEOUT` bound the engine).
- Alternatives considered:
  - Keep a `forced === false` short-circuit so unforceable groups skip the
    engine entirely: rejected — `forced` is now `true` for all supported sizes;
    dead path.
- Rationale: The reconcile layer is the safety net that makes a missing patch a
  cosmetic regression, not a correctness or availability one.
- Trade-offs: A fresh clone without `postinstall` loses d4 animation silently —
  acceptable and covered by the marker assertion in Decision 5.

### Decision 5: Guard against silent patch loss with a unit-level marker assertion

- Chosen: A unit test reads the installed
  `node_modules/@drdreo/dice-box-threejs` engine file and asserts it contains a
  stable marker string introduced by the patch (e.g. a comment
  `/* d4-forced-face patch #627 */` next to the fix). If `patch-package` fails to
  apply, this test fails in CI before e2e.
- Alternatives considered:
  - Rely solely on `patch-package` exit code: kept (it stays fail-loud) but not
    sufficient — a partial/re-based-away patch could still exit 0 in some npm
    versions.
  - An e2e-only check: rejected — slower feedback, flakier.
- Rationale: Cheap, deterministic tripwire.
- Trade-offs: The test knows an implementation-detail path; acceptable for a
  vendored dependency.

### Decision 6: `useDiceAnimation` — verify, expect no change

- Chosen: Confirm the d4 group flows through the same per-group `roll()` /
  `add()` path the other sizes use. Expected outcome: no code change (d4 was
  never special-cased in the hook, only in `toDiceBoxNotation`). If the spike
  shows a forced d4 needs a longer `iterationLimit` than the current constant,
  raise that constant (documented) rather than special-casing d4.
- Alternatives considered: a d4-specific `iterationLimit` — rejected unless the
  spike proves it necessary; keep one bound for all sizes.
- Rationale: Preserve the single-engine, uniform-handling invariant.
- Trade-offs: A global `iterationLimit` bump (if needed) slightly lengthens the
  worst-case settle for every die size.

### Decision 7: E2E coverage mirrors the existing settled-face assertion

- Chosen: Add a case to `tests/e2e/dice-roll-animation.spec.ts` that rolls a d4
  pool (e.g. `3d4`), waits for the tumble, and asserts the per-die `[a, b]`
  breakdown line matches the predetermined faces — the same technique the spec
  already uses for d6/d20. No pixel assertions.
- Alternatives considered: a screenshot diff — rejected as flaky.
- Rationale: Consistency with existing coverage; asserts the real contract
  (settled faces == decided faces).
- Trade-offs: Adds one WebGL e2e case (~seconds).

## Proposal to Design Mapping

- Proposal element: d4 `@` notation ignored / hangs (issue #627 gap 1)
  - Design decision: Decision 1 (spike), Decision 2 (patch)
  - Validation approach: spike reproduces then fixes in a Playwright page;
    e2e case (Decision 7) proves it in CI
- Proposal element: Fix must live in this repo, not depend on upstream merge
  - Design decision: Decision 2 (`patch-package`, upstream PR parallel)
  - Validation approach: `patches/` file committed; marker assertion (Decision 5)
- Proposal element: `toDiceBoxNotation` emits `@` for d4 again
  - Design decision: Decision 3
  - Validation approach: unit tests for `toDiceBoxNotation` d4 group → `forced:
    true`, `notation` contains `@`
- Proposal element: d4-specific reconcile-and-skip path removed
  - Design decision: Decision 4
  - Validation approach: unit tests for `reconcileDiceFaces` d4 group matching;
    grep shows no `sides === 4` branch
- Proposal element: e2e covers a d4 pool settling on its faces
  - Design decision: Decision 7
  - Validation approach: new spec case, run in CI e2e job
- Proposal element: upstream PR also done
  - Design decision: Decision 2
  - Validation approach: PR URL recorded in `tasks.md` before archive
- Proposal element: hang shares the d4 root cause (must confirm)
  - Design decision: Decision 1 step 3
  - Validation approach: spike runs `"1d4@3"` at `iterationLimit: 20000`
    pre/post-patch
- Proposal element: patch may fail silently on future installs
  - Design decision: Decision 5 (marker assertion), Decision 4 (safe degrade)
  - Validation approach: unit test fails if marker absent; reconcile test proves
    instant-reveal fallback

## Functional Requirements Mapping

- Requirement: A d4 pool animates on its predetermined faces.
  - Design element: Decisions 2, 3, 6
  - Acceptance criteria reference: `specs/dice-roll-animation/spec.md` —
    "d4 pools animate on predetermined faces"
  - Testability notes: e2e rolls `3d4`, asserts breakdown line == decided faces
    and that the tumble path (not the instant path) ran.
- Requirement: `toDiceBoxNotation` emits `Nd4@…` with `forced: true`.
  - Design element: Decision 3
  - Acceptance criteria reference: spec — "d4 groups are forced"
  - Testability notes: pure unit test on the returned `DiceGroupPlan`.
- Requirement: `reconcileDiceFaces` compares d4 like any other size.
  - Design element: Decision 4
  - Acceptance criteria reference: spec — "reconcile treats all supported sizes
    uniformly"
  - Testability notes: unit test — matching d4 faces → `true`; mismatched → `false`.
- Requirement: An upstream PR is opened.
  - Design element: Decision 2
  - Acceptance criteria reference: spec — "upstream fix submitted"
  - Testability notes: manual — PR URL present in `tasks.md`; not a CI gate.

## Non-Functional Requirements Mapping

- Requirement category: reliability
  - Requirement: A missing/failed patch never causes a hang or a wrong total —
    only a missing d4 animation.
  - Design element: Decisions 4, 5, 6 (`iterationLimit` backstop)
  - Acceptance criteria reference: spec — "missing patch degrades to instant
    reveal"
  - Testability notes: unit test simulates reconcile mismatch → instant reveal;
    marker assertion catches the missing patch in CI.
- Requirement category: performance
  - Requirement: Forced d4 settles within the existing roll timeout budget.
  - Design element: Decision 1 step 3 (measure), Decision 6
  - Acceptance criteria reference: spec — "forced d4 settles within
    `iterationLimit`"
  - Testability notes: spike records iteration count; e2e case completes within
    the spec's existing wait budget.
- Requirement category: security
  - Requirement: No new randomness, network, or change to persisted roll data;
    outcome predetermined and persisted before animation.
  - Design element: Decision 2 (cosmetic engine change only)
  - Acceptance criteria reference: spec — "animation does not alter the decided
    result"
  - Testability notes: existing dice-fairness unit tests stay green; diff review
    confirms no `built.*` mutation.
- Requirement category: operability
  - Requirement: The patch step runs in CI before tests; failure is visible.
  - Design element: Decisions 2, 5
  - Acceptance criteria reference: spec — "CI applies the patch before tests"
  - Testability notes: CI config review; marker unit test in the unit job.

## Risks / Trade-offs

- Risk/trade-off: d4 defect is deep, not a small patch.
  - Impact: Change is abandoned or re-scoped after the spike.
  - Mitigation: Decision 1 is a hard go/no-go; on "deep", update proposal via
    Change Control and stop.
- Risk/trade-off: `patch-package` patch stops applying on a future install.
  - Impact: d4 animation regresses (cosmetic only).
  - Mitigation: fail-loud postinstall + marker unit assertion (Decision 5); safe
    degrade (Decision 4).
- Risk/trade-off: Global `iterationLimit` bump (if the spike shows d4 needs it).
  - Impact: Slightly longer worst-case settle for all die sizes.
  - Mitigation: Only bump if measured necessary; document the new value and why.
- Risk/trade-off: E2E flake asserting settled d4 faces in headless WebGL.
  - Impact: CI noise.
  - Mitigation: reuse the existing breakdown-line assertion pattern; no pixels.
- Risk/trade-off: Upstream PR never merges.
  - Impact: The repo carries the patch indefinitely.
  - Mitigation: acceptable; the patch is small and version-pinned. Not a gate.

## Rollback / Mitigation

- Rollback trigger: d4 animation causes hangs, wrong totals, or unacceptable e2e
  flake after merge.
- Rollback steps:
  1. Revert the commit(s): removes `patches/…`, the `postinstall` hook, and the
    `toDiceBoxNotation` / `reconcileDiceFaces` / e2e changes.
  2. `npm ci` — with no patch and `FORCEABLE_SIDES` back to `{6,8,10,12,20}`, d4
    pools return to reconcile-mismatch → instant reveal (the current shipped
    behavior).
  3. Leave #627 open; the upstream PR (if opened) can continue independently.
- Data migration considerations: none — no schema, no persisted data touched.
- Verification after rollback: existing dice e2e + unit suites green; a d4 pool
  shows the correct total via the instant path.

## Operational Blocking Policy

- If CI checks fail: fix forward — the failing check (unit, e2e, marker
  assertion, lint) names the defect. Do not `verity waive` or skip. If the
  postinstall patch step fails, the patch no longer applies to `1.1.0`; re-base
  the `.patch` file, do not disable the step.
- If security checks fail: treat as blocking. This change adds a dev dependency
  (`patch-package`) and a vendored diff — a flagged transitive advisory or a
  suspicious patch hunk must be resolved or explained in the PR before merge;
  never waived on agent judgment (project CLAUDE.md quality gate).
- If required reviews are blocked/stale: the vendored patch and the CI change
  need a human reviewer. Ping the repo owner (doug); do not self-approve or use
  `--admin` / branch-protection bypass (memory: no-admin-merge,
  no-branch-protection-bypass).
- Escalation path and timeout: if the spike is not conclusively "small" within
  its time box, stop and escalate to doug with the findings rather than pressing
  on. If CI is red for >1 working day with no clear fix, convert to draft and
  raise in the PR thread.

## Open Questions

- Mechanism confirmation: `patch-package` vs `overrides` vs wrapper — design
  assumes `patch-package`; will proceed unless doug says otherwise (not an apply
  blocker).
- Upstream PR as archive gate: assumed "recorded link, not a gate" (not an apply
  blocker).
- Spike outcomes to be recorded here after Task 1: (a) exact defect location and
  patch size; (b) confirmation the hang shares the root cause; (c) forced-d4
  settle-iteration count and whether `iterationLimit` needs raising.
