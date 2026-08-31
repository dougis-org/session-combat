import type { DiceGroupPlan } from '@/lib/dice/toDiceBoxNotation'

/** A single settled die as reported by `@drdreo/dice-box-threejs` (`DiceResult`). */
export interface SettledDie {
  sides: number
  value: number
}

/** d10 reports a `0` landing as face `10`, but normalize either way before comparing. */
function normalize(sides: number, value: number): number {
  return sides === 10 && value === 0 ? 10 : value
}

function multisetEqual(a: number[], b: number[]): boolean {
  if (a.length !== b.length) return false
  const counts = new Map<number, number>()
  for (const v of a) counts.set(v, (counts.get(v) ?? 0) + 1)
  for (const v of b) {
    const n = counts.get(v)
    if (!n) return false
    counts.set(v, n - 1)
  }
  return true
}

/**
 * Compare the faces the dice engine settled on against the predetermined per-die values.
 *
 * `plan` is the per-die-size groups from `toDiceBoxNotation`; `settled` is the flattened
 * dice the engine reported. The comparison is per die-size group as an unordered multiset
 * over the first `plan[i].values.length` settled dice of that size, so neither a different
 * ordering nor an extra cocked-die result the engine may return is a false mismatch. d10
 * `0`/`10` faces are normalized first.
 *
 * Every die size is compared the same way — d4 included (the vendored engine patch,
 * `restore-d4-forced-face-support` / #627, restored d4 `@` forcing, so `toDiceBoxNotation`
 * marks d4 groups `forced: true` like every other size). If that patch is ever absent the
 * d4 group simply mismatches here and the roll reveals through the instant path — no code
 * path special-cases `sides === 4`.
 *
 * Pure; no library import. Returns `true` when every group matches.
 */
export function reconcileDiceFaces(plan: DiceGroupPlan[], settled: SettledDie[]): boolean {
  const bySize = new Map<number, number[]>()
  for (const die of settled) {
    const list = bySize.get(die.sides) ?? []
    list.push(normalize(die.sides, die.value))
    bySize.set(die.sides, list)
  }

  for (const group of plan) {
    const settledForSize = bySize.get(group.sides) ?? []
    const expected = group.values.map(v => normalize(group.sides, v))
    if (!multisetEqual(expected, settledForSize.slice(0, expected.length))) return false
  }
  return true
}
