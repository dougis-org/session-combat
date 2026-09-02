import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { GlobalDiceFab } from '@/lib/components/GlobalDiceFab'
import { LocalStore } from '@/lib/offline/LocalStore'
import { mockAuthed, open } from './__helpers__/globalDiceFabHarness'

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

describe('GlobalDiceFab — dice appearance (task 4.3 / 5.1-d)', () => {
  async function openPanel() {
    const user = userEvent.setup()
    mockAuthed()
    render(<GlobalDiceFab />)
    await open(user)
    return user
  }

  it('4.3-a/b the panel exposes a "Dice appearance" control that opens the modal', async () => {
    const user = await openPanel()
    const trigger = screen.getByRole('button', { name: /dice appearance/i })
    expect(trigger).toBeInTheDocument()
    await user.click(trigger)
    expect(screen.getByRole('dialog', { name: /dice appearance/i })).toBeInTheDocument()
  })

  it('4.3-c Escape closes only the appearance modal, the panel stays open', async () => {
    const user = await openPanel()
    await user.click(screen.getByRole('button', { name: /dice appearance/i }))
    expect(screen.getByRole('dialog', { name: /dice appearance/i })).toBeInTheDocument()
    await user.keyboard('{Escape}')
    expect(screen.queryByRole('dialog', { name: /dice appearance/i })).not.toBeInTheDocument()
    expect(screen.getByRole('dialog', { name: 'Roll dice' })).toBeInTheDocument()
  })

  it('4.3-d outside-click closes only the appearance modal, the panel stays open', async () => {
    const user = await openPanel()
    await user.click(screen.getByRole('button', { name: /dice appearance/i }))
    const backdrop = screen.getByRole('dialog', { name: /dice appearance/i }).parentElement!
    await user.click(backdrop)
    expect(screen.queryByRole('dialog', { name: /dice appearance/i })).not.toBeInTheDocument()
    expect(screen.getByRole('dialog', { name: 'Roll dice' })).toBeInTheDocument()
  })

  it('4.3-e focus returns to the "Dice appearance" trigger on close', async () => {
    const user = await openPanel()
    const trigger = screen.getByRole('button', { name: /dice appearance/i })
    await user.click(trigger)
    await user.keyboard('{Escape}')
    expect(trigger).toHaveFocus()
  })

  it('4.3-f selecting a colorset + material persists both keys', async () => {
    const setSpy = jest.spyOn(LocalStore, 'set')
    const user = await openPanel()
    await user.click(screen.getByRole('button', { name: /dice appearance/i }))
    const modal = screen.getByRole('dialog', { name: /dice appearance/i })
    await user.click(within(modal).getByRole('radio', { name: /blood moon|bloodmoon/i }))
    await user.click(within(modal).getByRole('radio', { name: 'Metal' }))
    expect(setSpy).toHaveBeenCalledWith('dice-fab-colorset', 'bloodmoon')
    expect(setSpy).toHaveBeenCalledWith('dice-fab-material', 'metal')
  })

  it('closing then re-opening the panel does not re-show the appearance modal', async () => {
    const user = await openPanel()
    await user.click(screen.getByRole('button', { name: /dice appearance/i }))
    expect(screen.getByRole('dialog', { name: /dice appearance/i })).toBeInTheDocument()
    // Close the modal, then close the panel, then re-open the panel.
    await user.keyboard('{Escape}')
    await user.keyboard('{Escape}')
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    await open(user)
    expect(screen.queryByRole('dialog', { name: /dice appearance/i })).not.toBeInTheDocument()
    expect(screen.getByRole('dialog', { name: 'Roll dice' })).toBeInTheDocument()
  })

  it('5.1-d passes the persisted appearance into useDiceAnimation', async () => {
    LocalStore.set('dice-fab-colorset', 'fire')
    LocalStore.set('dice-fab-material', 'wood')
    await openPanel()
    await waitFor(() =>
      expect(useDiceAnimationMock).toHaveBeenLastCalledWith({ colorset: 'fire', material: 'wood' }),
    )
  })
})
