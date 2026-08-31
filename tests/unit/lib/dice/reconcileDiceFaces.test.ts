import { reconcileDiceFaces, type SettledDie } from '@/lib/dice/reconcileDiceFaces'
import type { DiceGroupPlan } from '@/lib/dice/toDiceBoxNotation'

const group = (sides: number, values: number[], forced = true): DiceGroupPlan => ({
  sides, values, forced,
  notation: forced ? `${values.length}d${sides}@${values.join(',')}` : `${values.length}d${sides}`,
})

const die = (sides: number, value: number): SettledDie => ({ sides, value })

describe('reconcileDiceFaces', () => {
  it('matches identical single-group faces', () => {
    expect(reconcileDiceFaces([group(12, [4, 3])], [die(12, 4), die(12, 3)])).toBe(true)
  })

  it('flags a mismatched value', () => {
    expect(reconcileDiceFaces([group(12, [4, 3])], [die(12, 7), die(12, 3)])).toBe(false)
  })

  it('matches regardless of order (multiset, per die-size group)', () => {
    const plan = [group(20, [14, 2]), group(6, [5])]
    const settled = [die(6, 5), die(20, 2), die(20, 14)]
    expect(reconcileDiceFaces(plan, settled)).toBe(true)
  })

  it('normalizes d10 0 and 10 as equal', () => {
    expect(reconcileDiceFaces([group(10, [10, 10])], [die(10, 0), die(10, 0)])).toBe(true)
    expect(reconcileDiceFaces([group(10, [7, 4])], [die(10, 7), die(10, 4)])).toBe(true)
  })

  it('ignores an extra cocked-die result beyond the expected count for a group', () => {
    const plan = [group(6, Array.from({ length: 15 }, (_, i) => (i % 6) + 1))]
    const settled = [
      ...plan[0].values.map(v => die(6, v)),
      die(6, 6), // one extra
    ]
    expect(reconcileDiceFaces(plan, settled)).toBe(true)
  })

  it('flags a group the engine did not roll at all', () => {
    expect(reconcileDiceFaces([group(8, [5])], [])).toBe(false)
  })

  it('a forced d4 group is compared exactly like every other size (#627)', () => {
    // Patch present: the engine lands the decided faces → match.
    expect(reconcileDiceFaces([group(4, [1, 2, 4])], [die(4, 4), die(4, 1), die(4, 2)])).toBe(true)
    // Patch absent: the engine rolls d4 naturally → mismatch → instant reveal.
    expect(reconcileDiceFaces([group(4, [2, 4])], [die(4, 1), die(4, 4)])).toBe(false)
  })

  it('a mixed d4 + d6 pool reconciles per group', () => {
    const plan = [group(4, [1, 4]), group(6, [2, 3, 6])]
    expect(reconcileDiceFaces(plan, [die(6, 6), die(4, 4), die(6, 2), die(4, 1), die(6, 3)])).toBe(true)
    expect(reconcileDiceFaces(plan, [die(4, 4), die(4, 1), die(6, 2), die(6, 3), die(6, 5)])).toBe(false)
  })
})
