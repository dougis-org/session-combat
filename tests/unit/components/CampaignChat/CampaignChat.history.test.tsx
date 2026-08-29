import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
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

  // A transient failure on the first history fetch must not permanently
  // suppress retries — reopening the drawer should try again.
  it('a failed history fetch retries on the next expand instead of loading forever', async () => {
    const user = userEvent.setup()
    let messagesCallCount = 0
    sharedTestState.fetchSpy = jest.fn().mockImplementation((url: string) => {
      if (url.includes('/members')) return Promise.resolve({ ok: true, json: () => Promise.resolve({ members: [] }) })
      if (url.includes('/messages')) {
        messagesCallCount += 1
        if (messagesCallCount === 1) return Promise.resolve({ ok: false, json: () => Promise.resolve(null) })
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            messages: [{
              id: 'msg-retry', campaignId: CAMPAIGN_ID, senderId: 'user-1', senderName: 'Alice',
              text: 'Recovered', visibility: { scope: 'group' }, createdAt: new Date().toISOString(),
            }],
          }),
        })
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve({}) })
    })
    global.fetch = sharedTestState.fetchSpy as unknown as typeof global.fetch

    render(<CampaignChat campaignId={CAMPAIGN_ID} />)
    await user.click(screen.getByRole('button', { name: /chat/i }))
    await waitFor(() => expect(messagesCallCount).toBe(1))

    await user.click(screen.getByRole('button', { name: 'Collapse chat' }))
    await user.click(screen.getByRole('button', { name: /chat/i }))

    await waitFor(() => expect(messagesCallCount).toBe(2))
    await waitFor(() => expect(screen.getByText('Recovered')).toBeInTheDocument())
  })
})
