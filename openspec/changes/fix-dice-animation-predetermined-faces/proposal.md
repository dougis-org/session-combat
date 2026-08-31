## GitHub Issues

- #624

## Why

- Problem statement: On nearly every roll, the 3D dice animation settles on die
  faces that have nothing to do with the roll result. `lib/dice/toDiceBoxNotation.ts`
  builds notation of the form `"2d12@4,3"`, but the installed engine —
  `@3d-dice/dice-box@1.1.4` (Babylon.js) — has **no predetermined-results feature
  at all**. Its `@` tail is silently ignored: `parse()` never reads it,
  `createNotationArray()` only reads `qty`/`sides` from notation objects, the
  physics worker's `addDie` message carries only `{sides, scale, id, theme,
  meshName}`, and `Dice.getRollResult()` derives every value from a downward
  raycast against the *settled* mesh. `reroll()` even strips any `value` field.
  The library's own `box.roll()` return (the actually-settled faces) is discarded
  (`lib/dice/useDiceAnimation.ts:173`), so nothing detects the drift.
- Root cause of the coding error: the `@` syntax **is** real — but it belongs to
  a different package, `@3d-dice/dice-box-threejs` (Three.js), not the Babylon
  `@3d-dice/dice-box` the project installs. The original animation work was coded
  against the wrong library's documentation.
- Why now: Regression window. The large predetermined animation landed with the
  #596 work on 2026-08-30 and issue #624 was filed the same day. A player seeing a
  die read `7` next to a result line of `[4, 3] = 7` reasonably concludes the app
  is misreporting rolls, even though the authoritative predetermined result is
  correct and persisted first (decisions n139, n134).
- Business/user impact: Erodes trust in roll fairness — the single most important
  property of a dice tool. Secondary complaint in the same issue: the animated
  dice and the per-die values are too small to read (the per-die readout in the
  result modal was subsequently added by `enhance-dice-roll-modal`, so the
  readability half is largely addressed; the fidelity half is not).

## Problem Space

- Current behavior:
  - `buildRoll()` / `buildPercentileRoll()` predetermine the faces and total.
  - `toDiceBoxNotation(built)` maps that to `"<count>d<sides>@<v1>,<v2>,…"`
    (groups joined with `+`; percentile as `2d10@<tens>,<ones>`).
  - `useDiceAnimation.run()` calls `box.roll(notation)` on
    `@3d-dice/dice-box@1.1.4`; the engine ignores the `@` values and settles on
    random faces.
  - `box.roll()` resolves with the settled results; that value is awaited only
    for timing and then thrown away (`lib/dice/useDiceAnimation.ts:173`).
  - The result modal (`DiceRollOverlay.tsx`) already shows `built.formula`, the
    total, **and** a per-die readout (`StaticRollResult`, from
    `enhance-dice-roll-modal`) — but with no cap for very large pools.
  - `tests/e2e/dice-roll-animation.spec.ts` asserts only that the modal total
    equals the inline total; it never inspects a physical die face.
- Desired behavior:
  - Physical dice settle showing the predetermined faces, for every die type and
    for percentile, because the engine natively supports forced results.
  - `box.roll()`'s settled results are inspected and reconciled against the
    predetermined faces as a cheap sanity check; on the rare mismatch the UI
    reveals the (correct) result via the instant path instead of holding a
    misleading tumble, and logs once.
  - The animated dice and the existing per-die readout stay legible on a 375px
    phone and on desktop; the readout gains a `+N more` affordance above the
    animation cap.
- Constraints:
  - The predetermined result stays the source of truth; animation is cosmetic
    and must never change `built.total` / `built.rolls` / `built.breakdown`
    (n139, n116, n134).
  - Preserve the persistent-vs-transient failure split (n125), bounded
    import/init/roll phases with guaranteed teardown (n140), and modal gating on
    animation completion with an independent fallback timeout (n136).
  - Self-contained: no new network calls; assets self-hosted from `public/`
    (n-lazy-load-self-host); WebGL-only animation; instant path unchanged for
    unsupported / disabled / reduced-motion.
  - The engine is lazy-loaded (dynamic `import()`), never in the initial bundle.
- Assumptions:
  - A1: `@drdreo/dice-box-threejs@1.1.0` honors `@` predetermined notation for
    `d4/d6/d8/d10/d12/d20` and for two-d10 percentile, returning
    `reason: "forced"` per die. Confirmed by source review (`dist/…es.js` carries
    the `"forced"` reason path and an `iterationLimit` fast-forward); a bounded
    spike (design Decision 1) re-verifies it end-to-end in this app before the
    rest of the work is locked.
  - A2: The engine's `clearDice()` plus dropping the instance reference is
    sufficient teardown for the single-instance invariant (it calls
    `cancelAnimationFrame` and `dispose()` internally). The spike confirms.
- Edge cases considered:
  - Percentile: two physical d10s, `00` decoded as faces `10,10`; engine `0`/`10`
    encoding normalized before reconciliation.
  - Pools above the 15-die animation cap (`DICE_ANIM_CAP`) — only the first 15
    animate; the modal/inline total is always the full-pool total.
  - Mixed die sizes in one pool (`2d20 + 1d6`).
  - Engine returning results grouped/ordered differently than requested.
  - Engine returning a die whose `reason` is not `"forced"`, or a value that
    still differs from the target.
  - WebGL unavailable, animation disabled, reduced-motion default.
  - A superseding `run()` / teardown while a roll is mid-settle.
  - `three` / `cannon-es` added as dependencies; main-thread physics (no web
    workers) — bounded by the existing `ROLL_TIMEOUT_MS`.

## Scope

### In Scope

- Replace the 3D dice engine: remove `@3d-dice/dice-box`, add
  `@drdreo/dice-box-threejs@1.1.0` (+ `three`, `cannon-es` peers), self-host its
  `textures/` assets under `public/`.
- Rewrite `lib/dice/useDiceAnimation.ts` against the new engine API
  (`new DiceBox(el, config)`, `initialize()`, `roll(): Promise<DiceResults>`,
  `clearDice()`, `updateConfig()`), keeping the `run()` / `teardown()` contract,
  the bounded phases, and the persistent-vs-transient failure split unchanged.
- Keep `lib/dice/toDiceBoxNotation.ts` emitting `"<count>d<sides>@<v1>,…"` string
  notation (now honored), keep the percentile `2 × d10` mapping and the 15-die
  cap; adjust only where the new engine's notation differs.
- Replace `types/dice-box.d.ts` with a thin re-export / declaration for the new
  package (it ships its own types).
- Retune `lib/dice/diceAnimationScale.ts` for the new engine's `baseScale`
  semantics (default 100, vs the old `scale` default 5).
- Reconciliation guard in `useDiceAnimation`: compare the engine's returned
  settled results against the predetermined faces; on mismatch, log once as a
  transient per-roll failure (never latch `unsupported`) and reveal the result
  through the instant path.
- Add a `+N more` affordance to `DiceRollOverlay`'s existing per-die readout for
  pools above the animation cap; confirm the readout renders on every reveal
  path.
- Extend `tests/e2e/dice-roll-animation.spec.ts` to assert the settled per-die
  faces equal the inline per-die values, not only the aggregate total.
- Update `openspec/specs/global-dice-fab/spec.md` for the changed behavior.

### Out of Scope

- Any change to roll generation, RNG, rejection sampling, persistence, or the
  values in `built.total` / `built.rolls` / `built.breakdown` (n116, n134).
- Cross-client frame-accurate animation.
- Animating more than the existing 15-die cap.
- New dice themes, colours, sound, or camera choreography beyond size /
  legibility. (`sounds` stays `false`.)
- Non-WebGL animation.
- Making the panel's `DieGlyph` die-type icons display roll values — they are
  type indicators, not results.
- Forking or vendoring the dice engine into the repo (use the published package).

## What Changes

- `package.json` — remove `@3d-dice/dice-box`; add
  `@drdreo/dice-box-threejs@1.1.0`, `three`, `cannon-es`. Asset-copy step for
  `public/dice-box-threejs/`.
- `lib/dice/useDiceAnimation.ts` — new engine: `new DiceBox(container, { assetPath,
  baseScale, … })`, `await box.initialize()`, `const results = await box.roll(...)`,
  `box.clearDice()` on teardown. Capture `results`; add the
  predetermined-vs-settled reconciliation step; classify a mismatch as a
  transient per-roll failure (reveal result, log once, do not set
  `status: 'unsupported'`).
- `lib/dice/toDiceBoxNotation.ts` — unchanged shape (string `@` notation) unless
  the spike finds a notation quirk; keep percentile mapping and the 15-die cap.
- `lib/dice/diceAnimationScale.ts` — retune `DICE_BASE_SCALE` / `DICE_MIN_SCALE`
  for the new `baseScale` units; keep the monotonic shrink curve.
- `lib/dice/reconcileDiceFaces.ts` (new) — pure multiset comparison of expected
  vs settled faces per die-size group, with percentile `0`/`10` normalization.
- `lib/components/dice/DiceRollOverlay.tsx` — `+N more` affordance on the
  existing per-die readout above the cap; canvas band sizing check for the new
  engine.
- `types/dice-box.d.ts` — replaced by the package's own types (delete or reduce
  to a re-export).
- `tests/e2e/dice-roll-animation.spec.ts`, `tests/unit/lib/dice/*.test.ts`,
  `tests/unit/components/DiceRollOverlay.test.tsx` — face-fidelity, reconciliation
  and engine-swap coverage.
- `openspec/specs/global-dice-fab/spec.md` — MODIFIED requirement + scenarios.

## Risks

- Risk: `@drdreo/dice-box-threejs` is a single-maintainer fork; `1.1.0` is the
  latest (May 2025).
  - Impact: Future upstream fixes may lag; a regression would need a local patch.
  - Mitigation: It is MIT-licensed and self-contained; assets and code are
    vendored into `public/` / `node_modules` and pinned exactly (`1.1.0`, no
    caret). The reconciliation guard means even an engine regression degrades to
    "skip the tumble, show the correct result", never a wrong result. A
    follow-up issue tracks evaluating a longer-term engine.
- Risk: Main-thread physics (no web workers, unlike the Babylon engine) janks the
  UI during a large-pool settle.
  - Impact: Dropped frames while 15 dice tumble.
  - Mitigation: 15-die cap already in place; `iterationLimit` config bounds the
    physics solve; `ROLL_TIMEOUT_MS` bounds the whole phase; visual-check task at
    `15d6`.
- Risk: `three` + `cannon-es` bundle size.
  - Impact: Larger lazy chunk (~250KB gzipped for the engine chunk).
  - Mitigation: Dynamic `import()` only — never in the initial bundle; the
    Babylon engine it replaces was comparable. `npm run build` size check.
- Risk: Asset path / self-hosting misconfiguration → textures 404, dice render
  untextured or the engine throws.
  - Impact: Broken-looking or failed animation.
  - Mitigation: Copy step scripted and committed; `assetPath` unit-asserted;
    engine failure already falls through to the instant path (n125/n136); E2E
    CI-no-WebGL path unaffected.
- Risk: Percentile face encoding (`0` vs `10`) differs between our faces and the
  engine's returned values.
  - Impact: Percentile rolls always flagged as mismatched.
  - Mitigation: Explicit percentile reconciliation normalization with a dedicated
    scenario.

## Open Questions

- Question: Does `@drdreo/dice-box-threejs@1.1.0` reliably land `@`-forced faces
  for every die type and percentile in this app's WebGL setup, and is
  `clearDice()` + reference-drop a clean teardown?
  - Needed from: the Decision 1 spike (this change).
  - Blocker for apply: yes — the spike gates E2 onward. If forced faces prove
    unreliable, fall back to the previous plan's Decision 4 (detect + skip) and
    update this proposal per Change Control.
- Question: Keep `sounds: false` (silent dice) or wire the optional dice-hit
  sounds?
  - Needed from: requester (@dougis).
  - Blocker for apply: no — default is `sounds: false`, no sound assets copied.
- Question: Target apparent die size for the new engine — match the previous
  visual size or take the opportunity to go larger?
  - Needed from: requester (@dougis).
  - Blocker for apply: no — default target is "clearly readable at 375px viewport
    width", verified by a visual-check task, tuned via `baseScale`.

## Non-Goals

- Guaranteeing that every roll animates — the unsupported, disabled,
  reduced-motion, and mismatch paths all still fall through to the instant
  result reveal.
- Frame-accurate or synchronized animation across clients.
- Changing how `disableAnimation` is resolved or persisted.
- Revisiting decisions n047 (body-level portal), n136 (modal gating), or n140
  (bounded phases) beyond what this swap strictly requires.

## Change Control

If scope changes after proposal approval, update `proposal.md`, `design.md`,
`specs/**/*.md`, and `tasks.md` before implementation continues. In particular, if
the Decision 1 spike shows `@drdreo/dice-box-threejs` cannot reliably force faces
in this app, this proposal reverts to the detect-and-skip fallback (previous
Decision 4) and Scope / What Changes are revised before E2 begins.

## History

- Originally proposed (2026-08-30) as a repair of the predetermined-value path on
  `@3d-dice/dice-box@1.1.4`, gated on a spike to find that engine's forced-face
  mechanism.
- Rewritten (2026-08-30) after the spike proved `@3d-dice/dice-box@1.1.4` has no
  such mechanism: the change now **replaces the engine** with
  `@drdreo/dice-box-threejs`, which natively supports the `@` notation the code
  already emits. Requested by @dougis.
