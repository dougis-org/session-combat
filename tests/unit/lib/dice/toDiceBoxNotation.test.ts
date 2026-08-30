import type { BuiltRoll } from '@/lib/dice/useDicePoolState'
import { toDiceBoxNotation, DICE_ANIM_CAP } from '@/lib/dice/toDiceBoxNotation'

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

describe('toDiceBoxNotation — single die types', () => {
  it.each([4, 6, 8, 10, 12, 20])('d%i maps to predetermined notation with the exact value', (sides) => {
    const built = poolRoll([{ sides, value: 3 }])
    expect(toDiceBoxNotation(built)).toBe(`1d${sides}@3`)
  })
})

describe('toDiceBoxNotation — mixed pool + modifier', () => {
  it('covers all dice; the modifier does not become a die', () => {
    const built = poolRoll(
      [{ sides: 20, value: 14 }, { sides: 20, value: 2 }, { sides: 6, value: 5 }],
      3,
    )
    expect(toDiceBoxNotation(built)).toBe('2d20@14,2+1d6@5')
  })
})

describe('toDiceBoxNotation — percentile', () => {
  it('renders two d10 faces from percentileFaces', () => {
    const built: BuiltRoll = {
      formula: 'd%',
      rolls: [42],
      total: 42,
      breakdown: [],
      modifier: 0,
      percentileFaces: [4, 2],
    }
    expect(toDiceBoxNotation(built)).toBe('2d10@4,2')
  })

  it('renders "00" percentile as face 10,10', () => {
    const built: BuiltRoll = {
      formula: 'd%',
      rolls: [100],
      total: 100,
      breakdown: [],
      modifier: 0,
      percentileFaces: [10, 10],
    }
    expect(toDiceBoxNotation(built)).toBe('2d10@10,10')
  })
})

describe('toDiceBoxNotation — visual cap', () => {
  it('a 120-die pool yields at most DICE_ANIM_CAP dice; caller total untouched', () => {
    const breakdown = Array.from({ length: 120 }, () => ({ sides: 6, value: 4 }))
    const built = poolRoll(breakdown)
    const notation = toDiceBoxNotation(built)
    const diceCount = notation
      .split('+')
      .reduce((sum, part) => sum + part.split('@')[1].split(',').length, 0)
    expect(diceCount).toBeLessThanOrEqual(DICE_ANIM_CAP)
    expect(diceCount).toBe(30)
    expect(built.total).toBe(480)
  })
})
