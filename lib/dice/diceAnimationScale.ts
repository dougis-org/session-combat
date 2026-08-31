/**
 * Dice sizing for the 3D roll animation.
 *
 * `DICE_BASE_SCALE` is passed to `@drdreo/dice-box-threejs` as its `baseScale` for pools of
 * six or fewer animated dice, so a die face reads clearly at a 375px viewport width. When
 * more than six dice animate, {@link diceAnimationScale} shrinks the dice progressively
 * (down to `DICE_MIN_SCALE`) so fifteen dice still settle inside the clear zone above the
 * result modal.
 *
 * Units are `@drdreo/dice-box-threejs` `baseScale` units (library default `100`), NOT the
 * `scale` units of the previously used `@3d-dice/dice-box`. The exact constants are
 * empirical — fixed by the Decision 4 / 6 visual-check task (`design.md`).
 *
 * Depends only on `DICE_ANIM_CAP` (a plain constant) so the curve stays unit-testable and
 * locked to the animated-dice cap.
 */
import { DICE_ANIM_CAP } from '@/lib/dice/toDiceBoxNotation'

export const DICE_BASE_SCALE = 100
export const DICE_MIN_SCALE = 60

/** Dice count at/below which no down-scaling is applied. */
const NO_SHRINK_THRESHOLD = 6
/** Dice count at which the curve reaches `DICE_MIN_SCALE` — the animated-dice cap. */
const FULL_SHRINK_COUNT = DICE_ANIM_CAP

/**
 * Map an animated dice count to the engine `baseScale`: `DICE_BASE_SCALE` for `count <= 6`,
 * then a monotonically non-increasing linear ramp down to `DICE_MIN_SCALE` at 15+ dice.
 * Non-positive counts are treated as one die.
 */
export function diceAnimationScale(count: number): number {
  if (count <= NO_SHRINK_THRESHOLD) return DICE_BASE_SCALE

  const clamped = Math.min(count, FULL_SHRINK_COUNT)
  const progress = (clamped - NO_SHRINK_THRESHOLD) / (FULL_SHRINK_COUNT - NO_SHRINK_THRESHOLD)
  return DICE_BASE_SCALE - progress * (DICE_BASE_SCALE - DICE_MIN_SCALE)
}
