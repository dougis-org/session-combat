import { render, screen, act, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { GlobalDiceFab } from '@/lib/components/GlobalDiceFab'
import { announcePresence } from '@/lib/dice/diceSessionBridge'
import { mockAuthed, mockRollPost, open } from './__helpers__/globalDiceFabHarness'

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
