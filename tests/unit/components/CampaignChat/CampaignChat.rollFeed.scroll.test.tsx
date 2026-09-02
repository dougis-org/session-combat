import { screen, act, waitFor } from '@testing-library/react'
import { CAMPAIGN_ID, sharedTestState, setupFetchMock, restoreFetch, openDockWithSession, makeRoll } from './helpers'

// ── Mocks ─────────────────────────────────────────────────────────

jest.mock('@/lib/offline/LocalStore', () => ({
  LocalStore: { get: jest.fn().mockReturnValue(null), set: jest.fn(), remove: jest.fn() },
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

// ── Feed auto-scroll on a stream 'roll' event ────────────────────
// Ported from the removed CampaignChat.dicePool.scroll.test.tsx: rolls now
// reach the feed only via the SSE 'roll' stream event (GlobalDiceFab is the
// sole roll surface), so auto-scroll is driven purely by the ingested roll's
// rollerId, not by any in-dock commit path.

function getFeedContainer(): HTMLElement {
  const el = document.querySelector('.flex-1.overflow-y-auto')
  if (!el) throw new Error('feed container not found')
  return el as HTMLElement
}

function markScrolledUp(container: HTMLElement) {
  Object.defineProperty(container, 'scrollHeight', { value: 1000, configurable: true })
  Object.defineProperty(container, 'clientHeight', { value: 300, configurable: true })
  Object.defineProperty(container, 'scrollTop', { value: 0, configurable: true })
}

describe('CampaignChat — roll feed / auto-scroll', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    sharedTestState.capturedOnEvent = null
    setupFetchMock()
  })

  afterEach(() => {
    restoreFetch()
  })

  it("auto-scrolls to the current user's own roll ingested via SSE even when scrolled up", async () => {
    await openDockWithSession('session-1')
    const container = getFeedContainer()
    const scrollSpy = jest.fn()
    container.scrollTo = scrollSpy
    markScrolledUp(container)

    act(() => {
      sharedTestState.capturedOnEvent?.({
        type: 'roll',
        campaignId: CAMPAIGN_ID,
        data: makeRoll({ id: 'roll-own-sse', rollerId: 'user-1', formula: '1d20', rolls: [7], total: 7 }),
      })
    })

    await waitFor(() => {
      expect(scrollSpy).toHaveBeenCalledWith(expect.objectContaining({ behavior: 'smooth' }))
    })
  })

  it("auto-scrolls for another player's roll only when the feed is near the bottom", async () => {
    await openDockWithSession('session-1')
    const container = getFeedContainer()
    const scrollSpy = jest.fn()
    container.scrollTo = scrollSpy

    // Near the bottom (jsdom defaults: all offsets 0) → scrolls.
    act(() => {
      sharedTestState.capturedOnEvent?.({
        type: 'roll',
        campaignId: CAMPAIGN_ID,
        data: makeRoll({ id: 'roll-other-near', rollerId: 'user-2', rollerName: 'other', formula: '1d20', rolls: [7], total: 7 }),
      })
    })
    await waitFor(() => {
      expect(scrollSpy).toHaveBeenCalledWith(expect.objectContaining({ behavior: 'smooth' }))
    })

    // Scrolled up to read history → does not yank the feed down.
    scrollSpy.mockClear()
    markScrolledUp(container)
    act(() => {
      sharedTestState.capturedOnEvent?.({
        type: 'roll',
        campaignId: CAMPAIGN_ID,
        data: makeRoll({ id: 'roll-other-far', rollerId: 'user-2', rollerName: 'other', formula: '1d20', rolls: [7], total: 7 }),
      })
    })
    await waitFor(() => expect(screen.getAllByText(/1d20/).length).toBeGreaterThan(0))
    expect(scrollSpy).not.toHaveBeenCalled()
  })
})
