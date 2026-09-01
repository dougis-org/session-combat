import { renderHook, act } from '@testing-library/react'
import { LocalStore } from '@/lib/offline/LocalStore'
import { useDiceFabPreferences } from '@/lib/dice/useDiceFabPreferences'

function mockMatchMedia(reduceMotion: boolean) {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    configurable: true,
    value: jest.fn().mockImplementation((query: string) => ({
      matches: query.includes('prefers-reduced-motion') ? reduceMotion : false,
      media: query,
      onchange: null,
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      addListener: jest.fn(),
      removeListener: jest.fn(),
      dispatchEvent: jest.fn(),
    })),
  })
}

beforeEach(() => {
  LocalStore.clear()
  jest.clearAllMocks()
})

afterEach(() => {
  jest.restoreAllMocks()
})

describe('useDiceFabPreferences — disableAnimation resolution', () => {
  const table: Array<{ stored: boolean | null; reduce: boolean; resolved: boolean }> = [
    { stored: null, reduce: true, resolved: true },
    { stored: null, reduce: false, resolved: false },
    { stored: false, reduce: true, resolved: false },
    { stored: true, reduce: false, resolved: true },
  ]

  it.each(table)('stored=$stored + reduceMotion=$reduce → resolved=$resolved', ({ stored, reduce, resolved }) => {
    mockMatchMedia(reduce)
    if (stored !== null) LocalStore.set('dice-fab-disable-animation', stored)
    const { result } = renderHook(() => useDiceFabPreferences())
    expect(result.current.disableAnimation).toBe(resolved)
  })
})

describe('useDiceFabPreferences — explicit choice overrides the media query', () => {
  it('first toggle writes an explicit boolean and wins over a later media-query change', () => {
    mockMatchMedia(true)
    const { result, rerender } = renderHook(() => useDiceFabPreferences())
    expect(result.current.disableAnimation).toBe(true) // from reduced-motion

    act(() => result.current.setDisableAnimation(false))
    expect(result.current.disableAnimation).toBe(false)
    expect(LocalStore.get<boolean>('dice-fab-disable-animation')).toBe(false)

    // media query flips to "no reduce" — resolved value must stay the explicit choice
    mockMatchMedia(false)
    rerender()
    expect(result.current.disableAnimation).toBe(false)
  })
})

describe('useDiceFabPreferences — sendToChat', () => {
  it('defaults to false with no stored value', () => {
    mockMatchMedia(false)
    const { result } = renderHook(() => useDiceFabPreferences())
    expect(result.current.sendToChat).toBe(false)
  })

  it('persists across remount', () => {
    mockMatchMedia(false)
    const first = renderHook(() => useDiceFabPreferences())
    act(() => first.result.current.setSendToChat(true))
    first.unmount()

    const second = renderHook(() => useDiceFabPreferences())
    expect(second.result.current.sendToChat).toBe(true)
  })
})

describe('useDiceFabPreferences — disableAnimation persists across remount', () => {
  it('a checked choice survives unmount/remount', () => {
    mockMatchMedia(false)
    const first = renderHook(() => useDiceFabPreferences())
    act(() => first.result.current.setDisableAnimation(true))
    first.unmount()

    const second = renderHook(() => useDiceFabPreferences())
    expect(second.result.current.disableAnimation).toBe(true)
    expect(second.result.current.disableAnimationChoice).toBe(true)
  })
})

describe('useDiceFabPreferences — dice appearance (tasks 3.1 / 3.2)', () => {
  beforeEach(() => mockMatchMedia(false))

  it('3.2-a defaults to white / glass with empty storage', () => {
    const { result } = renderHook(() => useDiceFabPreferences())
    expect(result.current.diceColorset).toBe('white')
    expect(result.current.diceMaterial).toBe('glass')
  })

  it('3.2-b setDiceColorset persists under dice-fab-colorset and survives remount', () => {
    const setSpy = jest.spyOn(LocalStore, 'set')
    const first = renderHook(() => useDiceFabPreferences())
    act(() => first.result.current.setDiceColorset('bloodmoon'))
    expect(first.result.current.diceColorset).toBe('bloodmoon')
    expect(setSpy).toHaveBeenCalledWith('dice-fab-colorset', 'bloodmoon')
    first.unmount()

    const second = renderHook(() => useDiceFabPreferences())
    expect(second.result.current.diceColorset).toBe('bloodmoon')
  })

  it('3.2-c setDiceMaterial persists under dice-fab-material and survives remount', () => {
    const setSpy = jest.spyOn(LocalStore, 'set')
    const first = renderHook(() => useDiceFabPreferences())
    act(() => first.result.current.setDiceMaterial('metal'))
    expect(first.result.current.diceMaterial).toBe('metal')
    expect(setSpy).toHaveBeenCalledWith('dice-fab-material', 'metal')
    first.unmount()

    const second = renderHook(() => useDiceFabPreferences())
    expect(second.result.current.diceMaterial).toBe('metal')
  })

  it('3.2-d junk in storage resolves to the defaults without throwing', () => {
    LocalStore.set('dice-fab-colorset', 'bogus')
    LocalStore.set('dice-fab-material', 7)
    const { result } = renderHook(() => useDiceFabPreferences())
    expect(result.current.diceColorset).toBe('white')
    expect(result.current.diceMaterial).toBe('glass')
  })

  it('3.2-e a throwing LocalStore.get still initializes to defaults with one warn per key', () => {
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {})
    jest.spyOn(LocalStore, 'get').mockImplementation(() => {
      throw new Error('nope')
    })
    const { result } = renderHook(() => useDiceFabPreferences())
    expect(result.current.diceColorset).toBe('white')
    expect(result.current.diceMaterial).toBe('glass')
    expect(warnSpy.mock.calls.filter(c => String(c[0]).includes('dice-fab-colorset'))).toHaveLength(1)
    expect(warnSpy.mock.calls.filter(c => String(c[0]).includes('dice-fab-material'))).toHaveLength(1)
    warnSpy.mockRestore()
  })

  it('3.2-f a throwing LocalStore.set does not throw and keeps the in-session value', () => {
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {})
    const { result } = renderHook(() => useDiceFabPreferences())
    jest.spyOn(LocalStore, 'set').mockImplementation(() => {
      throw new Error('nope')
    })
    expect(() => act(() => result.current.setDiceColorset('fire'))).not.toThrow()
    expect(result.current.diceColorset).toBe('fire')
    expect(warnSpy.mock.calls.filter(c => String(c[0]).includes('dice-fab-colorset'))).toHaveLength(1)
    warnSpy.mockRestore()
  })

  it('3.2-g existing sendToChat / disableAnimation behavior is unchanged', () => {
    const { result } = renderHook(() => useDiceFabPreferences())
    expect(result.current.sendToChat).toBe(false)
    act(() => result.current.setSendToChat(true))
    expect(result.current.sendToChat).toBe(true)
    act(() => result.current.setDisableAnimation(true))
    expect(result.current.disableAnimation).toBe(true)
  })
})

describe('useDiceFabPreferences — storage unavailable', () => {
  it('returns defaults and does not throw when LocalStore throws', () => {
    mockMatchMedia(false)
    const getSpy = jest.spyOn(LocalStore, 'get').mockImplementation(() => { throw new Error('nope') })
    const setSpy = jest.spyOn(LocalStore, 'set').mockImplementation(() => { throw new Error('nope') })

    const { result } = renderHook(() => useDiceFabPreferences())
    expect(result.current.sendToChat).toBe(false)
    expect(result.current.disableAnimation).toBe(false)
    expect(() => act(() => result.current.setSendToChat(true))).not.toThrow()
    expect(() => act(() => result.current.setDisableAnimation(true))).not.toThrow()

    getSpy.mockRestore()
    setSpy.mockRestore()
  })
})
