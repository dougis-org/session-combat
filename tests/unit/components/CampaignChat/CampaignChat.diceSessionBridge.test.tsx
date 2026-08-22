import { render, screen, act, waitFor } from '@testing-library/react'
import { CampaignChat } from '@/lib/components/CampaignChat'
import { requestRoll, resetDiceSessionBridge } from '@/lib/dice/diceSessionBridge'
import * as bridge from '@/lib/dice/diceSessionBridge'
import type { CampaignRoll } from '@/lib/types'

const CAMPAIGN_ID = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'

jest.mock('@/lib/offline/LocalStore', () => ({
  LocalStore: { get: jest.fn().mockReturnValue(null), set: jest.fn(), remove: jest.fn() },
}))

jest.mock('@/lib/hooks/useCampaignStream', () => ({
  useCampaignStream: jest.fn(() => ({ status: 'open' })),
}))

jest.mock('@/lib/hooks/useAuth', () => ({
  useAuth: jest.fn(() => ({
    user: { userId: 'user-1', email: 'test@example.com', username: 'tester' },
    loading: false,
  })),
}))

function makeRoll(overrides: Partial<CampaignRoll> = {}): CampaignRoll {
  return {
    id: 'roll-external-1',
    campaignId: CAMPAIGN_ID,
    sessionId: 'session-1',
    rollerId: 'user-1',
    rollerName: 'tester',
    formula: '2d6',
    rolls: [3, 5],
    total: 8,
    visibility: { scope: 'group' },
    createdAt: new Date('2026-01-01T12:00:00Z'),
    ...overrides,
  }
}

const originalFetch = global.fetch
let fetchSpy: jest.Mock

function setupFetchMock(overrides: Record<string, unknown> = {}) {
  fetchSpy = jest.fn().mockImplementation((url: string, init?: RequestInit) => {
    if (url.includes('/members')) {
      return Promise.resolve({ ok: true, json: () => Promise.resolve({ members: [] }) })
    }
    if (url.includes('/messages') && (!init || init.method !== 'POST')) {
      return Promise.resolve({ ok: true, json: () => Promise.resolve({ messages: [] }) })
    }
    if (url.includes('/rolls') && (!init || init.method !== 'POST')) {
      return Promise.resolve({ ok: true, json: () => Promise.resolve({ rolls: [] }) })
    }
    if (url.includes('/rolls') && init?.method === 'POST') {
      const status = (overrides.rollPostStatus as number) ?? 201
      const body = overrides.rollPostBody ?? makeRoll()
      return Promise.resolve({
        ok: status >= 200 && status < 300,
        status,
        json: () => Promise.resolve(body),
      })
    }
    return Promise.resolve({ ok: true, json: () => Promise.resolve({}) })
  })
  global.fetch = fetchSpy as unknown as typeof global.fetch
}

beforeEach(() => {
  jest.clearAllMocks()
  resetDiceSessionBridge()
  setupFetchMock()
})

afterEach(() => {
  global.fetch = originalFetch
  resetDiceSessionBridge()
})

async function openDock(campaignId: string, activeSessionId: string | null) {
  render(<CampaignChat campaignId={campaignId} activeSessionId={activeSessionId} />)
  await act(async () => {
    screen.getByRole('button', { name: /chat/i }).click()
  })
}

describe('CampaignChat — dice session bridge presence lifecycle', () => {
  it('mounting with an active session announces presence', () => {
    const spy = jest.spyOn(bridge, 'announcePresence')
    render(<CampaignChat campaignId={CAMPAIGN_ID} activeSessionId="session-1" />)
    expect(spy).toHaveBeenCalledWith({ campaignId: CAMPAIGN_ID, sessionId: 'session-1' })
  })

  it('mounting with no active session never announces presence', () => {
    const spy = jest.spyOn(bridge, 'announcePresence')
    render(<CampaignChat campaignId={CAMPAIGN_ID} activeSessionId={null} />)
    expect(spy).not.toHaveBeenCalled()
  })

  it('session ending clears presence', () => {
    const spy = jest.spyOn(bridge, 'clearPresence')
    const { rerender } = render(<CampaignChat campaignId={CAMPAIGN_ID} activeSessionId="session-1" />)
    rerender(<CampaignChat campaignId={CAMPAIGN_ID} activeSessionId={null} />)
    expect(spy).toHaveBeenCalled()
  })

  it('unmounting clears presence', () => {
    const spy = jest.spyOn(bridge, 'clearPresence')
    const { unmount } = render(<CampaignChat campaignId={CAMPAIGN_ID} activeSessionId="session-1" />)
    unmount()
    expect(spy).toHaveBeenCalled()
  })
})

describe('CampaignChat — dice session bridge roll-request scoping', () => {
  it('a matching roll request is submitted through the existing commit path and appears in the feed', async () => {
    await openDock(CAMPAIGN_ID, 'session-1')
    act(() => {
      requestRoll({
        campaignId: CAMPAIGN_ID,
        sessionId: 'session-1',
        roll: { formula: '2d6', rolls: [3, 5], total: 8, visibility: { scope: 'group' } },
      })
    })
    await waitFor(() => {
      expect(screen.getByText(/2d6/)).toBeInTheDocument()
    })
  })

  it('a roll request for a different campaign is ignored', async () => {
    await openDock(CAMPAIGN_ID, 'session-1')
    fetchSpy.mockClear()
    act(() => {
      requestRoll({
        campaignId: 'other-campaign',
        sessionId: 'session-1',
        roll: { formula: '1d20', rolls: [10], total: 10, visibility: { scope: 'group' } },
      })
    })
    expect(screen.queryByText(/1d20/)).not.toBeInTheDocument()
    expect(fetchSpy).not.toHaveBeenCalledWith(expect.stringContaining('/rolls'), expect.objectContaining({ method: 'POST' }))
  })

  it('a roll request for a stale/mismatched session is ignored', async () => {
    await openDock(CAMPAIGN_ID, 'session-1')
    act(() => {
      requestRoll({
        campaignId: CAMPAIGN_ID,
        sessionId: 'session-stale',
        roll: { formula: '1d12', rolls: [7], total: 7, visibility: { scope: 'group' } },
      })
    })
    expect(screen.queryByText(/1d12/)).not.toBeInTheDocument()
  })

  it('409 on an externally-requested roll adds nothing to the feed and does not crash', async () => {
    setupFetchMock({ rollPostStatus: 409 })
    await openDock(CAMPAIGN_ID, 'session-1')
    act(() => {
      requestRoll({
        campaignId: CAMPAIGN_ID,
        sessionId: 'session-1',
        roll: { formula: '1d4', rolls: [2], total: 2, visibility: { scope: 'group' } },
      })
    })
    await waitFor(() => {
      expect(screen.queryByText(/1d4/)).not.toBeInTheDocument()
    })
  })
})
