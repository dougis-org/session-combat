import { screen, waitFor, act } from '@testing-library/react'
import { rollDicePool } from '@/lib/utils/dice'
import {
  CAMPAIGN_ID, sharedTestState, setupFetchMock, restoreFetch, openDockWithSession,
  rollResponse, mockRollPost,
} from './helpers'

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

function fireRollEvent(overrides: Partial<{ id: string; rollerId: string; rollerName: string }> = {}) {
  act(() => {
    sharedTestState.capturedOnEvent?.({
      type: 'roll',
      campaignId: CAMPAIGN_ID,
      data: {
        id: overrides.id ?? 'roll-event', campaignId: CAMPAIGN_ID, sessionId: 'session-1',
        rollerId: overrides.rollerId ?? 'user-2', rollerName: overrides.rollerName ?? 'other',
        formula: '1d20', rolls: [7], total: 7,
        visibility: { scope: 'group' }, createdAt: new Date(),
      },
    })
  })
}

function scrolledUp(container: HTMLElement) {
  Object.defineProperty(container, 'scrollHeight', { value: 1000, configurable: true })
  Object.defineProperty(container, 'clientHeight', { value: 300, configurable: true })
  Object.defineProperty(container, 'scrollTop', { value: 0, configurable: true })
}

describe('CampaignChat — feed auto-scroll on any dice roll', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    sharedTestState.capturedOnEvent = null
    setupFetchMock()
    document.getElementById('dice-pool-overlay-root')?.remove()
  })

  afterEach(() => {
    restoreFetch()
  })

  function getFeedContainer(): HTMLElement {
    const el = document.querySelector('.flex-1.overflow-y-auto')
    if (!el) throw new Error('feed container not found')
    return el as HTMLElement
  }

  it('committing a roll, once echoed back via SSE, scrolls the feed to reveal it', async () => {
    mockedRollDicePool.mockReturnValue([{ sides: 20, value: 10 }])
    mockRollPost({ status: 201, body: rollResponse({ id: 'roll-scroll-own' }) })

    const { user } = await openDockWithSession()
    const scrollSpy = jest.fn()
    getFeedContainer().scrollTo = scrollSpy

    await user.click(screen.getByRole('button', { name: /roll|dice/i }))
    await user.click(screen.getByRole('button', { name: 'Add d20' }))
    await user.click(screen.getByRole('button', { name: 'Roll' }))

    // A submitted roll now only enters the feed via the SSE 'roll' stream event,
    // same as any other client's roll — simulate the server round-trip echo.
    fireRollEvent({ id: 'roll-scroll-own', rollerId: 'user-1', rollerName: 'tester' })

    await waitFor(() => {
      expect(scrollSpy).toHaveBeenCalledWith(expect.objectContaining({ behavior: 'smooth' }))
    })
  })

  it('a roll from another player arriving via SSE also triggers auto-scroll', async () => {
    await openDockWithSession()
    const scrollSpy = jest.fn()
    getFeedContainer().scrollTo = scrollSpy

    fireRollEvent({ id: 'roll-other-player' })

    await waitFor(() => expect(screen.getByText(/1d20/)).toBeInTheDocument())
    await waitFor(() => {
      expect(scrollSpy).toHaveBeenCalledWith(expect.objectContaining({ behavior: 'smooth' }))
    })
  })

  it('a roll from another player does not yank the feed down when the user has scrolled up to read history', async () => {
    await openDockWithSession()
    const container = getFeedContainer()
    const scrollSpy = jest.fn()
    container.scrollTo = scrollSpy
    scrolledUp(container)

    fireRollEvent({ id: 'roll-other-player-far' })

    await waitFor(() => expect(screen.getByText(/1d20/)).toBeInTheDocument())
    expect(scrollSpy).not.toHaveBeenCalled()
  })

  it('the roller is always pulled down to their own roll even if they had scrolled up', async () => {
    mockedRollDicePool.mockReturnValue([{ sides: 20, value: 10 }])
    mockRollPost({ status: 201, body: rollResponse({ id: 'roll-scroll-own-far' }) })

    const { user } = await openDockWithSession()
    const container = getFeedContainer()
    const scrollSpy = jest.fn()
    container.scrollTo = scrollSpy
    scrolledUp(container)

    await user.click(screen.getByRole('button', { name: /roll|dice/i }))
    await user.click(screen.getByRole('button', { name: 'Add d20' }))
    await user.click(screen.getByRole('button', { name: 'Roll' }))
    fireRollEvent({ id: 'roll-scroll-own-far', rollerId: 'user-1', rollerName: 'tester' })

    await waitFor(() => {
      expect(scrollSpy).toHaveBeenCalledWith(expect.objectContaining({ behavior: 'smooth' }))
    })
  })

  it('a duplicate roll id echoed twice via SSE still scrolls exactly once', async () => {
    mockedRollDicePool.mockReturnValue([{ sides: 20, value: 10 }])
    mockRollPost({ status: 201, body: rollResponse({ id: 'roll-race-reverse' }) })

    const { user } = await openDockWithSession()
    const scrollSpy = jest.fn()
    getFeedContainer().scrollTo = scrollSpy

    await user.click(screen.getByRole('button', { name: /roll|dice/i }))
    await user.click(screen.getByRole('button', { name: 'Add d20' }))
    await user.click(screen.getByRole('button', { name: 'Roll' }))

    // The SSE echo for the roll's own committed roll arrives, and a second
    // (duplicate) echo of the same id must not scroll or append a second time.
    fireRollEvent({ id: 'roll-race-reverse', rollerId: 'user-1', rollerName: 'tester' })
    await waitFor(() => expect(screen.getByText(/1d20/)).toBeInTheDocument())
    fireRollEvent({ id: 'roll-race-reverse', rollerId: 'user-1', rollerName: 'tester' })

    await waitFor(() => expect(scrollSpy).toHaveBeenCalledTimes(1))
  })

  it('a duplicate roll id racing between the SSE echo and the POST response still scrolls exactly once', async () => {
    mockedRollDicePool.mockReturnValue([{ sides: 20, value: 10 }])
    mockRollPost({ status: 201, body: rollResponse({ id: 'roll-race' }) })

    const { user } = await openDockWithSession()
    const scrollSpy = jest.fn()
    getFeedContainer().scrollTo = scrollSpy

    await user.click(screen.getByRole('button', { name: /roll|dice/i }))
    await user.click(screen.getByRole('button', { name: 'Add d20' }))

    // Simulate the SSE echo of the roll winning the race, before the POST response resolves
    fireRollEvent({ id: 'roll-race', rollerId: 'user-1', rollerName: 'tester' })

    await user.click(screen.getByRole('button', { name: 'Roll' }))

    await waitFor(() => expect(screen.getByText(/1d20/)).toBeInTheDocument())
    await waitFor(() => expect(scrollSpy).toHaveBeenCalledTimes(1))
  })

  it('still force-scrolls the roller to their own roll when the SSE echo wins the race while they had scrolled up', async () => {
    mockedRollDicePool.mockReturnValue([{ sides: 20, value: 10 }])
    mockRollPost({ status: 201, body: rollResponse({ id: 'roll-race-own-sse-wins' }) })

    const { user } = await openDockWithSession()
    const container = getFeedContainer()
    const scrollSpy = jest.fn()
    container.scrollTo = scrollSpy
    // The roller had scrolled up to read history before rolling.
    scrolledUp(container)

    await user.click(screen.getByRole('button', { name: /roll|dice/i }))
    await user.click(screen.getByRole('button', { name: 'Add d20' }))

    // The SSE echo of the roller's own roll wins the race and is processed
    // before the POST response resolves, so handleRollPosted's seenIds
    // guard will short-circuit — the SSE path must still force-scroll
    // because it recognizes this as the local user's own roll.
    fireRollEvent({ id: 'roll-race-own-sse-wins', rollerId: 'user-1', rollerName: 'tester' })

    await user.click(screen.getByRole('button', { name: 'Roll' }))

    await waitFor(() => expect(screen.getByText(/1d20/)).toBeInTheDocument())
    await waitFor(() => {
      expect(scrollSpy).toHaveBeenCalledWith(expect.objectContaining({ behavior: 'smooth' }))
    })
  })

  it('a new chat message does not trigger auto-scroll', async () => {
    await openDockWithSession()
    const scrollSpy = jest.fn()
    getFeedContainer().scrollTo = scrollSpy

    act(() => {
      sharedTestState.capturedOnEvent?.({
        type: 'message',
        campaignId: CAMPAIGN_ID,
        data: {
          id: 'msg-no-scroll', campaignId: CAMPAIGN_ID, senderId: 'user-2', senderName: 'Alice',
          text: 'hello there', visibility: { scope: 'group' }, createdAt: new Date(),
        },
      })
    })

    await waitFor(() => expect(screen.getByText('hello there')).toBeInTheDocument())
    expect(scrollSpy).not.toHaveBeenCalled()
  })

  it('auto-scroll does not reorder the feed — the new roll stays last', async () => {
    mockedRollDicePool.mockReturnValue([{ sides: 20, value: 10 }])
    mockRollPost({ status: 201, body: rollResponse({ id: 'roll-scroll-order' }) })

    const { user } = await openDockWithSession()
    getFeedContainer().scrollTo = jest.fn()

    act(() => {
      sharedTestState.capturedOnEvent?.({
        type: 'message',
        campaignId: CAMPAIGN_ID,
        data: {
          id: 'msg-before', campaignId: CAMPAIGN_ID, senderId: 'user-2', senderName: 'Alice',
          text: 'earlier message', visibility: { scope: 'group' }, createdAt: new Date(),
        },
      })
    })

    await user.click(screen.getByRole('button', { name: /roll|dice/i }))
    await user.click(screen.getByRole('button', { name: 'Add d20' }))
    await user.click(screen.getByRole('button', { name: 'Roll' }))
    fireRollEvent({ id: 'roll-scroll-order', rollerId: 'user-1', rollerName: 'tester' })

    await waitFor(() => expect(screen.getByText(/1d20/)).toBeInTheDocument())

    const feedItems = getFeedContainer().querySelectorAll(':scope > *')
    const texts = Array.from(feedItems).map(el => el.textContent ?? '')
    const lastIdx = texts.length - 1
    expect(texts[lastIdx]).toContain('1d20')
    expect(texts.findIndex(t => t.includes('earlier message'))).toBeLessThan(lastIdx)
  })
})
