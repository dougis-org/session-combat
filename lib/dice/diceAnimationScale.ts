/**
 * Dice sizing for the 3D roll animation (design Decision 1 & 4 of
 * `improve-dice-roll-animation`).
 *
 * `DICE_BASE_SCALE` is passed to `@3d-dice/dice-box` as its `scale` for pools of six or
 * fewer animated dice — well above the library default (`5`) so a die face reads on
 * roughly the same visual order as the result modal's total text. When more than six dice
 * animate, {@link diceAnimationScale} shrinks the dice progressively (down to
 * `DICE_MIN_SCALE`) so fifteen dice still settle inside the clear zone above the modal.
 *
 * Depends only on `DICE_ANIM_CAP` (a plain constant) so the curve stays unit-testable and
 * locked to the animated-dice cap.
 */
import { DICE_ANIM_CAP } from '@/lib/dice/toDiceBoxNotation'

export const DICE_BASE_SCALE = 12
export const DICE_MIN_SCALE = 6

/** Dice count at/below which no down-scaling is applied. */
const NO_SHRINK_THRESHOLD = 6
/** Dice count at which the curve reaches `DICE_MIN_SCALE` — the animated-dice cap. */
const FULL_SHRINK_COUNT = DICE_ANIM_CAP

/**
 * Map an animated dice count to the dice-box `scale`: `DICE_BASE_SCALE` for `count <= 6`,
 * then a monotonically non-increasing linear ramp down to `DICE_MIN_SCALE` at 15+ dice.
 * Non-positive counts are treated as one die.
 */
export function diceAnimationScale(count: number): number {
  if (count <= NO_SHRINK_THRESHOLD) return DICE_BASE_SCALE

  const clamped = Math.min(count, FULL_SHRINK_COUNT)
  const progress = (clamped - NO_SHRINK_THRESHOLD) / (FULL_SHRINK_COUNT - NO_SHRINK_THRESHOLD)
  return DICE_BASE_SCALE - progress * (DICE_BASE_SCALE - DICE_MIN_SCALE)
}
