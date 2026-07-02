import { screen, fireEvent, waitFor } from '@testing-library/react'
import { LocalStore } from '@/lib/offline/LocalStore'
import { CAMPAIGN_ID, sharedTestState, setupFetchMock, restoreFetch, openDock, withMembers } from './helpers'

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

describe('CampaignChat — composer', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockedLocalStore.get.mockReturnValue(null)
    sharedTestState.capturedOnEvent = null
    setupFetchMock()
  })

  afterEach(() => {
    restoreFetch()
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
      sharedTestState.capturedOnEvent = onEvent
      return { status: 'error' }
    })
    await openDock()
    expect(screen.getByRole('textbox', { name: 'Message' })).toBeDisabled()
    expect(screen.getByRole('button', { name: /send/i })).toBeDisabled()
    ;(useCampaignStream as jest.Mock).mockImplementation((_, onEvent) => {
      sharedTestState.capturedOnEvent = onEvent
      return { status: 'open' }
    })
  })

  // ── T7 — @mention tests ──────────────────────────────────────────────

  // T7h-1: typing @al shows dropdown with matching member
  it('typing @prefix shows matching member in dropdown', async () => {
    withMembers([{ id: 'm2', userId: 'u2', username: 'bob' }])
    const user = await openDock()
    await waitFor(() => expect(sharedTestState.fetchSpy).toHaveBeenCalledWith(expect.stringContaining('/members')))
    await user.type(screen.getByRole('textbox', { name: 'Message' }), '@al')
    await waitFor(() => expect(screen.getByText('@alice')).toBeInTheDocument())
    expect(screen.queryByText('@bob')).not.toBeInTheDocument()
  })

  // T7h-2: no match hides dropdown
  it('no matching members hides the mention dropdown', async () => {
    withMembers()
    const user = await openDock()
    await waitFor(() => expect(sharedTestState.fetchSpy).toHaveBeenCalledWith(expect.stringContaining('/members')))
    await user.type(screen.getByRole('textbox', { name: 'Message' }), '@xyz')
    await waitFor(() => expect(screen.queryByText('@alice')).not.toBeInTheDocument())
  })

  // T7h-3: selecting a member updates text and sets direct visibility
  it('selecting mention sets visibility to direct and updates textarea', async () => {
    withMembers()
    const user = await openDock()
    await waitFor(() => expect(sharedTestState.fetchSpy).toHaveBeenCalledWith(expect.stringContaining('/members')))
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
    await waitFor(() => expect(sharedTestState.fetchSpy).toHaveBeenCalledWith(expect.stringContaining('/members')))
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
      expect(sharedTestState.fetchSpy).toHaveBeenCalledWith(
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
    expect(sharedTestState.fetchSpy).not.toHaveBeenCalledWith(
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
    expect(sharedTestState.fetchSpy).not.toHaveBeenCalledWith(
      expect.stringContaining('/messages'),
      expect.objectContaining({ method: 'POST' }),
    )
  })
})
