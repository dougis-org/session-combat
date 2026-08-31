import {
  diceAnimationScale,
  DICE_BASE_SCALE,
  DICE_MIN_SCALE,
} from '@/lib/dice/diceAnimationScale'

describe('diceAnimationScale', () => {
  it('returns the base scale for a single die', () => {
    expect(diceAnimationScale(1)).toBe(DICE_BASE_SCALE)
  })

  it('returns the base scale at the 6-die threshold', () => {
    expect(diceAnimationScale(6)).toBe(DICE_BASE_SCALE)
  })

  it('shrinks below the base scale once more than 6 dice animate', () => {
    expect(diceAnimationScale(7)).toBeLessThan(DICE_BASE_SCALE)
  })

  it('shrinks further as the count grows', () => {
    expect(diceAnimationScale(10)).toBeLessThan(diceAnimationScale(7))
    expect(diceAnimationScale(10)).toBeLessThan(DICE_BASE_SCALE)
  })

  it('reaches but never drops below the minimum at the cap', () => {
    expect(diceAnimationScale(15)).toBeLessThanOrEqual(diceAnimationScale(10))
    expect(diceAnimationScale(15)).toBeGreaterThanOrEqual(DICE_MIN_SCALE)
    expect(diceAnimationScale(15)).toBe(DICE_MIN_SCALE)
  })

  it('is monotonically non-increasing across counts 1..15', () => {
    for (let n = 2; n <= 15; n++) {
      expect(diceAnimationScale(n)).toBeLessThanOrEqual(diceAnimationScale(n - 1))
    }
  })

  it('never returns below the minimum scale, even past the cap or for junk input', () => {
    for (const n of [0, -3, 16, 30, 200]) {
      expect(diceAnimationScale(n)).toBeGreaterThanOrEqual(DICE_MIN_SCALE)
    }
  })

  it('exposes a positive base scale in @drdreo/dice-box-threejs baseScale units', () => {
    expect(DICE_BASE_SCALE).toBeGreaterThan(0)
    expect(DICE_MIN_SCALE).toBeGreaterThan(0)
    expect(DICE_MIN_SCALE).toBeLessThan(DICE_BASE_SCALE)
  })
})
