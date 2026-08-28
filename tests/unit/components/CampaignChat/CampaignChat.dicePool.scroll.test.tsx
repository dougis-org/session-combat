import { screen, waitFor, act } from '@testing-library/react'
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

  it('committing a roll scrolls the feed to reveal it', async () => {
    mockedRollDicePool.mockReturnValue([{ sides: 20, value: 10 }])
    sharedTestState.fetchSpy.mockImplementation((url: string, options?: RequestInit) => {
      if (url.includes('/members')) return Promise.resolve({ ok: true, json: () => Promise.resolve({ members: [] }) })
      if (url.includes('/rolls') && options?.method === 'POST') {
        return Promise.resolve({
          ok: true, status: 201,
          json: () => Promise.resolve({
            id: 'roll-scroll-own', campaignId: CAMPAIGN_ID, rollerName: 'tester',
            formula: '1d20', rolls: [10], total: 10,
            visibility: { scope: 'group' }, createdAt: new Date().toISOString(),
          }),
        })
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve({ messages: [] }) })
    })

    const { user } = await openDockWithSession()
    const scrollSpy = jest.fn()
    getFeedContainer().scrollTo = scrollSpy

    await user.click(screen.getByRole('button', { name: /roll|dice/i }))
    await user.click(screen.getByRole('button', { name: 'Add d20' }))
    await user.click(screen.getByRole('button', { name: 'Roll' }))

    await waitFor(() => {
      expect(scrollSpy).toHaveBeenCalledWith(expect.objectContaining({ behavior: 'smooth' }))
    })
  })

  it('a roll from another player arriving via SSE also triggers auto-scroll', async () => {
    const { user } = await openDockWithSession()
    const scrollSpy = jest.fn()
    getFeedContainer().scrollTo = scrollSpy

    act(() => {
      sharedTestState.capturedOnEvent?.({
        type: 'roll',
        campaignId: CAMPAIGN_ID,
        data: {
          id: 'roll-other-player', campaignId: CAMPAIGN_ID, sessionId: 'session-1',
          rollerId: 'user-2', rollerName: 'other', formula: '1d20', rolls: [7], total: 7,
          visibility: { scope: 'group' }, createdAt: new Date(),
        },
      })
    })

    await waitFor(() => expect(screen.getByText(/1d20/)).toBeInTheDocument())
    await waitFor(() => {
      expect(scrollSpy).toHaveBeenCalledWith(expect.objectContaining({ behavior: 'smooth' }))
    })
  })

  it('a roll from another player does not yank the feed down when the user has scrolled up to read history', async () => {
    const { user } = await openDockWithSession()
    const container = getFeedContainer()
    const scrollSpy = jest.fn()
    container.scrollTo = scrollSpy
    // Simulate the user having scrolled well away from the bottom.
    Object.defineProperty(container, 'scrollHeight', { value: 1000, configurable: true })
    Object.defineProperty(container, 'clientHeight', { value: 300, configurable: true })
    Object.defineProperty(container, 'scrollTop', { value: 0, configurable: true })

    act(() => {
      sharedTestState.capturedOnEvent?.({
        type: 'roll',
        campaignId: CAMPAIGN_ID,
        data: {
          id: 'roll-other-player-far', campaignId: CAMPAIGN_ID, sessionId: 'session-1',
          rollerId: 'user-2', rollerName: 'other', formula: '1d20', rolls: [7], total: 7,
          visibility: { scope: 'group' }, createdAt: new Date(),
        },
      })
    })

    await waitFor(() => expect(screen.getByText(/1d20/)).toBeInTheDocument())
    expect(scrollSpy).not.toHaveBeenCalled()
  })

  it('the roller is always pulled down to their own roll even if they had scrolled up', async () => {
    mockedRollDicePool.mockReturnValue([{ sides: 20, value: 10 }])
    sharedTestState.fetchSpy.mockImplementation((url: string, options?: RequestInit) => {
      if (url.includes('/members')) return Promise.resolve({ ok: true, json: () => Promise.resolve({ members: [] }) })
      if (url.includes('/rolls') && options?.method === 'POST') {
        return Promise.resolve({
          ok: true, status: 201,
          json: () => Promise.resolve({
            id: 'roll-scroll-own-far', campaignId: CAMPAIGN_ID, rollerName: 'tester',
            formula: '1d20', rolls: [10], total: 10,
            visibility: { scope: 'group' }, createdAt: new Date().toISOString(),
          }),
        })
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve({ messages: [] }) })
    })

    const { user } = await openDockWithSession()
    const container = getFeedContainer()
    const scrollSpy = jest.fn()
    container.scrollTo = scrollSpy
    Object.defineProperty(container, 'scrollHeight', { value: 1000, configurable: true })
    Object.defineProperty(container, 'clientHeight', { value: 300, configurable: true })
    Object.defineProperty(container, 'scrollTop', { value: 0, configurable: true })

    await user.click(screen.getByRole('button', { name: /roll|dice/i }))
    await user.click(screen.getByRole('button', { name: 'Add d20' }))
    await user.click(screen.getByRole('button', { name: 'Roll' }))

    await waitFor(() => {
      expect(scrollSpy).toHaveBeenCalledWith(expect.objectContaining({ behavior: 'smooth' }))
    })
  })

  it('a duplicate roll id racing with the POST response resolving before the SSE echo still scrolls exactly once', async () => {
    mockedRollDicePool.mockReturnValue([{ sides: 20, value: 10 }])
    sharedTestState.fetchSpy.mockImplementation((url: string, options?: RequestInit) => {
      if (url.includes('/members')) return Promise.resolve({ ok: true, json: () => Promise.resolve({ members: [] }) })
      if (url.includes('/rolls') && options?.method === 'POST') {
        return Promise.resolve({
          ok: true, status: 201,
          json: () => Promise.resolve({
            id: 'roll-race-reverse', campaignId: CAMPAIGN_ID, rollerName: 'tester',
            formula: '1d20', rolls: [10], total: 10,
            visibility: { scope: 'group' }, createdAt: new Date().toISOString(),
          }),
        })
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve({ messages: [] }) })
    })

    const { user } = await openDockWithSession()
    const scrollSpy = jest.fn()
    getFeedContainer().scrollTo = scrollSpy

    await user.click(screen.getByRole('button', { name: /roll|dice/i }))
    await user.click(screen.getByRole('button', { name: 'Add d20' }))

    // POST response resolves first (handleRollPosted wins the race)...
    await user.click(screen.getByRole('button', { name: 'Roll' }))
    await waitFor(() => expect(screen.getByText(/1d20/)).toBeInTheDocument())

    // ...then the SSE echo for the same roll id arrives afterwards.
    act(() => {
      sharedTestState.capturedOnEvent?.({
        type: 'roll',
        campaignId: CAMPAIGN_ID,
        data: {
          id: 'roll-race-reverse', campaignId: CAMPAIGN_ID, sessionId: 'session-1',
          rollerId: 'user-1', rollerName: 'tester', formula: '1d20', rolls: [10], total: 10,
          visibility: { scope: 'group' }, createdAt: new Date(),
        },
      })
    })

    await waitFor(() => expect(scrollSpy).toHaveBeenCalledTimes(1))
  })

  it('a duplicate roll id racing between the SSE echo and the POST response still scrolls exactly once', async () => {
    mockedRollDicePool.mockReturnValue([{ sides: 20, value: 10 }])
    sharedTestState.fetchSpy.mockImplementation((url: string, options?: RequestInit) => {
      if (url.includes('/members')) return Promise.resolve({ ok: true, json: () => Promise.resolve({ members: [] }) })
      if (url.includes('/rolls') && options?.method === 'POST') {
        return Promise.resolve({
          ok: true, status: 201,
          json: () => Promise.resolve({
            id: 'roll-race', campaignId: CAMPAIGN_ID, rollerName: 'tester',
            formula: '1d20', rolls: [10], total: 10,
            visibility: { scope: 'group' }, createdAt: new Date().toISOString(),
          }),
        })
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve({ messages: [] }) })
    })

    const { user } = await openDockWithSession()
    const scrollSpy = jest.fn()
    getFeedContainer().scrollTo = scrollSpy

    await user.click(screen.getByRole('button', { name: /roll|dice/i }))
    await user.click(screen.getByRole('button', { name: 'Add d20' }))

    // Simulate the SSE echo of the roll winning the race, before the POST response resolves
    act(() => {
      sharedTestState.capturedOnEvent?.({
        type: 'roll',
        campaignId: CAMPAIGN_ID,
        data: {
          id: 'roll-race', campaignId: CAMPAIGN_ID, sessionId: 'session-1',
          rollerId: 'user-1', rollerName: 'tester', formula: '1d20', rolls: [10], total: 10,
          visibility: { scope: 'group' }, createdAt: new Date(),
        },
      })
    })

    await user.click(screen.getByRole('button', { name: 'Roll' }))

    await waitFor(() => expect(screen.getByText(/1d20/)).toBeInTheDocument())
    await waitFor(() => expect(scrollSpy).toHaveBeenCalledTimes(1))
  })

  it('still force-scrolls the roller to their own roll when the SSE echo wins the race while they had scrolled up', async () => {
    mockedRollDicePool.mockReturnValue([{ sides: 20, value: 10 }])
    sharedTestState.fetchSpy.mockImplementation((url: string, options?: RequestInit) => {
      if (url.includes('/members')) return Promise.resolve({ ok: true, json: () => Promise.resolve({ members: [] }) })
      if (url.includes('/rolls') && options?.method === 'POST') {
        return Promise.resolve({
          ok: true, status: 201,
          json: () => Promise.resolve({
            id: 'roll-race-own-sse-wins', campaignId: CAMPAIGN_ID, rollerName: 'tester',
            formula: '1d20', rolls: [10], total: 10,
            visibility: { scope: 'group' }, createdAt: new Date().toISOString(),
          }),
        })
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve({ messages: [] }) })
    })

    const { user } = await openDockWithSession()
    const container = getFeedContainer()
    const scrollSpy = jest.fn()
    container.scrollTo = scrollSpy
    // The roller had scrolled up to read history before rolling.
    Object.defineProperty(container, 'scrollHeight', { value: 1000, configurable: true })
    Object.defineProperty(container, 'clientHeight', { value: 300, configurable: true })
    Object.defineProperty(container, 'scrollTop', { value: 0, configurable: true })

    await user.click(screen.getByRole('button', { name: /roll|dice/i }))
    await user.click(screen.getByRole('button', { name: 'Add d20' }))

    // The SSE echo of the roller's own roll wins the race and is processed
    // before the POST response resolves, so handleRollPosted's seenIds
    // guard will short-circuit — the SSE path must still force-scroll
    // because it recognizes this as the local user's own roll.
    act(() => {
      sharedTestState.capturedOnEvent?.({
        type: 'roll',
        campaignId: CAMPAIGN_ID,
        data: {
          id: 'roll-race-own-sse-wins', campaignId: CAMPAIGN_ID, sessionId: 'session-1',
          rollerId: 'user-1', rollerName: 'tester', formula: '1d20', rolls: [10], total: 10,
          visibility: { scope: 'group' }, createdAt: new Date(),
        },
      })
    })

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
    sharedTestState.fetchSpy.mockImplementation((url: string, options?: RequestInit) => {
      if (url.includes('/members')) return Promise.resolve({ ok: true, json: () => Promise.resolve({ members: [] }) })
      if (url.includes('/rolls') && options?.method === 'POST') {
        return Promise.resolve({
          ok: true, status: 201,
          json: () => Promise.resolve({
            id: 'roll-scroll-order', campaignId: CAMPAIGN_ID, rollerName: 'tester',
            formula: '1d20', rolls: [10], total: 10,
            visibility: { scope: 'group' }, createdAt: new Date().toISOString(),
          }),
        })
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve({ messages: [] }) })
    })

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

    await waitFor(() => expect(screen.getByText(/1d20/)).toBeInTheDocument())

    const feedItems = getFeedContainer().querySelectorAll(':scope > *')
    const texts = Array.from(feedItems).map(el => el.textContent ?? '')
    const lastIdx = texts.length - 1
    expect(texts[lastIdx]).toContain('1d20')
    expect(texts.findIndex(t => t.includes('earlier message'))).toBeLessThan(lastIdx)
  })
})
