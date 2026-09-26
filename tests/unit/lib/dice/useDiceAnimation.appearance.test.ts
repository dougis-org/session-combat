import { renderHook, act } from '@testing-library/react'
import { useDiceAnimation } from '@/lib/dice/useDiceAnimation'
import { engineMock, resetEngineMock, built, stubWebGL } from './__helpers__/diceAnimationHarness'

// Appearance pass-through for `useDiceAnimation` (design.md Decisions 4, 5): a resolved
// `{ customColorset, material, surface }` — sourced from `preferences.dice.*` — is threaded
// into the `DiceBox` constructor options as `theme_customColorset` / `theme_material` /
// `theme_surface`, each omitted when `null`. `theme_colorset` is never passed. Shares the
// engine stand-in in `./__helpers__`.
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

describe('useDiceAnimation — appearance pass-through (task 2.3)', () => {
  it('a set customColorset appears verbatim in the constructed DiceConfig, no theme_colorset', async () => {
    const container = document.createElement('div')
    const { result } = renderHook(() =>
      useDiceAnimation({
        customColorset: { foreground: '#000', background: '#f00' },
        material: null,
        surface: null,
      }),
    )
    await act(async () => {
      await result.current.run(built, container)
    })
    const opts = lastOptions()
    expect(opts.theme_customColorset).toEqual({ foreground: '#000', background: '#f00' })
    expect(opts).not.toHaveProperty('theme_colorset')
  })

  it('a set surface appears verbatim in the constructed DiceConfig', async () => {
    const container = document.createElement('div')
    const { result } = renderHook(() =>
      useDiceAnimation({ customColorset: null, material: null, surface: 'wood-tray' }),
    )
    await act(async () => {
      await result.current.run(built, container)
    })
    expect(lastOptions().theme_surface).toBe('wood-tray')
  })

  it('a set material appears verbatim in the constructed DiceConfig', async () => {
    const container = document.createElement('div')
    const { result } = renderHook(() =>
      useDiceAnimation({ customColorset: null, material: 'metal', surface: null }),
    )
    await act(async () => {
      await result.current.run(built, container)
    })
    expect(lastOptions().theme_material).toBe('metal')
  })

  it('all-null appearance omits theme_customColorset, theme_material, theme_surface, and theme_colorset', async () => {
    const container = document.createElement('div')
    const { result } = renderHook(() =>
      useDiceAnimation({ customColorset: null, material: null, surface: null }),
    )
    await act(async () => {
      await result.current.run(built, container)
    })
    const opts = lastOptions()
    expect(opts).not.toHaveProperty('theme_customColorset')
    expect(opts).not.toHaveProperty('theme_material')
    expect(opts).not.toHaveProperty('theme_surface')
    expect(opts).not.toHaveProperty('theme_colorset')
  })

  it('no appearance argument (default) also omits all three theme_* keys', async () => {
    const container = document.createElement('div')
    const { result } = renderHook(() => useDiceAnimation())
    await act(async () => {
      await result.current.run(built, container)
    })
    const opts = lastOptions()
    expect(opts).not.toHaveProperty('theme_customColorset')
    expect(opts).not.toHaveProperty('theme_material')
    expect(opts).not.toHaveProperty('theme_surface')
  })

  it('leaves the pre-existing constructor options unchanged', async () => {
    const container = document.createElement('div')
    const { result } = renderHook(() =>
      useDiceAnimation({
        customColorset: { foreground: '#000', background: '#f00' },
        material: 'metal',
        surface: 'wood-tray',
      }),
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

  it('appearance mapping does not affect lazy-load timing (import only fires on run())', () => {
    // No run() call — the module mock records ctor calls only; asserting no import side
    // effect happened is implicit in this suite's other tests all calling run() explicitly
    // before any DiceBox is constructed. This test documents the guarantee explicitly.
    renderHook(() =>
      useDiceAnimation({ customColorset: null, material: 'metal', surface: null }),
    )
    expect(ctorMock).not.toHaveBeenCalled()
  })
})
