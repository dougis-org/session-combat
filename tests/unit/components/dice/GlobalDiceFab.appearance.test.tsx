import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { GlobalDiceFab } from '@/lib/components/GlobalDiceFab'
import { LocalStore } from '@/lib/offline/LocalStore'
import { PREFERENCES_MIRROR_KEY } from '@/lib/preferences/usePreferences'
import { DEFAULT_PREFERENCES } from '@/lib/preferences/schema'
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

// The gallery appearance picker is retired (design.md Decision 6): /profile is the sole
// control surface for dice.color/.surface/.material, wired through preferences.dice.* into
// useDiceAnimation (Decision 5). This suite covers both: no in-panel appearance control, and
// the preferences → useDiceAnimation wiring.
describe('GlobalDiceFab — appearance retired, wired from preferences (task 2.4 / 3.5)', () => {
  async function openPanel() {
    const user = userEvent.setup()
    mockAuthed()
    render(<GlobalDiceFab />)
    await open(user)
    return user
  }

  it('the panel exposes no "Dice appearance" trigger', async () => {
    await openPanel()
    expect(screen.queryByRole('button', { name: /dice appearance/i })).not.toBeInTheDocument()
  })

  it('no appearance modal is reachable from the panel', async () => {
    await openPanel()
    expect(screen.queryByRole('dialog', { name: /dice appearance/i })).not.toBeInTheDocument()
  })

  it('calls useDiceAnimation with customColorset/material/surface built from preferences.dice', async () => {
    LocalStore.set(PREFERENCES_MIRROR_KEY, {
      ...DEFAULT_PREFERENCES,
      dice: {
        ...DEFAULT_PREFERENCES.dice,
        color: { foreground: '#000', background: '#fff' },
        material: 'wood',
        surface: 'metal',
      },
    })
    await openPanel()
    await waitFor(() =>
      expect(useDiceAnimationMock).toHaveBeenLastCalledWith({
        customColorset: { foreground: '#000', background: '#fff' },
        material: 'wood',
        surface: 'metal',
      }),
    )
  })

  it('calls useDiceAnimation with all-null appearance when no dice.* preference is set', async () => {
    await openPanel()
    await waitFor(() =>
      expect(useDiceAnimationMock).toHaveBeenLastCalledWith({
        customColorset: null,
        material: null,
        surface: null,
      }),
    )
  })
})
