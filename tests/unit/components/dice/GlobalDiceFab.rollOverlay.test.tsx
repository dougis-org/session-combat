import { render, screen, act, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { GlobalDiceFab } from '@/lib/components/GlobalDiceFab'
import { LocalStore } from '@/lib/offline/LocalStore'
import { announcePresence } from '@/lib/dice/diceSessionBridge'
import { mockAuthed, mockMatchMedia, mockRollPost, mockedRollDicePool, open } from './__helpers__/globalDiceFabHarness'

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

    // Picker state is cleared after a roll, so the Roll button becomes disabled
    expect(screen.getByRole('button', { name: 'Roll' })).toBeDisabled()

    // ...so we must add a die again for the next roll
    await user.click(screen.getByRole('button', { name: 'Add d20' }))
    expect(screen.getByRole('button', { name: 'Roll' })).not.toBeDisabled()
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

    await act(async () => { resolveRun(true) })
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
      await act(async () => { pending[0](true) })
      await screen.findByRole('dialog', { name: /dice roll result/i })

      // Picker state is cleared after a roll, so we must add a die again for the next roll
      await user.click(screen.getByRole('button', { name: 'Add d20' }))
      await user.click(screen.getByRole('button', { name: 'Roll' }))
      await waitFor(() =>
        expect(screen.queryByRole('dialog', { name: /dice roll result/i })).not.toBeInTheDocument(),
      )
      expect(document.body.querySelectorAll('[data-dice-roll-overlay-root]')).toHaveLength(1)
    } finally {
      runMock.mockReset()
      runMock.mockResolvedValue(true)
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
    expect(
      LocalStore.get<{ dice: { disableAnimation: boolean | null } }>('preferences')!.dice
        .disableAnimation,
    ).toBe(false)
  })
})

describe('GlobalDiceFab — roll POST body', () => {
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
