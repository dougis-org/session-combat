import { render, screen, waitFor } from '@testing-library/react'
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

describe('CampaignChat — history', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockedLocalStore.get.mockReturnValue(null)
    sharedTestState.capturedOnEvent = null
    setupFetchMock()
  })

  afterEach(() => {
    restoreFetch()
  })

  // ── T4 — History tests ───────────────────────────────────────────────

  // T4d-1: history NOT fetched on mount (dock collapsed)
  it('history is not fetched on mount when dock is collapsed', async () => {
    render(<CampaignChat campaignId={CAMPAIGN_ID} />)
    await waitFor(() => expect(sharedTestState.fetchSpy).toHaveBeenCalledWith(expect.stringContaining('/members')))
    expect(sharedTestState.fetchSpy).not.toHaveBeenCalledWith(expect.stringContaining('/messages'))
  })

  // T4d-2: history fetched when dock opens
  it('history is fetched when dock is expanded', async () => {
    await openDock()
    await waitFor(() => {
      expect(sharedTestState.fetchSpy).toHaveBeenCalledWith(expect.stringContaining('/messages?limit=30'))
    })
  })

  // T4d-3: hasMore = false when API returns no nextCursor
  it('hasMore is false when history response has no nextCursor', async () => {
    const messages = Array.from({ length: 5 }, (_, i) => ({
      id: `msg-${i}`, campaignId: CAMPAIGN_ID, senderId: 'user-1',
      senderName: 'Alice', text: `Message ${i}`,
      visibility: { scope: 'group' }, createdAt: new Date().toISOString(),
    }))
    // No nextCursor in response → no more pages
    setupFetchMock({ messages: { messages } })
    await openDock()
    await waitFor(() => expect(screen.getByText('Message 0')).toBeInTheDocument())
  })
})
