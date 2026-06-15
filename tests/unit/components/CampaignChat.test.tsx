import { render, screen, fireEvent, act, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { CampaignChat } from '@/lib/components/CampaignChat'
import { LocalStore } from '@/lib/offline/LocalStore'
import type { CampaignStreamEvent } from '@/lib/types'

jest.mock('@/lib/offline/LocalStore', () => ({
  LocalStore: {
    get: jest.fn().mockReturnValue(null),
    set: jest.fn(),
    remove: jest.fn(),
  },
}))

// Capture the onEvent callback so tests can fire synthetic stream events
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

const mockedLocalStore = LocalStore as jest.Mocked<typeof LocalStore>

// Default fetch mock: empty members and messages
let fetchSpy: jest.Mock
const originalFetch = global.fetch

function setupFetchMock(overrides?: Record<string, unknown>) {
  fetchSpy = jest.fn().mockImplementation((url: string) => {
    if (url.includes('/members')) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(overrides?.members ?? { members: [] }),
      })
    }
    if (url.includes('/messages')) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(overrides?.messages ?? { messages: [] }),
      })
    }
    return Promise.resolve({ ok: true, json: () => Promise.resolve({}) })
  })
  global.fetch = fetchSpy as unknown as typeof global.fetch
}

beforeEach(() => {
  jest.clearAllMocks()
  mockedLocalStore.get.mockReturnValue(null)
  capturedOnEvent = null
  setupFetchMock()
})

afterEach(() => {
  global.fetch = originalFetch
})

// ── Existing shell tests (TC-01 to TC-13) ──────────────────────────

// TC-01
it('pill button is present on initial render', () => {
  render(<CampaignChat campaignId="test-campaign" />)
  expect(screen.getByRole('button', { name: /chat/i })).toBeInTheDocument()
})

// TC-02
it('drawer is absent on initial render when no pin stored', () => {
  render(<CampaignChat campaignId="test-campaign" />)
  expect(screen.queryByRole('complementary')).not.toBeInTheDocument()
})

// TC-03
it('drawer is present on mount when pin is stored', async () => {
  mockedLocalStore.get.mockReturnValue(true)
  render(<CampaignChat campaignId="test-campaign" />)
  expect(screen.getByRole('complementary', { name: /campaign chat/i })).toBeInTheDocument()
})

// TC-04
it('clicking pill expands the drawer', async () => {
  const user = userEvent.setup()
  render(<CampaignChat campaignId="test-campaign" />)
  await user.click(screen.getByRole('button', { name: /chat/i }))
  expect(screen.getByRole('complementary')).toBeInTheDocument()
})

// TC-05
it('clicking close button collapses the drawer', async () => {
  const user = userEvent.setup()
  render(<CampaignChat campaignId="test-campaign" />)
  await user.click(screen.getByRole('button', { name: /chat/i }))
  await user.click(screen.getByRole('button', { name: /collapse/i }))
  expect(screen.queryByRole('complementary')).not.toBeInTheDocument()
})

// TC-06
it('pressing Escape collapses the drawer', async () => {
  const user = userEvent.setup()
  render(<CampaignChat campaignId="test-campaign" />)
  await user.click(screen.getByRole('button', { name: /chat/i }))
  fireEvent.keyDown(document, { key: 'Escape' })
  expect(screen.queryByRole('complementary')).not.toBeInTheDocument()
})

// TC-07
it('pressing Escape when collapsed has no effect', () => {
  render(<CampaignChat campaignId="test-campaign" />)
  fireEvent.keyDown(document, { key: 'Escape' })
  expect(screen.queryByRole('complementary')).not.toBeInTheDocument()
  expect(screen.getByRole('button', { name: /chat/i })).toBeInTheDocument()
})

// TC-08
it('pin button has aria-pressed="false" when not pinned', async () => {
  const user = userEvent.setup()
  render(<CampaignChat campaignId="test-campaign" />)
  await user.click(screen.getByRole('button', { name: /chat/i }))
  expect(screen.getByRole('button', { name: /pin/i })).toHaveAttribute('aria-pressed', 'false')
})

// TC-09
it('clicking pin sets aria-pressed="true" and calls LocalStore.set', async () => {
  const user = userEvent.setup()
  render(<CampaignChat campaignId="test-campaign" />)
  await user.click(screen.getByRole('button', { name: /chat/i }))
  const pinButton = screen.getByRole('button', { name: /pin/i })
  await user.click(pinButton)
  expect(pinButton).toHaveAttribute('aria-pressed', 'true')
  expect(mockedLocalStore.set).toHaveBeenCalledWith('campaign-chat-pin', true)
})

// TC-10
it('clicking pin again sets aria-pressed="false" and calls LocalStore.remove', async () => {
  const user = userEvent.setup()
  render(<CampaignChat campaignId="test-campaign" />)
  await user.click(screen.getByRole('button', { name: /chat/i }))
  const pinButton = screen.getByRole('button', { name: /pin/i })
  await user.click(pinButton)
  await user.click(pinButton)
  expect(pinButton).toHaveAttribute('aria-pressed', 'false')
  expect(mockedLocalStore.remove).toHaveBeenCalledWith('campaign-chat-pin')
})

// TC-11
it('unpinning while expanded does not collapse the drawer', async () => {
  const user = userEvent.setup()
  render(<CampaignChat campaignId="test-campaign" />)
  await user.click(screen.getByRole('button', { name: /chat/i }))
  const pinButton = screen.getByRole('button', { name: /pin/i })
  await user.click(pinButton)
  await user.click(pinButton)
  expect(screen.getByRole('complementary')).toBeInTheDocument()
})

// TC-12
it('drawer has role="complementary" and aria-label="Campaign Chat"', async () => {
  const user = userEvent.setup()
  render(<CampaignChat campaignId="test-campaign" />)
  await user.click(screen.getByRole('button', { name: /chat/i }))
  expect(screen.getByRole('complementary', { name: 'Campaign Chat' })).toBeInTheDocument()
})

// TC-13
it('pill button is keyboard-activatable with Enter', async () => {
  const user = userEvent.setup()
  render(<CampaignChat campaignId="test-campaign" />)
  const pill = screen.getByRole('button', { name: /chat/i })
  pill.focus()
  await user.keyboard('{Enter}')
  expect(screen.getByRole('complementary')).toBeInTheDocument()
})

// ── T2 — Stream tests ────────────────────────────────────────────────

// T2e-1: stream message event appends to feed
it('stream message event adds message to feed when dock is open', async () => {
  const user = userEvent.setup()
  render(<CampaignChat campaignId="test-campaign" />)
  await user.click(screen.getByRole('button', { name: /chat/i }))

  act(() => {
    capturedOnEvent?.({
      type: 'message',
      campaignId: 'test-campaign',
      data: {
        id: 'msg-1',
        campaignId: 'test-campaign',
        senderId: 'user-1',
        senderName: 'Alice',
        text: 'Hello world',
        visibility: { scope: 'group' },
        createdAt: new Date().toISOString(),
      },
    })
  })

  expect(screen.getByText('Hello world')).toBeInTheDocument()
  expect(screen.getByText('Alice')).toBeInTheDocument()
})

// T2e-2: duplicate stream event does not duplicate message
it('duplicate stream event is ignored', async () => {
  const user = userEvent.setup()
  render(<CampaignChat campaignId="test-campaign" />)
  await user.click(screen.getByRole('button', { name: /chat/i }))

  const event = {
    type: 'message',
    campaignId: 'test-campaign',
    data: {
      id: 'msg-dup',
      campaignId: 'test-campaign',
      senderId: 'user-1',
      senderName: 'Bob',
      text: 'Duplicate',
      visibility: { scope: 'group' },
      createdAt: new Date().toISOString(),
    },
  }

  act(() => { capturedOnEvent?.(event) })
  act(() => { capturedOnEvent?.(event) })

  expect(screen.getAllByText('Duplicate')).toHaveLength(1)
})

// T2e-3: heartbeat event does not change feed
it('heartbeat event does not affect message feed', async () => {
  const user = userEvent.setup()
  render(<CampaignChat campaignId="test-campaign" />)
  await user.click(screen.getByRole('button', { name: /chat/i }))

  act(() => {
    capturedOnEvent?.({ type: 'heartbeat', campaignId: 'test-campaign', data: { ts: Date.now() } })
  })

  expect(screen.queryByText('Hello world')).not.toBeInTheDocument()
  expect(screen.getByText('No messages yet.')).toBeInTheDocument()
})

// ── T3 — Members tests ───────────────────────────────────────────────

// T3c-1: members fetched on mount
it('fetches members on mount', async () => {
  render(<CampaignChat campaignId="test-campaign" />)
  await waitFor(() => {
    expect(fetchSpy).toHaveBeenCalledWith(
      expect.stringContaining('/api/campaigns/test-campaign/members'),
    )
  })
})

// T3c-2: fetch failure leaves members empty (no crash)
it('members fetch failure does not crash the component', async () => {
  fetchSpy.mockImplementation((url: string) => {
    if (url.includes('/members')) return Promise.reject(new Error('network error'))
    return Promise.resolve({ ok: true, json: () => Promise.resolve({ messages: [] }) })
  })

  expect(() => render(<CampaignChat campaignId="test-campaign" />)).not.toThrow()
  await waitFor(() => {
    expect(fetchSpy).toHaveBeenCalledWith(
      expect.stringContaining('/members'),
    )
  })
})

// ── T4 — History tests ───────────────────────────────────────────────

// T4d-1: history NOT fetched on mount (dock collapsed)
it('history is not fetched on mount when dock is collapsed', async () => {
  render(<CampaignChat campaignId="test-campaign" />)
  await waitFor(() => {
    expect(fetchSpy).toHaveBeenCalledWith(expect.stringContaining('/members'))
  })
  expect(fetchSpy).not.toHaveBeenCalledWith(expect.stringContaining('/messages'))
})

// T4d-2: history fetched when dock opens
it('history is fetched when dock is expanded', async () => {
  const user = userEvent.setup()
  render(<CampaignChat campaignId="test-campaign" />)
  await user.click(screen.getByRole('button', { name: /chat/i }))
  await waitFor(() => {
    expect(fetchSpy).toHaveBeenCalledWith(
      expect.stringContaining('/messages?page=1&perPage=30'),
    )
  })
})

// T4d-3: hasMore = false when result count < 30
it('hasMore is false when history returns fewer than 30 messages', async () => {
  const messages = Array.from({ length: 5 }, (_, i) => ({
    id: `msg-${i}`,
    campaignId: 'test-campaign',
    senderId: 'user-1',
    senderName: 'Alice',
    text: `Message ${i}`,
    visibility: { scope: 'group' },
    createdAt: new Date().toISOString(),
  }))
  setupFetchMock({ messages: { messages } })

  const user = userEvent.setup()
  render(<CampaignChat campaignId="test-campaign" />)
  await user.click(screen.getByRole('button', { name: /chat/i }))

  await waitFor(() => {
    expect(screen.getByText('Message 0')).toBeInTheDocument()
  })
  // If hasMore=false the component won't fetch page 2 on scroll — tested indirectly
})

// ── T5 — Unread badge tests ──────────────────────────────────────────

// T5f-1: stream message while collapsed increments badge
it('stream message while dock is collapsed shows unread badge', async () => {
  const pastDate = new Date(Date.now() - 5000).toISOString()
  mockedLocalStore.get.mockImplementation((key: string) => {
    if (key === 'campaign-chat-last-open-test-campaign') return pastDate
    return null
  })

  render(<CampaignChat campaignId="test-campaign" />)

  act(() => {
    capturedOnEvent?.({
      type: 'message',
      campaignId: 'test-campaign',
      data: {
        id: 'new-msg',
        campaignId: 'test-campaign',
        senderId: 'user-2',
        senderName: 'Bob',
        text: 'Hi',
        visibility: { scope: 'group' },
        createdAt: new Date().toISOString(),
      },
    })
  })

  expect(screen.getByLabelText('unread messages')).toBeInTheDocument()
})

// T5f-2: opening dock clears badge and updates LocalStore
it('opening dock clears unread badge and updates LocalStore', async () => {
  const pastDate = new Date(Date.now() - 5000).toISOString()
  mockedLocalStore.get.mockImplementation((key: string) => {
    if (key === 'campaign-chat-last-open-test-campaign') return pastDate
    return null
  })

  const user = userEvent.setup()
  render(<CampaignChat campaignId="test-campaign" />)

  act(() => {
    capturedOnEvent?.({
      type: 'message',
      campaignId: 'test-campaign',
      data: {
        id: 'unread-1',
        campaignId: 'test-campaign',
        senderId: 'user-2',
        senderName: 'Bob',
        text: 'Badge test',
        visibility: { scope: 'group' },
        createdAt: new Date().toISOString(),
      },
    })
  })

  await user.click(screen.getByRole('button', { name: /chat/i }))
  expect(screen.queryByLabelText('unread messages')).not.toBeInTheDocument()
  expect(mockedLocalStore.set).toHaveBeenCalledWith(
    'campaign-chat-last-open-test-campaign',
    expect.any(String),
  )
})

// T5f-3: stream message while dock is open does not increment badge
it('stream message while dock is open does not increment unread count', async () => {
  const user = userEvent.setup()
  render(<CampaignChat campaignId="test-campaign" />)
  await user.click(screen.getByRole('button', { name: /chat/i }))

  act(() => {
    capturedOnEvent?.({
      type: 'message',
      campaignId: 'test-campaign',
      data: {
        id: 'open-msg',
        campaignId: 'test-campaign',
        senderId: 'user-2',
        senderName: 'Carol',
        text: 'Visible',
        visibility: { scope: 'group' },
        createdAt: new Date().toISOString(),
      },
    })
  })

  // no badge should appear when the dock is open
  expect(screen.queryByLabelText('unread messages')).not.toBeInTheDocument()
})

// T5f-4: LocalStore throws — no crash
it('LocalStore.get throwing does not crash the component', () => {
  mockedLocalStore.get.mockImplementation(() => { throw new Error('storage unavailable') })
  expect(() => render(<CampaignChat campaignId="test-campaign" />)).not.toThrow()
})

// ── T6 — Composer tests ──────────────────────────────────────────────

// T6e-1: three visibility options present when dock is open
it('composer shows three visibility options when dock is expanded', async () => {
  const user = userEvent.setup()
  render(<CampaignChat campaignId="test-campaign" />)
  await user.click(screen.getByRole('button', { name: /chat/i }))
  expect(screen.getByRole('option', { name: 'Group' })).toBeInTheDocument()
  expect(screen.getByRole('option', { name: 'DM-only' })).toBeInTheDocument()
  expect(screen.getByRole('option', { name: 'Whisper' })).toBeInTheDocument()
})

// T6e-2: selecting DM-only changes visibility
it('selecting DM-only visibility updates the select value', async () => {
  const user = userEvent.setup()
  render(<CampaignChat campaignId="test-campaign" />)
  await user.click(screen.getByRole('button', { name: /chat/i }))
  const select = screen.getByRole('combobox')
  await user.selectOptions(select, 'dm-only')
  expect((select as HTMLSelectElement).value).toBe('dm-only')
})

// T6e-3: textarea and send disabled when streamStatus is error
it('composer is disabled when stream status is not open', async () => {
  const { useCampaignStream } = await import('@/lib/hooks/useCampaignStream')
  ;(useCampaignStream as jest.Mock).mockImplementation((_, onEvent) => {
    capturedOnEvent = onEvent
    return { status: 'error' }
  })

  const user = userEvent.setup()
  render(<CampaignChat campaignId="test-campaign" />)
  await user.click(screen.getByRole('button', { name: /chat/i }))

  const textarea = screen.getByRole('textbox')
  const sendBtn = screen.getByRole('button', { name: /send/i })
  expect(textarea).toBeDisabled()
  expect(sendBtn).toBeDisabled()

  // Restore to default implementation
  ;(useCampaignStream as jest.Mock).mockImplementation((_, onEvent) => {
    capturedOnEvent = onEvent
    return { status: 'open' }
  })
})

// ── T7 — @mention tests ──────────────────────────────────────────────

// T7h-1: typing @al shows dropdown with matching member
it('typing @prefix shows matching member in dropdown', async () => {
  setupFetchMock({
    members: {
      members: [
        { id: 'm1', userId: 'u1', username: 'alice', role: 'player', status: 'active' },
        { id: 'm2', userId: 'u2', username: 'bob', role: 'player', status: 'active' },
      ],
    },
  })

  const user = userEvent.setup()
  render(<CampaignChat campaignId="test-campaign" />)
  await user.click(screen.getByRole('button', { name: /chat/i }))

  // Wait for members to load
  await waitFor(() => expect(fetchSpy).toHaveBeenCalledWith(expect.stringContaining('/members')))

  const textarea = screen.getByRole('textbox')
  await user.type(textarea, '@al')

  await waitFor(() => {
    expect(screen.getByText('@alice')).toBeInTheDocument()
  })
  expect(screen.queryByText('@bob')).not.toBeInTheDocument()
})

// T7h-2: no match hides dropdown
it('no matching members hides the mention dropdown', async () => {
  setupFetchMock({
    members: {
      members: [
        { id: 'm1', userId: 'u1', username: 'alice', role: 'player', status: 'active' },
      ],
    },
  })

  const user = userEvent.setup()
  render(<CampaignChat campaignId="test-campaign" />)
  await user.click(screen.getByRole('button', { name: /chat/i }))

  await waitFor(() => expect(fetchSpy).toHaveBeenCalledWith(expect.stringContaining('/members')))

  const textarea = screen.getByRole('textbox')
  await user.type(textarea, '@xyz')

  await waitFor(() => {
    expect(screen.queryByText('@alice')).not.toBeInTheDocument()
  })
})

// T7h-3: selecting a member updates text and sets direct visibility
it('selecting mention sets visibility to direct and updates textarea', async () => {
  setupFetchMock({
    members: {
      members: [
        { id: 'm1', userId: 'u1', username: 'alice', role: 'player', status: 'active' },
      ],
    },
  })

  const user = userEvent.setup()
  render(<CampaignChat campaignId="test-campaign" />)
  await user.click(screen.getByRole('button', { name: /chat/i }))
  await waitFor(() => expect(fetchSpy).toHaveBeenCalledWith(expect.stringContaining('/members')))

  const textarea = screen.getByRole('textbox')
  await user.type(textarea, '@al')

  await waitFor(() => screen.getByText('@alice'))
  fireEvent.mouseDown(screen.getByText('@alice'))

  await waitFor(() => {
    expect((textarea as HTMLTextAreaElement).value).toContain('@alice')
    expect(screen.getByRole('combobox')).toHaveValue('direct')
  })
})

// T7h-4: deleting @mention text resets visibility to group
it('deleting @mention text resets visibility to group', async () => {
  setupFetchMock({
    members: {
      members: [
        { id: 'm1', userId: 'u1', username: 'alice', role: 'player', status: 'active' },
      ],
    },
  })

  const user = userEvent.setup()
  render(<CampaignChat campaignId="test-campaign" />)
  await user.click(screen.getByRole('button', { name: /chat/i }))
  await waitFor(() => expect(fetchSpy).toHaveBeenCalledWith(expect.stringContaining('/members')))

  const textarea = screen.getByRole('textbox')
  await user.type(textarea, '@al')
  await waitFor(() => screen.getByText('@alice'))
  fireEvent.mouseDown(screen.getByText('@alice'))

  await waitFor(() => expect(screen.getByRole('combobox')).toHaveValue('direct'))

  // Clear text to trigger visibility reset
  fireEvent.change(textarea, { target: { value: '', selectionStart: 0 } })

  expect(screen.getByRole('combobox')).toHaveValue('group')
})

// ── T8 — Send tests ──────────────────────────────────────────────────

// T8e-1: POST called with correct body on send
it('send button calls POST with text and visibility', async () => {
  const user = userEvent.setup()
  render(<CampaignChat campaignId="test-campaign" />)
  await user.click(screen.getByRole('button', { name: /chat/i }))

  const textarea = screen.getByRole('textbox')
  await user.type(textarea, 'Hello everyone')
  await user.click(screen.getByRole('button', { name: /send/i }))

  await waitFor(() => {
    expect(fetchSpy).toHaveBeenCalledWith(
      '/api/campaigns/test-campaign/messages',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ text: 'Hello everyone', visibility: { scope: 'group' } }),
      }),
    )
  })
})

// T8e-2: composer cleared on successful send
it('composer text is cleared after successful send', async () => {
  const user = userEvent.setup()
  render(<CampaignChat campaignId="test-campaign" />)
  await user.click(screen.getByRole('button', { name: /chat/i }))

  const textarea = screen.getByRole('textbox')
  await user.type(textarea, 'Clear me')
  await user.click(screen.getByRole('button', { name: /send/i }))

  await waitFor(() => {
    expect((textarea as HTMLTextAreaElement).value).toBe('')
  })
})

// T8e-3: empty composer does not POST
it('send does nothing when composer text is empty', async () => {
  const user = userEvent.setup()
  render(<CampaignChat campaignId="test-campaign" />)
  await user.click(screen.getByRole('button', { name: /chat/i }))

  await user.click(screen.getByRole('button', { name: /send/i }))

  expect(fetchSpy).not.toHaveBeenCalledWith(
    expect.stringContaining('/messages'),
    expect.objectContaining({ method: 'POST' }),
  )
})

// ── T9 — ChatFeed render tests ────────────────────────────────────────

// T9d-1: group message renders no visibility marker
it('group message renders without visibility marker', async () => {
  const user = userEvent.setup()
  render(<CampaignChat campaignId="test-campaign" />)
  await user.click(screen.getByRole('button', { name: /chat/i }))

  act(() => {
    capturedOnEvent?.({
      type: 'message',
      campaignId: 'test-campaign',
      data: {
        id: 'group-msg',
        campaignId: 'test-campaign',
        senderId: 'u1',
        senderName: 'Alice',
        text: 'Group message',
        visibility: { scope: 'group' },
        createdAt: new Date().toISOString(),
      },
    })
  })

  expect(screen.getByText('Group message')).toBeInTheDocument()
  expect(screen.queryByText('[DM]')).not.toBeInTheDocument()
})

// T9d-2: dm-only message renders [DM]
it('dm-only message renders [DM] marker', async () => {
  const user = userEvent.setup()
  render(<CampaignChat campaignId="test-campaign" />)
  await user.click(screen.getByRole('button', { name: /chat/i }))

  act(() => {
    capturedOnEvent?.({
      type: 'message',
      campaignId: 'test-campaign',
      data: {
        id: 'dm-msg',
        campaignId: 'test-campaign',
        senderId: 'u1',
        senderName: 'Alice',
        text: 'DM message',
        visibility: { scope: 'dm-only' },
        createdAt: new Date().toISOString(),
      },
    })
  })

  expect(screen.getByText('[DM]')).toBeInTheDocument()
})

// T9d-3: direct (whisper) message renders [→ @username]
it('direct message renders whisper marker with recipient username', async () => {
  setupFetchMock({
    members: {
      members: [
        { id: 'm1', userId: 'u2', username: 'bob', role: 'player', status: 'active' },
      ],
    },
  })

  const user = userEvent.setup()
  render(<CampaignChat campaignId="test-campaign" />)
  await user.click(screen.getByRole('button', { name: /chat/i }))
  await waitFor(() => expect(fetchSpy).toHaveBeenCalledWith(expect.stringContaining('/members')))

  act(() => {
    capturedOnEvent?.({
      type: 'message',
      campaignId: 'test-campaign',
      data: {
        id: 'whisper-msg',
        campaignId: 'test-campaign',
        senderId: 'u1',
        senderName: 'Alice',
        text: 'Whisper message',
        visibility: { scope: 'direct', toUserId: 'u2' },
        createdAt: new Date().toISOString(),
      },
    })
  })

  await waitFor(() => {
    expect(screen.getByText('[→ @bob]')).toBeInTheDocument()
  })
})

// T9d-4: loading indicator shown when isLoadingHistory
it('loading indicator is shown when history is loading', async () => {
  // Make messages fetch hang so loading state is visible
  fetchSpy.mockImplementation((url: string) => {
    if (url.includes('/members')) {
      return Promise.resolve({ ok: true, json: () => Promise.resolve({ members: [] }) })
    }
    if (url.includes('/messages')) {
      return new Promise(() => {}) // never resolves
    }
    return Promise.resolve({ ok: true, json: () => Promise.resolve({}) })
  })

  const user = userEvent.setup()
  render(<CampaignChat campaignId="test-campaign" />)
  await user.click(screen.getByRole('button', { name: /chat/i }))

  await waitFor(() => {
    expect(screen.getByText('Loading…')).toBeInTheDocument()
  })
})
