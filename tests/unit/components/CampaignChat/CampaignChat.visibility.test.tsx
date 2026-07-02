import { screen, act, waitFor } from '@testing-library/react'
import { CampaignChat } from '@/lib/components/CampaignChat'
import { LocalStore } from '@/lib/offline/LocalStore'
import { CAMPAIGN_ID, sharedTestState, setupFetchMock, restoreFetch, openDock, withMembers, fireMsg } from './helpers'

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

describe('CampaignChat — visibility rendering', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockedLocalStore.get.mockReturnValue(null)
    sharedTestState.capturedOnEvent = null
    setupFetchMock()
  })

  afterEach(() => {
    restoreFetch()
  })

  // ── T9 — ChatFeed render tests ────────────────────────────────────────

  // T9d-1: group message renders no visibility marker
  it('group message renders without visibility marker', async () => {
    await openDock()
    fireMsg({ id: 'group-msg', senderId: 'u1', text: 'Group message', visibility: { scope: 'group' } })
    expect(screen.getByText('Group message')).toBeInTheDocument()
    expect(screen.queryByText('[DM]')).not.toBeInTheDocument()
  })

  // T9d-2: dm-only message renders [DM]
  it('dm-only message renders [DM] marker', async () => {
    await openDock()
    fireMsg({ id: 'dm-msg', senderId: 'u1', text: 'DM message', visibility: { scope: 'dm-only' } })
    expect(screen.getByText('[DM]')).toBeInTheDocument()
  })

  // T9d-3: direct (whisper) message renders [→ @username]
  it('direct message renders whisper marker with recipient username', async () => {
    withMembers([{ id: 'm2', userId: 'u2', username: 'bob' }])
    await openDock()
    await waitFor(() => expect(sharedTestState.fetchSpy).toHaveBeenCalledWith(expect.stringContaining('/members')))
    fireMsg({ id: 'whisper-msg', senderId: 'u1', text: 'Whisper message', visibility: { scope: 'direct', toUserId: 'u2' } })
    await waitFor(() => expect(screen.getByText('[→ @bob]')).toBeInTheDocument())
  })

  // T9d-4: loading indicator shown when isLoadingHistory
  it('loading indicator is shown when history is loading', async () => {
    sharedTestState.fetchSpy.mockImplementation((url: string) => {
      if (url.includes('/members')) return Promise.resolve({ ok: true, json: () => Promise.resolve({ members: [] }) })
      if (url.includes('/messages')) return new Promise(() => {})
      return Promise.resolve({ ok: true, json: () => Promise.resolve({}) })
    })
    await openDock()
    await waitFor(() => expect(screen.getByText('Loading…')).toBeInTheDocument())
  })
})
