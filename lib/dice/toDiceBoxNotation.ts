import type { BuiltRoll } from '@/lib/dice/useDicePoolState'

/**
 * Maximum number of dice animated regardless of pool size (design Decision 6). The total
 * modal and inline result always show the exact total for the whole pool; only the visual
 * tumble is capped.
 */
export const DICE_ANIM_CAP = 30

/**
 * Map a built roll to `@3d-dice/dice-box` **predetermined** notation
 * (`"<count>d<sides>@<v1>,<v2>,…"`, groups joined with `+`), so the physics settles on the
 * faces already chosen by `rollDicePool` / `rollPercentile`. Pure — no library import, no
 * randomness. The flat `modifier` never becomes a die. Percentile renders as two physical
 * d10s (`2d10@<tens>,<ones>`); its decoded 1..100 value is unchanged elsewhere.
 */
export function toDiceBoxNotation(built: BuiltRoll): string {
  if (built.percentileFaces) {
    const [tens, ones] = built.percentileFaces
    return `2d10@${tens},${ones}`
  }

  const capped = built.breakdown.slice(0, DICE_ANIM_CAP)

  // Group consecutive-or-not dice by size, preserving first-seen order.
  const groups: { sides: number; values: number[] }[] = []
  for (const { sides, value } of capped) {
    let group = groups.find(g => g.sides === sides)
    if (!group) {
      group = { sides, values: [] }
      groups.push(group)
    }
    group.values.push(value)
  }

  return groups
    .map(g => `${g.values.length}d${g.sides}@${g.values.join(',')}`)
    .join('+')
}
