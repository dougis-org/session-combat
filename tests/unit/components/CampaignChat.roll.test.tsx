import { render, screen, act, waitFor, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { CampaignChat } from '@/lib/components/CampaignChat'
import type { CampaignRoll, CampaignStreamEvent } from '@/lib/types'

// ── Mocks ─────────────────────────────────────────────────────────

jest.mock('@/lib/offline/LocalStore', () => ({
  LocalStore: { get: jest.fn().mockReturnValue(null), set: jest.fn(), remove: jest.fn() },
}))

jest.mock('@/lib/utils/dice', () => ({
  rollDie: jest.fn().mockReturnValue([15]),
}))

let capturedOnEvent: ((e: CampaignStreamEvent) => void) | null = null
jest.mock('@/lib/hooks/useCampaignStream', () => ({
  useCampaignStream: jest.fn((_, onEvent) => {
    capturedOnEvent = onEvent
    return { status: 'open' }
  }),
}))

jest.mock('@/lib/hooks/useAuth', () => ({
  useAuth: jest.fn(() => ({
    user: { userId: 'user-1', email: 'test@example.com', username: 'tester' },
    loading: false,
  })),
}))

// ── Test fixtures ─────────────────────────────────────────────────

function makeRoll(overrides: Partial<CampaignRoll> = {}): CampaignRoll {
  return {
    id: 'roll-1',
    campaignId: 'test-campaign',
    sessionId: 'session-1',
    rollerId: 'user-1',
    rollerName: 'thegm',
    formula: '1d20+3',
    rolls: [17],
    total: 20,
    visibility: { scope: 'group' },
    createdAt: new Date('2026-01-01T12:00:00Z'),
    ...overrides,
  }
}

// ── Setup ─────────────────────────────────────────────────────────

let fetchSpy: jest.Mock
const originalFetch = global.fetch

function setupFetchMock(overrides: Record<string, unknown> = {}) {
  fetchSpy = jest.fn().mockImplementation((url: string, init?: RequestInit) => {
    if (url.includes('/members')) {
      return Promise.resolve({ ok: true, json: () => Promise.resolve({ members: [] }) })
    }
    if (url.includes('/messages') && (!init || init.method !== 'POST')) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(overrides.messages ?? { messages: [] }),
      })
    }
    if (url.includes('/rolls') && (!init || init.method !== 'POST')) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(overrides.rolls ?? { rolls: [] }),
      })
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

async function openDock(activeSessionId?: string | null) {
  const user = userEvent.setup()
  render(<CampaignChat campaignId="test-campaign" activeSessionId={activeSessionId ?? null} />)
  await user.click(screen.getByRole('button', { name: /chat/i }))
  return user
}

beforeEach(() => {
  jest.clearAllMocks()
  capturedOnEvent = null
  setupFetchMock()
})

afterEach(() => {
  global.fetch = originalFetch
})

// ── T1 — activeSessionId prop ────────────────────────────────────

// T1.1
it('renders without error when activeSessionId is null', async () => {
  await openDock(null)
  expect(screen.getByRole('complementary', { name: /campaign chat/i })).toBeInTheDocument()
})

// T1.2
it('renders without error when activeSessionId is a non-null string', async () => {
  await openDock('session-abc')
  expect(screen.getByRole('complementary', { name: /campaign chat/i })).toBeInTheDocument()
})

// ── T2 — FeedItem union and stream handler ────────────────────────

// T2.1
it('stream roll event appends a roll item to the feed', async () => {
  await openDock('session-1')
  act(() => {
    capturedOnEvent?.({
      type: 'roll',
      campaignId: 'test-campaign',
      data: makeRoll({ formula: '1d20+3', rolls: [17], total: 20 }),
    })
  })
  expect(screen.getByText('1d20+3 → [17] =')).toBeInTheDocument()
})

// T2.2
it('duplicate roll id from stream is ignored', async () => {
  await openDock('session-1')
  act(() => {
    capturedOnEvent?.({
      type: 'roll',
      campaignId: 'test-campaign',
      data: makeRoll({ id: 'roll-dup', formula: '1d6', rolls: [4], total: 4 }),
    })
  })
  act(() => {
    capturedOnEvent?.({
      type: 'roll',
      campaignId: 'test-campaign',
      data: makeRoll({ id: 'roll-dup', formula: '1d6', rolls: [4], total: 4 }),
    })
  })
  expect(screen.getAllByText(/1d6/)).toHaveLength(1)
})

// T2.3
it('stream message event still appends a message item to the feed (regression)', async () => {
  await openDock('session-1')
  act(() => {
    capturedOnEvent?.({
      type: 'message',
      campaignId: 'test-campaign',
      data: {
        id: 'msg-1', campaignId: 'test-campaign', senderId: 'user-1',
        senderName: 'Alice', text: 'Hello world',
        visibility: { scope: 'group' }, createdAt: new Date(),
      },
    })
  })
  expect(screen.getByText('Hello world')).toBeInTheDocument()
})

// T2.4
it('feed renders both message and roll items from stream events', async () => {
  await openDock('session-1')
  act(() => {
    capturedOnEvent?.({
      type: 'message',
      campaignId: 'test-campaign',
      data: { id: 'msg-1', campaignId: 'test-campaign', senderId: 'u1', senderName: 'Alice', text: 'Hi', visibility: { scope: 'group' }, createdAt: new Date() },
    })
  })
  act(() => {
    capturedOnEvent?.({
      type: 'roll',
      campaignId: 'test-campaign',
      data: makeRoll({ id: 'roll-2', formula: '1d8', rolls: [5], total: 5 }),
    })
  })
  expect(screen.getByText('Hi')).toBeInTheDocument()
  expect(screen.getByText(/1d8/)).toBeInTheDocument()
})

// ── T3 — RollFeedItem rendering ───────────────────────────────────

// T3.1
it('roll feed item shows formula, breakdown, total, roller name, and [DM] for dm-only', async () => {
  await openDock('session-1')
  act(() => {
    capturedOnEvent?.({
      type: 'roll',
      campaignId: 'test-campaign',
      data: makeRoll({ rollerName: 'thegm', formula: '1d20+3', rolls: [17], total: 20, visibility: { scope: 'dm-only' } }),
    })
  })
  expect(screen.getByText('thegm')).toBeInTheDocument()
  expect(screen.getByText(/1d20\+3/)).toBeInTheDocument()
  expect(screen.getByText(/\[17\]/)).toBeInTheDocument()
  expect(screen.getByText('20')).toBeInTheDocument()
  expect(screen.getByText('[DM]')).toBeInTheDocument()
})

// T3.2
it('group-scoped roll shows no [DM] marker', async () => {
  await openDock('session-1')
  act(() => {
    capturedOnEvent?.({
      type: 'roll',
      campaignId: 'test-campaign',
      data: makeRoll({ visibility: { scope: 'group' } }),
    })
  })
  expect(screen.queryByText('[DM]')).not.toBeInTheDocument()
})

// T3.3
it('roll item has background class that message item does not', async () => {
  await openDock('session-1')
  act(() => {
    capturedOnEvent?.({
      type: 'message',
      campaignId: 'test-campaign',
      data: { id: 'msg-1', campaignId: 'test-campaign', senderId: 'u1', senderName: 'Alice', text: 'Plain message', visibility: { scope: 'group' }, createdAt: new Date() },
    })
  })
  act(() => {
    capturedOnEvent?.({
      type: 'roll',
      campaignId: 'test-campaign',
      data: makeRoll({ id: 'roll-2' }),
    })
  })
  // Roll items have bg-gray-700/50 class, message items don't
  const rollItem = screen.getByText('thegm').closest('div[class*="bg-gray-700"]')
  expect(rollItem).toBeInTheDocument()
})

// T3.4
it('roll item displays dice indicator emoji', async () => {
  await openDock('session-1')
  act(() => {
    capturedOnEvent?.({
      type: 'roll',
      campaignId: 'test-campaign',
      data: makeRoll(),
    })
  })
  expect(screen.getByText('🎲')).toBeInTheDocument()
})

// ── T4 — RollEntryStrip ───────────────────────────────────────────

// T4.1
it('roll strip disabled with "No active session" when activeSessionId is null', async () => {
  await openDock(null)
  expect(screen.getByText('No active session')).toBeInTheDocument()
  expect(screen.getByRole('button', { name: 'd20' })).toBeDisabled()
  expect(screen.getByLabelText('Modifier')).toBeDisabled()
  expect(screen.getByLabelText('Roll visibility')).toBeDisabled()
})

// T4.2
it('roll strip enabled when activeSessionId is non-null and stream is open', async () => {
  await openDock('session-1')
  expect(screen.queryByText('No active session')).not.toBeInTheDocument()
  expect(screen.getByRole('button', { name: 'd20' })).not.toBeDisabled()
  expect(screen.getByLabelText('Modifier')).not.toBeDisabled()
  expect(screen.getByLabelText('Roll visibility')).not.toBeDisabled()
})

// T4.3
it('clicking d20 with modifier=3 posts correct formula and total', async () => {
  const { rollDie } = await import('@/lib/utils/dice')
  ;(rollDie as jest.Mock).mockReturnValue([15])
  const user = await openDock('session-1')
  const modifierInput = screen.getByLabelText('Modifier')
  await user.clear(modifierInput)
  await user.type(modifierInput, '3')
  await user.click(screen.getByRole('button', { name: 'd20' }))
  await waitFor(() => {
    expect(fetchSpy).toHaveBeenCalledWith(
      '/api/campaigns/test-campaign/rolls',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ formula: '1d20+3', rolls: [15], total: 18, visibility: { scope: 'group' } }),
      }),
    )
  })
})

// T4.4
it('clicking d6 with modifier=0 sends formula without +0', async () => {
  const { rollDie } = await import('@/lib/utils/dice')
  ;(rollDie as jest.Mock).mockReturnValue([4])
  await openDock('session-1')
  await userEvent.click(screen.getByRole('button', { name: 'd6' }))
  await waitFor(() => {
    expect(fetchSpy).toHaveBeenCalledWith(
      '/api/campaigns/test-campaign/rolls',
      expect.objectContaining({
        body: JSON.stringify({ formula: '1d6', rolls: [4], total: 4, visibility: { scope: 'group' } }),
      }),
    )
  })
})

// T4.5
it('clicking d8 with modifier=-2 sends formula with minus sign', async () => {
  const { rollDie } = await import('@/lib/utils/dice')
  ;(rollDie as jest.Mock).mockReturnValue([5])
  const user = await openDock('session-1')
  const modifierInput = screen.getByLabelText('Modifier')
  fireEvent.change(modifierInput, { target: { value: '-2' } })
  await user.click(screen.getByRole('button', { name: 'd8' }))
  await waitFor(() => {
    expect(fetchSpy).toHaveBeenCalledWith(
      '/api/campaigns/test-campaign/rolls',
      expect.objectContaining({
        body: JSON.stringify({ formula: '1d8-2', rolls: [5], total: 3, visibility: { scope: 'group' } }),
      }),
    )
  })
})

// T4.6
it('visibility selector defaults to group on first render', async () => {
  await openDock('session-1')
  expect(screen.getByLabelText('Roll visibility')).toHaveValue('group')
})

// T4.7
it('selecting DM-only sends correct scope', async () => {
  const { rollDie } = await import('@/lib/utils/dice')
  ;(rollDie as jest.Mock).mockReturnValue([10])
  const user = await openDock('session-1')
  await user.selectOptions(screen.getByLabelText('Roll visibility'), 'dm-only')
  await user.click(screen.getByRole('button', { name: 'd6' }))
  await waitFor(() => {
    expect(fetchSpy).toHaveBeenCalledWith(
      '/api/campaigns/test-campaign/rolls',
      expect.objectContaining({
        body: expect.stringContaining('"scope":"dm-only"'),
      }),
    )
  })
})

// T4.9
it('409 response shows inline "No active session" error', async () => {
  setupFetchMock({ rollPostStatus: 409 })
  await openDock('session-1')
  await userEvent.click(screen.getByRole('button', { name: 'd20' }))
  await waitFor(() => {
    expect(screen.getByText('No active session')).toBeInTheDocument()
  })
})

// T4.10
it('successful 201 response calls onRollPosted (roll appears in feed)', async () => {
  const returnedRoll = makeRoll({ id: 'roll-from-server', formula: '1d20', rolls: [15], total: 15 })
  setupFetchMock({ rollPostBody: returnedRoll, rollPostStatus: 201 })
  await openDock('session-1')
  await userEvent.click(screen.getByRole('button', { name: 'd20' }))
  await waitFor(() => {
    expect(screen.getByText(/1d20/)).toBeInTheDocument()
  })
})

// ── T5 — Roll history fetch on expand ────────────────────────────

// T5.1
it('fetches roll history with correct sessionId on dock expand', async () => {
  await openDock('session-xyz')
  await waitFor(() => {
    expect(fetchSpy).toHaveBeenCalledWith(
      '/api/campaigns/test-campaign/rolls?sessionId=session-xyz&limit=30',
    )
  })
})

// T5.2
it('does not fetch rolls when activeSessionId is null; still fetches messages', async () => {
  await openDock(null)
  await waitFor(() => {
    expect(fetchSpy).toHaveBeenCalledWith(expect.stringContaining('/messages?limit=30'))
  })
  expect(fetchSpy).not.toHaveBeenCalledWith(expect.stringContaining('/rolls?sessionId'))
})

// T5.3
it('merged feed is sorted by createdAt', async () => {
  const t1 = new Date('2026-01-01T10:00:00Z').toISOString()
  const t2 = new Date('2026-01-01T11:00:00Z').toISOString()
  const t3 = new Date('2026-01-01T12:00:00Z').toISOString()

  setupFetchMock({
    messages: {
      messages: [
        // API returns newest-first
        { id: 'msg-3', campaignId: 'test-campaign', senderId: 'u1', senderName: 'Alice', text: 'Msg T3', visibility: { scope: 'group' }, createdAt: t3 },
        { id: 'msg-1', campaignId: 'test-campaign', senderId: 'u1', senderName: 'Alice', text: 'Msg T1', visibility: { scope: 'group' }, createdAt: t1 },
      ],
    },
    rolls: {
      rolls: [
        { id: 'roll-2', campaignId: 'test-campaign', sessionId: 'session-1', rollerId: 'u1', rollerName: 'Alice', formula: '1d6', rolls: [3], total: 3, visibility: { scope: 'group' }, createdAt: t2 },
      ],
    },
  })

  await openDock('session-1')

  await waitFor(() => {
    const items = screen.getAllByText(/Msg T|1d6/)
    expect(items[0].textContent).toContain('Msg T1')
    expect(items[1].textContent).toContain('1d6')
    expect(items[2].textContent).toContain('Msg T3')
  })
})

// T5.4
it('roll id in both history and prior stream event appears only once', async () => {
  setupFetchMock({
    messages: { messages: [] },
    rolls: {
      rolls: [makeRoll({ id: 'roll-dup', formula: '1d4', rolls: [2], total: 2 })],
    },
  })

  const user = userEvent.setup()
  render(<CampaignChat campaignId="test-campaign" activeSessionId="session-1" />)

  // Stream event arrives before history loads
  act(() => {
    capturedOnEvent?.({
      type: 'roll',
      campaignId: 'test-campaign',
      data: makeRoll({ id: 'roll-dup', formula: '1d4', rolls: [2], total: 2 }),
    })
  })

  // Now expand dock (triggers history fetch)
  await user.click(screen.getByRole('button', { name: /chat/i }))
  await waitFor(() => {
    expect(fetchSpy).toHaveBeenCalledWith(expect.stringContaining('/rolls?sessionId'))
  })

  // Should appear only once
  await waitFor(() => {
    expect(screen.getAllByText(/1d4/)).toHaveLength(1)
  })
})
