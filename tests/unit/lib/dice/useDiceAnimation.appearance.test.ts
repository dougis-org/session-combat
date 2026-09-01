import { renderHook, act } from '@testing-library/react'
import type { BuiltRoll } from '@/lib/dice/useDicePoolState'
import { useDiceAnimation } from '@/lib/dice/useDiceAnimation'
import { engineMock, resetEngineMock, built, stubWebGL } from './__helpers__/diceAnimationHarness'

// Appearance pass-through for `useDiceAnimation`: the resolved `{ colorset, material }` is
// threaded into the `DiceBox` constructor options as `theme_colorset` / `theme_material`
// (with `theme_customColorset: null`), without disturbing the pre-existing options or the
// decided roll. Shares the engine stand-in in `./__helpers__`.
jest.mock('@drdreo/dice-box-threejs', () =>
  require('./__helpers__/diceAnimationHarness').diceBoxMockFactory(),
)

const { ctorMock } = engineMock
let warnSpy: jest.SpyInstance

beforeEach(() => {
  resetEngineMock()
  warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {})
  stubWebGL(true)
})

afterEach(() => {
  warnSpy.mockRestore()
  jest.restoreAllMocks()
})

function lastOptions() {
  return ctorMock.mock.calls[ctorMock.mock.calls.length - 1][1]
}

describe('useDiceAnimation — appearance pass-through (tasks 5.1 / 5.2)', () => {
  it('5.1-a passes the resolved colorset / material as theme_* options', async () => {
    const container = document.createElement('div')
    const { result } = renderHook(() =>
      useDiceAnimation({ colorset: 'fire', material: 'metal' }),
    )
    await act(async () => {
      await result.current.run(built, container)
    })
    const opts = lastOptions()
    expect(opts.theme_colorset).toBe('fire')
    expect(opts.theme_customColorset).toBeNull()
    expect(opts.theme_material).toBe('metal')
  })

  it('5.1-b leaves the pre-existing constructor options unchanged', async () => {
    const container = document.createElement('div')
    const { result } = renderHook(() =>
      useDiceAnimation({ colorset: 'fire', material: 'metal' }),
    )
    await act(async () => {
      await result.current.run(built, container)
    })
    const opts = lastOptions()
    expect(opts.assetPath).toBe('/dice-box-threejs/')
    expect(opts.sounds).toBe(false)
    expect(opts.shadows).toBe(false)
    expect(typeof opts.baseScale).toBe('number')
    expect(typeof opts.iterationLimit).toBe('number')
  })

  it('5.1-c defaults to white / glass when no appearance is supplied', async () => {
    const container = document.createElement('div')
    const { result } = renderHook(() => useDiceAnimation())
    await act(async () => {
      await result.current.run(built, container)
    })
    const opts = lastOptions()
    expect(opts.theme_colorset).toBe('white')
    expect(opts.theme_material).toBe('glass')
  })

  it('5.3-a a seeded roll reports the same total regardless of appearance', async () => {
    const seeded: BuiltRoll = {
      formula: '2d6',
      rolls: [3, 4],
      total: 7,
      breakdown: [
        { sides: 6, value: 3 },
        { sides: 6, value: 4 },
      ],
      modifier: 0,
    }
    const container = document.createElement('div')

    const a = renderHook(() => useDiceAnimation({ colorset: 'white', material: 'glass' }))
    await act(async () => {
      await a.result.current.run(seeded, container)
    })
    const totalDefault = seeded.total

    resetEngineMock()
    const b = renderHook(() =>
      useDiceAnimation({ colorset: 'glitterparty', material: 'wood' }),
    )
    await act(async () => {
      await b.result.current.run(seeded, container)
    })

    expect(seeded.total).toBe(totalDefault)
    expect(lastOptions().theme_material).toBe('wood')
  })

  it('5.3-b/c a forced d4 with a non-glass material settles or reconciles, never throws', async () => {
    const forcedD4: BuiltRoll = {
      formula: '1d4',
      rolls: [3],
      total: 3,
      breakdown: [{ sides: 4, value: 3 }],
      modifier: 0,
    }
    const container = document.createElement('div')

    // Case 1: engine settles on the forced face — clean reconcile, no warn.
    {
      const { result } = renderHook(() =>
        useDiceAnimation({ colorset: 'bronze', material: 'wood' }),
      )
      let outcome: boolean | undefined
      await act(async () => {
        outcome = await result.current.run(forcedD4, container)
      })
      expect(outcome).toBe(true)
      expect(warnSpy).not.toHaveBeenCalled()
    }

    // Case 2: engine settles on a different face — reconcile mismatch degrades to a reveal.
    resetEngineMock()
    warnSpy.mockClear()
    engineMock.faceOverride = (_notation, forced) =>
      forced.map(d => ({ ...d, value: d.value === 4 ? 1 : d.value + 1 }))
    {
      const { result } = renderHook(() =>
        useDiceAnimation({ colorset: 'bronze', material: 'wood' }),
      )
      let outcome: boolean | undefined
      let threw = false
      await act(async () => {
        try {
          outcome = await result.current.run(forcedD4, container)
        } catch {
          threw = true
        }
      })
      expect(threw).toBe(false)
      expect(outcome).toBe(true)
      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining('did not match the decided roll'),
      )
      expect(forcedD4.total).toBe(3)
    }
  })
})
