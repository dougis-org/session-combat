import { renderHook, act } from '@testing-library/react'
import type { BuiltRoll } from '@/lib/dice/useDicePoolState'
import { useDiceAnimation } from '@/lib/dice/useDiceAnimation'
import { engineMock, resetEngineMock, built, stubWebGL } from './__helpers__/diceAnimationHarness'

// Reconciliation behaviour for `useDiceAnimation`: the settled faces the engine reports are
// checked against the decided roll; a mismatch is a transient per-roll condition (one
// distinct warn, prompt reveal, no `unsupported` latch). Degradation / scale / lifecycle
// cases live in `useDiceAnimation.test.ts`; both share the engine stand-in in `./__helpers__`.
jest.mock('@drdreo/dice-box-threejs', () =>
  require('./__helpers__/diceAnimationHarness').diceBoxMockFactory(),
)

const { ctorMock, clearMock, rollMock, addMock } = engineMock
let warnSpy: jest.SpyInstance

beforeEach(() => {
  resetEngineMock()
  warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {})
})

afterEach(() => {
  warnSpy.mockRestore()
  jest.restoreAllMocks()
})

const mixed: BuiltRoll = {
  formula: '2d20+1d6',
  rolls: [14, 2, 5],
  total: 21,
  breakdown: [{ sides: 20, value: 14 }, { sides: 20, value: 2 }, { sides: 6, value: 5 }],
  modifier: 0,
}

describe('useDiceAnimation — settle + reconciliation', () => {
  it('passes the per-group forced notation to roll(); resolves true; status idle; no warn', async () => {
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
    const container = document.createElement('div')
    const { result } = renderHook(() => useDiceAnimation())
    await act(async () => { await result.current.run(mixed, container) })

    expect(rollMock).toHaveBeenCalledWith('2d20@14,2')
    expect(addMock).toHaveBeenCalledWith('1d6@5')
  })

  it('drives a 3-die-size pool with roll() then add() per extra group, in first-seen order', async () => {
    stubWebGL(true)
    const three: BuiltRoll = {
      formula: '2d20+1d6+1d8',
      rolls: [14, 2, 5, 8],
      total: 29,
      breakdown: [
        { sides: 20, value: 14 }, { sides: 20, value: 2 },
        { sides: 6, value: 5 }, { sides: 8, value: 8 },
      ],
      modifier: 0,
    }
    const container = document.createElement('div')
    const { result } = renderHook(() => useDiceAnimation())
    await act(async () => { await result.current.run(three, container) })

    expect(rollMock).toHaveBeenCalledWith('2d20@14,2')
    expect(addMock.mock.calls.map(c => c[0])).toEqual(['1d6@5', '1d8@8'])
    expect(warnSpy).not.toHaveBeenCalled()
  })

  it('a mismatch in an add() group (not the first roll group) still routes to the instant reveal', async () => {
    stubWebGL(true)
    engineMock.faceOverride = (n, forced) =>
      n.startsWith('1d6') ? forced.map(d => ({ ...d, value: d.value + 1 })) : forced
    const container = document.createElement('div')
    const { result } = renderHook(() => useDiceAnimation())
    let outcome: boolean | undefined
    await act(async () => { outcome = await result.current.run(mixed, container) })

    expect(outcome).toBe(true)
    expect(result.current.status).toBe('idle')
    expect(warnSpy).toHaveBeenCalledTimes(1)
    expect(warnSpy.mock.calls[0][0]).toMatch(/did not match/i)
  })

  it('a face mismatch resolves true, keeps status idle, and warns exactly once (distinct message)', async () => {
    stubWebGL(true)
    engineMock.faceOverride = (_n, forced) =>
      forced.map((d, i) => (i === 0 ? { ...d, value: d.value + 1 } : d))
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
    const d4roll: BuiltRoll = {
      formula: '2d4',
      rolls: [1, 2],
      total: 3,
      breakdown: [{ sides: 4, value: 1 }, { sides: 4, value: 2 }],
      modifier: 0,
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
    engineMock.faceOverride = (_n, forced) => forced.map(d => ({ ...d, value: d.value + 1 }))
    const container = document.createElement('div')
    const { result } = renderHook(() => useDiceAnimation())
    await act(async () => { await result.current.run(built, container) })
    await act(async () => { await result.current.run(built, container) })
    expect(warnSpy).toHaveBeenCalledTimes(1)
  })

  it('after a mismatch, a later run() still attempts the engine', async () => {
    stubWebGL(true)
    engineMock.faceOverride = (_n, forced) => forced.map(d => ({ ...d, value: d.value + 1 }))
    const container = document.createElement('div')
    const { result } = renderHook(() => useDiceAnimation())
    await act(async () => { await result.current.run(built, container) })
    engineMock.faceOverride = null
    await act(async () => { await result.current.run(built, container) })
    expect(ctorMock).toHaveBeenCalledTimes(2)
  })

  it('reordered engine results still reconcile as a match', async () => {
    stubWebGL(true)
    engineMock.faceOverride = (_n, forced) => [...forced].reverse()
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
    engineMock.faceOverride = () => [{ sides: 10, value: 0 }, { sides: 10, value: 0 }]
    const container = document.createElement('div')
    const { result } = renderHook(() => useDiceAnimation())
    await act(async () => { await result.current.run(pct, container) })
    expect(rollMock).toHaveBeenCalledWith('2d10@10,10')
    expect(warnSpy).not.toHaveBeenCalled()
  })

  it('the reconciliation path issues no fetch', async () => {
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
