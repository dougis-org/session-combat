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
