import { renderHook, act } from '@testing-library/react'
import type { BuiltRoll } from '@/lib/dice/useDicePoolState'
import { useDiceAnimation } from '@/lib/dice/useDiceAnimation'
import { DICE_BASE_SCALE, diceAnimationScale } from '@/lib/dice/diceAnimationScale'

// --- engine mock -----------------------------------------------------------
// A stateful stand-in for @drdreo/dice-box-threejs: roll()/add() parse the "@"
// notation and accumulate settled dice; getDiceResults() returns the running set.
// By default every die settles on its forced value so reconciliation passes.

const initMock = jest.fn().mockResolvedValue(undefined)
const clearMock = jest.fn()
const ctorMock = jest.fn()
const rollMock = jest.fn()
const addMock = jest.fn()

interface FakeDie { sides: number; value: number }
let accumulated: FakeDie[] = []
/** Override the faces a given notation settles on (for mismatch tests). */
let faceOverride: ((notation: string, forced: FakeDie[]) => FakeDie[]) | null = null
/** When set, roll() returns this promise instead of settling (for hang / supersede tests). */
let rollOverride: (() => Promise<unknown>) | null = null

function parseNotation(notation: string): FakeDie[] {
  const [head, tail] = notation.split('@')
  const m = head.match(/^(\d+)d(\d+)$/)!
  const [, qtyStr, sidesStr] = m
  const sides = Number(sidesStr)
  const qty = Number(qtyStr)
  if (tail) return tail.split(',').map(v => ({ sides, value: Number(v) }))
  // no "@": plain roll — deterministic filler so tests are stable (never the forced value)
  return Array.from({ length: qty }, () => ({ sides, value: sides }))
}

function toResults(dice: FakeDie[]) {
  const bySize = new Map<number, FakeDie[]>()
  for (const d of dice) bySize.set(d.sides, [...(bySize.get(d.sides) ?? []), d])
  return {
    notation: '',
    modifier: 0,
    total: dice.reduce((s, d) => s + d.value, 0),
    sets: [...bySize.entries()].map(([sides, rolls]) => ({
      num: rolls.length, type: `d${sides}`, sides, total: rolls.reduce((s, d) => s + d.value, 0),
      rolls: rolls.map((d, id) => ({ type: `d${sides}`, sides, id, value: d.value, reason: 'forced' })),
    })),
  }
}

jest.mock('@drdreo/dice-box-threejs', () => ({
  __esModule: true,
  default: class {
    constructor(...args: unknown[]) { ctorMock(...args) }
    initialize = initMock
    clearDice = clearMock
    roll = (notation: string) => {
      rollMock(notation)
      if (rollOverride) return rollOverride()
      accumulated = []
      const forced = parseNotation(notation)
      accumulated.push(...(faceOverride ? faceOverride(notation, forced) : forced))
      return Promise.resolve(toResults(accumulated))
    }
    add = (notation: string) => {
      addMock(notation)
      const forced = parseNotation(notation)
      const settled = faceOverride ? faceOverride(notation, forced) : forced
      accumulated.push(...settled)
      return Promise.resolve(settled)
    }
    getDiceResults = () => toResults(accumulated)
  },
}))

const built: BuiltRoll = {
  formula: '2d6', rolls: [3, 4], total: 7,
  breakdown: [{ sides: 6, value: 3 }, { sides: 6, value: 4 }], modifier: 0,
}

function poolBuilt(n: number, sides = 6): BuiltRoll {
  const breakdown = Array.from({ length: n }, () => ({ sides, value: 3 }))
  return { formula: `${n}d${sides}`, rolls: breakdown.map(d => d.value), total: n * 3, breakdown, modifier: 0 }
}

function stubWebGL(available: boolean) {
  const original = HTMLCanvasElement.prototype.getContext
  jest
    .spyOn(HTMLCanvasElement.prototype, 'getContext')
    .mockImplementation(function (this: HTMLCanvasElement, type: string, ...rest: unknown[]) {
      if (type === 'webgl' || type === 'experimental-webgl') {
        return available ? ({} as unknown as RenderingContext) : null
      }
      return (original as (...a: unknown[]) => unknown).call(this, type, ...rest) as RenderingContext | null
    })
}

let warnSpy: jest.SpyInstance

beforeEach(() => {
  jest.clearAllMocks()
  accumulated = []
  faceOverride = null
  rollOverride = null
  initMock.mockResolvedValue(undefined)
  warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {})
})

afterEach(() => {
  warnSpy.mockRestore()
  jest.restoreAllMocks()
})

describe('useDiceAnimation — degradation (persistent)', () => {
  it('WebGL unavailable → run() resolves false, status unsupported, logs once', async () => {
    stubWebGL(false)
    const container = document.createElement('div')
    const { result } = renderHook(() => useDiceAnimation())

    let outcome: boolean | undefined
    await act(async () => { outcome = await result.current.run(built, container) })

    expect(outcome).toBe(false)
    expect(result.current.status).toBe('unsupported')
    expect(ctorMock).not.toHaveBeenCalled()
    expect(warnSpy).toHaveBeenCalledTimes(1)

    await act(async () => { await result.current.run(built, container) })
    expect(warnSpy).toHaveBeenCalledTimes(1)
  })

  it('initialize() rejection → instant resolve false, single log, status unsupported, roll not attempted', async () => {
    stubWebGL(true)
    initMock.mockRejectedValueOnce(new Error('asset load failed'))
    const container = document.createElement('div')
    const { result } = renderHook(() => useDiceAnimation())

    await act(async () => { await result.current.run(built, container) })

    expect(result.current.status).toBe('unsupported')
    expect(warnSpy).toHaveBeenCalledTimes(1)
    expect(rollMock).not.toHaveBeenCalled()
  })

  it("a stale run's init failure does not latch the hook or disturb the newer run", async () => {
    stubWebGL(true)
    let rejectFirstInit!: (e: unknown) => void
    initMock
      .mockImplementationOnce(() => new Promise((_res, rej) => { rejectFirstInit = rej }))
      .mockResolvedValueOnce(undefined)
    const container = document.createElement('div')
    const { result } = renderHook(() => useDiceAnimation())

    await act(async () => {
      const stale = result.current.run(built, container)
      await new Promise(r => setTimeout(r, 0))
      await result.current.run(built, container)
      rejectFirstInit(new Error('slow asset load, too late'))
      await stale
    })

    expect(result.current.status).toBe('idle')
    expect(warnSpy).not.toHaveBeenCalled()
  })
})

describe('useDiceAnimation — lazy import', () => {
  it('the engine constructor is never invoked until run() is called', () => {
    stubWebGL(true)
    renderHook(() => useDiceAnimation())
    expect(ctorMock).not.toHaveBeenCalled()
  })

  it('useDiceAnimation.ts imports the engine dynamically, not at module top level', () => {
    const fs = require('fs') as typeof import('fs')
    const path = require('path') as typeof import('path')
    const src = fs.readFileSync(path.resolve(__dirname, '../../../../lib/dice/useDiceAnimation.ts'), 'utf8')
    // a value (non-type) top-level import would put the engine in the initial bundle
    expect(src).not.toMatch(/^import (?!type )[^\n]*['"]@drdreo\/dice-box-threejs['"]/m)
    expect(src).toMatch(/import\(\s*['"]@drdreo\/dice-box-threejs['"]\s*\)/)
  })
})

describe('useDiceAnimation — settle + reconciliation', () => {
  it('passes the per-group forced notation to roll(); resolves true; status stays idle; no warn', async () => {
    stubWebGL(true)
    const container = document.createElement('div')
    const { result } = renderHook(() => useDiceAnimation())

    let outcome: boolean | undefined
    await act(async () => { outcome = await result.current.run(built, container) })

    expect(rollMock).toHaveBeenCalledWith('2d6@3,4')
    expect(outcome).toBe(true)
    expect(result.current.status).toBe('idle')
    expect(warnSpy).not.toHaveBeenCalled()
  })

  it('drives a mixed pool with roll() then add() per die size', async () => {
    stubWebGL(true)
    const mixed: BuiltRoll = {
      formula: '2d20+1d6', rolls: [14, 2, 5], total: 21,
      breakdown: [{ sides: 20, value: 14 }, { sides: 20, value: 2 }, { sides: 6, value: 5 }], modifier: 0,
    }
    const container = document.createElement('div')
    const { result } = renderHook(() => useDiceAnimation())
    await act(async () => { await result.current.run(mixed, container) })

    expect(rollMock).toHaveBeenCalledWith('2d20@14,2')
    expect(addMock).toHaveBeenCalledWith('1d6@5')
  })

  it('a face mismatch resolves true, keeps status idle, and warns exactly once (distinct message)', async () => {
    stubWebGL(true)
    faceOverride = (_n, forced) => forced.map((d, i) => (i === 0 ? { ...d, value: d.value + 1 } : d))
    const errSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
    const container = document.createElement('div')
    const { result } = renderHook(() => useDiceAnimation())

    let outcome: boolean | undefined
    await act(async () => { outcome = await result.current.run(built, container) })

    expect(outcome).toBe(true)
    expect(result.current.status).toBe('idle')
    expect(clearMock).toHaveBeenCalled()
    expect(errSpy).not.toHaveBeenCalled()
    expect(warnSpy).toHaveBeenCalledTimes(1)
    expect(warnSpy.mock.calls[0][0]).toMatch(/did not match/i)
    errSpy.mockRestore()
  })

  it('a d4 pool always mismatches (engine cannot force d4) → reveal without tumble, no @ notation sent', async () => {
    stubWebGL(true)
    // plain "2d4" → mock returns value=sides=4 for both, expected [1,2] → mismatch
    const d4roll: BuiltRoll = {
      formula: '2d4', rolls: [1, 2], total: 3,
      breakdown: [{ sides: 4, value: 1 }, { sides: 4, value: 2 }], modifier: 0,
    }
    const container = document.createElement('div')
    const { result } = renderHook(() => useDiceAnimation())
    let outcome: boolean | undefined
    await act(async () => { outcome = await result.current.run(d4roll, container) })

    expect(rollMock).toHaveBeenCalledWith('2d4')
    expect(outcome).toBe(true)
    expect(result.current.status).toBe('idle')
  })

  it('a second mismatch in the same mount does not warn again', async () => {
    stubWebGL(true)
    faceOverride = (_n, forced) => forced.map(d => ({ ...d, value: d.value + 1 }))
    const container = document.createElement('div')
    const { result } = renderHook(() => useDiceAnimation())
    await act(async () => { await result.current.run(built, container) })
    await act(async () => { await result.current.run(built, container) })
    expect(warnSpy).toHaveBeenCalledTimes(1)
  })

  it('after a mismatch, a later run() still attempts the engine', async () => {
    stubWebGL(true)
    faceOverride = (_n, forced) => forced.map(d => ({ ...d, value: d.value + 1 }))
    const container = document.createElement('div')
    const { result } = renderHook(() => useDiceAnimation())
    await act(async () => { await result.current.run(built, container) })
    faceOverride = null
    await act(async () => { await result.current.run(built, container) })
    expect(ctorMock).toHaveBeenCalledTimes(2)
  })

  it('reordered engine results still reconcile as a match', async () => {
    stubWebGL(true)
    faceOverride = (_n, forced) => [...forced].reverse()
    const container = document.createElement('div')
    const { result } = renderHook(() => useDiceAnimation())
    await act(async () => { await result.current.run(built, container) })
    expect(warnSpy).not.toHaveBeenCalled()
  })

  it('percentile 0/10 faces reconcile after normalization', async () => {
    stubWebGL(true)
    const pct: BuiltRoll = {
      formula: 'd%', rolls: [100], total: 100, breakdown: [], modifier: 0, percentileFaces: [10, 10],
    }
    faceOverride = () => [{ sides: 10, value: 0 }, { sides: 10, value: 0 }]
    const container = document.createElement('div')
    const { result } = renderHook(() => useDiceAnimation())
    await act(async () => { await result.current.run(pct, container) })
    expect(rollMock).toHaveBeenCalledWith('2d10@10,10')
    expect(warnSpy).not.toHaveBeenCalled()
  })

  it('reconciliation issues no fetch', async () => {
    stubWebGL(true)
    const fetchSpy = jest.fn(() => { throw new Error('no network from the reconciliation path') })
    const prev = (global as { fetch?: unknown }).fetch
    ;(global as { fetch?: unknown }).fetch = fetchSpy
    try {
      const container = document.createElement('div')
      const { result } = renderHook(() => useDiceAnimation())
      await act(async () => { await result.current.run(built, container) })
      expect(fetchSpy).not.toHaveBeenCalled()
    } finally {
      ;(global as { fetch?: unknown }).fetch = prev
    }
  })
})

describe('useDiceAnimation — single-instance invariant', () => {
  it('a second run() clears the first box before constructing a new one', async () => {
    stubWebGL(true)
    const container = document.createElement('div')
    const { result } = renderHook(() => useDiceAnimation())
    await act(async () => { await result.current.run(built, container) })
    expect(ctorMock).toHaveBeenCalledTimes(1)
    await act(async () => { await result.current.run(built, container) })
    expect(clearMock).toHaveBeenCalled()
    expect(ctorMock).toHaveBeenCalledTimes(2)
  })

  it('run() resolves false for a run superseded mid-tumble', async () => {
    stubWebGL(true)
    let resolveFirst: ((v: unknown) => void) | undefined
    rollOverride = () => new Promise(res => { resolveFirst = res })
    const container = document.createElement('div')
    const { result } = renderHook(() => useDiceAnimation())

    let firstOutcome: boolean | undefined
    let firstPromise!: Promise<boolean>
    await act(async () => {
      firstPromise = result.current.run(built, container)
      firstPromise.then(v => { firstOutcome = v })
      await new Promise(r => setTimeout(r, 0))
      rollOverride = null
      await result.current.run(built, container)
      resolveFirst!(undefined)
      await firstPromise
    })
    expect(firstOutcome).toBe(false)
  })
})

describe('useDiceAnimation — scale', () => {
  it('constructs the engine with the base baseScale for a 6-die roll', async () => {
    stubWebGL(true)
    const container = document.createElement('div')
    const { result } = renderHook(() => useDiceAnimation())
    await act(async () => { await result.current.run(poolBuilt(6), container) })
    expect(ctorMock.mock.calls[0][1].baseScale).toBe(DICE_BASE_SCALE)
    expect(ctorMock.mock.calls[0][1].sounds).toBe(false)
  })

  it('constructs the engine with a reduced baseScale for >6 dice, capped at 15', async () => {
    stubWebGL(true)
    const container = document.createElement('div')
    const { result } = renderHook(() => useDiceAnimation())
    await act(async () => { await result.current.run(poolBuilt(12), container) })
    expect(ctorMock.mock.calls[0][1].baseScale).toBe(diceAnimationScale(12))
    expect(ctorMock.mock.calls[0][1].baseScale).toBeLessThan(DICE_BASE_SCALE)

    jest.clearAllMocks()
    accumulated = []
    await act(async () => { await result.current.run(poolBuilt(120), container) })
    expect(ctorMock.mock.calls[0][1].baseScale).toBe(diceAnimationScale(15))
  })

  it('constructs the engine with the container element and a config object (2 args)', async () => {
    stubWebGL(true)
    const container = document.createElement('div')
    const { result } = renderHook(() => useDiceAnimation())
    await act(async () => { await result.current.run(built, container) })
    const call = ctorMock.mock.calls[0]
    expect(call).toHaveLength(2)
    expect(call[0]).toBe(container)
    expect(typeof call[1]).toBe('object')
    expect(call[1].assetPath).toBe('/dice-box-threejs/')
  })
})

describe('useDiceAnimation — bounded settle', () => {
  it('a roll() that never settles is bounded — run() resolves true, box torn down, status idle', async () => {
    jest.useFakeTimers()
    try {
      stubWebGL(true)
      rollOverride = () => new Promise(() => {})
      const errSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
      const container = document.createElement('div')
      const { result } = renderHook(() => useDiceAnimation())

      let settled = false
      let outcome: boolean | undefined
      let runPromise!: Promise<void>
      await act(async () => {
        runPromise = result.current.run(built, container).then(v => { settled = true; outcome = v })
        for (let i = 0; i < 20; i++) await Promise.resolve()
        expect(settled).toBe(false)
        jest.advanceTimersByTime(12000)
        await runPromise
      })

      expect(settled).toBe(true)
      expect(outcome).toBe(true)
      expect(result.current.status).toBe('idle')
      expect(clearMock).toHaveBeenCalled()
      expect(errSpy).toHaveBeenCalled()
      errSpy.mockRestore()
    } finally {
      jest.useRealTimers()
    }
  })
})
