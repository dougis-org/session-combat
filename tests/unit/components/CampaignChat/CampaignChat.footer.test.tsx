import { render, screen } from '@testing-library/react'
import { CampaignChat } from '@/lib/components/CampaignChat'
import { LocalStore } from '@/lib/offline/LocalStore'
import {
  CAMPAIGN_ID, sharedTestState, setupFetchMock, restoreFetch,
  openDockWithSession,
} from './helpers'

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

function drawer(): HTMLElement {
  return screen.getByRole('complementary', { name: /campaign chat/i })
}

describe('CampaignChat — session-gated footer', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockedLocalStore.get.mockReturnValue(null)
    sharedTestState.capturedOnEvent = null
    setupFetchMock()
  })

  afterEach(() => {
    restoreFetch()
  })

  it('shows the "No active session" footer when no session is active', async () => {
    await openDockWithSession(null)
    expect(screen.getByText('No active session')).toBeInTheDocument()
  })

  it('renders no dice trigger when no session is active', async () => {
    await openDockWithSession(null)
    expect(screen.queryByRole('button', { name: /roll|dice/i })).toBeNull()
    expect(
      document.querySelector('[title="Dice Rolls for main screen pop out"]'),
    ).toBeNull()
  })

  it('renders no footer strip and no dice trigger when a session is active', async () => {
    await openDockWithSession('session-abc')
    expect(screen.queryByText('No active session')).toBeNull()
    expect(screen.queryByRole('button', { name: /roll|dice/i })).toBeNull()
    expect(
      document.querySelector('[title="Dice Rolls for main screen pop out"]'),
    ).toBeNull()
  })

  it('toggles the footer as activeSessionId changes while the drawer is open', async () => {
    const { rerender } = await openDockWithSession('session-abc')
    expect(screen.queryByText('No active session')).toBeNull()

    rerender(<CampaignChat campaignId={CAMPAIGN_ID} activeSessionId={null} />)
    expect(screen.getByText('No active session')).toBeInTheDocument()

    rerender(<CampaignChat campaignId={CAMPAIGN_ID} activeSessionId="session-xyz" />)
    expect(screen.queryByText('No active session')).toBeNull()
  })

  it('keeps the chat feed as the flex-growing element of the drawer', async () => {
    await openDockWithSession('session-abc')
    const feed = drawer().querySelector('.flex-1.overflow-y-auto')
    expect(feed).not.toBeNull()
  })
})
