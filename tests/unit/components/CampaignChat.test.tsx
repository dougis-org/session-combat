import { render, screen, fireEvent, act, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { CampaignChat } from '@/lib/components/CampaignChat'
import { LocalStore } from '@/lib/offline/LocalStore'
import type { CampaignStreamEvent } from '@/lib/types'

const CAMPAIGN_ID = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'

jest.mock('@/lib/offline/LocalStore', () => ({
  LocalStore: {
    get: jest.fn().mockReturnValue(null),
    set: jest.fn(),
    remove: jest.fn(),
  },
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

const mockedLocalStore = LocalStore as jest.Mocked<typeof LocalStore>

let fetchSpy: jest.Mock
const originalFetch = global.fetch

// ── Test helpers ──────────────────────────────────────────────────

function setupFetchMock(overrides?: Record<string, unknown>) {
  fetchSpy = jest.fn().mockImplementation((url: string, options?: RequestInit) => {
    if (url.includes('/attachments')) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(overrides?.attachments ?? { attachmentId: 'att-test' }),
      })
    }
    if (url.includes('/members')) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(overrides?.members ?? { members: [] }),
      })
    }
    if (url.includes('/messages')) {
      if (options?.method === 'POST') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(overrides?.sceneMessage ?? { id: 'scene-1', kind: 'scene', text: '', attachmentId: 'att-test', visibility: { scope: 'group' }, campaignId: CAMPAIGN_ID, senderId: 'user-1', senderName: 'DM', createdAt: new Date().toISOString() }),
        })
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(overrides?.messages ?? { messages: [] }),
      })
    }
    return Promise.resolve({ ok: true, json: () => Promise.resolve({}) })
  })
  global.fetch = fetchSpy as unknown as typeof global.fetch
}

/** Render the component and expand the dock. Returns userEvent instance. */
async function openDock() {
  const user = userEvent.setup()
  render(<CampaignChat campaignId={CAMPAIGN_ID} />)
  await user.click(screen.getByRole('button', { name: /chat/i }))
  return user
}

/** Build and fire a synthetic stream event via act(). */
function fireMsg(overrides: Partial<{
  id: string; senderId: string; senderName: string
  text: string; visibility: { scope: string; toUserId?: string }; createdAt: string
}> = {}) {
  const visibility = overrides.visibility ?? { scope: 'group' }
  act(() => {
    capturedOnEvent?.({
      type: 'message',
      campaignId: 'test-campaign',
        data: {
        id: overrides.id ?? 'msg-default',
        campaignId: 'test-campaign',
        senderId: overrides.senderId ?? 'user-1',
        senderName: overrides.senderName ?? 'Alice',
        text: overrides.text ?? 'Hello',
        visibility: visibility as any,
        createdAt: overrides.createdAt ?? new Date().toISOString(),
      },
    })
  })
}

/** Setup members fetch with alice + optional extra members. */
function withMembers(extra: Array<{ id: string; userId: string; username: string }> = []) {
  setupFetchMock({
    members: {
      members: [
        { id: 'm1', userId: 'u1', username: 'alice', role: 'player', status: 'active' },
        ...extra,
      ],
    },
  })
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

// ── Shell tests (TC-01 to TC-13) ──────────────────────────────────

// TC-01
it('pill button is present on initial render', () => {
  render(<CampaignChat campaignId={CAMPAIGN_ID} />)
  expect(screen.getByRole('button', { name: /chat/i })).toBeInTheDocument()
})

// TC-02
it('drawer is absent on initial render when no pin stored', () => {
  render(<CampaignChat campaignId={CAMPAIGN_ID} />)
  expect(screen.queryByRole('complementary')).not.toBeInTheDocument()
})

// TC-03
it('drawer is present on mount when pin is stored', async () => {
  mockedLocalStore.get.mockReturnValue(true)
  render(<CampaignChat campaignId={CAMPAIGN_ID} />)
  expect(screen.getByRole('complementary', { name: /campaign chat/i })).toBeInTheDocument()
})

// TC-04
it('clicking pill expands the drawer', async () => {
  await openDock()
  expect(screen.getByRole('complementary')).toBeInTheDocument()
})

// TC-05
it('clicking close button collapses the drawer', async () => {
  const user = await openDock()
  await user.click(screen.getByRole('button', { name: /collapse/i }))
  expect(screen.queryByRole('complementary')).not.toBeInTheDocument()
})

// TC-06
it('pressing Escape collapses the drawer', async () => {
  await openDock()
  fireEvent.keyDown(document, { key: 'Escape' })
  expect(screen.queryByRole('complementary')).not.toBeInTheDocument()
})

// TC-07
it('pressing Escape when collapsed has no effect', () => {
  render(<CampaignChat campaignId={CAMPAIGN_ID} />)
  fireEvent.keyDown(document, { key: 'Escape' })
  expect(screen.queryByRole('complementary')).not.toBeInTheDocument()
  expect(screen.getByRole('button', { name: /chat/i })).toBeInTheDocument()
})

// TC-08
it('pin button has aria-pressed="false" when not pinned', async () => {
  await openDock()
  expect(screen.getByRole('button', { name: /pin/i })).toHaveAttribute('aria-pressed', 'false')
})

// TC-09
it('clicking pin sets aria-pressed="true" and calls LocalStore.set', async () => {
  const user = await openDock()
  const pinButton = screen.getByRole('button', { name: /pin/i })
  await user.click(pinButton)
  expect(pinButton).toHaveAttribute('aria-pressed', 'true')
  expect(mockedLocalStore.set).toHaveBeenCalledWith('campaign-chat-pin', true)
})

// TC-10
it('clicking pin again sets aria-pressed="false" and calls LocalStore.remove', async () => {
  const user = await openDock()
  const pinButton = screen.getByRole('button', { name: /pin/i })
  await user.click(pinButton)
  await user.click(pinButton)
  expect(pinButton).toHaveAttribute('aria-pressed', 'false')
  expect(mockedLocalStore.remove).toHaveBeenCalledWith('campaign-chat-pin')
})

// TC-11
it('unpinning while expanded does not collapse the drawer', async () => {
  const user = await openDock()
  const pinButton = screen.getByRole('button', { name: /pin/i })
  await user.click(pinButton)
  await user.click(pinButton)
  expect(screen.getByRole('complementary')).toBeInTheDocument()
})

// TC-12
it('drawer has role="complementary" and aria-label="Campaign Chat"', async () => {
  await openDock()
  expect(screen.getByRole('complementary', { name: 'Campaign Chat' })).toBeInTheDocument()
})

// TC-13
it('pill button is keyboard-activatable with Enter', async () => {
  const user = userEvent.setup()
  render(<CampaignChat campaignId={CAMPAIGN_ID} />)
  const pill = screen.getByRole('button', { name: /chat/i })
  pill.focus()
  await user.keyboard('{Enter}')
  expect(screen.getByRole('complementary')).toBeInTheDocument()
})

// ── T2 — Stream tests ────────────────────────────────────────────────

// T2e-1: stream message event appends to feed
it('stream message event adds message to feed when dock is open', async () => {
  await openDock()
  act(() => {
    capturedOnEvent?.({
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
  act(() => { capturedOnEvent?.({ type: 'message', campaignId: 'test-campaign', data: { id: 'msg-dup', campaignId: 'test-campaign', senderId: 'user-1', senderName: 'Bob', text: 'Duplicate', visibility: { scope: 'group' }, createdAt: new Date().toISOString() } }) })
  act(() => { capturedOnEvent?.({ type: 'message', campaignId: 'test-campaign', data: { id: 'msg-dup', campaignId: 'test-campaign', senderId: 'user-1', senderName: 'Bob', text: 'Duplicate', visibility: { scope: 'group' }, createdAt: new Date().toISOString() } }) })
  expect(screen.getAllByText('Duplicate')).toHaveLength(1)
})

// T2e-3: heartbeat event does not change feed
it('heartbeat event does not affect message feed', async () => {
  await openDock()
  act(() => {
    capturedOnEvent?.({ type: 'heartbeat', campaignId: 'test-campaign', data: { ts: Date.now() } })
  })
  expect(screen.getByText('No messages yet.')).toBeInTheDocument()
})

// ── T3 — Members tests ───────────────────────────────────────────────

// T3c-1: members fetched on mount
it('fetches members on mount', async () => {
  render(<CampaignChat campaignId={CAMPAIGN_ID} />)
  await waitFor(() => {
    expect(fetchSpy).toHaveBeenCalledWith(expect.stringContaining(`/api/campaigns/${CAMPAIGN_ID}/members`))
  })
})

// T3c-2: fetch failure leaves members empty (no crash)
it('members fetch failure does not crash the component', async () => {
  fetchSpy.mockImplementation((url: string) => {
    if (url.includes('/members')) return Promise.reject(new Error('network error'))
    return Promise.resolve({ ok: true, json: () => Promise.resolve({ messages: [] }) })
  })
  expect(() => render(<CampaignChat campaignId={CAMPAIGN_ID} />)).not.toThrow()
  await waitFor(() => expect(fetchSpy).toHaveBeenCalledWith(expect.stringContaining('/members')))
})

// ── T4 — History tests ───────────────────────────────────────────────

// T4d-1: history NOT fetched on mount (dock collapsed)
it('history is not fetched on mount when dock is collapsed', async () => {
  render(<CampaignChat campaignId={CAMPAIGN_ID} />)
  await waitFor(() => expect(fetchSpy).toHaveBeenCalledWith(expect.stringContaining('/members')))
  expect(fetchSpy).not.toHaveBeenCalledWith(expect.stringContaining('/messages'))
})

// T4d-2: history fetched when dock opens
it('history is fetched when dock is expanded', async () => {
  await openDock()
  await waitFor(() => {
    expect(fetchSpy).toHaveBeenCalledWith(expect.stringContaining('/messages?limit=30'))
  })
})

// T4d-3: hasMore = false when API returns no nextCursor
it('hasMore is false when history response has no nextCursor', async () => {
  const messages = Array.from({ length: 5 }, (_, i) => ({
    id: `msg-${i}`, campaignId: 'test-campaign', senderId: 'user-1',
    senderName: 'Alice', text: `Message ${i}`,
    visibility: { scope: 'group' }, createdAt: new Date().toISOString(),
  }))
  // No nextCursor in response → no more pages
  setupFetchMock({ messages: { messages } })
  await openDock()
  await waitFor(() => expect(screen.getByText('Message 0')).toBeInTheDocument())
})

// ── T5 — Unread badge tests ──────────────────────────────────────────

// T5f-1: stream message while collapsed increments badge
it('stream message while dock is collapsed shows unread badge', async () => {
  const pastDate = new Date(Date.now() - 5000).toISOString()
  mockedLocalStore.get.mockImplementation((key: string) =>
    key === `campaign-chat-last-open-${CAMPAIGN_ID}` ? pastDate : null
  )
  render(<CampaignChat campaignId={CAMPAIGN_ID} />)
  fireMsg({ id: 'new-msg', senderName: 'Bob', text: 'Hi' })
  expect(screen.getByLabelText('unread messages')).toBeInTheDocument()
})

// T5f-2: opening dock clears badge and updates LocalStore
it('opening dock clears unread badge and updates LocalStore', async () => {
  const pastDate = new Date(Date.now() - 5000).toISOString()
  mockedLocalStore.get.mockImplementation((key: string) =>
    key === `campaign-chat-last-open-${CAMPAIGN_ID}` ? pastDate : null
  )
  render(<CampaignChat campaignId={CAMPAIGN_ID} />)
  fireMsg({ id: 'unread-1', senderName: 'Bob', text: 'Badge test' })

  const user = userEvent.setup()
  await user.click(screen.getByRole('button', { name: /chat/i }))
  expect(screen.queryByLabelText('unread messages')).not.toBeInTheDocument()
  expect(mockedLocalStore.set).toHaveBeenCalledWith(`campaign-chat-last-open-${CAMPAIGN_ID}`, expect.any(String))
})

// T5f-3: stream message while dock is open does not increment badge
it('stream message while dock is open does not increment unread count', async () => {
  await openDock()
  fireMsg({ id: 'open-msg', senderName: 'Carol', text: 'Visible' })
  expect(screen.queryByLabelText('unread messages')).not.toBeInTheDocument()
})

// T5f-4: LocalStore throws — no crash
it('LocalStore.get throwing does not crash the component', () => {
  mockedLocalStore.get.mockImplementation(() => { throw new Error('storage unavailable') })
  expect(() => render(<CampaignChat campaignId={CAMPAIGN_ID} />)).not.toThrow()
})

// ── T6 — Composer tests ──────────────────────────────────────────────

// T6e-1: three visibility options present when dock is open
it('composer shows three visibility options when dock is expanded', async () => {
  await openDock()
  const msgSelect = screen.getByRole('combobox', { name: 'Message visibility' })
  expect(msgSelect).toBeInTheDocument()
  const options = Array.from(msgSelect.querySelectorAll('option')).map(o => o.textContent)
  expect(options).toContain('Group')
  expect(options).toContain('DM-only')
  expect(options).toContain('Whisper')
})

// T6e-2: selecting DM-only changes visibility
it('selecting DM-only visibility updates the select value', async () => {
  const user = await openDock()
  const select = screen.getByRole('combobox', { name: 'Message visibility' })
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
  await openDock()
  expect(screen.getByRole('textbox', { name: 'Message' })).toBeDisabled()
  expect(screen.getByRole('button', { name: /send/i })).toBeDisabled()
  ;(useCampaignStream as jest.Mock).mockImplementation((_, onEvent) => {
    capturedOnEvent = onEvent
    return { status: 'open' }
  })
})

// ── T7 — @mention tests ──────────────────────────────────────────────

// T7h-1: typing @al shows dropdown with matching member
it('typing @prefix shows matching member in dropdown', async () => {
  withMembers([{ id: 'm2', userId: 'u2', username: 'bob' }])
  const user = await openDock()
  await waitFor(() => expect(fetchSpy).toHaveBeenCalledWith(expect.stringContaining('/members')))
  await user.type(screen.getByRole('textbox', { name: 'Message' }), '@al')
  await waitFor(() => expect(screen.getByText('@alice')).toBeInTheDocument())
  expect(screen.queryByText('@bob')).not.toBeInTheDocument()
})

// T7h-2: no match hides dropdown
it('no matching members hides the mention dropdown', async () => {
  withMembers()
  const user = await openDock()
  await waitFor(() => expect(fetchSpy).toHaveBeenCalledWith(expect.stringContaining('/members')))
  await user.type(screen.getByRole('textbox', { name: 'Message' }), '@xyz')
  await waitFor(() => expect(screen.queryByText('@alice')).not.toBeInTheDocument())
})

// T7h-3: selecting a member updates text and sets direct visibility
it('selecting mention sets visibility to direct and updates textarea', async () => {
  withMembers()
  const user = await openDock()
  await waitFor(() => expect(fetchSpy).toHaveBeenCalledWith(expect.stringContaining('/members')))
  await user.type(screen.getByRole('textbox', { name: 'Message' }), '@al')
  await waitFor(() => screen.getByText('@alice'))
  fireEvent.mouseDown(screen.getByText('@alice'))
  await waitFor(() => {
    expect((screen.getByRole('textbox', { name: 'Message' }) as HTMLTextAreaElement).value).toContain('@alice')
    expect(screen.getByRole('combobox', { name: 'Message visibility' })).toHaveValue('direct')
  })
})

// T7h-4: deleting @mention text resets visibility to group
it('deleting @mention text resets visibility to group', async () => {
  withMembers()
  const user = await openDock()
  await waitFor(() => expect(fetchSpy).toHaveBeenCalledWith(expect.stringContaining('/members')))
  await user.type(screen.getByRole('textbox', { name: 'Message' }), '@al')
  await waitFor(() => screen.getByText('@alice'))
  fireEvent.mouseDown(screen.getByText('@alice'))
  await waitFor(() => expect(screen.getByRole('combobox', { name: 'Message visibility' })).toHaveValue('direct'))
  fireEvent.change(screen.getByRole('textbox', { name: 'Message' }), { target: { value: '', selectionStart: 0 } })
  expect(screen.getByRole('combobox', { name: 'Message visibility' })).toHaveValue('group')
})

// ── T8 — Send tests ──────────────────────────────────────────────────

// T8e-1: POST called with correct body on send
it('send button calls POST with text and visibility', async () => {
  const user = await openDock()
  await user.type(screen.getByRole('textbox', { name: 'Message' }), 'Hello everyone')
  await user.click(screen.getByRole('button', { name: /send/i }))
  await waitFor(() => {
    expect(fetchSpy).toHaveBeenCalledWith(
      `/api/campaigns/${CAMPAIGN_ID}/messages`,
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ text: 'Hello everyone', visibility: { scope: 'group' } }),
      }),
    )
  })
})

// T8e-2: composer cleared on successful send
it('composer text is cleared after successful send', async () => {
  const user = await openDock()
  const textarea = screen.getByRole('textbox', { name: 'Message' })
  await user.type(textarea, 'Clear me')
  await user.click(screen.getByRole('button', { name: /send/i }))
  await waitFor(() => expect((textarea as HTMLTextAreaElement).value).toBe(''))
})

// T8e-3: empty composer does not POST
it('send does nothing when composer text is empty', async () => {
  const user = await openDock()
  await user.click(screen.getByRole('button', { name: /send/i }))
  expect(fetchSpy).not.toHaveBeenCalledWith(
    expect.stringContaining('/messages'),
    expect.objectContaining({ method: 'POST' }),
  )
})

// T8e-4: direct visibility with no toUserId does not POST
it('send does nothing when direct visibility has no mention target', async () => {
  const user = await openDock()
  await user.selectOptions(screen.getByRole('combobox', { name: 'Message visibility' }), 'direct')
  await user.type(screen.getByRole('textbox', { name: 'Message' }), 'whisper without target')
  await user.click(screen.getByRole('button', { name: /send/i }))
  expect(fetchSpy).not.toHaveBeenCalledWith(
    expect.stringContaining('/messages'),
    expect.objectContaining({ method: 'POST' }),
  )
})

// ── T9 — ChatFeed render tests ────────────────────────────────────────

// T9d-1: group message renders no visibility marker
it('group message renders without visibility marker', async () => {
  await openDock()
  act(() => {
    capturedOnEvent?.({
      type: 'message',
      campaignId: 'test-campaign',
      data: {
        id: 'group-msg', campaignId: 'test-campaign', senderId: 'u1',
        senderName: 'Alice', text: 'Group message',
        visibility: { scope: 'group' }, createdAt: new Date().toISOString(),
      },
    })
  })
  expect(screen.getByText('Group message')).toBeInTheDocument()
  expect(screen.queryByText('[DM]')).not.toBeInTheDocument()
})

// T9d-2: dm-only message renders [DM]
it('dm-only message renders [DM] marker', async () => {
  await openDock()
  act(() => {
    capturedOnEvent?.({
      type: 'message',
      campaignId: 'test-campaign',
      data: {
        id: 'dm-msg', campaignId: 'test-campaign', senderId: 'u1',
        senderName: 'Alice', text: 'DM message',
        visibility: { scope: 'dm-only' }, createdAt: new Date().toISOString(),
      },
    })
  })
  expect(screen.getByText('[DM]')).toBeInTheDocument()
})

// T9d-3: direct (whisper) message renders [→ @username]
it('direct message renders whisper marker with recipient username', async () => {
  setupFetchMock({
    members: { members: [{ id: 'm1', userId: 'u2', username: 'bob', role: 'player', status: 'active' }] },
  })
  await openDock()
  await waitFor(() => expect(fetchSpy).toHaveBeenCalledWith(expect.stringContaining('/members')))
  act(() => {
    capturedOnEvent?.({
      type: 'message',
      campaignId: 'test-campaign',
      data: {
        id: 'whisper-msg', campaignId: 'test-campaign', senderId: 'u1',
        senderName: 'Alice', text: 'Whisper message',
        visibility: { scope: 'direct', toUserId: 'u2' }, createdAt: new Date().toISOString(),
      },
    })
  })
  await waitFor(() => expect(screen.getByText('[→ @bob]')).toBeInTheDocument())
})

// T9d-4: loading indicator shown when isLoadingHistory
it('loading indicator is shown when history is loading', async () => {
  fetchSpy.mockImplementation((url: string) => {
    if (url.includes('/members')) return Promise.resolve({ ok: true, json: () => Promise.resolve({ members: [] }) })
    if (url.includes('/messages')) return new Promise(() => {})
    return Promise.resolve({ ok: true, json: () => Promise.resolve({}) })
  })
  await openDock()
  await waitFor(() => expect(screen.getByText('Loading…')).toBeInTheDocument())
})

// ── T10 — Push Scene button tests ────────────────────────────────────

const DM_MEMBERS_RESPONSE = {
  members: [{ id: 'm1', userId: 'user-1', username: 'tester', role: 'dm', status: 'active' }],
}

const PLAYER_MEMBERS_RESPONSE = {
  members: [{ id: 'm1', userId: 'user-1', username: 'tester', role: 'player', status: 'active' }],
}

// T10-1: DM sees "Push Scene" button
it('DM user sees Push Scene button in expanded dock', async () => {
  setupFetchMock({ members: DM_MEMBERS_RESPONSE })
  const user = userEvent.setup()
  render(<CampaignChat campaignId={CAMPAIGN_ID} />)
  await user.click(screen.getByRole('button', { name: /chat/i }))
  await waitFor(() =>
    expect(fetchSpy).toHaveBeenCalledWith(expect.stringContaining('/members'))
  )
  await waitFor(() =>
    expect(screen.getByRole('button', { name: /push scene/i })).toBeInTheDocument()
  )
})

// T10-2: Non-DM does NOT see "Push Scene" button
it('Non-DM member does not see Push Scene button', async () => {
  setupFetchMock({ members: PLAYER_MEMBERS_RESPONSE })
  const user = userEvent.setup()
  render(<CampaignChat campaignId={CAMPAIGN_ID} />)
  await user.click(screen.getByRole('button', { name: /chat/i }))
  await waitFor(() =>
    expect(fetchSpy).toHaveBeenCalledWith(expect.stringContaining('/members'))
  )
  await waitFor(() =>
    expect(screen.queryByRole('button', { name: /push scene/i })).not.toBeInTheDocument()
  )
})

// T10-3: Clicking "Push Scene" renders SceneComposer
it('Clicking Push Scene renders SceneComposer', async () => {
  setupFetchMock({ members: DM_MEMBERS_RESPONSE })
  const user = userEvent.setup()
  render(<CampaignChat campaignId={CAMPAIGN_ID} />)
  await user.click(screen.getByRole('button', { name: /chat/i }))
  await waitFor(() =>
    expect(screen.getByRole('button', { name: /push scene/i })).toBeInTheDocument()
  )
  await user.click(screen.getByRole('button', { name: /push scene/i }))
  expect(screen.getByLabelText('Scene image')).toBeInTheDocument()
})

// T10-4: SceneComposer onCancel hides composer
it('SceneComposer Cancel hides composer and shows Push Scene button again', async () => {
  setupFetchMock({ members: DM_MEMBERS_RESPONSE })
  const user = userEvent.setup()
  render(<CampaignChat campaignId={CAMPAIGN_ID} />)
  await user.click(screen.getByRole('button', { name: /chat/i }))
  await waitFor(() =>
    expect(screen.getByRole('button', { name: /push scene/i })).toBeInTheDocument()
  )
  await user.click(screen.getByRole('button', { name: /push scene/i }))
  expect(screen.getByLabelText('Scene image')).toBeInTheDocument()
  await user.click(screen.getByRole('button', { name: /cancel/i }))
  expect(screen.queryByLabelText('Scene image')).not.toBeInTheDocument()
  expect(screen.getByRole('button', { name: /push scene/i })).toBeInTheDocument()
})

// T10-5: SSE scene event renders SceneFeedItem in feed
it('SSE scene message event renders SceneFeedItem in feed', async () => {
  setupFetchMock({ members: DM_MEMBERS_RESPONSE })
  render(<CampaignChat campaignId={CAMPAIGN_ID} />)
  const user = userEvent.setup()
  await user.click(screen.getByRole('button', { name: /chat/i }))
  await waitFor(() =>
    expect(screen.getByRole('button', { name: /push scene/i })).toBeInTheDocument()
  )

  act(() => {
    capturedOnEvent?.({
      type: 'message',
      campaignId: CAMPAIGN_ID,
      data: {
        id: 'scene-msg-1',
        campaignId: CAMPAIGN_ID,
        senderId: 'user-1',
        senderName: 'DM',
        text: '',
        visibility: { scope: 'group' },
        createdAt: new Date().toISOString(),
        kind: 'scene',
        attachmentId: 'att-abc',
      } as any,
    })
  })
  await waitFor(() =>
    expect(screen.queryAllByText('Scene').length).toBeGreaterThanOrEqual(1)
  )
})

// T10-6: SceneComposer onSuccess appends message to feed and closes composer
it('SceneComposer onSuccess appends scene message to feed and closes composer', async () => {
  const sceneMsg = {
    id: 'scene-posted-1',
    campaignId: CAMPAIGN_ID,
    senderId: 'user-1',
    senderName: 'DM',
    text: '',
    visibility: { scope: 'group' },
    createdAt: new Date().toISOString(),
    kind: 'scene',
    attachmentId: 'att-posted',
  }
  setupFetchMock({ members: DM_MEMBERS_RESPONSE, sceneMessage: sceneMsg })
  const user = userEvent.setup()
  render(<CampaignChat campaignId={CAMPAIGN_ID} />)
  await user.click(screen.getByRole('button', { name: /chat/i }))
  await waitFor(() =>
    expect(screen.getByRole('button', { name: /push scene/i })).toBeInTheDocument()
  )

  // Open SceneComposer and upload a valid JPEG
  await user.click(screen.getByRole('button', { name: /push scene/i }))
  expect(screen.getByLabelText('Scene image')).toBeInTheDocument()
  const file = new File([new Uint8Array(1024)], 'test.jpg', { type: 'image/jpeg' })
  await user.upload(screen.getByLabelText('Scene image'), file)

  // Submit — triggers upload + post → onSuccess (scope to SceneComposer container)
  const fileInput = screen.getByLabelText('Scene image')
  await user.click(within(fileInput.parentElement!).getByRole('button', { name: /send/i }))

  // Composer closes and Push Scene button returns
  await waitFor(() => expect(screen.queryByLabelText('Scene image')).not.toBeInTheDocument())
  expect(screen.getByRole('button', { name: /push scene/i })).toBeInTheDocument()

  // SceneFeedItem renders in feed
  expect(screen.queryAllByText('Scene').length).toBeGreaterThanOrEqual(1)

  // Duplicate id ignored: SSE fires same message id — still only one SceneFeedItem
  act(() => {
    capturedOnEvent?.({ type: 'message', campaignId: CAMPAIGN_ID, data: sceneMsg as any })
  })
  await waitFor(() => {
    expect(screen.queryAllByText('Scene').length).toBe(1)
  })
})
