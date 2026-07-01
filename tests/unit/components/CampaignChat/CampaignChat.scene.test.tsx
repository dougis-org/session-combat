import { render, screen, act, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { CampaignChat } from '@/lib/components/CampaignChat'
import { LocalStore } from '@/lib/offline/LocalStore'
import { CAMPAIGN_ID, sharedTestState, setupFetchMock, restoreFetch } from './helpers'

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

const DM_MEMBERS_RESPONSE = {
  members: [{ id: 'm1', userId: 'user-1', username: 'tester', role: 'dm', status: 'active' }],
}

const PLAYER_MEMBERS_RESPONSE = {
  members: [{ id: 'm1', userId: 'user-1', username: 'tester', role: 'player', status: 'active' }],
}

describe('CampaignChat — scene', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockedLocalStore.get.mockReturnValue(null)
    sharedTestState.capturedOnEvent = null
    setupFetchMock()
  })

  afterEach(() => {
    restoreFetch()
  })

  // ── T10 — Push Scene button tests ────────────────────────────────────

  // T10-1: DM sees "Push Scene" button
  it('DM user sees Push Scene button in expanded dock', async () => {
    setupFetchMock({ members: DM_MEMBERS_RESPONSE })
    const user = userEvent.setup()
    render(<CampaignChat campaignId={CAMPAIGN_ID} />)
    await user.click(screen.getByRole('button', { name: /chat/i }))
    await waitFor(() =>
      expect(sharedTestState.fetchSpy).toHaveBeenCalledWith(expect.stringContaining('/members'))
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
      expect(sharedTestState.fetchSpy).toHaveBeenCalledWith(expect.stringContaining('/members'))
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
      sharedTestState.capturedOnEvent?.({
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
      sharedTestState.capturedOnEvent?.({ type: 'message', campaignId: CAMPAIGN_ID, data: sceneMsg as any })
    })
    await waitFor(() => {
      expect(screen.queryAllByText('Scene').length).toBe(1)
    })
  })
})
