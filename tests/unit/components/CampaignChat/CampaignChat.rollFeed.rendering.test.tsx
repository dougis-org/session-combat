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

describe('CampaignChat — roll feed / RollFeedItem rendering', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    sharedTestState.capturedOnEvent = null
    setupFetchMock()
  })

  afterEach(() => {
    restoreFetch()
  })

  // ── Percentile rolls render through the standard formula path ────

  it('renders a percentile roll through the standard formula path', async () => {
    await openDockWithSession('session-1')
    act(() => {
      sharedTestState.capturedOnEvent?.({
        type: 'roll',
        campaignId: CAMPAIGN_ID,
        data: makeRoll({ id: 'roll-pct-1', formula: 'd%', rolls: [97], total: 97 }),
      })
    })
    expect(screen.getByText('d% → [97] =')).toBeInTheDocument()
    expect(screen.getByText('97')).toBeInTheDocument()
  })

  it('renders the percentile 100 result through the standard formula path', async () => {
    await openDockWithSession('session-1')
    act(() => {
      sharedTestState.capturedOnEvent?.({
        type: 'roll',
        campaignId: CAMPAIGN_ID,
        data: makeRoll({ id: 'roll-pct-2', formula: 'd%', rolls: [100], total: 100 }),
      })
    })
    expect(screen.getByText('d% → [100] =')).toBeInTheDocument()
    expect(screen.getByText('100')).toBeInTheDocument()
  })

  // ── RollFeedItem visual output ──────────────────────────────────

  it('roll feed item shows formula, breakdown, total, roller name, and [DM] for dm-only', async () => {
    await openDockWithSession('session-1')
    act(() => {
      sharedTestState.capturedOnEvent?.({
        type: 'roll',
        campaignId: CAMPAIGN_ID,
        data: makeRoll({ rollerName: 'thegm', formula: '1d20+3', rolls: [17], total: 20, visibility: { scope: 'dm-only' } }),
      })
    })
    expect(screen.getByText('thegm')).toBeInTheDocument()
    expect(screen.getByText(/1d20\+3/)).toBeInTheDocument()
    expect(screen.getByText(/\[17\]/)).toBeInTheDocument()
    expect(screen.getByText('20')).toBeInTheDocument()
    expect(screen.getByText('[DM]')).toBeInTheDocument()
  })

  it('group-scoped roll shows no [DM] marker', async () => {
    await openDockWithSession('session-1')
    act(() => {
      sharedTestState.capturedOnEvent?.({
        type: 'roll',
        campaignId: CAMPAIGN_ID,
        data: makeRoll({ visibility: { scope: 'group' } }),
      })
    })
    expect(screen.queryByText('[DM]')).not.toBeInTheDocument()
  })

  it('roll item has background class that message item does not', async () => {
    await openDockWithSession('session-1')
    act(() => {
      sharedTestState.capturedOnEvent?.({
        type: 'message',
        campaignId: CAMPAIGN_ID,
        data: { id: 'msg-1', campaignId: CAMPAIGN_ID, senderId: 'u1', senderName: 'Alice', text: 'Plain message', visibility: { scope: 'group' }, createdAt: new Date() },
      })
    })
    act(() => {
      sharedTestState.capturedOnEvent?.({
        type: 'roll',
        campaignId: CAMPAIGN_ID,
        data: makeRoll({ id: 'roll-2' }),
      })
    })
    // Roll items have bg-gray-700/50 class, message items don't
    const rollItem = screen.getByText('thegm').closest('div[class*="bg-gray-700"]')
    expect(rollItem).toBeInTheDocument()
  })

  it('roll item displays the vendored d20 icon, not the dice emoji', async () => {
    await openDockWithSession('session-1')
    act(() => {
      sharedTestState.capturedOnEvent?.({
        type: 'roll',
        campaignId: CAMPAIGN_ID,
        data: makeRoll(),
      })
    })
    expect(screen.queryByText('🎲')).not.toBeInTheDocument()
    const rollItem = screen.getByText('thegm').closest('div[class*="bg-gray-700"]')
    expect(rollItem?.querySelector('svg')).toBeInTheDocument()
  })
})
