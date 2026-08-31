import type { BuiltRoll } from '@/lib/dice/useDicePoolState'
import { toDiceBoxNotation, DICE_ANIM_CAP, animatedDiceCount } from '@/lib/dice/toDiceBoxNotation'

function poolRoll(breakdown: { sides: number; value: number }[], modifier = 0): BuiltRoll {
  const rolls = breakdown.map(d => d.value)
  return {
    formula: 'test',
    rolls,
    total: rolls.reduce((s, v) => s + v, 0) + modifier,
    breakdown,
    modifier,
  }
}

const notations = (built: BuiltRoll) => toDiceBoxNotation(built).groups.map(g => g.notation)

describe('toDiceBoxNotation — single die types', () => {
  it.each([6, 8, 10, 12, 20])('d%i emits a forced @ notation with the exact value', (sides) => {
    const plan = toDiceBoxNotation(poolRoll([{ sides, value: 3 }]))
    expect(plan.groups).toEqual([
      { sides, values: [3], notation: `1d${sides}@3`, forced: true },
    ])
  })

  it('d4 emits plain notation (the engine cannot force a d4) and is marked not forced', () => {
    const plan = toDiceBoxNotation(poolRoll([{ sides: 4, value: 3 }]))
    expect(plan.groups).toEqual([
      { sides: 4, values: [3], notation: '1d4', forced: false },
    ])
  })
})

describe('toDiceBoxNotation — mixed pool + modifier', () => {
  it('emits one group per die size in first-seen order; groups are never "+"-joined', () => {
    const plan = toDiceBoxNotation(
      poolRoll([{ sides: 20, value: 14 }, { sides: 20, value: 2 }, { sides: 6, value: 5 }], 3),
    )
    expect(plan.groups).toEqual([
      { sides: 20, values: [14, 2], notation: '2d20@14,2', forced: true },
      { sides: 6, values: [5], notation: '1d6@5', forced: true },
    ])
    // the modifier is not a die
    expect(plan.groups.flatMap(g => g.values)).toHaveLength(3)
  })

  it('a d4 group in a mixed pool stays plain while the others are forced', () => {
    const plan = toDiceBoxNotation(
      poolRoll([{ sides: 4, value: 1 }, { sides: 4, value: 4 }, { sides: 20, value: 11 }]),
    )
    expect(plan.groups).toEqual([
      { sides: 4, values: [1, 4], notation: '2d4', forced: false },
      { sides: 20, values: [11], notation: '1d20@11', forced: true },
    ])
  })
})

describe('toDiceBoxNotation — percentile', () => {
  it('renders two d10 faces from percentileFaces as one forced group', () => {
    const built: BuiltRoll = {
      formula: 'd%', rolls: [42], total: 42, breakdown: [], modifier: 0, percentileFaces: [4, 2],
    }
    expect(toDiceBoxNotation(built).groups).toEqual([
      { sides: 10, values: [4, 2], notation: '2d10@4,2', forced: true },
    ])
  })

  it('renders "00" percentile as face 10,10', () => {
    const built: BuiltRoll = {
      formula: 'd%', rolls: [100], total: 100, breakdown: [], modifier: 0, percentileFaces: [10, 10],
    }
    expect(notations(built)).toEqual(['2d10@10,10'])
  })
})

function planDiceCount(built: BuiltRoll): number {
  return toDiceBoxNotation(built).groups.reduce((sum, g) => sum + g.values.length, 0)
}

describe('toDiceBoxNotation — visual cap', () => {
  it('DICE_ANIM_CAP is 15', () => {
    expect(DICE_ANIM_CAP).toBe(15)
  })

  it('a 120-die pool yields exactly DICE_ANIM_CAP dice; caller total untouched', () => {
    const built = poolRoll(Array.from({ length: 120 }, () => ({ sides: 6, value: 4 })))
    expect(planDiceCount(built)).toBe(15)
    expect(built.total).toBe(480)
  })

  it('a 15-die pool animates all 15 (boundary)', () => {
    expect(planDiceCount(poolRoll(Array.from({ length: 15 }, () => ({ sides: 6, value: 2 }))))).toBe(15)
  })

  it('a 6-die pool animates all 6 (below the cap)', () => {
    expect(planDiceCount(poolRoll(Array.from({ length: 6 }, () => ({ sides: 6, value: 2 }))))).toBe(6)
  })
})

describe('toDiceBoxNotation — purity', () => {
  it('is deterministic for a fixed BuiltRoll and uses no RNG', () => {
    const built = poolRoll([{ sides: 20, value: 7 }, { sides: 6, value: 3 }])
    expect(toDiceBoxNotation(built)).toEqual(toDiceBoxNotation(built))
    expect(toDiceBoxNotation.toString()).not.toMatch(/crypto|Math\.random/)
  })
})

describe('animatedDiceCount', () => {
  it('caps at DICE_ANIM_CAP for large pools', () => {
    expect(animatedDiceCount(poolRoll(Array.from({ length: 120 }, () => ({ sides: 6, value: 4 }))))).toBe(15)
  })

  it('returns the pool size below the cap', () => {
    expect(animatedDiceCount(poolRoll([{ sides: 20, value: 1 }, { sides: 6, value: 2 }]))).toBe(2)
  })

  it('is 2 for a percentile roll', () => {
    const built: BuiltRoll = { formula: 'd%', rolls: [42], total: 42, breakdown: [], modifier: 0, percentileFaces: [4, 2] }
    expect(animatedDiceCount(built)).toBe(2)
  })
})
