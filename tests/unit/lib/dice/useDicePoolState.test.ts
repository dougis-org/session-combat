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
