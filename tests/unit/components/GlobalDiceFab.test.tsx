import { render, screen, act, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { GlobalDiceFab } from '@/lib/components/GlobalDiceFab'
import { rollDicePool } from '@/lib/utils/dice'
import { LocalStore } from '@/lib/offline/LocalStore'
import { announcePresence, clearPresence, resetDiceSessionBridge } from '@/lib/dice/diceSessionBridge'

jest.mock('@/lib/hooks/useAuth', () => ({
  useAuth: jest.fn(),
}))

jest.mock('@/lib/utils/dice', () => ({
  ...jest.requireActual('@/lib/utils/dice'),
  rollDicePool: jest.fn(),
}))

const runMock = jest.fn().mockResolvedValue(undefined)
const teardownMock = jest.fn()
jest.mock('@/lib/dice/useDiceAnimation', () => ({
  useDiceAnimation: () => ({ status: 'idle', run: runMock, teardown: teardownMock }),
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

function mockMatchMedia(reduceMotion = false) {
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
  LocalStore.clear()
  mockMatchMedia(false)
  resetDiceSessionBridge()
  mockedRollDicePool.mockReturnValue([{ sides: 20, value: 14 }])
})

afterEach(() => {
  resetDiceSessionBridge()
  global.fetch = originalFetch
})

async function open(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole('button', { name: /roll|dice/i }))
}

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
    await open(user)
    for (const sides of [4, 6, 8, 10, 12, 20]) {
      expect(screen.getByRole('button', { name: `Add d${sides}` })).toBeInTheDocument()
    }
    expect(screen.getByLabelText('Modifier')).toBeInTheDocument()
    expect(screen.getByRole('dialog')).toHaveClass('absolute', 'bottom-4', 'left-4')
  })

  it('background dimming overlay bg-black/50 is present and clicking it closes the modal', async () => {
    mockAuthed()
    const user = userEvent.setup()
    render(<GlobalDiceFab />)
    await open(user)
    const overlay = screen.getByRole('dialog').parentElement!
    expect(overlay).toHaveClass('fixed', 'inset-0', 'bg-black/50')
    expect(overlay).not.toHaveClass('flex', 'items-center', 'justify-center')
    await user.click(overlay)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('each die control shows a persistent visible label with no hover tooltip', async () => {
    mockAuthed()
    const user = userEvent.setup()
    render(<GlobalDiceFab />)
    await open(user)
    const d20Button = screen.getByRole('button', { name: 'Add d20' })
    expect(within(d20Button).getByText('d20')).toBeInTheDocument()
    await user.hover(d20Button)
    expect(within(d20Button).getAllByText('d20')).toHaveLength(1)
    expect(d20Button).not.toHaveAttribute('title')
  })

  it('rolling with no presence produces a local result and no network call', async () => {
    mockAuthed()
    const fetchSpy = jest.fn()
    global.fetch = fetchSpy as unknown as typeof global.fetch
    const user = userEvent.setup()
    render(<GlobalDiceFab />)
    await open(user)
    await user.click(screen.getByRole('button', { name: 'Add d20' }))
    await user.click(screen.getByRole('button', { name: 'Roll' }))
    expect(screen.getByText(/1d20 →/)).toBeInTheDocument()
    expect(fetchSpy).not.toHaveBeenCalled()
  })

  it('empty pool cannot be rolled', async () => {
    mockAuthed()
    const user = userEvent.setup()
    render(<GlobalDiceFab />)
    await open(user)
    expect(screen.getByRole('button', { name: 'Roll' })).toBeDisabled()
  })
})

describe('GlobalDiceFab — modal close behavior', () => {
  it('Escape closes the modal', async () => {
    mockAuthed()
    const user = userEvent.setup()
    render(<GlobalDiceFab />)
    await open(user)
    expect(screen.getByRole('button', { name: 'Roll' })).toBeInTheDocument()
    await user.keyboard('{Escape}')
    expect(screen.queryByRole('button', { name: 'Roll' })).not.toBeInTheDocument()
  })

  it('modal remains open with no timer-driven auto-close', async () => {
    jest.useFakeTimers()
    mockAuthed()
    const user = userEvent.setup({ delay: null })
    render(<GlobalDiceFab />)
    await open(user)
    act(() => { jest.advanceTimersByTime(60_000) })
    expect(screen.getByRole('button', { name: 'Roll' })).toBeInTheDocument()
    jest.useRealTimers()
  })
})

describe('GlobalDiceFab — roll overlay + total modal', () => {
  it('rolling opens the total modal above the panel showing the total, and the panel stays open', async () => {
    mockAuthed()
    const user = userEvent.setup()
    mockedRollDicePool.mockReturnValue([{ sides: 20, value: 14 }])
    render(<GlobalDiceFab />)
    await open(user)
    await user.click(screen.getByRole('button', { name: 'Add d20' }))
    await user.click(screen.getByRole('button', { name: 'Roll' }))
    const overlayDialog = await screen.findByRole('dialog', { name: /dice roll result/i })
    expect(overlayDialog).toHaveTextContent('14')
    expect(screen.getByRole('button', { name: 'Roll' })).toBeInTheDocument()
  })

  it('pressing Escape dismisses the overlay and leaves the panel open with the pool intact', async () => {
    mockAuthed()
    const user = userEvent.setup()
    render(<GlobalDiceFab />)
    await open(user)
    await user.click(screen.getByRole('button', { name: 'Add d20' }))
    await user.click(screen.getByRole('button', { name: 'Roll' }))
    await screen.findByRole('dialog', { name: /dice roll result/i })
    await user.keyboard('{Escape}')
    expect(screen.queryByRole('dialog', { name: /dice roll result/i })).not.toBeInTheDocument()
    // the FAB panel stays open with its pool + roll controls intact
    expect(screen.getByRole('dialog', { name: /roll dice/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Roll' })).toBeInTheDocument()
    expect(screen.getByText(/1d20 →/)).toBeInTheDocument()
  })

  it('a second roll shows exactly one overlay', async () => {
    mockAuthed()
    const user = userEvent.setup()
    render(<GlobalDiceFab />)
    await open(user)
    await user.click(screen.getByRole('button', { name: 'Add d20' }))
    await user.click(screen.getByRole('button', { name: 'Roll' }))
    await screen.findByRole('dialog', { name: /dice roll result/i })
    await user.click(screen.getByRole('button', { name: 'Roll' }))
    expect(document.body.querySelectorAll('[data-dice-roll-overlay-root]')).toHaveLength(1)
  })

  it('with animation enabled, the animation seam runs after a roll', async () => {
    mockAuthed()
    const user = userEvent.setup()
    render(<GlobalDiceFab />)
    await open(user)
    await user.click(screen.getByRole('button', { name: 'Add d20' }))
    await user.click(screen.getByRole('button', { name: 'Roll' }))
    await waitFor(() => expect(runMock).toHaveBeenCalledTimes(1))
  })

  it('the total modal stays hidden until the animation settles, then shows built.total', async () => {
    mockAuthed()
    let resolveRun!: (v: unknown) => void
    runMock.mockImplementationOnce(() => new Promise(res => { resolveRun = res }))
    mockedRollDicePool.mockReturnValue([{ sides: 20, value: 14 }])
    const user = userEvent.setup()
    render(<GlobalDiceFab />)
    await open(user)
    await user.click(screen.getByRole('button', { name: 'Add d20' }))
    await user.click(screen.getByRole('button', { name: 'Roll' }))

    // inline result renders immediately; the overlay modal does not
    expect(screen.getByText(/1d20 →/)).toBeInTheDocument()
    await waitFor(() => expect(runMock).toHaveBeenCalledTimes(1))
    expect(screen.queryByRole('dialog', { name: /dice roll result/i })).not.toBeInTheDocument()

    await act(async () => { resolveRun(undefined) })
    const dialog = await screen.findByRole('dialog', { name: /dice roll result/i })
    expect(dialog).toHaveTextContent('14')
  })

  it('a 120d6 pool shows the full-pool total in the modal even though the tumble is capped', async () => {
    mockAuthed()
    mockedRollDicePool.mockReturnValue(Array.from({ length: 120 }, () => ({ sides: 6, value: 4 })))
    const user = userEvent.setup()
    render(<GlobalDiceFab />)
    await open(user)
    await user.click(screen.getByRole('button', { name: 'Add d6' }))
    await user.click(screen.getByRole('button', { name: 'Roll' }))
    const dialog = await screen.findByRole('dialog', { name: /dice roll result/i })
    expect(dialog).toHaveTextContent('480')
  })

  it('a second roll re-gates the modal', async () => {
    mockAuthed()
    const pending: Array<(v: unknown) => void> = []
    try {
      runMock.mockImplementation(() => new Promise(res => { pending.push(res) }))
      const user = userEvent.setup()
      render(<GlobalDiceFab />)
      await open(user)
      await user.click(screen.getByRole('button', { name: 'Add d20' }))
      await user.click(screen.getByRole('button', { name: 'Roll' }))
      await waitFor(() => expect(runMock).toHaveBeenCalledTimes(1))
      await act(async () => { pending[0](undefined) })
      await screen.findByRole('dialog', { name: /dice roll result/i })

      await user.click(screen.getByRole('button', { name: 'Roll' }))
      await waitFor(() =>
        expect(screen.queryByRole('dialog', { name: /dice roll result/i })).not.toBeInTheDocument(),
      )
      expect(document.body.querySelectorAll('[data-dice-roll-overlay-root]')).toHaveLength(1)
    } finally {
      runMock.mockReset()
      runMock.mockResolvedValue(undefined)
    }
  })

  it('"Disable animation" checked → overlay opens with total modal, no canvas, seam not run', async () => {
    mockAuthed()
    const user = userEvent.setup()
    render(<GlobalDiceFab />)
    await open(user)
    await user.click(screen.getByRole('checkbox', { name: /disable animation/i }))
    await user.click(screen.getByRole('button', { name: 'Add d20' }))
    await user.click(screen.getByRole('button', { name: 'Roll' }))
    expect(await screen.findByRole('dialog', { name: /dice roll result/i })).toBeInTheDocument()
    expect(screen.queryByTestId('dice-roll-canvas')).not.toBeInTheDocument()
    expect(runMock).not.toHaveBeenCalled()
  })

  it('the "Disable animation" checkbox reflects reduced-motion and toggling it persists', async () => {
    mockMatchMedia(true)
    mockAuthed()
    const user = userEvent.setup()
    render(<GlobalDiceFab />)
    await open(user)
    const box = screen.getByRole('checkbox', { name: /disable animation/i })
    await waitFor(() => expect(box).toBeChecked())
    await user.click(box)
    expect(box).not.toBeChecked()
    expect(LocalStore.get<boolean>('dice-fab-disable-animation')).toBe(false)
  })
})

describe('GlobalDiceFab — percentile control', () => {
  it('activating the percentile control sets a local d% result with a 1..100 total and no network call', async () => {
    mockAuthed()
    const fetchSpy = jest.fn()
    global.fetch = fetchSpy as unknown as typeof global.fetch
    const user = userEvent.setup()
    render(<GlobalDiceFab />)
    await open(user)
    await user.click(screen.getByRole('button', { name: /percentile|d%/i }))
    const resultLine = screen.getByText(/d% → \[\d+\] =/)
    const total = Number(resultLine.textContent!.match(/=\s*(\d+)\s*$/)![1])
    expect(total).toBeGreaterThanOrEqual(1)
    expect(total).toBeLessThanOrEqual(100)
    expect(fetchSpy).not.toHaveBeenCalled()
  })

  it('checked send-to-chat + presence + percentile → submits d% unchanged, then animates', async () => {
    mockAuthed()
    mockRollPost({ status: 201 })
    const user = userEvent.setup()
    render(<GlobalDiceFab />)
    act(() => { announcePresence({ campaignId: 'camp-1', sessionId: 'sess-1' }) })
    await open(user)
    await user.click(screen.getByRole('checkbox', { name: /send to session chat/i }))
    await user.click(screen.getByRole('button', { name: /percentile|d%/i }))
    const total = Number(screen.getByText(/d% → \[\d+\] =/).textContent!.match(/=\s*(\d+)\s*$/)![1])
    await waitFor(() => {
      const call = (global.fetch as jest.Mock).mock.calls.find(c => String(c[0]).includes('/rolls'))
      expect(call).toBeDefined()
      const body = JSON.parse((call![1] as RequestInit).body as string)
      expect(body).toEqual({ formula: 'd%', rolls: [total], total, visibility: { scope: 'group' } })
    })
    await waitFor(() => expect(runMock).toHaveBeenCalled())
  })

  it('the percentile control is disabled while a submission is in flight', async () => {
    mockAuthed()
    let resolveFetch!: (v: unknown) => void
    global.fetch = jest.fn(() => new Promise(resolve => { resolveFetch = resolve })) as unknown as typeof fetch
    const user = userEvent.setup()
    render(<GlobalDiceFab />)
    act(() => { announcePresence({ campaignId: 'camp-1', sessionId: 'sess-1' }) })
    await open(user)
    await user.click(screen.getByRole('checkbox', { name: /send to session chat/i }))
    await user.click(screen.getByRole('button', { name: /percentile|d%/i }))
    await waitFor(() => expect(screen.getByRole('button', { name: /percentile|d%/i })).toBeDisabled())
    resolveFetch({ status: 201, json: () => Promise.resolve({ id: 'roll-sent' }) })
    await waitFor(() => expect(screen.getByRole('button', { name: /percentile|d%/i })).not.toBeDisabled())
  })
})

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
    LocalStore.set('dice-fab-send-to-chat', true)
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

  it('POST body never carries breakdown / modifier / percentileFaces', async () => {
    mockAuthed()
    mockRollPost({ status: 201 })
    mockedRollDicePool.mockReturnValue([{ sides: 20, value: 14 }, { sides: 6, value: 2 }])
    const user = userEvent.setup()
    render(<GlobalDiceFab />)
    act(() => { announcePresence({ campaignId: 'camp-1', sessionId: 'sess-1' }) })
    await open(user)
    await user.click(screen.getByRole('checkbox', { name: /send to session chat/i }))
    await user.click(screen.getByRole('button', { name: 'Add d20' }))
    await user.click(screen.getByRole('button', { name: 'Add d6' }))
    await user.click(screen.getByRole('button', { name: 'Roll' }))
    await waitFor(() => {
      const call = (global.fetch as jest.Mock).mock.calls.find(c => String(c[0]).includes('/rolls'))
      expect(call).toBeDefined()
      const body = JSON.parse((call![1] as RequestInit).body as string)
      expect(Object.keys(body).sort()).toEqual(['formula', 'rolls', 'total', 'visibility'])
    })
  })
})
