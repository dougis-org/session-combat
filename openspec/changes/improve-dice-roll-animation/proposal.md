## GitHub Issues

- #596

## Why

- Problem statement: The 3D dice-roll animation shipped by `add-dice-roll-animation` is effectively unusable. The dice render at the library default `scale` inside a full-viewport canvas, so the tumbling dice are tiny and settle in the **top-left corner** of the screen — most users never see them. The total-result modal also renders immediately, on top of (and drawing attention away from) the animation that is supposed to precede it.
- Why now: The feature is live in `GlobalDiceFab` but delivers no value in its current form; players report not seeing any dice. Issue #596 asks for concrete, bounded fixes.
- Business/user impact: Players get a legible, centered dice animation that visibly leads into the result modal, making shared rolls feel tactile and trustworthy instead of instantaneous and opaque.

## Problem Space

- Current behavior:
  - `lib/dice/useDiceAnimation.ts` constructs `@3d-dice/dice-box` with only `container`, `assetPath`, and `theme` — no `scale`, so the library default (`scale: 5`) applies against a `absolute inset-0` full-viewport canvas, producing dice a few pixels across.
  - Dice settle in the top-left of the canvas, not centered.
  - `lib/components/dice/DiceRollOverlay.tsx` renders the result modal unconditionally, concurrently with the canvas. `GlobalDiceFab.runAnimation` calls `void animation.run(...)` and never awaits settle, so nothing gates the modal on the animation finishing.
  - `lib/dice/toDiceBoxNotation.ts` caps the animated subset at `DICE_ANIM_CAP = 30` dice.
- Desired behavior:
  - Dice faces render at roughly the size of the modal's total text (`text-5xl`, ~48px) — an increase on the order of 500% over today.
  - The animation is horizontally centered and the dice come to rest in the **clear space just above the result modal**, so the user can see both the dice and the total that came from them at the same time.
  - The result modal stays hidden until the tumble completes (or is skipped), then appears below the settled dice.
  - The animated subset is capped at **15 dice** (down from 30). When **more than 6 dice** are rolled, the dice scale **down** progressively so the settled cluster still fits the clear zone above the modal.
- Constraints:
  - Roll outcomes are already decided before animation (decisions n061, "predetermine dice outcomes"); this change is purely presentational and MUST NOT introduce randomness, network calls, or alter `built.total` / `built.rolls`.
  - Must preserve the instant/unsupported fallback path (decision "separate persistent dice-engine failures from transient per-roll failures"): no WebGL, failed asset load, or `disableAnimation` preference => modal shows immediately with no tumble.
  - Must preserve reduced-motion default handling (decision "use reduced-motion as the default") — no change to how `disableAnimation` resolves.
  - Overlay dismissal semantics (Escape / outside-click close the overlay only, capture-phase, `stopPropagation`) from `add-dice-roll-animation` must be retained.
  - `@3d-dice/dice-box` is pinned at `^1.1.4`; only its documented config (`scale`, `onRollComplete`, `settleTimeout`, `container`) and the promise returned by `roll()` may be relied on.
- Assumptions:
  - `box.roll(notation)` resolves when the dice settle; `onRollComplete` fires at the same point. Either is an acceptable "animation complete" signal.
  - dice-box scatters dice across the floor of its container; constraining the canvas container's size and position is the practical way to control where they land. A smaller canvas also makes a given `scale` look larger.
  - A fixed `scale` plus a bounded, centered canvas container above the modal is sufficient to satisfy "just above the modal" without per-frame camera work.
- Edge cases considered:
  - 1 die (and percentile = 2 physical d10s): must still be large and centered, not lost.
  - Exactly 6 dice: no down-scaling yet (threshold is "more than 6").
  - 7–15 dice: progressive down-scaling.
  - More than 15 dice (e.g. `120d6`): only 15 animate; modal + inline result still show the exact total for the full pool.
  - Animation never signals completion (WebGL context lost mid-roll): a fallback timeout reveals the modal so the user is never stranded.
  - New roll while an overlay is open: existing single-overlay teardown must still yield exactly one overlay, and the modal-gating state must reset for the new roll.
  - Very short/though narrow viewports (mobile): the clear zone above the modal may be small; down-scaling and the 15-cap are the mitigations, plus the canvas container is sized relative to the viewport.

## Scope

### In Scope

- `lib/dice/useDiceAnimation.ts`: pass a `scale` (and any needed physics/`settleTimeout` config) to `DiceBox`; surface an animation-complete signal (resolve `run()` only on settle, or expose `onRollComplete`); compute a scale factor from the animated die count (down-scale when count > 6).
- `lib/components/dice/DiceRollOverlay.tsx`: bound and center the dice canvas container above the modal; hold the result modal hidden until an `animationComplete` (or `disableAnimation` / `unsupported`) signal; add a safety timeout fallback.
- `lib/components/GlobalDiceFab.tsx`: await / react to the animation-complete signal; pass the completion state to the overlay; reset gating state per roll.
- `lib/dice/toDiceBoxNotation.ts`: lower `DICE_ANIM_CAP` from 30 to 15.
- `openspec/specs/global-dice-fab/spec.md`: MODIFY the "Rolling plays a dice animation then a total modal" requirement (explicit modal gating, 15-die cap, size/placement, down-scaling).
- Unit tests: `tests/unit/components/DiceRollOverlay.test.tsx`, `tests/unit/components/GlobalDiceFab.test.tsx`, `tests/unit/lib/dice/useDiceAnimation.test.ts`, and a test for `toDiceBoxNotation` cap.

### Out of Scope

- The dice-in-chat rendering path (`lib/components/CampaignChat/*`) and any SSE roll-ingestion behavior.
- Roll generation, bounds, or randomness (`lib/utils/dice.ts`, `lib/dice/useDicePoolState.ts`).
- The "send to session chat" / shared-roll submission flow.
- Adding new dice themes, colors, sounds, or camera choreography beyond size/centering/landing position.
- Changing how the `disableAnimation` preference is resolved or persisted.
- E2E/Playwright coverage of the 3D canvas (WebGL is not reliably available in CI; unit-level seams are used instead).

## What Changes

- Dice render ~500% larger via an explicit dice-box `scale` plus a bounded canvas container; target size ≈ the modal total's `text-5xl`.
- The dice canvas becomes a centered, bounded region occupying the clear space above the result modal instead of `absolute inset-0`.
- The result modal is gated: hidden until the animation reports completion, or shown immediately on the `disableAnimation` / WebGL-unsupported / instant paths.
- A safety timeout guarantees the modal appears even if the animation never signals completion.
- The animated-dice cap drops from 30 to 15.
- When more than 6 dice animate, `scale` is reduced progressively with the die count.
- The `global-dice-fab` spec's animation requirement is updated to make gating, the 15-cap, sizing, centering, and down-scaling normative.

## Risks

- Risk: dice-box `scale` + bounded container tuning is empirical; the "≈ modal font size" target may need iteration and could differ across viewport sizes.
  - Impact: Dice look too big (clip the clear zone / overlap the modal) or still too small.
  - Mitigation: Derive the canvas container size from viewport units, keep `scale` a single named constant with the down-scaling curve as a pure function, and cover the curve with unit tests; visually verify at desktop and mobile breakpoints during implementation.
- Risk: `box.roll()` promise or `onRollComplete` may not fire reliably in all failure modes (context loss, tab backgrounded).
  - Impact: Modal never appears — worse than today.
  - Mitigation: Mandatory fallback timeout in the overlay (independent of dice-box `settleTimeout`); on timeout, reveal the modal and tear down the box.
- Risk: 15 large dice in a constrained zone pile up, clip, or rest on the modal edge.
  - Impact: Visual mess; dice obscure the total.
  - Mitigation: The >6 down-scaling curve is sized so 15 dice fit; the canvas container's floor sits a margin above the modal; validate with `15d6` and `120d6` (capped) during implementation.
- Risk: Regression in the existing instant/unsupported fallback or overlay-dismissal behavior.
  - Impact: Users with no WebGL see a broken overlay, or Escape closes the whole panel.
  - Mitigation: Keep existing tests green; add explicit tests that the modal shows immediately when `disableAnimation` is true and when `status === 'unsupported'`.
- Risk: Delaying the modal delays focus moving into `role="dialog"` for keyboard/screen-reader users.
  - Impact: Momentary focus limbo during the tumble.
  - Mitigation: The inline `formula → [rolls] = total` line in the panel already renders immediately for non-visual feedback; focus moves into the modal when it appears (unchanged from today, just later). Document this trade-off in design.md.

## Open Questions

- No unresolved ambiguity. The explore session for issue #596 resolved the open questions:
  - Dice currently land top-left (not bottom) — confirmed by requester.
  - Modal-gating ("hidden until animation completes") is a missed original requirement, not new scope — confirmed.
  - Dice land in the clear space **just above** the modal so both are visible together — confirmed.
  - Cap the animated subset at **15** dice; scale **down** for more than **6** dice — confirmed.

## Non-Goals

- Making the 3D animation deterministic across clients frame-for-frame (only the outcome is authoritative; the tumble is cosmetic).
- Supporting animation when WebGL/assets are unavailable (instant path remains the fallback).
- Redesigning the dice panel, the FAB, or the result modal's visual style beyond what centering/gating requires.
- Animating more than 15 dice or reflecting per-die values for the un-animated remainder.

## Change Control

If scope changes after proposal approval, update `openspec/changes/improve-dice-roll-animation/proposal.md`,
`openspec/changes/improve-dice-roll-animation/design.md`,
`openspec/changes/improve-dice-roll-animation/specs/**/*.md`, and
`openspec/changes/improve-dice-roll-animation/tasks.md` before implementation starts.
