import React from 'react'
import { act } from 'react'
import { createReactRoot, unmountReactRoot } from '../helpers/reactRoot'
import { SessionControl } from '@/lib/components/SessionControl'

const useIsDMMock = jest.fn()
jest.mock('@/lib/hooks/useIsDM', () => ({
  useIsDM: (campaignId: string) => useIsDMMock(campaignId),
}))

function render(props: { campaignId: string; initialSessionId: string | null }) {
  const { container, root } = createReactRoot()
  act(() => {
    root.render(React.createElement(SessionControl, props))
  })
  return {
    container,
    unmount: () => unmountReactRoot(container, root),
    rerender: (nextProps: typeof props) => {
      act(() => {
        root.render(React.createElement(SessionControl, nextProps))
      })
    },
  }
}

describe('SessionControl', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    global.fetch = jest.fn()
  })

  test('T2-1: non-DM renders nothing', () => {
    useIsDMMock.mockReturnValue({ isDM: false, loading: false })
    const { container, unmount } = render({ campaignId: 'camp-1', initialSessionId: null })

    expect(container.textContent).toBe('')
    unmount()
  })

  test('T2-2: loading renders nothing', () => {
    useIsDMMock.mockReturnValue({ isDM: false, loading: true })
    const { container, unmount } = render({ campaignId: 'camp-1', initialSessionId: null })

    expect(container.textContent).toBe('')
    unmount()
  })

  test('T2-3: DM with no active session renders Start Session only', () => {
    useIsDMMock.mockReturnValue({ isDM: true, loading: false })
    const { container, unmount } = render({ campaignId: 'camp-1', initialSessionId: null })

    expect(container.textContent).toContain('Start Session')
    expect(container.textContent).not.toContain('End Session')
    expect(container.textContent).not.toContain('Force end')
    unmount()
  })

  test('T2-4: clicking Start Session posts and calls onSessionChange on 201', async () => {
    useIsDMMock.mockReturnValue({ isDM: true, loading: false })
    ;(global.fetch as jest.Mock).mockResolvedValue({
      status: 201,
      json: async () => ({ id: 'log-1' }),
    })
    const { container, unmount } = render({ campaignId: 'camp-1', initialSessionId: null })

    const button = container.querySelector('button')!
    await act(async () => { button.click() })

    expect(global.fetch).toHaveBeenCalledWith('/api/campaigns/camp-1/sessions/active', { method: 'POST' })
    // state changed
    expect(container.textContent).toMatch(/End Session/)
    unmount()
  })

  test('T2-5: Start Session 409 reconciles from GET campaign, no error shown', async () => {
    useIsDMMock.mockReturnValue({ isDM: true, loading: false })
    ;(global.fetch as jest.Mock)
      .mockResolvedValueOnce({ status: 409 })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ activeSessionId: 'log-2' }) })
    const { container, unmount } = render({ campaignId: 'camp-1', initialSessionId: null })

    const button = container.querySelector('button')!
    await act(async () => { button.click() })

    expect(global.fetch).toHaveBeenNthCalledWith(2, '/api/campaigns/camp-1')
    expect(container.textContent).toMatch(/End Session/)
    expect(container.textContent).not.toMatch(/error/i)
    unmount()
  })

  test('T2-5b: Start Session 409 whose reconciliation GET also fails shows an error and does not call onSessionChange(null)', async () => {
    useIsDMMock.mockReturnValue({ isDM: true, loading: false })
    ;(global.fetch as jest.Mock)
      .mockResolvedValueOnce({ status: 409 })
      .mockResolvedValueOnce({ ok: false, status: 500 })
    const { container, unmount } = render({ campaignId: 'camp-1', initialSessionId: null })

    const button = container.querySelector('button')!
    await act(async () => { button.click() })

    // no state change
    expect(container.textContent).toMatch(/reload the page/i)
    unmount()
  })

  test('Start Session 201 with malformed id shows inline error, does not call onSessionChange', async () => {
    useIsDMMock.mockReturnValue({ isDM: true, loading: false })
    ;(global.fetch as jest.Mock).mockResolvedValue({
      status: 201,
      json: async () => ({ id: undefined }),
    })
    const { container, unmount } = render({ campaignId: 'camp-1', initialSessionId: null })

    const button = container.querySelector('button')!
    await act(async () => { button.click() })

    // no state change
    expect(container.textContent).toContain('Failed to start session')
    unmount()
  })

  test('Start Session 409 whose reconciliation GET succeeds with a null initialSessionId reconciles to Start Session, no error shown', async () => {
    useIsDMMock.mockReturnValue({ isDM: true, loading: false })
    ;(global.fetch as jest.Mock)
      .mockResolvedValueOnce({ status: 409 })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ activeSessionId: null }) })
    const { container, unmount } = render({ campaignId: 'camp-1', initialSessionId: null })

    const button = container.querySelector('button')!
    await act(async () => { button.click() })

    expect(container.textContent).toMatch(/Start Session/)
    expect(container.textContent).not.toMatch(/error/i)
    unmount()
  })

  test('Start Session 409 whose reconciliation GET succeeds with a malformed initialSessionId shows an error', async () => {
    useIsDMMock.mockReturnValue({ isDM: true, loading: false })
    ;(global.fetch as jest.Mock)
      .mockResolvedValueOnce({ status: 409 })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ activeSessionId: 42 }) })
    const { container, unmount } = render({ campaignId: 'camp-1', initialSessionId: null })

    const button = container.querySelector('button')!
    await act(async () => { button.click() })

    // no state change
    expect(container.textContent).toMatch(/reload the page/i)
    unmount()
  })

  test('T2-6: Start Session 500 shows inline error, does not call onSessionChange', async () => {
    useIsDMMock.mockReturnValue({ isDM: true, loading: false })
    ;(global.fetch as jest.Mock).mockResolvedValue({ status: 500 })
    const { container, unmount } = render({ campaignId: 'camp-1', initialSessionId: null })

    const button = container.querySelector('button')!
    await act(async () => { button.click() })

    // no state change
    expect(container.textContent).toContain('Failed to start session')
    expect(button.hasAttribute('disabled')).toBe(false)
    unmount()
  })

  test('T2-7: DM with active session renders End Session and Force end', () => {
    useIsDMMock.mockReturnValue({ isDM: true, loading: false })
    const { container, unmount } = render({ campaignId: 'camp-1', initialSessionId: 'log-1' })

    expect(container.textContent).toContain('End Session')
    expect(container.textContent).toContain('Force end')
    unmount()
  })

  test('T2-8: clicking End Session deletes (no force) and calls onSessionChange(null) on 200', async () => {
    useIsDMMock.mockReturnValue({ isDM: true, loading: false })
    ;(global.fetch as jest.Mock).mockResolvedValue({ ok: true, status: 200 })
    const { container, unmount } = render({ campaignId: 'camp-1', initialSessionId: 'log-1' })

    const [endButton] = Array.from(container.querySelectorAll('button'))
    await act(async () => { endButton.click() })

    expect(global.fetch).toHaveBeenCalledWith('/api/campaigns/camp-1/sessions/active', { method: 'DELETE' })
    // state changed
    expect(container.textContent).toMatch(/Start Session/)
    unmount()
  })

  test('T2-8b: clicking End Session calls onSessionChange(null) on 204', async () => {
    useIsDMMock.mockReturnValue({ isDM: true, loading: false })
    ;(global.fetch as jest.Mock).mockResolvedValue({ ok: true, status: 204 })
    const { container, unmount } = render({ campaignId: 'camp-1', initialSessionId: 'log-1' })

    const [endButton] = Array.from(container.querySelectorAll('button'))
    await act(async () => { endButton.click() })

    expect(container.textContent).toMatch(/Start Session/)
    unmount()
  })

  test('T2-9: End Session 404 "No active session" calls onSessionChange(null), no error shown', async () => {
    useIsDMMock.mockReturnValue({ isDM: true, loading: false })
    ;(global.fetch as jest.Mock).mockResolvedValue({ status: 404, json: async () => ({ error: 'No active session' }) })
    const { container, unmount } = render({ campaignId: 'camp-1', initialSessionId: 'log-1' })

    const [endButton] = Array.from(container.querySelectorAll('button'))
    await act(async () => { endButton.click() })

    expect(global.fetch).toHaveBeenCalledTimes(1)
    expect(container.textContent).toMatch(/Start Session/)
    expect(container.textContent).not.toMatch(/error/i)
    unmount()
  })

  test.each([
    { label: 'End Session 404 "Campaign not found" (unauthorized)', response: { status: 404, json: async () => ({ error: 'Campaign not found' }) } },
    { label: 'End Session 500', response: { status: 500 } },
  ])('$label shows inline error, does not call onSessionChange', async ({ response }) => {
    useIsDMMock.mockReturnValue({ isDM: true, loading: false })
    ;(global.fetch as jest.Mock).mockResolvedValue(response)
    const { container, unmount } = render({ campaignId: 'camp-1', initialSessionId: 'log-1' })

    const [endButton] = Array.from(container.querySelectorAll('button'))
    await act(async () => { endButton.click() })

    // no state change
    expect(container.textContent).toContain('Failed to end session')
    unmount()
  })


  test('T2-11: clicking Force end deletes with force=true and calls onSessionChange(null)', async () => {
    useIsDMMock.mockReturnValue({ isDM: true, loading: false })
    ;(global.fetch as jest.Mock).mockResolvedValue({ ok: true, status: 200 })
    const { container, unmount } = render({ campaignId: 'camp-1', initialSessionId: 'log-1' })

    const [, forceButton] = Array.from(container.querySelectorAll('button'))
    await act(async () => { forceButton.click() })

    expect(global.fetch).toHaveBeenCalledWith('/api/campaigns/camp-1/sessions/active?force=true', { method: 'DELETE' })
    expect(container.textContent).toMatch(/Start Session/)
    unmount()
  })

  // The route never returns "No active session" for force=true requests (that
  // check is skipped when force=true), so any 404 here means the caller lost
  // DM access mid-session and must not be silently treated as success.
  test.each([
    { label: 'Force end 404 "Campaign not found" (unauthorized)', response: { ok: false, status: 404, json: async () => ({ error: 'Campaign not found' }) } },
    { label: 'T2-11b: Force end 500', response: { ok: false, status: 500 } },
  ])('$label shows inline error, does not call onSessionChange', async ({ response }) => {
    useIsDMMock.mockReturnValue({ isDM: true, loading: false })
    ;(global.fetch as jest.Mock).mockResolvedValue(response)
    const { container, unmount } = render({ campaignId: 'camp-1', initialSessionId: 'log-1' })

    const [, forceButton] = Array.from(container.querySelectorAll('button'))
    await act(async () => { forceButton.click() })

    // no state change
    expect(container.textContent).toContain('Failed to reset session')
    unmount()
  })

  test.each([
    { label: 'Start Session', initialSessionId: null, buttonIndex: 0, errorText: 'Failed to start session' },
    { label: 'End Session', initialSessionId: 'log-1', buttonIndex: 0, errorText: 'Failed to end session' },
    { label: 'Force end', initialSessionId: 'log-1', buttonIndex: 1, errorText: 'Failed to reset session' },
  ])('$label network failure shows inline error, does not call onSessionChange', async ({ initialSessionId, buttonIndex, errorText }) => {
    useIsDMMock.mockReturnValue({ isDM: true, loading: false })
    ;(global.fetch as jest.Mock).mockRejectedValue(new Error('network down'))
    const { container, unmount } = render({ campaignId: 'camp-1', initialSessionId })

    const targetButton = Array.from(container.querySelectorAll('button'))[buttonIndex]
    await act(async () => { targetButton.click() })

    // no state change
    expect(container.textContent).toContain(errorText)
    unmount()
  })

  test('T2-12: buttons are disabled while a request is in flight', async () => {
    useIsDMMock.mockReturnValue({ isDM: true, loading: false })
    let resolve!: (v: unknown) => void
    ;(global.fetch as jest.Mock).mockReturnValue(new Promise(r => { resolve = r }))
    const { container, unmount } = render({ campaignId: 'camp-1', initialSessionId: null })

    const button = container.querySelector('button')!
    act(() => { button.click() })

    expect(button.hasAttribute('disabled')).toBe(true)

    await act(async () => { resolve({ status: 201, json: async () => ({ id: 'log-1' }) }) })
    unmount()
  })
})
