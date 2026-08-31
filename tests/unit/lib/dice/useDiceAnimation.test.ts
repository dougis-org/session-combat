import { renderHook, act } from '@testing-library/react'
import { useDiceAnimation } from '@/lib/dice/useDiceAnimation'
import { DICE_BASE_SCALE, diceAnimationScale } from '@/lib/dice/diceAnimationScale'
import {
  engineMock,
  resetEngineMock,
  built,
  poolBuilt,
  stubWebGL,
} from './__helpers__/diceAnimationHarness'

// The reconciliation-specific behaviour lives in `useDiceAnimation.reconcile.test.ts`;
// this file covers degradation, laziness, the single-instance invariant, scale, and the
// bounded-settle backstop. Both share the engine stand-in in `./__helpers__`.
jest.mock('@drdreo/dice-box-threejs', () =>
  require('./__helpers__/diceAnimationHarness').diceBoxMockFactory(),
)

const { ctorMock, clearMock, rollMock, initMock } = engineMock
let warnSpy: jest.SpyInstance

beforeEach(() => {
  resetEngineMock()
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
  // The engine is loaded via `import('@drdreo/dice-box-threejs')` inside run(); that it
  // stays out of the initial bundle is asserted by the build-time NFAC check (tasks E8),
  // not a source-string regex here.
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
    engineMock.rollOverride = () => new Promise(res => { resolveFirst = res })
    const container = document.createElement('div')
    const { result } = renderHook(() => useDiceAnimation())

    let firstOutcome: boolean | undefined
    let firstPromise!: Promise<boolean>
    await act(async () => {
      firstPromise = result.current.run(built, container)
      firstPromise.then(v => { firstOutcome = v })
      await new Promise(r => setTimeout(r, 0))
      engineMock.rollOverride = null
      await result.current.run(built, container)
      resolveFirst!(undefined)
      await firstPromise
    })
    expect(firstOutcome).toBe(false)
  })
})

describe('useDiceAnimation — scale', () => {
  it('constructs the engine with the base baseScale (and sounds off) for a 6-die roll', async () => {
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

    resetEngineMock()
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
      engineMock.rollOverride = () => new Promise(() => {})
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
