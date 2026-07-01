import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { CampaignChat } from '@/lib/components/CampaignChat'
import { LocalStore } from '@/lib/offline/LocalStore'
import { CAMPAIGN_ID, sharedTestState, setupFetchMock, restoreFetch, fireMsg } from './helpers'

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
  const user = userEvent.setup()
  render(<CampaignChat campaignId={CAMPAIGN_ID} />)
  await user.click(screen.getByRole('button', { name: /chat/i }))
  fireMsg({ id: 'open-msg', senderName: 'Carol', text: 'Visible' })
  expect(screen.queryByLabelText('unread messages')).not.toBeInTheDocument()
})

// T5f-4: LocalStore throws — no crash
it('LocalStore.get throwing does not crash the component', () => {
  mockedLocalStore.get.mockImplementation(() => { throw new Error('storage unavailable') })
  expect(() => render(<CampaignChat campaignId={CAMPAIGN_ID} />)).not.toThrow()
})
