import { render, screen, act, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { CampaignChat } from '@/lib/components/CampaignChat'
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

describe('CampaignChat — roll feed / history fetch on expand', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    sharedTestState.capturedOnEvent = null
    setupFetchMock()
  })

  afterEach(() => {
    restoreFetch()
  })

  it('fetches roll history with correct sessionId on dock expand', async () => {
    await openDockWithSession('session-xyz')
    await waitFor(() => {
      expect(sharedTestState.fetchSpy).toHaveBeenCalledWith(
        `/api/campaigns/${CAMPAIGN_ID}/rolls?sessionId=session-xyz&limit=30`,
      )
    })
  })

  it('does not fetch rolls when activeSessionId is null; still fetches messages', async () => {
    await openDockWithSession(null)
    await waitFor(() => {
      expect(sharedTestState.fetchSpy).toHaveBeenCalledWith(expect.stringContaining('/messages?limit=30'))
    })
    expect(sharedTestState.fetchSpy).not.toHaveBeenCalledWith(expect.stringContaining('/rolls?sessionId'))
  })

  it('merged feed is sorted by createdAt', async () => {
    const t1 = new Date('2026-01-01T10:00:00Z').toISOString()
    const t2 = new Date('2026-01-01T11:00:00Z').toISOString()
    const t3 = new Date('2026-01-01T12:00:00Z').toISOString()

    setupFetchMock({
      messages: {
        messages: [
          // API returns newest-first
          { id: 'msg-3', campaignId: CAMPAIGN_ID, senderId: 'u1', senderName: 'Alice', text: 'Msg T3', visibility: { scope: 'group' }, createdAt: t3 },
          { id: 'msg-1', campaignId: CAMPAIGN_ID, senderId: 'u1', senderName: 'Alice', text: 'Msg T1', visibility: { scope: 'group' }, createdAt: t1 },
        ],
      },
      rolls: {
        rolls: [
          { id: 'roll-2', campaignId: CAMPAIGN_ID, sessionId: 'session-1', rollerId: 'u1', rollerName: 'Alice', formula: '1d6', rolls: [3], total: 3, visibility: { scope: 'group' }, createdAt: t2 },
        ],
      },
    })

    await openDockWithSession('session-1')

    await waitFor(() => {
      const items = screen.getAllByText(/Msg T|1d6/)
      expect(items[0].textContent).toContain('Msg T1')
      expect(items[1].textContent).toContain('1d6')
      expect(items[2].textContent).toContain('Msg T3')
    })
  })

  it('roll id in both history and prior stream event appears only once', async () => {
    setupFetchMock({
      messages: { messages: [] },
      rolls: {
        rolls: [makeRoll({ id: 'roll-dup', formula: '1d4', rolls: [2], total: 2 })],
      },
    })

    const user = userEvent.setup()
    render(<CampaignChat campaignId={CAMPAIGN_ID} activeSessionId="session-1" />)

    // Stream event arrives before history loads
    act(() => {
      sharedTestState.capturedOnEvent?.({
        type: 'roll',
        campaignId: CAMPAIGN_ID,
        data: makeRoll({ id: 'roll-dup', formula: '1d4', rolls: [2], total: 2 }),
      })
    })

    // Now expand dock (triggers history fetch)
    await user.click(screen.getByRole('button', { name: /chat/i }))
    await waitFor(() => {
      expect(sharedTestState.fetchSpy).toHaveBeenCalledWith(expect.stringContaining('/rolls?sessionId'))
    })

    // Should appear only once
    await waitFor(() => {
      expect(screen.getAllByText(/1d4/)).toHaveLength(1)
    })
  })
})
