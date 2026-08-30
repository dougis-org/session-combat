## GitHub Issues

- #624

## Why

- Problem statement: On nearly every roll, the 3D dice animation settles on die
  faces that have nothing to do with the roll result. `lib/dice/toDiceBoxNotation.ts`
  builds `@3d-dice/dice-box` "predetermined" notation of the form
  `"2d12@4,3"`, but `@3d-dice/dice-box@1.1.4` does not appear to honor that `@`
  syntax — the dice tumble to random faces while the (correct) total is shown
  beside them. It affects all die types and percentile. The library's own return
  value from `box.roll()` (the actually-settled faces) is currently discarded
  (`lib/dice/useDiceAnimation.ts:173`), so nothing detects or corrects the drift.
- Why now: Regression window. The large predetermined animation landed with the
  #596 work on 2026-08-30 and issue #624 was filed the same day. A player seeing a
  die read `7` next to a result line of `[4, 3] = 7` reasonably concludes the app
  is misreporting rolls, even though the authoritative predetermined result is
  correct and persisted first (decisions n139, n134).
- Business/user impact: Erodes trust in roll fairness — the single most important
  property of a dice tool. Secondary complaint in the same issue: the animated
  dice and the per-die values are too small to read.

## Problem Space

- Current behavior:
  - `buildRoll()` / `buildPercentileRoll()` predetermine the faces and total.
  - `toDiceBoxNotation(built)` maps that to `"<count>d<sides>@<v1>,<v2>,…"`
    (groups joined with `+`; percentile as `2d10@<tens>,<ones>`).
  - `useDiceAnimation.run()` calls `box.roll(notation)`; dice-box ignores the
    `@` values and settles on random faces.
  - `box.roll()` resolves with the settled `DiceBoxResult[]`; that value is
    awaited only for timing and then thrown away.
  - The result modal (`DiceRollOverlay.tsx`) shows the formula and total only —
    no per-die faces. The panel's `DieGlyph` shows ~21px die-*type* icons with no
    values.
  - `tests/e2e/dice-roll-animation.spec.ts` asserts only that the modal total
    equals the inline total; it never inspects a physical die face.
- Desired behavior:
  - Physical dice settle showing the predetermined faces.
  - If dice-box cannot land the dice on those faces, the mismatch is detected and
    the UI does not present or hold a misleading tumble — it reveals the
    (correct) result via the existing instant path instead, and logs once.
  - The animated dice and a per-die result readout are legible on a 375px-wide
    phone and on desktop.
- Constraints:
  - `@3d-dice/dice-box@^1.1.4` is the latest published version — no upgrade fix
    is available.
  - The predetermined result stays the source of truth; animation is cosmetic
    and must never change `built.total` / `built.rolls` (n139, n116, n134).
  - Preserve the persistent-vs-transient failure split (n125), bounded
    import/init/roll phases with guaranteed teardown (n140), and modal gating on
    animation completion with an independent fallback timeout (n136).
  - Self-contained: no new network calls; WebGL-only animation; instant path
    unchanged for unsupported / disabled / reduced-motion.
- Assumptions:
  - A1: `@3d-dice/dice-box@1.1.4` exposes *some* supported mechanism to force
    per-die results — object/array roll notation carrying a `value`, or
    `add()` / `reroll()`, or the `@3d-dice/dice-parser-interface` layer. This is
    **not yet confirmed** and a spike (design Decision 1) must establish it
    before the rest of the design is locked. If A1 is false, scope narrows to
    detection + graceful skip + legibility (see Risks).
  - A2: The drift is a notation/API problem, not a physics-space problem —
    supported by "nearly every roll, every die type, percentile included".
- Edge cases considered:
  - Percentile: two physical d10s, `00` decoded as face `10,10`.
  - Pools above the 15-die animation cap (`DICE_ANIM_CAP`) — only the first 15
    animate; the modal/inline total is always the full-pool total.
  - Mixed die sizes in one pool (`2d20 + 1d6`).
  - dice-box returning results in a different order/grouping than requested.
  - dice-box returning fewer results than requested, or a die landing cocked.
  - WebGL unavailable, animation disabled, reduced-motion default.
  - A superseding `run()` / teardown while a roll is mid-settle.

## Scope

### In Scope

- Repair the predetermined-value path so `@3d-dice/dice-box@1.1.4` settles dice
  on the chosen faces, using a spike-confirmed supported mechanism
  (`lib/dice/toDiceBoxNotation.ts`, `lib/dice/useDiceAnimation.ts`,
  `types/dice-box.d.ts`).
- Reconciliation guard in `useDiceAnimation`: compare dice-box's returned
  settled results against the predetermined faces; on mismatch, log once as a
  transient per-roll failure (never latch `unsupported`) and reveal the result
  through the instant path rather than showing/holding the misleading tumble.
- Extend `tests/e2e/dice-roll-animation.spec.ts` to assert the settled dice-box
  results equal the inline per-die values, not only the aggregate total.
- Legibility: increase the animated die size and/or canvas band, and add a
  readable per-die result readout to the result modal (`DiceRollOverlay.tsx`,
  `lib/dice/diceAnimationScale.ts`).
- Update `openspec/specs/global-dice-fab/spec.md` for the changed behavior.

### Out of Scope

- Upgrading, patching, or forking `@3d-dice/dice-box`.
- Any change to roll generation, RNG, rejection sampling, persistence, or the
  values in `built.total` / `built.rolls` (n116, n134).
- Cross-client frame-accurate animation.
- Animating more than the existing 15-die cap.
- New dice themes, colours, sound, or camera choreography beyond size /
  legibility.
- Non-WebGL animation.
- Making the panel's `DieGlyph` die-type icons display roll values — they are
  type indicators, not results.

## What Changes

- `lib/dice/toDiceBoxNotation.ts` — emit the roll spec form that dice-box
  actually honors (expected: object/array notation with a per-die `value`, or a
  structured predetermined-roll object) instead of `@` string notation; keep the
  percentile mapping and the 15-die cap.
- `lib/dice/useDiceAnimation.ts` — capture the `box.roll()` return value; add a
  predetermined-vs-settled reconciliation step; classify a mismatch as a
  transient per-roll failure (reveal result, log once, do not set
  `status: 'unsupported'`); pass the larger `scale` through.
- `lib/dice/diceAnimationScale.ts` — raise `DICE_BASE_SCALE` and/or retune the
  shrink curve for legibility.
- `lib/components/dice/DiceRollOverlay.tsx` — enlarge the canvas band within the
  existing centered-stack layout; add a per-die result readout to the result
  modal that is independent of the WebGL canvas.
- `types/dice-box.d.ts` — model the confirmed predetermined-roll API surface.
- `tests/e2e/dice-roll-animation.spec.ts`, `tests/unit/lib/dice/*.test.ts`,
  `tests/unit/components/DiceRollOverlay.test.tsx` — face-fidelity and
  reconciliation coverage.
- `openspec/specs/global-dice-fab/spec.md` — MODIFIED requirement + scenarios.

## Risks

- Risk: The spike finds `@3d-dice/dice-box@1.1.4` has no reliable way to force
  die faces on the first settle.
  - Impact: The "make it land correctly" goal is unachievable; the fix collapses
    to detection + graceful skip of the misleading tumble, plus legibility.
  - Mitigation: The design branches on the spike outcome. The reconciliation
    guard is independently valuable and is the guaranteed floor. If the spike
    invalidates assumption A1, `proposal.md` / `design.md` / `specs` / `tasks`
    are updated per Change Control before implementation continues.
- Risk: Larger dice in the bounded canvas clip or obscure the result modal (the
  #596 layout concern this change reopens).
  - Impact: The total or per-die readout is hidden behind settled dice.
  - Mitigation: The per-die readout lives in the modal as DOM text, always
    legible and independent of the canvas; canvas size is tuned with explicit
    desktop + mobile visual-check tasks; the "physics floor a fixed margin above
    the modal" layout is retained.
- Risk: Reconciliation delays the result reveal.
  - Impact: Sluggish feel.
  - Mitigation: Reconciliation is a synchronous comparison over the already-
    awaited `box.roll()` results — no additional await unless the design opts
    into a single bounded reroll pass, which still completes inside
    `ROLL_TIMEOUT_MS`.
- Risk: dice-box returns results in a different order or grouping than requested,
  producing false-positive mismatches.
  - Impact: The guard suppresses valid animations.
  - Mitigation: Compare as per-die-size multisets, not positionally; unit-test
    against dice-box's documented result shape.
- Risk: Percentile face encoding (`0` vs `10`) differs between our faces and
  dice-box's returned values.
  - Impact: Percentile rolls always flagged as mismatched.
  - Mitigation: Explicit percentile reconciliation mapping with a dedicated
    scenario.

## Open Questions

- Question: If the spike shows dice-box can only reach the target faces via a
  bounded reroll loop (not first settle), is up to one extra reroll pass per
  mismatched die acceptable for latency, or should such rolls skip the tumble?
  - Needed from: requester (@dougis)
  - Blocker for apply: no — design will default to a single bounded reroll pass,
    then fall through to the instant reveal if it still mismatches.
- Question: Preferred form of the per-die readout in the result modal — plain
  large text (`[4, 3]`, matching the inline line) or numbered die glyphs?
  - Needed from: requester (@dougis)
  - Blocker for apply: no — default is a plain large text row.
- Question: Target apparent die size — keep the #596 "≈ modal total text size"
  goal, or just "clearly readable"?
  - Needed from: requester (@dougis)
  - Blocker for apply: no — default target is "clearly readable at 375px viewport
    width", verified by a visual-check task.

## Non-Goals

- Guaranteeing that every roll animates — the unsupported, disabled,
  reduced-motion, and mismatch paths all still fall through to the instant
  result reveal.
- Frame-accurate or synchronized animation across clients.
- Changing how `disableAnimation` is resolved or persisted.
- Revisiting decisions n047 (body-level portal), n136 (modal gating), or n140
  (bounded phases) beyond what this fix strictly requires.

## Change Control

If scope changes after proposal approval, update `proposal.md`, `design.md`,
`specs/**/*.md`, and `tasks.md` before implementation starts. In particular, if
the design-phase spike invalidates assumption A1 (dice-box can force faces), this
proposal's Scope and What Changes sections must be revised before specs and tasks
are finalized.
