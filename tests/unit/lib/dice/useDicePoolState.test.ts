import { renderHook, act } from '@testing-library/react'
import { createRef } from 'react'
import { rollDicePool } from '@/lib/utils/dice'
import { useDicePoolState } from '@/lib/dice/useDicePoolState'

jest.mock('@/lib/utils/dice', () => ({
  ...jest.requireActual('@/lib/utils/dice'),
  rollDicePool: jest.fn(),
}))

const mockedRollDicePool = rollDicePool as jest.Mock

function setup() {
  const triggerRef = createRef<HTMLButtonElement>()
  const panelRef = createRef<HTMLDivElement>()
  return renderHook(() => useDicePoolState({ triggerRef, panelRef }))
}

beforeEach(() => {
  jest.clearAllMocks()
})

describe('useDicePoolState — pool add/remove clamping', () => {
  it('adding a die increments its count', () => {
    const { result } = setup()
    act(() => result.current.handleAdd(6))
    expect(result.current.pool[6]).toBe(1)
  })

  it('cannot add a die past MAX_PER_DIE', () => {
    const { result } = setup()
    act(() => {
      for (let i = 0; i < 30; i++) result.current.handleAdd(20)
    })
    expect(result.current.pool[20]).toBeLessThanOrEqual(20)
    const maxed = result.current.pool[20]
    act(() => result.current.handleAdd(20))
    expect(result.current.pool[20]).toBe(maxed)
  })

  it('removing a die cannot go below zero', () => {
    const { result } = setup()
    act(() => result.current.handleRemove(10))
    expect(result.current.pool[10]).toBe(0)
  })

  it('poolTotal sums all staged dice', () => {
    const { result } = setup()
    act(() => {
      result.current.handleAdd(6)
      result.current.handleAdd(6)
      result.current.handleAdd(8)
    })
    expect(result.current.poolTotal).toBe(3)
  })
})

describe('useDicePoolState — modifier clamping', () => {
  it('modifier is clamped to MAX_MODIFIER via buildRoll formula', () => {
    mockedRollDicePool.mockReturnValue([{ sides: 20, value: 1 }])
    const { result } = setup()
    act(() => {
      result.current.handleAdd(20)
      result.current.setModifierText('99999')
    })
    const built = result.current.buildRoll()
    expect(built.total).toBeLessThanOrEqual(1 + 999)
  })
})

describe('useDicePoolState — buildPercentileRoll', () => {
  it("returns { formula: 'd%', rolls: [v], total: v } with v in 1..100 equal to total", () => {
    const { result } = setup()
    for (let i = 0; i < 50; i++) {
      const built = result.current.buildPercentileRoll()
      expect(built.formula).toBe('d%')
      expect(built.rolls).toHaveLength(1)
      const [v] = built.rolls
      expect(v).toBeGreaterThanOrEqual(1)
      expect(v).toBeLessThanOrEqual(100)
      expect(built.total).toBe(v)
    }
  })

  it('is independent of staged pool and modifier, issues no roll of the pool', () => {
    mockedRollDicePool.mockReturnValue([{ sides: 20, value: 1 }])
    const { result } = setup()
    act(() => {
      result.current.handleAdd(20)
      result.current.handleAdd(6)
      result.current.setModifierText('50')
    })
    const built = result.current.buildPercentileRoll()
    expect(built.rolls[0]).toBeLessThanOrEqual(100)
    expect(mockedRollDicePool).not.toHaveBeenCalled()
    // pool + modifier untouched
    expect(result.current.pool[20]).toBe(1)
    expect(result.current.modifierText).toBe('50')
  })
})

describe('useDicePoolState — open/close', () => {
  it('outside click closes the panel', () => {
    const { result } = setup()
    act(() => result.current.setIsOpen(true))
    expect(result.current.isOpen).toBe(true)
    act(() => document.dispatchEvent(new MouseEvent('mousedown', { bubbles: true })))
    expect(result.current.isOpen).toBe(false)
  })

  it('Escape closes the panel', () => {
    const { result } = setup()
    act(() => result.current.setIsOpen(true))
    act(() => document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' })))
    expect(result.current.isOpen).toBe(false)
  })
})

describe('useDicePoolState — buildRoll output', () => {
  it('produces a formula/rolls/total shape from the current pool', () => {
    mockedRollDicePool.mockReturnValue([{ sides: 6, value: 3 }, { sides: 6, value: 5 }])
    const { result } = setup()
    act(() => {
      result.current.handleAdd(6)
      result.current.handleAdd(6)
    })
    const built = result.current.buildRoll()
    expect(built.formula).toContain('2d6')
    expect(built.rolls).toEqual([3, 5])
    expect(built.total).toBe(8)
  })

  it('breakdown carries one {sides,value} per staged die with sizes matching the pool', () => {
    mockedRollDicePool.mockReturnValue([
      { sides: 20, value: 11 }, { sides: 20, value: 4 }, { sides: 6, value: 2 },
    ])
    const { result } = setup()
    act(() => {
      result.current.handleAdd(20)
      result.current.handleAdd(20)
      result.current.handleAdd(6)
      result.current.setModifierText('3')
    })
    const built = result.current.buildRoll()
    expect(built.breakdown).toEqual([
      { sides: 20, value: 11 }, { sides: 20, value: 4 }, { sides: 6, value: 2 },
    ])
    expect(built.breakdown.filter(d => d.sides === 20)).toHaveLength(2)
    expect(built.breakdown.filter(d => d.sides === 6)).toHaveLength(1)
  })

  it('breakdown values plus modifier sum to total; modifier field equals the clamped applied modifier', () => {
    mockedRollDicePool.mockReturnValue([{ sides: 20, value: 11 }, { sides: 6, value: 2 }])
    const { result } = setup()
    act(() => {
      result.current.handleAdd(20)
      result.current.handleAdd(6)
      result.current.setModifierText('3')
    })
    const built = result.current.buildRoll()
    expect(built.modifier).toBe(3)
    expect(built.breakdown.reduce((s, d) => s + d.value, 0) + built.modifier).toBe(built.total)
  })

  it('adding breakdown/modifier does not change formula/rolls/total shape', () => {
    mockedRollDicePool.mockReturnValue([{ sides: 6, value: 3 }, { sides: 6, value: 5 }])
    const { result } = setup()
    act(() => {
      result.current.handleAdd(6)
      result.current.handleAdd(6)
    })
    const built = result.current.buildRoll()
    expect(built.formula).toContain('2d6')
    expect(built.rolls).toEqual([3, 5])
    expect(built.total).toBe(8)
  })

  it('buildRoll issues no HTTP request', () => {
    const fetchSpy = jest.fn()
    const original = global.fetch
    global.fetch = fetchSpy as unknown as typeof fetch
    mockedRollDicePool.mockReturnValue([{ sides: 6, value: 3 }])
    const { result } = setup()
    act(() => result.current.handleAdd(6))
    result.current.buildRoll()
    expect(fetchSpy).not.toHaveBeenCalled()
    global.fetch = original
  })

  it('buildPercentileRoll returns percentileFaces that decode to total; rolls stays [value]', () => {
    const { result } = setup()
    for (let i = 0; i < 50; i++) {
      const built = result.current.buildPercentileRoll()
      expect(built.percentileFaces).toHaveLength(2)
      const [tens, ones] = built.percentileFaces!
      expect(tens).toBeGreaterThanOrEqual(1)
      expect(tens).toBeLessThanOrEqual(10)
      expect(ones).toBeGreaterThanOrEqual(1)
      expect(ones).toBeLessThanOrEqual(10)
      const decoded = ((tens % 10) * 10 + (ones % 10)) || 100
      expect(decoded).toBe(built.total)
      expect(built.rolls).toEqual([built.total])
      expect(built.breakdown).toEqual([])
      expect(built.modifier).toBe(0)
    }
  })

  it('reset clears the pool and modifier', () => {
    const { result } = setup()
    act(() => {
      result.current.handleAdd(6)
      result.current.setModifierText('5')
    })
    act(() => result.current.reset())
    expect(result.current.pool[6]).toBe(0)
    expect(result.current.modifierText).toBe('0')
  })
})
