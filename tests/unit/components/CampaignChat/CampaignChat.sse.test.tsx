import { render, screen, act } from '@testing-library/react'
import { CampaignChat } from '@/lib/components/CampaignChat'
import { LocalStore } from '@/lib/offline/LocalStore'
import { CAMPAIGN_ID, sharedTestState, setupFetchMock, restoreFetch, openDock } from './helpers'

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
    act(() => {
      sharedTestState.capturedOnEvent?.({
        type: 'message',
        campaignId: 'test-campaign',
        data: {
          id: 'msg-1', campaignId: 'test-campaign', senderId: 'user-1',
          senderName: 'Alice', text: 'Hello world',
          visibility: { scope: 'group' }, createdAt: new Date().toISOString(),
        },
      })
    })
    expect(screen.getByText('Hello world')).toBeInTheDocument()
    expect(screen.getByText('Alice')).toBeInTheDocument()
  })

  // T2e-2: duplicate stream event does not duplicate message
  it('duplicate stream event is ignored', async () => {
    await openDock()
    act(() => { sharedTestState.capturedOnEvent?.({ type: 'message', campaignId: 'test-campaign', data: { id: 'msg-dup', campaignId: 'test-campaign', senderId: 'user-1', senderName: 'Bob', text: 'Duplicate', visibility: { scope: 'group' }, createdAt: new Date().toISOString() } }) })
    act(() => { sharedTestState.capturedOnEvent?.({ type: 'message', campaignId: 'test-campaign', data: { id: 'msg-dup', campaignId: 'test-campaign', senderId: 'user-1', senderName: 'Bob', text: 'Duplicate', visibility: { scope: 'group' }, createdAt: new Date().toISOString() } }) })
    expect(screen.getAllByText('Duplicate')).toHaveLength(1)
  })

  // T2e-3: heartbeat event does not change feed
  it('heartbeat event does not affect message feed', async () => {
    await openDock()
    act(() => {
      sharedTestState.capturedOnEvent?.({ type: 'heartbeat', campaignId: 'test-campaign', data: { ts: Date.now() } })
    })
    expect(screen.getByText('No messages yet.')).toBeInTheDocument()
  })

  // ── T11 — Session stream tests ───────────────────────────────────────

  // T11-1: session event calls onSessionChange with the new activeSessionId
  it('session stream event calls onSessionChange with activeSessionId', async () => {
    setupFetchMock({ members: [] })
    const onSessionChange = jest.fn()
    render(<CampaignChat campaignId={CAMPAIGN_ID} onSessionChange={onSessionChange} />)
    act(() => {
      sharedTestState.capturedOnEvent?.({ type: 'session', campaignId: CAMPAIGN_ID, data: { activeSessionId: 'ses-abc' } })
    })
    expect(onSessionChange).toHaveBeenCalledWith('ses-abc')
  })

  // T11-2: session event with null calls onSessionChange with null
  it('session stream event calls onSessionChange with null on session end', async () => {
    setupFetchMock({ members: [] })
    const onSessionChange = jest.fn()
    render(<CampaignChat campaignId={CAMPAIGN_ID} onSessionChange={onSessionChange} />)
    act(() => {
      sharedTestState.capturedOnEvent?.({ type: 'session', campaignId: CAMPAIGN_ID, data: { activeSessionId: null } })
    })
    expect(onSessionChange).toHaveBeenCalledWith(null)
  })

  // T11-3: session event without onSessionChange prop does not throw
  it('session stream event with no onSessionChange prop does not throw', () => {
    setupFetchMock({ members: [] })
    render(<CampaignChat campaignId={CAMPAIGN_ID} />)
    expect(() => {
      act(() => {
        sharedTestState.capturedOnEvent?.({ type: 'session', campaignId: CAMPAIGN_ID, data: { activeSessionId: 'ses-xyz' } })
      })
    }).not.toThrow()
  })
})
