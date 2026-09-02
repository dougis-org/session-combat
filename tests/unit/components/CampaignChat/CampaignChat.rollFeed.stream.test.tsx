import { screen, act } from '@testing-library/react'
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

describe('CampaignChat — roll feed / SSE stream ingestion', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    sharedTestState.capturedOnEvent = null
    setupFetchMock()
  })

  afterEach(() => {
    restoreFetch()
  })

  it('stream roll event appends a roll item to the feed', async () => {
    await openDockWithSession('session-1')
    act(() => {
      sharedTestState.capturedOnEvent?.({
        type: 'roll',
        campaignId: CAMPAIGN_ID,
        data: makeRoll({ formula: '1d20+3', rolls: [17], total: 20 }),
      })
    })
    expect(screen.getByText('1d20+3 → [17] =')).toBeInTheDocument()
  })

  it('duplicate roll id from stream is ignored', async () => {
    await openDockWithSession('session-1')
    act(() => {
      sharedTestState.capturedOnEvent?.({
        type: 'roll',
        campaignId: CAMPAIGN_ID,
        data: makeRoll({ id: 'roll-dup', formula: '1d6', rolls: [4], total: 4 }),
      })
    })
    act(() => {
      sharedTestState.capturedOnEvent?.({
        type: 'roll',
        campaignId: CAMPAIGN_ID,
        data: makeRoll({ id: 'roll-dup', formula: '1d6', rolls: [4], total: 4 }),
      })
    })
    expect(screen.getAllByText(/1d6/)).toHaveLength(1)
  })

  it('stream message event still appends a message item to the feed (regression)', async () => {
    await openDockWithSession('session-1')
    act(() => {
      sharedTestState.capturedOnEvent?.({
        type: 'message',
        campaignId: CAMPAIGN_ID,
        data: {
          id: 'msg-1', campaignId: CAMPAIGN_ID, senderId: 'user-1',
          senderName: 'Alice', text: 'Hello world',
          visibility: { scope: 'group' }, createdAt: new Date(),
        },
      })
    })
    expect(screen.getByText('Hello world')).toBeInTheDocument()
  })

  it('feed renders both message and roll items from stream events', async () => {
    await openDockWithSession('session-1')
    act(() => {
      sharedTestState.capturedOnEvent?.({
        type: 'message',
        campaignId: CAMPAIGN_ID,
        data: { id: 'msg-1', campaignId: CAMPAIGN_ID, senderId: 'u1', senderName: 'Alice', text: 'Hi', visibility: { scope: 'group' }, createdAt: new Date() },
      })
    })
    act(() => {
      sharedTestState.capturedOnEvent?.({
        type: 'roll',
        campaignId: CAMPAIGN_ID,
        data: makeRoll({ id: 'roll-2', formula: '1d8', rolls: [5], total: 5 }),
      })
    })
    expect(screen.getByText('Hi')).toBeInTheDocument()
    expect(screen.getByText(/1d8/)).toBeInTheDocument()
  })
})
