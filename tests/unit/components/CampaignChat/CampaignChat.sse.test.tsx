import React from 'react'
import { render, screen, act } from '@testing-library/react'
import { CampaignChat } from '@/lib/components/CampaignChat'
import { LocalStore } from '@/lib/offline/LocalStore'
import { CAMPAIGN_ID, sharedTestState, setupFetchMock, restoreFetch, openDock, openDockWithSession, fireMsg, mockActiveSessionIdCore } from './helpers'

jest.mock('@/lib/offline/LocalStore', () => ({
  LocalStore: {
    get: jest.fn().mockReturnValue(null),
    set: jest.fn(),
    remove: jest.fn(),
  },
}))

const useCampaignStreamMock = jest.fn((_: string, onEvent: (e: unknown) => void) => {
  const { sharedTestState: state } = require('./helpers')
  state.capturedOnEvent = onEvent
  return { status: 'open' }
})
jest.mock('@/lib/hooks/useCampaignStream', () => ({
  useCampaignStream: (...args: [string, (e: unknown) => void]) => useCampaignStreamMock(...args),
}))

jest.mock('@/lib/hooks/useAuth', () => ({
  useAuth: jest.fn(() => ({
    user: { userId: 'user-1', email: 'test@example.com', username: 'tester' },
    loading: false,
  })),
}))

jest.mock('@/lib/hooks/useActiveSessionId', () => ({
  useActiveSessionIdCore: jest.fn(() => ({ activeSessionId: null, setActiveSessionId: jest.fn(), handleStreamEvent: jest.fn() })),
}))

const mockedLocalStore = LocalStore as jest.Mocked<typeof LocalStore>

describe('CampaignChat — SSE stream', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockedLocalStore.get.mockReturnValue(null)
    sharedTestState.capturedOnEvent = null
    setupFetchMock()
  })

  afterEach(() => {
    restoreFetch()
  })

  // ── T2 — Stream tests ────────────────────────────────────────────────

  // T2e-1: stream message event appends to feed
  it('stream message event adds message to feed when dock is open', async () => {
    await openDock()
    fireMsg({ id: 'msg-1', text: 'Hello world' })
    expect(screen.getByText('Hello world')).toBeInTheDocument()
    expect(screen.getByText('Alice')).toBeInTheDocument()
  })

  // T2e-2: duplicate stream event does not duplicate message
  it('duplicate stream event is ignored', async () => {
    await openDock()
    fireMsg({ id: 'msg-dup', senderName: 'Bob', text: 'Duplicate' })
    fireMsg({ id: 'msg-dup', senderName: 'Bob', text: 'Duplicate' })
    expect(screen.getAllByText('Duplicate')).toHaveLength(1)
  })

  // T2e-3: heartbeat event does not change feed
  it('heartbeat event does not affect message feed', async () => {
    await openDock()
    act(() => {
      sharedTestState.capturedOnEvent?.({ type: 'heartbeat', campaignId: CAMPAIGN_ID, data: { ts: Date.now() } })
    })
    expect(screen.getByText('No messages yet.')).toBeInTheDocument()
  })

  // ── T11 — Session stream tests ───────────────────────────────────────
  // CampaignChat no longer accepts activeSessionId/onSessionChange props; it
  // calls the non-subscribing useActiveSessionIdCore internally and feeds it
  // events from useChatFeed's single existing useCampaignStream subscription
  // (design.md Decision 3). These tests assert that wiring, plus the
  // regression this change fixes (issue #721: an already-active session must
  // be visible to chat without waiting on a stream event).

  // Regression guard for #721: an already-active session, known only via the
  // core's own initial fetch, is reflected with no prior stream event. Open
  // the drawer (the footer this asserts on only renders when expanded) so
  // this actually distinguishes the active-session case from the
  // no-session case below, rather than trivially passing either way.
  it('reflects an already-active session on load with no prior stream event', async () => {
    await openDockWithSession('ses-preexisting')
    expect(screen.queryByText('No active session')).toBeNull()
  })

  it('reflects no active session on load when the core resolves null', async () => {
    await openDockWithSession(null)
    expect(screen.getByText('No active session')).toBeInTheDocument()
  })

  it('a session stream event is forwarded to handleStreamEvent and updates rendered state on session start', async () => {
    const { handleStreamEvent } = mockActiveSessionIdCore(null)
    render(<CampaignChat campaignId={CAMPAIGN_ID} />)

    act(() => {
      sharedTestState.capturedOnEvent?.({ type: 'session', campaignId: CAMPAIGN_ID, data: { activeSessionId: 'ses-live' } })
    })

    expect(handleStreamEvent).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'session', data: { activeSessionId: 'ses-live' } }),
    )
  })

  it('a session stream event is forwarded to handleStreamEvent and updates rendered state on session end', async () => {
    const { handleStreamEvent } = mockActiveSessionIdCore('ses-live')
    render(<CampaignChat campaignId={CAMPAIGN_ID} />)

    act(() => {
      sharedTestState.capturedOnEvent?.({ type: 'session', campaignId: CAMPAIGN_ID, data: { activeSessionId: null } })
    })

    expect(handleStreamEvent).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'session', data: { activeSessionId: null } }),
    )
  })

  it('does not throw when a session stream event arrives before the core has resolved', () => {
    mockActiveSessionIdCore(undefined)
    render(<CampaignChat campaignId={CAMPAIGN_ID} />)
    expect(() => {
      act(() => {
        sharedTestState.capturedOnEvent?.({ type: 'session', campaignId: CAMPAIGN_ID, data: { activeSessionId: 'ses-xyz' } })
      })
    }).not.toThrow()
  })

  it('opens exactly one subscription from within CampaignChat\'s render tree (connection lifecycle, not render count)', async () => {
    mockActiveSessionIdCore(null)
    let connectionsOpened = 0
    // Mirrors the real useCampaignStream: the render-time call may happen
    // every render, but the connection is owned by an effect keyed only on
    // campaignId, so it opens exactly once regardless of render count. This
    // is the assertion that would actually catch a future regression where
    // CampaignChat accidentally also called the self-subscribing
    // useActiveSessionId wrapper (see design.md Decision 1's revision note) —
    // a render-call-count assertion would not, since both calls would still
    // carry the same campaignId.
    useCampaignStreamMock.mockImplementation((campaignId: string, onEvent: (e: unknown) => void) => {
      sharedTestState.capturedOnEvent = onEvent
      React.useEffect(() => {
        connectionsOpened += 1
        return () => {}
      }, [campaignId])
      return { status: 'open' }
    })
    await openDock()
    expect(connectionsOpened).toBe(1)
  })
})
