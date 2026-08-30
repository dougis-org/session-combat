import { render, screen, act, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { GlobalDiceFab } from '@/lib/components/GlobalDiceFab'
import { rollDicePool } from '@/lib/utils/dice'
import { announcePresence, clearPresence, resetDiceSessionBridge } from '@/lib/dice/diceSessionBridge'

jest.mock('@/lib/hooks/useAuth', () => ({
  useAuth: jest.fn(),
}))

jest.mock('@/lib/utils/dice', () => ({
  ...jest.requireActual('@/lib/utils/dice'),
  rollDicePool: jest.fn(),
}))

const mockedUseAuth = jest.requireMock('@/lib/hooks/useAuth').useAuth as jest.Mock
const mockedRollDicePool = rollDicePool as jest.Mock
const originalFetch = global.fetch

function mockAuthed() {
  mockedUseAuth.mockReturnValue({ user: { userId: 'user-1', email: 'a@b.com', username: 'tester' }, loading: false })
}

function mockUnauthed() {
  mockedUseAuth.mockReturnValue({ user: null, loading: false })
}

function mockRollPost(result: { status: 201 } | { status: 409 | 500 } | { throws: true }) {
  global.fetch = jest.fn().mockImplementation(() => {
    if ('throws' in result) return Promise.reject(new Error('network down'))
    if (result.status === 201) {
      return Promise.resolve({ status: 201, json: () => Promise.resolve({ id: 'roll-sent' }) })
    }
    return Promise.resolve({ status: result.status, json: () => Promise.resolve({}) })
  }) as unknown as typeof fetch
}

beforeEach(() => {
  jest.clearAllMocks()
  resetDiceSessionBridge()
  mockedRollDicePool.mockReturnValue([{ sides: 20, value: 14 }])
})

afterEach(() => {
  resetDiceSessionBridge()
  global.fetch = originalFetch
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

  it('opening the fab shows a modal anchored to the bottom-left with controls for all six die sizes', async () => {
    mockAuthed()
    const user = userEvent.setup()
    render(<GlobalDiceFab />)
    await user.click(screen.getByRole('button', { name: /roll|dice/i }))
    for (const sides of [4, 6, 8, 10, 12, 20]) {
      expect(screen.getByRole('button', { name: `Add d${sides}` })).toBeInTheDocument()
    }
    expect(screen.getByLabelText('Modifier')).toBeInTheDocument()

    const panel = screen.getByRole('dialog')
    expect(panel).toHaveClass('absolute', 'bottom-4', 'left-4')
  })

  it('background dimming overlay bg-black/50 is present and clicking it closes the modal', async () => {
    mockAuthed()
    const user = userEvent.setup()
    const { container } = render(<GlobalDiceFab />)
    await user.click(screen.getByRole('button', { name: /roll|dice/i }))

    // Find the overlay which is the parent of the dialog
    const panel = screen.getByRole('dialog')
    const overlay = panel.parentElement!

    expect(overlay).toHaveClass('fixed', 'inset-0', 'bg-black/50')
    expect(overlay).not.toHaveClass('flex', 'items-center', 'justify-center')

    // The previous test checks closing, but we ensure it works by clicking the overlay
    await user.click(overlay)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('each die control shows a persistent visible label with no hover tooltip', async () => {
    mockAuthed()
    const user = userEvent.setup()
    render(<GlobalDiceFab />)
    await user.click(screen.getByRole('button', { name: /roll|dice/i }))

    // The label is always visible — not gated behind hover — and unchanged by hover/unhover.
    const d20Button = screen.getByRole('button', { name: 'Add d20' })
    expect(screen.getByText('d20')).toBeInTheDocument()

    await user.hover(d20Button)
    expect(screen.getAllByText('d20')).toHaveLength(1)

    await user.unhover(d20Button)
    expect(screen.getByText('d20')).toBeInTheDocument()
  })

  it('dice buttons do not have native title attributes', async () => {
    mockAuthed()
    const user = userEvent.setup()
    render(<GlobalDiceFab />)
    await user.click(screen.getByRole('button', { name: /roll|dice/i }))

    const d20Button = screen.getByRole('button', { name: 'Add d20' })
    expect(d20Button).not.toHaveAttribute('title')
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

describe('GlobalDiceFab — percentile control', () => {
  it('each die control shows a persistent visible label', async () => {
    mockAuthed()
    const user = userEvent.setup()
    render(<GlobalDiceFab />)
    await user.click(screen.getByRole('button', { name: /roll|dice/i }))
    for (const sides of [4, 6, 8, 10, 12, 20]) {
      expect(within(screen.getByRole('button', { name: `Add d${sides}` })).getByText(`d${sides}`)).toBeInTheDocument()
    }
  })

  it('activating the inline percentile control sets a local d% result with a 1..100 total and no network call', async () => {
    mockAuthed()
    const fetchSpy = jest.fn()
    global.fetch = fetchSpy as unknown as typeof global.fetch
    const user = userEvent.setup()
    render(<GlobalDiceFab />)
    await user.click(screen.getByRole('button', { name: /roll|dice/i }))
    await user.click(screen.getByRole('button', { name: /percentile|d%/i }))

    const resultLine = screen.getByText(/d% → \[\d+\] =/)
    const total = Number(resultLine.textContent!.match(/=\s*(\d+)\s*$/)![1])
    expect(total).toBeGreaterThanOrEqual(1)
    expect(total).toBeLessThanOrEqual(100)
    expect(fetchSpy).not.toHaveBeenCalled()
  })

  it('"Send to session chat" submits the percentile result unchanged when presence exists', async () => {
    mockAuthed()
    mockRollPost({ status: 201 })
    const user = userEvent.setup()
    render(<GlobalDiceFab />)
    act(() => { announcePresence({ campaignId: 'camp-1', sessionId: 'sess-1' }) })
    await user.click(screen.getByRole('button', { name: /roll|dice/i }))
    await user.click(screen.getByRole('button', { name: /percentile|d%/i }))
    const total = Number(screen.getByText(/d% → \[\d+\] =/).textContent!.match(/=\s*(\d+)\s*$/)![1])
    await user.click(screen.getByRole('button', { name: /send to session chat/i }))
    await waitFor(() => {
      const call = (global.fetch as jest.Mock).mock.calls.find(c => String(c[0]).includes('/rolls'))
      expect(call).toBeDefined()
      const body = JSON.parse((call![1] as RequestInit).body as string)
      expect(body.formula).toBe('d%')
      expect(body.rolls).toEqual([total])
      expect(body.total).toBe(total)
    })
  })

  it('the percentile control is disabled while a "Send to session chat" is in flight', async () => {
    mockAuthed()
    let resolveFetch!: (v: unknown) => void
    global.fetch = jest.fn(() => new Promise(resolve => { resolveFetch = resolve })) as unknown as typeof fetch
    const user = userEvent.setup()
    render(<GlobalDiceFab />)
    act(() => { announcePresence({ campaignId: 'camp-1', sessionId: 'sess-1' }) })
    await user.click(screen.getByRole('button', { name: /roll|dice/i }))
    await user.click(screen.getByRole('button', { name: /percentile|d%/i }))
    const total = Number(screen.getByText(/d% → \[\d+\] =/).textContent!.match(/=\s*(\d+)\s*$/)![1])

    user.click(screen.getByRole('button', { name: /send to session chat/i }))
    await waitFor(() => expect(screen.getByRole('button', { name: /percentile|d%/i })).toBeDisabled())
    // The in-flight result cannot be re-targeted by a fresh d% roll.
    await user.click(screen.getByRole('button', { name: /percentile|d%/i }))
    expect(screen.getByText(/d% → \[\d+\] =/).textContent).toContain(`= ${total}`)

    resolveFetch({ status: 201, json: () => Promise.resolve({ id: 'roll-sent' }) })
    await waitFor(() => expect(screen.getByRole('button', { name: /percentile|d%/i })).not.toBeDisabled())
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

  it('choosing to send submits directly to the current presence campaign at click time', async () => {
    mockAuthed()
    mockRollPost({ status: 201 })
    const user = userEvent.setup()
    render(<GlobalDiceFab />)
    act(() => { announcePresence({ campaignId: 'camp-1', sessionId: 'sess-1' }) })
    await user.click(screen.getByRole('button', { name: /roll|dice/i }))
    await user.click(screen.getByRole('button', { name: 'Add d20' }))
    await user.click(screen.getByRole('button', { name: 'Roll' }))
    // presence changes before the send click — the send must use the current value
    act(() => { announcePresence({ campaignId: 'camp-2', sessionId: 'sess-2' }) })
    await user.click(screen.getByRole('button', { name: /send to session chat/i }))
    await waitFor(() => expect(global.fetch).toHaveBeenCalledWith(
      '/api/campaigns/camp-2/rolls',
      expect.objectContaining({ method: 'POST' })
    ))
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

  it('shows a pending state immediately after send, before the request resolves', async () => {
    mockAuthed()
    global.fetch = jest.fn().mockImplementation(() => new Promise(() => { /* never resolves */ })) as unknown as typeof fetch
    const user = userEvent.setup()
    render(<GlobalDiceFab />)
    await rollAndSend(user)
    expect(screen.getByRole('button', { name: /sending/i })).toBeDisabled()
  })

  it('shows a confirmed "Sent" state only once the submission succeeds', async () => {
    mockAuthed()
    mockRollPost({ status: 201 })
    const user = userEvent.setup()
    render(<GlobalDiceFab />)
    await rollAndSend(user)
    await waitFor(() => {
      expect(screen.getByText(/sent to session chat/i)).toBeInTheDocument()
    })
  })

  it('shows a failure state and does not claim success when the roll could not be delivered (409)', async () => {
    mockAuthed()
    mockRollPost({ status: 409 })
    const user = userEvent.setup()
    render(<GlobalDiceFab />)
    await rollAndSend(user)
    await waitFor(() => {
      expect(screen.queryByText(/sent to session chat/i)).not.toBeInTheDocument()
      expect(screen.getByText(/couldn.t send/i)).toBeInTheDocument()
    })
    expect(screen.getByRole('button', { name: /retry send/i })).toBeInTheDocument()
  })

  it('shows a failure state on a network error', async () => {
    mockAuthed()
    mockRollPost({ throws: true })
    const user = userEvent.setup()
    render(<GlobalDiceFab />)
    await rollAndSend(user)
    await waitFor(() => {
      expect(screen.queryByText(/sent to session chat/i)).not.toBeInTheDocument()
      expect(screen.getByText(/couldn.t send/i)).toBeInTheDocument()
    })
  })

  it('sending succeeds with presence set but no CampaignChat rendered in the test tree at all (the bug-fix scenario)', async () => {
    mockAuthed()
    mockRollPost({ status: 201 })
    const user = userEvent.setup()
    // No CampaignChat instance is mounted anywhere in this test — submission
    // must not depend on one being present to receive/relay the roll.
    render(<GlobalDiceFab />)
    await rollAndSend(user)
    await waitFor(() => {
      expect(screen.getByText(/sent to session chat/i)).toBeInTheDocument()
    })
  })
})
