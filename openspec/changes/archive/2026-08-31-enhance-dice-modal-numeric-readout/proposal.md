## GitHub Issues

- #634

## Why

- Problem statement: The dice-roll result modal (`StaticRollResult` in
  `lib/components/dice/DiceRollOverlay.tsx`) renders each rolled die as a
  **static die-*size* SVG icon** from `DIE_ICONS` (`lib/components/icons/dice.tsx`)
  with the rolled value floated on top as a small absolutely-positioned `<span>`.
  Those icons are one-per-size silhouettes (the d6 path always draws a 6-pip
  face, the d20 always draws the same d20 outline); they do **not** depict the
  face that was rolled. To a user this reads as "the modal is showing a default
  d6 / d20 image, not the value I rolled" — issue #634, filed the same day the
  predetermined-face 3D animation landed (`fix-dice-animation-predetermined-faces`,
  #624). The 3D tumble now settles on the real physical face, so the modal's
  generic-icon-plus-sticker treatment looks broken next to it.
- Why now: #634 is an open follow-up to the just-shipped animation fidelity work.
  The 3D dice are now correct; the 2D readout is the last surface still showing
  a value that doesn't match what the dice show.
- Business/user impact: Erodes confidence that the tool reports rolls correctly —
  the same trust concern that drove #624. The fix is small, presentational, and
  client-only.

## Problem Space

- Current behavior:
  - `StaticRollResult` maps `built.breakdown.slice(0, DICE_ANIM_CAP)` to cells.
  - Each cell: `const Icon = DIE_ICONS[die.sides]`; if found, render `<Icon/>`
    plus an absolutely-positioned `<span data-testid="die-face">{die.value}</span>`
    overlay; if not found, render a `data-testid="fallback-die"` bordered box with
    the number only (no icon).
  - Percentile path: two `<DiceD10Icon/>` with `00`/`70`-style text overlaid,
    nudged with `mt-2`.
  - `+{remainder} more` (`data-testid="dice-readout-remainder"`) is shown when
    `built.breakdown.length > DICE_ANIM_CAP`.
  - The die *size* icons are also used by `DieGlyph`
    (`lib/components/dice/DieGlyph.tsx`) for the pool-builder buttons and the fab.
- Desired behavior:
  - The result modal readout shows, for each die, its **rolled numeric value**
    as the dominant element, with a small non-dominant `d{sides}` size tag so a
    mixed pool (`2d20 + 1d6`) stays readable. No die-face SVG graphic, no pips,
    no size-silhouette icon, no number-over-icon overlay.
  - Every die renders through **one** code path — the `Icon` / `fallback-die`
    split is removed.
  - The percentile path uses the same numeric-chip styling for its two faces
    (`d%` tag), with no `DiceD10Icon` and no `mt-2` nudge.
  - The existing 15-die display cap and `+N more` affordance are **kept**
    (requester decision, 2026-08-31): the readout stays aligned with the
    animation cap.
- Constraints:
  - Purely presentational and client-only. No change to `built.total`,
    `built.rolls`, `built.breakdown`, `percentileFaces`, roll generation, RNG,
    persistence, or any network path.
  - `data-testid="die-face"` MUST remain on the element carrying each die's
    value; `data-testid="dice-readout-remainder"` MUST remain for the `+N more`
    note. Existing overlay / animation-gating / focus behaviour in
    `DiceRollOverlay` is untouched.
  - `DIE_ICONS` / `lib/components/icons/dice.tsx` stay in the codebase — still
    consumed by `DieGlyph`. This change only stops the *result modal* from using
    them.
  - Preserve decision n047 (body-level portal), the modal-gating and fallback
    reveal behaviour, and the "roll outcome decided before animation" guarantee.
- Assumptions:
  - A1: A numeric-only readout satisfies #634's intent ("show another instance of
    the values rolled"). Confirmed with the requester (2026-08-31): number-render
    ALL dice, no pips even for d6, icon removed entirely.
  - A2: No other consumer reads the die-face SVG out of the result modal
    (searched: only `DieGlyph` and `DiePoolButton` use `DIE_ICONS`, both for
    pool controls, not the result modal).
- Edge cases considered:
  - Mixed die sizes in one pool — the `d{sides}` tag disambiguates.
  - Pools above `DICE_ANIM_CAP` (15) — `+N more` retained; total is always the
    full-pool total.
  - Percentile: two chips showing the `00`/tens and ones faces, `d%` tag.
  - Unknown / unsupported `die.sides` — no longer a special branch; it renders
    the same numeric chip as any other die.
  - Single-die roll, and the reduced-motion / animation-disabled / unsupported /
    fallback-timeout reveal paths — the readout must render identically on all of
    them (it already does; this change does not touch the reveal gating).

## Scope

### In Scope

- Rewrite `StaticRollResult` in `lib/components/dice/DiceRollOverlay.tsx`:
  - Remove the `DIE_ICONS` and `DiceD10Icon` imports and usages from this file.
  - Render each die (pool and percentile) as a single numeric chip: value as the
    dominant element, small `d{sides}` / `d%` tag, consistent sizing.
  - Delete the `Icon` vs `fallback-die` branching — one render path for all sizes.
  - Keep `built.breakdown.slice(0, DICE_ANIM_CAP)`, the `+N more` note, and the
    total line exactly as they are.
- Update `openspec/specs/global-dice-fab/spec.md` — MODIFIED requirement +
  scenarios for the numeric readout.
- Update unit tests: `tests/unit/components/DiceRollOverlay.test.tsx` (and any
  sibling) — remove assertions that a die-face `<svg>` renders in the modal; add
  assertions for the numeric value + `d{sides}` tag per die and for the retained
  `+N more`.
- Update `tests/e2e/dice-roll-animation.spec.ts` only if it locates result-modal
  dice via an icon selector; the per-die *value* assertions stay.

### Out of Scope

- Any change to roll generation, RNG, rejection sampling, persistence,
  `built.total` / `built.rolls` / `built.breakdown` / `percentileFaces`, or the
  roll-submission payload.
- Removing or altering `DIE_ICONS` / `lib/components/icons/dice.tsx`, `DieGlyph`,
  `DiePoolButton`, or the pool-builder / fab iconography.
- The 3D animation, the dice engine, `reconcileDiceFaces`, animation scaling, or
  the 15-die **animation** cap.
- The modal reveal gating, fallback timeout, focus management, escape /
  outside-click handling, or the `aria-live` result announcement.
- Per-face dice artwork, pip rendering, dice themes, or colour.
- Raising the readout display cap above 15 (requester chose to keep 15 + `+N more`).

## What Changes

- `lib/components/dice/DiceRollOverlay.tsx` — `StaticRollResult` rewritten to a
  numeric-chip readout; `DIE_ICONS` / `DiceD10Icon` imports dropped from this
  file. No other export in the file changes.
- `openspec/specs/global-dice-fab/spec.md` — MODIFIED "Rolling plays a dice
  animation then a total modal" requirement: the per-die readout is numeric-only
  with a size tag and no die-face graphic; percentile readout likewise.
- `tests/unit/components/DiceRollOverlay.test.tsx` — icon-in-modal assertions
  replaced with numeric-readout assertions.
- `tests/e2e/dice-roll-animation.spec.ts` — selector-only adjustment if it keys
  off an icon; value assertions unchanged.

## Risks

- Risk: A test elsewhere relies on `DIE_ICONS` rendering inside the result modal.
  - Impact: Red suite after the change.
  - Mitigation: Grep for `DIE_ICONS` / `die-face` / `fallback-die` /
    `DiceD10Icon` usage in `tests/` during Execution; update all hits. The
    `data-testid` hooks are preserved to minimise churn.
- Risk: Visual regression — the numeric chips look unstyled / cramped for large
  pools or on a 375px viewport.
  - Impact: Cosmetic regression in the shipped modal.
  - Mitigation: Reuse the existing wrapping flex container and `max-w-[80vw]`;
    `openwolf designqc` (or a manual check) at `15d6` and at 375px width during
    Validation.
- Risk: Screen-reader experience changes because the visual structure changes.
  - Impact: A11y regression.
  - Mitigation: The `sr-only` `aria-live` line (`"{formula} rolled {total}"`) is
    untouched and remains the primary assistive-tech announcement; the chips are
    supplementary visual detail. No `aria-hidden` removal needed.

## Open Questions

- No unresolved ambiguity remains. All questions raised during the explore
  session were resolved by the requester on 2026-08-31:
  - Interpretation is (B) — the icon art not depicting the rolled face is the
    defect.
  - Number-render **all** dice; **no** pip rendering for d6.
  - **Remove** the die-shape icon from the modal entirely (not a faint
    watermark).
  - **Keep** the 15-die display cap and `+N more` (do not uncap the readout).

## Non-Goals

- Making the pool-builder / fab `DieGlyph` icons display roll values — they are
  die-type indicators, not results.
- Introducing face-accurate dice artwork anywhere.
- Changing how or when the result modal is revealed.
- Changing the animation cap, dice count, or engine.
- Any server-side or persistence change.

## Change Control

If scope changes after proposal approval, update `proposal.md`, `design.md`,
`specs/**/*.md`, and `tasks.md` before implementation starts.
