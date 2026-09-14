// Regression test for issue #721, exercised through the REAL (unmocked)
// useActiveSessionIdCore hook rather than the mockActiveSessionIdCore stub
// every other CampaignChat test file uses. Every other file mocks the hook
// module directly, which proves CampaignChat *reacts* to whatever the hook
// reports, but never exercises the actual fetch('/api/campaigns/:id') ->
// useActiveSessionIdCore -> CampaignChat render path that this bug was about.
import { screen, waitFor } from '@testing-library/react'
import { CAMPAIGN_ID, sharedTestState, restoreFetch, openDockWithSessionViaRealFetch } from './helpers'

jest.mock('@/lib/offline/LocalStore', () => ({
  LocalStore: { get: jest.fn().mockReturnValue(null), set: jest.fn(), remove: jest.fn() },
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

// Deliberately NOT mocking '@/lib/hooks/useActiveSessionId' — this file
// exercises the real hook, fed by the mocked fetch below.

describe('CampaignChat — real useActiveSessionIdCore integration', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    sharedTestState.capturedOnEvent = null
  })

  afterEach(() => {
    restoreFetch()
  })

  it('reflects an already-active session resolved by the real fetch, with no stream event', async () => {
    await openDockWithSessionViaRealFetch('ses-real-preexisting')

    await waitFor(() => {
      expect(screen.queryByText('No active session')).toBeNull()
    })
  })

  it('reflects no active session when the real fetch resolves activeSessionId: null', async () => {
    await openDockWithSessionViaRealFetch(null)

    await waitFor(() => {
      expect(screen.getByText('No active session')).toBeInTheDocument()
    })
  })

  it('falls back to "no active session" rather than staying stuck when the campaign fetch fails', async () => {
    await openDockWithSessionViaRealFetch('error')

    await waitFor(() => {
      expect(screen.getByText('No active session')).toBeInTheDocument()
    })
  })
})
