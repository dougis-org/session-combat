import { renderHook, act } from '@testing-library/react'
import { LocalStore } from '@/lib/offline/LocalStore'
import { makePreferencesWrapper } from '@/tests/unit/helpers/preferences'
import {
  PREFERENCES_MIRROR_KEY,
  __resetFallbackPreferencesForTests,
} from '@/lib/preferences/usePreferences'
import { DEFAULT_PREFERENCES } from '@/lib/preferences/schema'
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

const mirror = (over: Partial<typeof DEFAULT_PREFERENCES.dice>) =>
  LocalStore.set(PREFERENCES_MIRROR_KEY, {
    ...DEFAULT_PREFERENCES,
    dice: { ...DEFAULT_PREFERENCES.dice, ...over },
  })

const wrapper = makePreferencesWrapper(null)

beforeEach(() => {
  LocalStore.clear()
  __resetFallbackPreferencesForTests()
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
    if (stored !== null) mirror({ disableAnimation: stored })
    __resetFallbackPreferencesForTests()
    const { result } = renderHook(() => useDiceFabPreferences(), { wrapper })
    expect(result.current.disableAnimation).toBe(resolved)
  })
})

describe('useDiceFabPreferences — explicit choice overrides the media query', () => {
  it('first toggle wins over a later media-query change and routes through setPreference', () => {
    mockMatchMedia(true)
    const { result, rerender } = renderHook(() => useDiceFabPreferences(), { wrapper })
    expect(result.current.disableAnimation).toBe(true) // from reduced-motion

    act(() => result.current.setDisableAnimation(false))
    expect(result.current.disableAnimation).toBe(false)
    expect(
      LocalStore.get<typeof DEFAULT_PREFERENCES>(PREFERENCES_MIRROR_KEY)!.dice.disableAnimation,
    ).toBe(false)

    mockMatchMedia(false)
    rerender()
    expect(result.current.disableAnimation).toBe(false)
  })
})

describe('useDiceFabPreferences — sendToChat', () => {
  it('defaults to false with no stored value', () => {
    mockMatchMedia(false)
    const { result } = renderHook(() => useDiceFabPreferences(), { wrapper })
    expect(result.current.sendToChat).toBe(false)
  })

  it('a set value survives an unmount/remount via the mirror', () => {
    mockMatchMedia(false)
    const first = renderHook(() => useDiceFabPreferences(), { wrapper })
    act(() => first.result.current.setSendToChat(true))
    first.unmount()

    const second = renderHook(() => useDiceFabPreferences(), { wrapper })
    expect(second.result.current.sendToChat).toBe(true)
  })
})

describe('useDiceFabPreferences — disableAnimation persists across remount', () => {
  it('a checked choice survives unmount/remount', () => {
    mockMatchMedia(false)
    const first = renderHook(() => useDiceFabPreferences(), { wrapper })
    act(() => first.result.current.setDisableAnimation(true))
    first.unmount()

    const second = renderHook(() => useDiceFabPreferences(), { wrapper })
    expect(second.result.current.disableAnimation).toBe(true)
    expect(second.result.current.disableAnimationChoice).toBe(true)
  })
})

describe('useDiceFabPreferences — dice appearance removed (design.md Decision 6)', () => {
  beforeEach(() => mockMatchMedia(false))

  it('exposes no diceColorset/diceMaterial appearance fields', () => {
    const { result } = renderHook(() => useDiceFabPreferences(), { wrapper })
    expect(result.current).not.toHaveProperty('diceColorset')
    expect(result.current).not.toHaveProperty('setDiceColorset')
    expect(result.current).not.toHaveProperty('diceMaterial')
    expect(result.current).not.toHaveProperty('setDiceMaterial')
  })

  it('existing sendToChat / disableAnimation behavior is unchanged', () => {
    const { result } = renderHook(() => useDiceFabPreferences(), { wrapper })
    expect(result.current.sendToChat).toBe(false)
    act(() => result.current.setSendToChat(true))
    expect(result.current.sendToChat).toBe(true)
    act(() => result.current.setDisableAnimation(true))
    expect(result.current.disableAnimation).toBe(true)
  })
})

describe('useDiceFabPreferences — storage unavailable', () => {
  it('does not throw when LocalStore.set throws', () => {
    mockMatchMedia(false)
    const setSpy = jest.spyOn(LocalStore, 'set').mockImplementation(() => {
      throw new Error('nope')
    })
    jest.spyOn(console, 'warn').mockImplementation(() => {})

    const { result } = renderHook(() => useDiceFabPreferences(), { wrapper })
    expect(() => act(() => result.current.setSendToChat(true))).not.toThrow()
    expect(() => act(() => result.current.setDisableAnimation(true))).not.toThrow()
    expect(result.current.sendToChat).toBe(true)
    setSpy.mockRestore()
  })
})
