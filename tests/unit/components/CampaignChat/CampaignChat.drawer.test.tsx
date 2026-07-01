import { render, screen, fireEvent } from '@testing-library/react'
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

beforeEach(() => {
  jest.clearAllMocks()
  mockedLocalStore.get.mockReturnValue(null)
  sharedTestState.capturedOnEvent = null
  setupFetchMock()
})

afterEach(() => {
  restoreFetch()
})

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
