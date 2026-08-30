import type { BuiltRoll } from '@/lib/dice/useDicePoolState'

/**
 * Maximum number of dice animated regardless of pool size (design Decision 4 of
 * `improve-dice-roll-animation`). Fewer, larger dice read better and keep the settled
 * cluster inside the clear zone above the result modal. The total modal and inline result
 * always show the exact total for the whole pool; only the visual tumble is capped.
 */
export const DICE_ANIM_CAP = 15

/**
 * Die sizes `@drdreo/dice-box-threejs@1.1.0` can land on a forced `@` value. The d4 in
 * this engine ignores `@` notation (it rolls naturally, and with a high `iterationLimit`
 * can hang), so d4 groups are emitted as plain `Nd4` — a pool containing a d4 then
 * reconciles as a mismatch and reveals through the instant path (design Decision 1 spike,
 * resolved 2026-08-30).
 */
const FORCEABLE_SIDES = new Set([6, 8, 10, 12, 20])

export interface DiceGroupPlan {
  sides: number
  /** The predetermined face for each die in this group, in `breakdown` order. */
  values: number[]
  /** `@drdreo/dice-box-threejs` notation for this group (`"3d6@1,4,6"`, or `"2d4"` for d4). */
  notation: string
  /** False for d4 — the engine cannot force these faces, so a mismatch is expected. */
  forced: boolean
}

export interface DiceRollPlan {
  /**
   * One entry per die-size group, in first-seen order. The animation drives the first
   * group with `box.roll()` and each remaining group with `box.add()` — the engine hangs
   * on a single `"2d20@…+1d6@…"` string, so groups are never `+`-joined (spike finding).
   */
  groups: DiceGroupPlan[]
}

/**
 * Map a built roll to a {@link DiceRollPlan} for `@drdreo/dice-box-threejs`. Pure — no
 * library import, no randomness. The flat `modifier` never becomes a die. Percentile
 * renders as two physical d10s (`2d10@<tens>,<ones>`, faces 1..10 where 10 shows as `0`);
 * its decoded 1..100 value is unchanged elsewhere. Truncated to {@link DICE_ANIM_CAP}.
 */
export function toDiceBoxNotation(built: BuiltRoll): DiceRollPlan {
  if (built.percentileFaces) {
    const [tens, ones] = built.percentileFaces
    return {
      groups: [
        { sides: 10, values: [tens, ones], notation: `2d10@${tens},${ones}`, forced: true },
      ],
    }
  }

  const capped = built.breakdown.slice(0, DICE_ANIM_CAP)

  // Group dice by size, preserving first-seen order.
  const bySize: { sides: number; values: number[] }[] = []
  for (const { sides, value } of capped) {
    let group = bySize.find(g => g.sides === sides)
    if (!group) {
      group = { sides, values: [] }
      bySize.push(group)
    }
    group.values.push(value)
  }

  return {
    groups: bySize.map(({ sides, values }) => {
      const forced = FORCEABLE_SIDES.has(sides)
      const notation = forced
        ? `${values.length}d${sides}@${values.join(',')}`
        : `${values.length}d${sides}`
      return { sides, values, notation, forced }
    }),
  }
}

/**
 * The number of physical dice that will actually animate for `built`, after the
 * {@link DICE_ANIM_CAP} cap. Percentile always animates its two physical d10s. Used to pick
 * the down-scaling factor so the settled cluster fits the clear zone above the modal.
 */
export function animatedDiceCount(built: BuiltRoll): number {
  if (built.percentileFaces) return 2
  return Math.min(built.breakdown.length, DICE_ANIM_CAP)
}
