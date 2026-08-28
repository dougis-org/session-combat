import { screen, act, fireEvent } from '@testing-library/react'
import { CampaignChat } from '@/lib/components/CampaignChat'
import { rollDicePool } from '@/lib/utils/dice'
import { CAMPAIGN_ID, sharedTestState, setupFetchMock, restoreFetch, openDockWithSession } from './helpers'

jest.mock('@/lib/offline/LocalStore', () => ({
  LocalStore: {
    get: jest.fn().mockReturnValue(null),
    set: jest.fn(),
    remove: jest.fn(),
  },
}))

jest.mock('@/lib/hooks/useCampaignStream', () => ({
  useCampaignStream: jest.fn((_, onEvent) => {
    const { sharedTestState: state } = require('./helpers')
    state.capturedOnEvent = onEvent
    return { status: 'open' }
  }),
}))

jest.mock('@/lib/hooks/useAuth', () => ({
  useAuth: jest.fn(() => ({
    user: { userId: 'user-1', email: 'test@example.com', username: 'tester' },
    loading: false,
  })),
}))

jest.mock('@/lib/utils/dice', () => ({
  ...jest.requireActual('@/lib/utils/dice'),
  rollDicePool: jest.fn(),
}))

const mockedRollDicePool = rollDicePool as jest.Mock

describe('CampaignChat — dice pool trigger', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    sharedTestState.capturedOnEvent = null
    setupFetchMock()
    mockedRollDicePool.mockReturnValue([])
    document.getElementById('dice-pool-overlay-root')?.remove()
  })

  afterEach(() => {
    restoreFetch()
  })

  it('trigger renders and is enabled when a session is active', async () => {
    await openDockWithSession('session-1')
    expect(screen.getByRole('button', { name: /roll|dice/i })).toBeEnabled()
  })

  it('trigger displays the vendored d20 icon, not the literal text d20', async () => {
    await openDockWithSession('session-1')
    const trigger = screen.getByRole('button', { name: /roll|dice/i })
    expect(trigger).not.toHaveTextContent('d20')
    expect(trigger.querySelector('svg')).toBeInTheDocument()
  })

  it('trigger is disabled when no active session', async () => {
    await openDockWithSession(null)
    expect(screen.getByRole('button', { name: /roll|dice/i })).toBeDisabled()
  })

  it('an already-open pop-out closes when activeSessionId transitions to null', async () => {
    const { user, rerender } = await openDockWithSession('session-1')
    await user.click(screen.getByRole('button', { name: /roll|dice/i }))
    expect(screen.getByRole('button', { name: 'Roll' })).toBeInTheDocument()
    rerender(<CampaignChat campaignId={CAMPAIGN_ID} activeSessionId={null} />)
    expect(screen.queryByRole('button', { name: 'Roll' })).not.toBeInTheDocument()
  })

  it('clicking the trigger opens the pop-out', async () => {
    const { user } = await openDockWithSession()
    await user.click(screen.getByRole('button', { name: /roll|dice/i }))
    expect(screen.getByRole('button', { name: 'Roll' })).toBeInTheDocument()
  })

  it('clicking the trigger again closes the pop-out', async () => {
    const { user } = await openDockWithSession()
    const trigger = screen.getByRole('button', { name: /roll|dice/i })
    await user.click(trigger)
    await user.click(trigger)
    expect(screen.queryByRole('button', { name: 'Roll' })).not.toBeInTheDocument()
  })

  it('closes on outside click', async () => {
    const { user } = await openDockWithSession()
    await user.click(screen.getByRole('button', { name: /roll|dice/i }))
    expect(screen.getByRole('button', { name: 'Roll' })).toBeInTheDocument()
    await user.click(document.body)
    expect(screen.queryByRole('button', { name: 'Roll' })).not.toBeInTheDocument()
  })

  it('closes on Escape', async () => {
    const { user } = await openDockWithSession()
    await user.click(screen.getByRole('button', { name: /roll|dice/i }))
    expect(screen.getByRole('button', { name: 'Roll' })).toBeInTheDocument()
    act(() => {
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
    })
    expect(screen.queryByRole('button', { name: 'Roll' })).not.toBeInTheDocument()
  })

  it('no always-visible die buttons remain in the chat dock body', async () => {
    await openDockWithSession()
    expect(screen.queryByRole('button', { name: 'Add d6' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Add d20' })).not.toBeInTheDocument()
  })

  it("pop-out is not nested inside the chat dock's role=complementary element", async () => {
    const { user } = await openDockWithSession()
    await user.click(screen.getByRole('button', { name: /roll|dice/i }))
    const rollButton = screen.getByRole('button', { name: 'Roll' })
    const drawer = screen.getByRole('complementary')
    expect(drawer.contains(rollButton)).toBe(false)
  })

  it('dice panel is a DOM sibling of the drawer, both children of one flex-row wrapper, not a document.body portal', async () => {
    const { user } = await openDockWithSession()
    await user.click(screen.getByRole('button', { name: /roll|dice/i }))
    const panel = screen.getByLabelText('Dice pool')
    const drawer = screen.getByRole('complementary')
    expect(panel.parentElement).toBe(drawer.parentElement)
    expect(document.getElementById('dice-pool-overlay-root')).toBeNull()
    expect(document.body.contains(panel)).toBe(true)
    // The panel must be inside the same in-flow wrapper, not directly appended to body
    expect(panel.parentElement).not.toBe(document.body)
  })

  it('dice panel appears before the drawer in DOM order (to its left in the flex row)', async () => {
    const { user } = await openDockWithSession()
    await user.click(screen.getByRole('button', { name: /roll|dice/i }))
    const panel = screen.getByLabelText('Dice pool')
    const drawer = screen.getByRole('complementary')
    const parent = panel.parentElement!
    const children = Array.from(parent.children)
    expect(children.indexOf(panel)).toBeLessThan(children.indexOf(drawer))
  })

  it('dice panel height is content-driven, not tied to a large custom drawer height', async () => {
    const { user } = await openDockWithSession()
    // Drag the drawer to a large custom height before opening the panel
    const handle = screen.getByRole('separator', { name: 'Resize chat panel' })
    fireEvent.mouseDown(handle, { clientY: 500 })
    fireEvent.mouseMove(document, { clientY: 100 })
    fireEvent.mouseUp(document)

    await user.click(screen.getByRole('button', { name: /roll|dice/i }))
    const panel = screen.getByLabelText('Dice pool')
    const drawer = screen.getByRole('complementary')
    expect((panel as HTMLElement).style.height).toBe('')
    expect((drawer as HTMLElement).style.height).not.toBe('')
  })

  it('dice panel is absent from the DOM when closed, and no overlay-root node is created', async () => {
    await openDockWithSession()
    expect(screen.queryByLabelText('Dice pool')).not.toBeInTheDocument()
    expect(document.getElementById('dice-pool-overlay-root')).toBeNull()
  })

  it('adding a d6 twice and a d8 twice sets staged counts and issues zero network requests', async () => {
    const { user } = await openDockWithSession()
    await user.click(screen.getByRole('button', { name: /roll|dice/i }))
    await user.click(screen.getByRole('button', { name: 'Add d6' }))
    await user.click(screen.getByRole('button', { name: 'Add d6' }))
    await user.click(screen.getByRole('button', { name: 'Add d8' }))
    await user.click(screen.getByRole('button', { name: 'Add d8' }))
    expect(screen.getByRole('button', { name: 'Add d6' })).toHaveTextContent('×2')
    expect(screen.getByRole('button', { name: 'Add d8' })).toHaveTextContent('×2')
    expect(screen.getByRole('button', { name: 'Add d4' })).toHaveTextContent('×0')
    expect(sharedTestState.fetchSpy).not.toHaveBeenCalledWith(expect.stringContaining('/rolls'), expect.anything())
  })

  it('removing one d6 from a staged count of 2 decrements it to 1', async () => {
    const { user } = await openDockWithSession()
    await user.click(screen.getByRole('button', { name: /roll|dice/i }))
    await user.click(screen.getByRole('button', { name: 'Add d6' }))
    await user.click(screen.getByRole('button', { name: 'Add d6' }))
    await user.click(screen.getByRole('button', { name: 'Remove d6' }))
    expect(screen.getByRole('button', { name: 'Add d6' })).toHaveTextContent('×1')
  })

  it('staged count cannot go below zero', async () => {
    const { user } = await openDockWithSession()
    await user.click(screen.getByRole('button', { name: /roll|dice/i }))
    await user.click(screen.getByRole('button', { name: 'Remove d10' }))
    expect(screen.getByRole('button', { name: 'Add d10' })).toHaveTextContent('×0')
  })

  it('modifier is editable independent of staged dice', async () => {
    const { user } = await openDockWithSession()
    await user.click(screen.getByRole('button', { name: /roll|dice/i }))
    const modifierInput = screen.getByRole('textbox', { name: 'Modifier' })
    await user.clear(modifierInput)
    await user.type(modifierInput, '-2')
    expect(modifierInput).toHaveValue('-2')
    expect(screen.getByRole('button', { name: 'Add d6' })).toHaveTextContent('×0')
  })

  it('visibility selector defaults to group', async () => {
    const { user } = await openDockWithSession()
    await user.click(screen.getByRole('button', { name: /roll|dice/i }))
    expect(screen.getByRole('combobox', { name: 'Roll visibility' })).toHaveValue('group')
  })

  it('rejects an unsupported visibility value instead of applying it', async () => {
    const { user } = await openDockWithSession()
    await user.click(screen.getByRole('button', { name: /roll|dice/i }))
    const select = screen.getByRole('combobox', { name: 'Roll visibility' })
    fireEvent.change(select, { target: { value: 'not-a-real-scope' } })
    expect(select).toHaveValue('group')
    expect(sharedTestState.fetchSpy).not.toHaveBeenCalledWith(expect.stringContaining('/rolls'), expect.anything())
  })

  it('each die-size add control renders the icon matching its own die size', async () => {
    const { user } = await openDockWithSession()
    await user.click(screen.getByRole('button', { name: /roll|dice/i }))
    for (const sides of [4, 6, 8, 10, 12, 20]) {
      const btn = screen.getByRole('button', { name: `Add d${sides}` })
      expect(btn.querySelector('svg')).toBeInTheDocument()
    }
  })

  it('trigger button exposes a tooltip via its title attribute', async () => {
    await openDockWithSession()
    const trigger = screen.getByRole('button', { name: /roll|dice/i })
    expect(trigger).toHaveAttribute('title', 'Dice Rolls for main screen pop out')
  })

  it('trigger icon renders at the enlarged 24px size', async () => {
    await openDockWithSession()
    const trigger = screen.getByRole('button', { name: /roll|dice/i })
    const svg = trigger.querySelector('svg')
    expect(svg).toHaveAttribute('width', '24')
    expect(svg).toHaveAttribute('height', '24')
  })

  it('each per-die add control renders its icon at the enlarged 21px size', async () => {
    const { user } = await openDockWithSession()
    await user.click(screen.getByRole('button', { name: /roll|dice/i }))
    for (const sides of [4, 6, 8, 10, 12, 20]) {
      const svg = screen.getByRole('button', { name: `Add d${sides}` }).querySelector('svg')
      expect(svg).toHaveAttribute('width', '21')
      expect(svg).toHaveAttribute('height', '21')
    }
  })

  it('each per-die add control exposes a tooltip matching its die size', async () => {
    const { user } = await openDockWithSession()
    await user.click(screen.getByRole('button', { name: /roll|dice/i }))
    for (const sides of [4, 6, 8, 10, 12, 20]) {
      const btn = screen.getByRole('button', { name: `Add d${sides}` })
      expect(btn).toHaveAttribute('title', `d${sides}`)
    }
  })
})
