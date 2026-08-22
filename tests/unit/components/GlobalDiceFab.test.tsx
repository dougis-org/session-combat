import { render, screen, act, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { GlobalDiceFab } from '@/lib/components/GlobalDiceFab'
import { rollDicePool } from '@/lib/utils/dice'
import { announcePresence, clearPresence, onRollRequested, resetDiceSessionBridge } from '@/lib/dice/diceSessionBridge'

jest.mock('@/lib/hooks/useAuth', () => ({
  useAuth: jest.fn(),
}))

jest.mock('@/lib/utils/dice', () => ({
  ...jest.requireActual('@/lib/utils/dice'),
  rollDicePool: jest.fn(),
}))

const mockedUseAuth = jest.requireMock('@/lib/hooks/useAuth').useAuth as jest.Mock
const mockedRollDicePool = rollDicePool as jest.Mock

function mockAuthed() {
  mockedUseAuth.mockReturnValue({ user: { userId: 'user-1', email: 'a@b.com', username: 'tester' }, loading: false })
}

function mockUnauthed() {
  mockedUseAuth.mockReturnValue({ user: null, loading: false })
}

beforeEach(() => {
  jest.clearAllMocks()
  resetDiceSessionBridge()
  mockedRollDicePool.mockReturnValue([{ sides: 20, value: 14 }])
})

afterEach(() => {
  resetDiceSessionBridge()
})

describe('GlobalDiceFab — visibility', () => {
  it('renders for an authenticated user with an accessible name matching roll/dice', () => {
    mockAuthed()
    render(<GlobalDiceFab />)
    expect(screen.getByRole('button', { name: /roll|dice/i })).toBeInTheDocument()
  })

  it('is absent for an unauthenticated user', () => {
    mockUnauthed()
    const { container } = render(<GlobalDiceFab />)
    expect(container).toBeEmptyDOMElement()
  })
})

describe('GlobalDiceFab — standalone modal', () => {
  it('the modal is not mounted until the fab is first opened', () => {
    mockAuthed()
    render(<GlobalDiceFab />)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('opening the fab shows a center-screen modal with controls for all six die sizes', async () => {
    mockAuthed()
    const user = userEvent.setup()
    render(<GlobalDiceFab />)
    await user.click(screen.getByRole('button', { name: /roll|dice/i }))
    for (const sides of [4, 6, 8, 10, 12, 20]) {
      expect(screen.getByRole('button', { name: `Add d${sides}` })).toBeInTheDocument()
    }
    expect(screen.getByLabelText('Modifier')).toBeInTheDocument()
  })

  it('rolling with no presence produces a local result and no network call', async () => {
    mockAuthed()
    const fetchSpy = jest.fn()
    global.fetch = fetchSpy as unknown as typeof global.fetch
    const user = userEvent.setup()
    render(<GlobalDiceFab />)
    await user.click(screen.getByRole('button', { name: /roll|dice/i }))
    await user.click(screen.getByRole('button', { name: 'Add d20' }))
    await user.click(screen.getByRole('button', { name: 'Roll' }))
    expect(screen.getByText(/1d20/)).toBeInTheDocument()
    expect(fetchSpy).not.toHaveBeenCalled()
  })

  it('empty pool cannot be rolled', async () => {
    mockAuthed()
    const user = userEvent.setup()
    render(<GlobalDiceFab />)
    await user.click(screen.getByRole('button', { name: /roll|dice/i }))
    expect(screen.getByRole('button', { name: 'Roll' })).toBeDisabled()
  })
})

describe('GlobalDiceFab — modal close behavior', () => {
  it('Escape closes the modal', async () => {
    mockAuthed()
    const user = userEvent.setup()
    render(<GlobalDiceFab />)
    await user.click(screen.getByRole('button', { name: /roll|dice/i }))
    expect(screen.getByRole('button', { name: 'Roll' })).toBeInTheDocument()
    await user.keyboard('{Escape}')
    expect(screen.queryByRole('button', { name: 'Roll' })).not.toBeInTheDocument()
  })

  it('outside click closes the modal', async () => {
    mockAuthed()
    const user = userEvent.setup()
    render(<GlobalDiceFab />)
    await user.click(screen.getByRole('button', { name: /roll|dice/i }))
    expect(screen.getByRole('button', { name: 'Roll' })).toBeInTheDocument()
    await user.click(document.body)
    expect(screen.queryByRole('button', { name: 'Roll' })).not.toBeInTheDocument()
  })

  it('modal remains open with no timer-driven auto-close', async () => {
    jest.useFakeTimers()
    mockAuthed()
    const user = userEvent.setup({ delay: null })
    render(<GlobalDiceFab />)
    await user.click(screen.getByRole('button', { name: /roll|dice/i }))
    act(() => { jest.advanceTimersByTime(60_000) })
    expect(screen.getByRole('button', { name: 'Roll' })).toBeInTheDocument()
    jest.useRealTimers()
  })
})

describe('GlobalDiceFab — send to session chat', () => {
  it('option is hidden with no presence announced', async () => {
    mockAuthed()
    const user = userEvent.setup()
    render(<GlobalDiceFab />)
    await user.click(screen.getByRole('button', { name: /roll|dice/i }))
    await user.click(screen.getByRole('button', { name: 'Add d20' }))
    await user.click(screen.getByRole('button', { name: 'Roll' }))
    expect(screen.queryByRole('button', { name: /send to session chat/i })).not.toBeInTheDocument()
  })

  it('option is shown once presence is announced', async () => {
    mockAuthed()
    const user = userEvent.setup()
    render(<GlobalDiceFab />)
    act(() => { announcePresence({ campaignId: 'camp-1', sessionId: 'sess-1' }) })
    await user.click(screen.getByRole('button', { name: /roll|dice/i }))
    await user.click(screen.getByRole('button', { name: 'Add d20' }))
    await user.click(screen.getByRole('button', { name: 'Roll' }))
    expect(screen.getByRole('button', { name: /send to session chat/i })).toBeInTheDocument()
  })

  it('choosing to send emits a scoped roll request using the current presence value at click time', async () => {
    mockAuthed()
    const received: unknown[] = []
    onRollRequested(payload => received.push(payload))
    const user = userEvent.setup()
    render(<GlobalDiceFab />)
    act(() => { announcePresence({ campaignId: 'camp-1', sessionId: 'sess-1' }) })
    await user.click(screen.getByRole('button', { name: /roll|dice/i }))
    await user.click(screen.getByRole('button', { name: 'Add d20' }))
    await user.click(screen.getByRole('button', { name: 'Roll' }))
    // presence changes before the send click — the send must use the current value
    act(() => { announcePresence({ campaignId: 'camp-2', sessionId: 'sess-2' }) })
    await user.click(screen.getByRole('button', { name: /send to session chat/i }))
    await waitFor(() => expect(received).toHaveLength(1))
    expect(received[0]).toMatchObject({ campaignId: 'camp-2', sessionId: 'sess-2' })
  })

  it('option disappears when presence is cleared while the modal is open', async () => {
    mockAuthed()
    const user = userEvent.setup()
    render(<GlobalDiceFab />)
    act(() => { announcePresence({ campaignId: 'camp-1', sessionId: 'sess-1' }) })
    await user.click(screen.getByRole('button', { name: /roll|dice/i }))
    await user.click(screen.getByRole('button', { name: 'Add d20' }))
    await user.click(screen.getByRole('button', { name: 'Roll' }))
    expect(screen.getByRole('button', { name: /send to session chat/i })).toBeInTheDocument()
    act(() => { clearPresence() })
    expect(screen.queryByRole('button', { name: /send to session chat/i })).not.toBeInTheDocument()
  })

  async function rollAndSend(user: ReturnType<typeof userEvent.setup>) {
    act(() => { announcePresence({ campaignId: 'camp-1', sessionId: 'sess-1' }) })
    await user.click(screen.getByRole('button', { name: /roll|dice/i }))
    await user.click(screen.getByRole('button', { name: 'Add d20' }))
    await user.click(screen.getByRole('button', { name: 'Roll' }))
    await user.click(screen.getByRole('button', { name: /send to session chat/i }))
  }

  it('shows a pending state immediately after send, before the ack resolves', async () => {
    mockAuthed()
    onRollRequested(() => { /* never acks */ })
    const user = userEvent.setup()
    render(<GlobalDiceFab />)
    await rollAndSend(user)
    expect(screen.getByRole('button', { name: /sending/i })).toBeDisabled()
  })

  it('shows a confirmed "Sent" state only once the receiving CampaignChat acks success', async () => {
    mockAuthed()
    onRollRequested(payload => payload.onResult?.('success'))
    const user = userEvent.setup()
    render(<GlobalDiceFab />)
    await rollAndSend(user)
    await waitFor(() => {
      expect(screen.getByText(/sent to session chat/i)).toBeInTheDocument()
    })
  })

  it('shows a failure state and does not claim success when the roll could not be delivered', async () => {
    mockAuthed()
    onRollRequested(payload => payload.onResult?.('error'))
    const user = userEvent.setup()
    render(<GlobalDiceFab />)
    await rollAndSend(user)
    await waitFor(() => {
      expect(screen.queryByText(/sent to session chat/i)).not.toBeInTheDocument()
      expect(screen.getByText(/couldn.t send/i)).toBeInTheDocument()
    })
    expect(screen.getByRole('button', { name: /retry send/i })).toBeInTheDocument()
  })

  it('shows a failure state when no CampaignChat is mounted to receive the request', async () => {
    mockAuthed()
    // no onRollRequested subscriber at all — requestRoll() drops the payload before dispatch
    const user = userEvent.setup()
    render(<GlobalDiceFab />)
    act(() => { announcePresence({ campaignId: 'camp-1', sessionId: 'sess-1' }) })
    await user.click(screen.getByRole('button', { name: /roll|dice/i }))
    await user.click(screen.getByRole('button', { name: 'Add d20' }))
    await user.click(screen.getByRole('button', { name: 'Roll' }))
    await user.click(screen.getByRole('button', { name: /send to session chat/i }))
    // With zero subscribers, requestRoll delivers to nobody and no ack ever fires;
    // the button must not silently flip to a false "sent" confirmation.
    expect(screen.queryByText(/sent to session chat/i)).not.toBeInTheDocument()
  })
})

