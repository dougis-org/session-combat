import { render, waitFor } from '@testing-library/react'
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

beforeEach(() => {
  jest.clearAllMocks()
  mockedLocalStore.get.mockReturnValue(null)
  sharedTestState.capturedOnEvent = null
  setupFetchMock()
})

afterEach(() => {
  restoreFetch()
})

// ── T3 — Members tests ───────────────────────────────────────────────

// T3c-1: members fetched on mount
it('fetches members on mount', async () => {
  render(<CampaignChat campaignId={CAMPAIGN_ID} />)
  await waitFor(() => {
    expect(sharedTestState.fetchSpy).toHaveBeenCalledWith(expect.stringContaining(`/api/campaigns/${CAMPAIGN_ID}/members`))
  })
})

// T3c-2: fetch failure leaves members empty (no crash)
it('members fetch failure does not crash the component', async () => {
  sharedTestState.fetchSpy.mockImplementation((url: string) => {
    if (url.includes('/members')) return Promise.reject(new Error('network error'))
    return Promise.resolve({ ok: true, json: () => Promise.resolve({ messages: [] }) })
  })
  expect(() => render(<CampaignChat campaignId={CAMPAIGN_ID} />)).not.toThrow()
  await waitFor(() => expect(sharedTestState.fetchSpy).toHaveBeenCalledWith(expect.stringContaining('/members')))
})
