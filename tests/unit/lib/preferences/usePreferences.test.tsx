import { renderHook, act, waitFor } from '@testing-library/react'
import { LocalStore } from '@/lib/offline/LocalStore'
import { MockFetchResponse } from '@/tests/unit/helpers/mockFetchResponse'
import { makePreferencesWrapper } from '@/tests/unit/helpers/preferences'
import { usePreferences, PREFERENCES_MIRROR_KEY } from '@/lib/preferences/usePreferences'
import { DEFAULT_PREFERENCES } from '@/lib/preferences/schema'

const realFetch = global.fetch

const resolved = (values: Record<string, unknown>, stored: Record<string, unknown> = {}) =>
  new MockFetchResponse(JSON.stringify({ schemaVersion: 1, values, stored }))

type FetchMock = jest.Mock<Promise<unknown>, [string, RequestInit?]>

function installFetch(impl: (url: string, init?: RequestInit) => unknown): FetchMock {
  const spy = jest.fn(async (url: string, init?: RequestInit) => impl(url, init)) as unknown as FetchMock
  global.fetch = spy as unknown as typeof global.fetch
  return spy
}

const okServer = (values: Record<string, unknown> = DEFAULT_PREFERENCES as unknown as Record<string, unknown>, stored = {}) =>
  installFetch((url, init) => {
    if (url.includes('/api/me/preferences') && (!init || init.method === undefined)) {
      return resolved(values, stored)
    }
    if (url.includes('/api/me/preferences') && init?.method === 'PATCH') {
      return resolved(values, stored)
    }
    return new MockFetchResponse('{}', { status: 404 })
  })

const patchCalls = (spy: FetchMock) =>
  spy.mock.calls.filter(([, init]) => init?.method === 'PATCH')

const patchBody = (spy: FetchMock, i = 0) =>
  JSON.parse((patchCalls(spy)[i][1] as RequestInit).body as string)

beforeEach(() => {
  LocalStore.clear()
  jest.restoreAllMocks()
  jest.useRealTimers()
})

afterEach(() => {
  jest.useRealTimers()
  global.fetch = realFetch
})

describe('usePreferences — logged out', () => {
  it('issues no GET/PATCH and mirrors changes locally', async () => {
    const spy = okServer()
    const { result } = renderHook(() => usePreferences(), {
      wrapper: makePreferencesWrapper(null),
    })
    await waitFor(() => expect(result.current.ready).toBe(true))

    act(() => result.current.setPreference('dice.sendToChat', true))

    expect(result.current.preferences.dice.sendToChat).toBe(true)
    expect(LocalStore.get(PREFERENCES_MIRROR_KEY)).toMatchObject({ dice: { sendToChat: true } })
    expect(spy).not.toHaveBeenCalled()
  })
})

describe('usePreferences — authenticated hydration', () => {
  it('issues exactly one GET and reconciles from the server', async () => {
    const spy = okServer(
      { ...DEFAULT_PREFERENCES, dice: { ...DEFAULT_PREFERENCES.dice, sendToChat: true } },
      { dice: { sendToChat: true } },
    )
    const { result } = renderHook(() => usePreferences(), {
      wrapper: makePreferencesWrapper('u1'),
    })
    await waitFor(() => expect(result.current.ready).toBe(true))
    await waitFor(() => expect(result.current.preferences.dice.sendToChat).toBe(true))

    const gets = spy.mock.calls.filter(([, init]) => !init || init.method === undefined)
    expect(gets).toHaveLength(1)
  })

  it('adopts a legacy local value when the server has none (single seeding PATCH)', async () => {
    LocalStore.set('dice-fab-send-to-chat', true)
    const spy = okServer(DEFAULT_PREFERENCES as unknown as Record<string, unknown>, {})
    const { result } = renderHook(() => usePreferences(), {
      wrapper: makePreferencesWrapper('u1'),
    })
    await waitFor(() => expect(result.current.preferences.dice.sendToChat).toBe(true))
    await waitFor(() => expect(patchCalls(spy).length).toBeGreaterThan(0))
    expect(patchBody(spy)).toMatchObject({ dice: { sendToChat: true } })
  })

  it('server value wins over a stale local value; no seeding PATCH for that key', async () => {
    LocalStore.set(PREFERENCES_MIRROR_KEY, { ...DEFAULT_PREFERENCES, dice: { ...DEFAULT_PREFERENCES.dice, sendToChat: true } })
    const spy = okServer(DEFAULT_PREFERENCES as unknown as Record<string, unknown>, { dice: { sendToChat: false } })
    const { result } = renderHook(() => usePreferences(), {
      wrapper: makePreferencesWrapper('u1'),
    })
    await waitFor(() => expect(result.current.ready).toBe(true))
    await waitFor(() => expect(result.current.preferences.dice.sendToChat).toBe(false))
    expect(LocalStore.get<Record<string, { sendToChat: boolean }>>(PREFERENCES_MIRROR_KEY)!.dice.sendToChat).toBe(false)
    expect(patchCalls(spy)).toHaveLength(0)
  })
})

describe('usePreferences — debounced persistence', () => {
  it('coalesces rapid changes into one PATCH carrying the final value', async () => {
    const spy = okServer()
    const { result } = renderHook(() => usePreferences(), {
      wrapper: makePreferencesWrapper('u1'),
    })
    await waitFor(() => expect(result.current.ready).toBe(true))
    // let the (no-op) hydration flush settle
    await act(async () => { await Promise.resolve() })
    const before = patchCalls(spy).length

    jest.useFakeTimers()
    act(() => {
      result.current.setPreference('chat.size', { height: 300, screenWidth: 1, screenHeight: 1 })
      result.current.setPreference('chat.size', { height: 350, screenWidth: 1, screenHeight: 1 })
      result.current.setPreference('chat.size', { height: 400, screenWidth: 1, screenHeight: 1 })
    })
    await act(async () => { jest.runOnlyPendingTimers() })
    jest.useRealTimers()
    await act(async () => { await Promise.resolve() })

    const after = patchCalls(spy).slice(before)
    expect(after).toHaveLength(1)
    expect(JSON.parse((after[0][1] as RequestInit).body as string)).toMatchObject({
      chat: { size: { height: 400 } },
    })
  })
})

describe('usePreferences — cross-tab sync', () => {
  it('updates from a storage event without issuing a PATCH', async () => {
    const spy = okServer()
    const { result } = renderHook(() => usePreferences(), {
      wrapper: makePreferencesWrapper('u1'),
    })
    await waitFor(() => expect(result.current.ready).toBe(true))
    const before = patchCalls(spy).length

    act(() => {
      LocalStore.set(PREFERENCES_MIRROR_KEY, { ...DEFAULT_PREFERENCES, chat: { ...DEFAULT_PREFERENCES.chat, pinned: true } })
      window.dispatchEvent(new StorageEvent('storage', { key: 'sessionCombat:v1:preferences' }))
    })

    await waitFor(() => expect(result.current.preferences.chat.pinned).toBe(true))
    expect(patchCalls(spy).length).toBe(before)
  })

  it('ignores storage events for unrelated keys', async () => {
    okServer()
    const { result } = renderHook(() => usePreferences(), {
      wrapper: makePreferencesWrapper('u1'),
    })
    await waitFor(() => expect(result.current.ready).toBe(true))
    act(() => {
      window.dispatchEvent(new StorageEvent('storage', { key: 'sessionCombat:v1:somethingElse' }))
    })
    expect(result.current.preferences).toEqual(DEFAULT_PREFERENCES)
  })
})

describe('usePreferences — graceful degradation', () => {
  it('does not throw when localStorage access fails', async () => {
    okServer()
    const { result } = renderHook(() => usePreferences(), {
      wrapper: makePreferencesWrapper(null),
    })
    await waitFor(() => expect(result.current.ready).toBe(true))
    const setSpy = jest.spyOn(LocalStore, 'set').mockImplementation(() => { throw new Error('nope') })
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {})

    expect(() => act(() => result.current.setPreference('dice.sendToChat', true))).not.toThrow()
    expect(result.current.preferences.dice.sendToChat).toBe(true)
    expect(warn).toHaveBeenCalled()
    setSpy.mockRestore()
  })

  it('re-sends a failed delta on the next change, without dropping either key', async () => {
    let failNextPatch = true
    const spy = installFetch((url, init) => {
      if (url.includes('/api/me/preferences') && (!init || init.method === undefined)) {
        return resolved(DEFAULT_PREFERENCES as unknown as Record<string, unknown>)
      }
      if (init?.method === 'PATCH') {
        if (failNextPatch) {
          failNextPatch = false
          return new MockFetchResponse('{}', { status: 500 })
        }
        return resolved(DEFAULT_PREFERENCES as unknown as Record<string, unknown>)
      }
      return new MockFetchResponse('{}', { status: 404 })
    })
    jest.spyOn(console, 'warn').mockImplementation(() => {})
    const { result } = renderHook(() => usePreferences(), {
      wrapper: makePreferencesWrapper('u1'),
    })
    await waitFor(() => expect(result.current.ready).toBe(true))
    await act(async () => { await Promise.resolve() })
    const before = patchCalls(spy).length

    jest.useFakeTimers()
    act(() => result.current.setPreference('dice.sendToChat', true))
    await act(async () => { jest.runOnlyPendingTimers() }) // PATCH #1 → 500, re-queued
    act(() => result.current.setPreference('dice.disableAnimation', true))
    await act(async () => { jest.runOnlyPendingTimers() }) // PATCH #2 → carries both
    jest.useRealTimers()
    await act(async () => { await Promise.resolve() })

    const sent = patchCalls(spy).slice(before)
    const last = JSON.parse((sent[sent.length - 1][1] as RequestInit).body as string)
    expect(last).toMatchObject({
      dice: { sendToChat: true, disableAnimation: true },
    })
  })

  it('renders preference-bound state from the mirror before the GET resolves', async () => {
    let releaseGet: () => void = () => {}
    const gate = new Promise<void>((r) => { releaseGet = r })
    installFetch((url, init) => {
      if (url.includes('/api/me/preferences') && (!init || init.method === undefined)) {
        return gate.then(() => resolved(DEFAULT_PREFERENCES as unknown as Record<string, unknown>))
      }
      return resolved(DEFAULT_PREFERENCES as unknown as Record<string, unknown>)
    })
    LocalStore.set(PREFERENCES_MIRROR_KEY, {
      ...DEFAULT_PREFERENCES,
      dice: { ...DEFAULT_PREFERENCES.dice, sendToChat: true },
    })

    const { result } = renderHook(() => usePreferences(), {
      wrapper: makePreferencesWrapper('u1'),
    })

    // First paint: mirror value is visible, network has not resolved yet.
    expect(result.current.ready).toBe(false)
    expect(result.current.preferences.dice.sendToChat).toBe(true)

    await act(async () => { releaseGet(); await Promise.resolve() })
    await waitFor(() => expect(result.current.ready).toBe(true))
  })

  it('keeps the value and logs when the PATCH fails', async () => {
    const spy = installFetch((url, init) => {
      if (url.includes('/api/me/preferences') && (!init || init.method === undefined)) {
        return resolved(DEFAULT_PREFERENCES as unknown as Record<string, unknown>)
      }
      return new MockFetchResponse('{}', { status: 500 })
    })
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {})
    const { result } = renderHook(() => usePreferences(), {
      wrapper: makePreferencesWrapper('u1'),
    })
    await waitFor(() => expect(result.current.ready).toBe(true))

    await act(async () => {
      result.current.setPreference('dice.sendToChat', true)
    })
    await waitFor(() => expect(patchCalls(spy).length).toBeGreaterThan(0))
    await waitFor(() => expect(warn).toHaveBeenCalled())
    expect(result.current.preferences.dice.sendToChat).toBe(true)
  })
})
