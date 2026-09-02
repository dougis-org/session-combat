import { render, screen, act, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { GlobalDiceFab } from '@/lib/components/GlobalDiceFab'
import { LocalStore } from '@/lib/offline/LocalStore'
import { announcePresence, clearPresence, resetDiceSessionBridge } from '@/lib/dice/diceSessionBridge'
import { mockAuthed, mockRollPost, mockedRollDicePool, open } from './__helpers__/globalDiceFabHarness'

jest.mock('@/lib/hooks/useAuth', () => ({
  useAuth: jest.fn(),
}))

jest.mock('@/lib/utils/dice', () => ({
  ...jest.requireActual('@/lib/utils/dice'),
  rollDicePool: jest.fn(),
}))

const runMock = jest.fn().mockResolvedValue(true)
const teardownMock = jest.fn()
const useDiceAnimationMock = jest.fn(() => ({ status: 'idle', run: runMock, teardown: teardownMock }))
jest.mock('@/lib/dice/useDiceAnimation', () => ({
  ...jest.requireActual('@/lib/dice/useDiceAnimation'),
  useDiceAnimation: (...args: unknown[]) => useDiceAnimationMock(...(args as [])),
}))

describe('GlobalDiceFab — send to session chat (persisted checkbox)', () => {
  it('the checkbox is hidden with no presence announced', async () => {
    mockAuthed()
    const user = userEvent.setup()
    render(<GlobalDiceFab />)
    await open(user)
    expect(screen.queryByRole('checkbox', { name: /send to session chat/i })).not.toBeInTheDocument()
  })

  it('the checkbox appears once presence is announced and disappears when cleared', async () => {
    mockAuthed()
    const user = userEvent.setup()
    render(<GlobalDiceFab />)
    act(() => { announcePresence({ campaignId: 'camp-1', sessionId: 'sess-1' }) })
    await open(user)
    expect(screen.getByRole('checkbox', { name: /send to session chat/i })).toBeInTheDocument()
    act(() => { clearPresence() })
    expect(screen.queryByRole('checkbox', { name: /send to session chat/i })).not.toBeInTheDocument()
  })

  it('checked + active session + Roll → submitRoll called once with exact args; seam waits for the promise', async () => {
    mockAuthed()
    let resolveFetch!: (v: unknown) => void
    global.fetch = jest.fn(() => new Promise(resolve => { resolveFetch = resolve })) as unknown as typeof fetch
    mockedRollDicePool.mockReturnValue([{ sides: 20, value: 14 }])
    const user = userEvent.setup()
    render(<GlobalDiceFab />)
    act(() => { announcePresence({ campaignId: 'camp-1', sessionId: 'sess-1' }) })
    await open(user)
    await user.click(screen.getByRole('checkbox', { name: /send to session chat/i }))
    await user.click(screen.getByRole('button', { name: 'Add d20' }))
    await user.click(screen.getByRole('button', { name: 'Roll' }))

    await waitFor(() => expect(global.fetch).toHaveBeenCalledTimes(1))
    const [url, init] = (global.fetch as jest.Mock).mock.calls[0]
    expect(url).toBe('/api/campaigns/camp-1/rolls')
    expect(JSON.parse((init as RequestInit).body as string)).toEqual({
      formula: '1d20', rolls: [14], total: 14, visibility: { scope: 'group' },
    })
    expect(screen.getByText(/Sending/i)).toBeInTheDocument()
    expect(runMock).not.toHaveBeenCalled()

    resolveFetch({ status: 201, json: () => Promise.resolve({ id: 'r' }) })
    await waitFor(() => expect(screen.getByText(/sent to session chat/i)).toBeInTheDocument())
    await waitFor(() => expect(runMock).toHaveBeenCalledTimes(1))
  })

  it('unchecked + presence + Roll → no network request; animation runs immediately', async () => {
    mockAuthed()
    const fetchSpy = jest.fn()
    global.fetch = fetchSpy as unknown as typeof global.fetch
    const user = userEvent.setup()
    render(<GlobalDiceFab />)
    act(() => { announcePresence({ campaignId: 'camp-1', sessionId: 'sess-1' }) })
    await open(user)
    await user.click(screen.getByRole('button', { name: 'Add d20' }))
    await user.click(screen.getByRole('button', { name: 'Roll' }))
    expect(fetchSpy).not.toHaveBeenCalled()
    await waitFor(() => expect(runMock).toHaveBeenCalledTimes(1))
  })

  it('checked + no presence + Roll → no network request; animation runs immediately', async () => {
    mockAuthed()
    LocalStore.set('preferences', { dice: { sendToChat: true } })
    const fetchSpy = jest.fn()
    global.fetch = fetchSpy as unknown as typeof global.fetch
    const user = userEvent.setup()
    render(<GlobalDiceFab />)
    await open(user)
    await user.click(screen.getByRole('button', { name: 'Add d20' }))
    await user.click(screen.getByRole('button', { name: 'Roll' }))
    expect(fetchSpy).not.toHaveBeenCalled()
    await waitFor(() => expect(runMock).toHaveBeenCalledTimes(1))
  })

  it.each([
    ['409 conflict', { status: 409 as const }],
    ['network error', { throws: true as const }],
  ])('failed persistence (%s) still animates and offers retry, no throw', async (_label, postResult) => {
    mockAuthed()
    mockRollPost(postResult)
    const user = userEvent.setup()
    render(<GlobalDiceFab />)
    act(() => { announcePresence({ campaignId: 'camp-1', sessionId: 'sess-1' }) })
    await open(user)
    await user.click(screen.getByRole('checkbox', { name: /send to session chat/i }))
    await user.click(screen.getByRole('button', { name: 'Add d20' }))
    await user.click(screen.getByRole('button', { name: 'Roll' }))
    await waitFor(() => expect(screen.getByText(/couldn.t send/i)).toBeInTheDocument())
    expect(screen.getByRole('button', { name: /retry send/i })).toBeInTheDocument()
    expect(screen.queryByText(/sent to session chat/i)).not.toBeInTheDocument()
    await waitFor(() => expect(runMock).toHaveBeenCalled())
  })

  it('retry send re-submits the last roll', async () => {
    mockAuthed()
    mockRollPost({ status: 409 })
    const user = userEvent.setup()
    render(<GlobalDiceFab />)
    act(() => { announcePresence({ campaignId: 'camp-1', sessionId: 'sess-1' }) })
    await open(user)
    await user.click(screen.getByRole('checkbox', { name: /send to session chat/i }))
    await user.click(screen.getByRole('button', { name: 'Add d20' }))
    await user.click(screen.getByRole('button', { name: 'Roll' }))
    await screen.findByRole('button', { name: /retry send/i })
    mockRollPost({ status: 201 })
    await user.click(screen.getByRole('button', { name: /retry send/i }))
    await waitFor(() => expect(screen.getByText(/sent to session chat/i)).toBeInTheDocument())
  })

  it('the checkbox state persists across remount while presence exists', async () => {
    mockAuthed()
    const user = userEvent.setup()
    const view = render(<GlobalDiceFab />)
    act(() => { announcePresence({ campaignId: 'camp-1', sessionId: 'sess-1' }) })
    await open(user)
    await user.click(screen.getByRole('checkbox', { name: /send to session chat/i }))
    expect(screen.getByRole('checkbox', { name: /send to session chat/i })).toBeChecked()

    view.unmount()
    resetDiceSessionBridge()
    render(<GlobalDiceFab />)
    act(() => { announcePresence({ campaignId: 'camp-1', sessionId: 'sess-1' }) })
    await open(user)
    await waitFor(() =>
      expect(screen.getByRole('checkbox', { name: /send to session chat/i })).toBeChecked(),
    )
  })

  it('the old post-roll "Send to session chat" button is gone', async () => {
    mockAuthed()
    const user = userEvent.setup()
    render(<GlobalDiceFab />)
    act(() => { announcePresence({ campaignId: 'camp-1', sessionId: 'sess-1' }) })
    await open(user)
    await user.click(screen.getByRole('button', { name: 'Add d20' }))
    await user.click(screen.getByRole('button', { name: 'Roll' }))
    expect(screen.queryByRole('button', { name: /send to session chat/i })).not.toBeInTheDocument()
  })
})
