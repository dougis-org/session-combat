import React from 'react'
import { act } from 'react'
import { createReactRoot, unmountReactRoot } from '../helpers/reactRoot'
import { SessionControl } from '@/lib/components/SessionControl'

const useIsDMMock = jest.fn()
jest.mock('@/lib/hooks/useIsDM', () => ({
  useIsDM: (campaignId: string) => useIsDMMock(campaignId),
}))

function render(props: { campaignId: string; activeSessionId: string | null; onSessionChange: (id: string | null) => void }) {
  const { container, root } = createReactRoot()
  act(() => {
    root.render(React.createElement(SessionControl, props))
  })
  return { container, unmount: () => unmountReactRoot(container, root) }
}

describe('SessionControl', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    global.fetch = jest.fn()
  })

  test('T2-1: non-DM renders nothing', () => {
    useIsDMMock.mockReturnValue({ isDM: false, loading: false })
    const onSessionChange = jest.fn()
    const { container, unmount } = render({ campaignId: 'camp-1', activeSessionId: null, onSessionChange })

    expect(container.textContent).toBe('')
    unmount()
  })

  test('T2-2: loading renders nothing', () => {
    useIsDMMock.mockReturnValue({ isDM: false, loading: true })
    const onSessionChange = jest.fn()
    const { container, unmount } = render({ campaignId: 'camp-1', activeSessionId: null, onSessionChange })

    expect(container.textContent).toBe('')
    unmount()
  })

  test('T2-3: DM with no active session renders Start Session only', () => {
    useIsDMMock.mockReturnValue({ isDM: true, loading: false })
    const onSessionChange = jest.fn()
    const { container, unmount } = render({ campaignId: 'camp-1', activeSessionId: null, onSessionChange })

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
    const onSessionChange = jest.fn()
    const { container, unmount } = render({ campaignId: 'camp-1', activeSessionId: null, onSessionChange })

    const button = container.querySelector('button')!
    await act(async () => { button.click() })

    expect(global.fetch).toHaveBeenCalledWith('/api/campaigns/camp-1/sessions/active', { method: 'POST' })
    expect(onSessionChange).toHaveBeenCalledTimes(1)
    expect(onSessionChange).toHaveBeenCalledWith('log-1')
    unmount()
  })

  test('T2-5: Start Session 409 reconciles from GET campaign, no error shown', async () => {
    useIsDMMock.mockReturnValue({ isDM: true, loading: false })
    ;(global.fetch as jest.Mock)
      .mockResolvedValueOnce({ status: 409 })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ activeSessionId: 'log-2' }) })
    const onSessionChange = jest.fn()
    const { container, unmount } = render({ campaignId: 'camp-1', activeSessionId: null, onSessionChange })

    const button = container.querySelector('button')!
    await act(async () => { button.click() })

    expect(global.fetch).toHaveBeenNthCalledWith(2, '/api/campaigns/camp-1')
    expect(onSessionChange).toHaveBeenCalledWith('log-2')
    expect(container.textContent).not.toMatch(/error/i)
    unmount()
  })

  test('T2-6: Start Session 500 shows inline error, does not call onSessionChange', async () => {
    useIsDMMock.mockReturnValue({ isDM: true, loading: false })
    ;(global.fetch as jest.Mock).mockResolvedValue({ status: 500 })
    const onSessionChange = jest.fn()
    const { container, unmount } = render({ campaignId: 'camp-1', activeSessionId: null, onSessionChange })

    const button = container.querySelector('button')!
    await act(async () => { button.click() })

    expect(onSessionChange).not.toHaveBeenCalled()
    expect(container.textContent).toContain('Failed to start session')
    expect(button.hasAttribute('disabled')).toBe(false)
    unmount()
  })

  test('T2-7: DM with active session renders End Session and Force end', () => {
    useIsDMMock.mockReturnValue({ isDM: true, loading: false })
    const onSessionChange = jest.fn()
    const { container, unmount } = render({ campaignId: 'camp-1', activeSessionId: 'log-1', onSessionChange })

    expect(container.textContent).toContain('End Session')
    expect(container.textContent).toContain('Force end')
    unmount()
  })

  test('T2-8: clicking End Session deletes (no force) and calls onSessionChange(null) on 200', async () => {
    useIsDMMock.mockReturnValue({ isDM: true, loading: false })
    ;(global.fetch as jest.Mock).mockResolvedValue({ status: 200 })
    const onSessionChange = jest.fn()
    const { container, unmount } = render({ campaignId: 'camp-1', activeSessionId: 'log-1', onSessionChange })

    const [endButton] = Array.from(container.querySelectorAll('button'))
    await act(async () => { endButton.click() })

    expect(global.fetch).toHaveBeenCalledWith('/api/campaigns/camp-1/sessions/active', { method: 'DELETE' })
    expect(onSessionChange).toHaveBeenCalledTimes(1)
    expect(onSessionChange).toHaveBeenCalledWith(null)
    unmount()
  })

  test('T2-9: End Session 404 calls onSessionChange(null), no error shown', async () => {
    useIsDMMock.mockReturnValue({ isDM: true, loading: false })
    ;(global.fetch as jest.Mock).mockResolvedValue({ status: 404 })
    const onSessionChange = jest.fn()
    const { container, unmount } = render({ campaignId: 'camp-1', activeSessionId: 'log-1', onSessionChange })

    const [endButton] = Array.from(container.querySelectorAll('button'))
    await act(async () => { endButton.click() })

    expect(global.fetch).toHaveBeenCalledTimes(1)
    expect(onSessionChange).toHaveBeenCalledWith(null)
    expect(container.textContent).not.toMatch(/error/i)
    unmount()
  })

  test('T2-10: End Session 500 shows inline error, does not call onSessionChange', async () => {
    useIsDMMock.mockReturnValue({ isDM: true, loading: false })
    ;(global.fetch as jest.Mock).mockResolvedValue({ status: 500 })
    const onSessionChange = jest.fn()
    const { container, unmount } = render({ campaignId: 'camp-1', activeSessionId: 'log-1', onSessionChange })

    const [endButton] = Array.from(container.querySelectorAll('button'))
    await act(async () => { endButton.click() })

    expect(onSessionChange).not.toHaveBeenCalled()
    expect(container.textContent).toContain('Failed to end session')
    unmount()
  })

  test('T2-11: clicking Force end deletes with force=true and calls onSessionChange(null)', async () => {
    useIsDMMock.mockReturnValue({ isDM: true, loading: false })
    ;(global.fetch as jest.Mock).mockResolvedValue({ ok: true, status: 200 })
    const onSessionChange = jest.fn()
    const { container, unmount } = render({ campaignId: 'camp-1', activeSessionId: 'log-1', onSessionChange })

    const [, forceButton] = Array.from(container.querySelectorAll('button'))
    await act(async () => { forceButton.click() })

    expect(global.fetch).toHaveBeenCalledWith('/api/campaigns/camp-1/sessions/active?force=true', { method: 'DELETE' })
    expect(onSessionChange).toHaveBeenCalledWith(null)
    unmount()
  })

  test('T2-12: buttons are disabled while a request is in flight', async () => {
    useIsDMMock.mockReturnValue({ isDM: true, loading: false })
    let resolve!: (v: unknown) => void
    ;(global.fetch as jest.Mock).mockReturnValue(new Promise(r => { resolve = r }))
    const onSessionChange = jest.fn()
    const { container, unmount } = render({ campaignId: 'camp-1', activeSessionId: null, onSessionChange })

    const button = container.querySelector('button')!
    act(() => { button.click() })

    expect(button.hasAttribute('disabled')).toBe(true)

    await act(async () => { resolve({ status: 201, json: async () => ({ id: 'log-1' }) }) })
    unmount()
  })
})
