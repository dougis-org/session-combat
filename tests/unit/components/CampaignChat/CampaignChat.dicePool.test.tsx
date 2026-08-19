import { render, screen, waitFor, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { CampaignChat } from '@/lib/components/CampaignChat'
import { rollDicePool } from '@/lib/utils/dice'
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

jest.mock('@/lib/utils/dice', () => ({
  rollDicePool: jest.fn(),
}))

const mockedRollDicePool = rollDicePool as jest.Mock

async function openDockWithSession(activeSessionId: string | null = 'session-1') {
  const user = userEvent.setup()
  const { rerender } = render(<CampaignChat campaignId={CAMPAIGN_ID} activeSessionId={activeSessionId} />)
  await user.click(screen.getByRole('button', { name: /chat/i }))
  return { user, rerender }
}

describe('CampaignChat — dice pool trigger', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    sharedTestState.capturedOnEvent = null
    setupFetchMock()
    mockedRollDicePool.mockReturnValue([])
    document.getElementById('dice-pool-overlay-root')?.remove()
  })

  afterEach(() => {
    restoreFetch()
  })

  it('trigger renders and is enabled when a session is active', async () => {
    await openDockWithSession('session-1')
    expect(screen.getByRole('button', { name: /roll|dice/i })).toBeEnabled()
  })

  it('trigger is disabled when no active session', async () => {
    await openDockWithSession(null)
    expect(screen.getByRole('button', { name: /roll|dice/i })).toBeDisabled()
  })

  it('an already-open pop-out closes when activeSessionId transitions to null', async () => {
    const { user, rerender } = await openDockWithSession('session-1')
    await user.click(screen.getByRole('button', { name: /roll|dice/i }))
    expect(screen.getByRole('button', { name: 'Roll' })).toBeInTheDocument()
    rerender(<CampaignChat campaignId={CAMPAIGN_ID} activeSessionId={null} />)
    expect(screen.queryByRole('button', { name: 'Roll' })).not.toBeInTheDocument()
  })

  it('clicking the trigger opens the pop-out', async () => {
    const { user } = await openDockWithSession()
    await user.click(screen.getByRole('button', { name: /roll|dice/i }))
    expect(screen.getByRole('button', { name: 'Roll' })).toBeInTheDocument()
  })

  it('clicking the trigger again closes the pop-out', async () => {
    const { user } = await openDockWithSession()
    const trigger = screen.getByRole('button', { name: /roll|dice/i })
    await user.click(trigger)
    await user.click(trigger)
    expect(screen.queryByRole('button', { name: 'Roll' })).not.toBeInTheDocument()
  })

  it('closes on outside click', async () => {
    const { user } = await openDockWithSession()
    await user.click(screen.getByRole('button', { name: /roll|dice/i }))
    expect(screen.getByRole('button', { name: 'Roll' })).toBeInTheDocument()
    await user.click(document.body)
    expect(screen.queryByRole('button', { name: 'Roll' })).not.toBeInTheDocument()
  })

  it('closes on Escape', async () => {
    const { user } = await openDockWithSession()
    await user.click(screen.getByRole('button', { name: /roll|dice/i }))
    expect(screen.getByRole('button', { name: 'Roll' })).toBeInTheDocument()
    act(() => {
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
    })
    expect(screen.queryByRole('button', { name: 'Roll' })).not.toBeInTheDocument()
  })

  it('no always-visible die buttons remain in the chat dock body', async () => {
    await openDockWithSession()
    expect(screen.queryByRole('button', { name: 'Add d6' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Add d20' })).not.toBeInTheDocument()
  })

  it("pop-out is not nested inside the chat dock's role=complementary element", async () => {
    const { user } = await openDockWithSession()
    await user.click(screen.getByRole('button', { name: /roll|dice/i }))
    const rollButton = screen.getByRole('button', { name: 'Roll' })
    const drawer = screen.getByRole('complementary')
    expect(drawer.contains(rollButton)).toBe(false)
  })

  it('adding a d6 twice and a d8 twice sets staged counts and issues zero network requests', async () => {
    const { user } = await openDockWithSession()
    await user.click(screen.getByRole('button', { name: /roll|dice/i }))
    await user.click(screen.getByRole('button', { name: 'Add d6' }))
    await user.click(screen.getByRole('button', { name: 'Add d6' }))
    await user.click(screen.getByRole('button', { name: 'Add d8' }))
    await user.click(screen.getByRole('button', { name: 'Add d8' }))
    expect(screen.getByRole('button', { name: 'Add d6' })).toHaveTextContent('d6 ×2')
    expect(screen.getByRole('button', { name: 'Add d8' })).toHaveTextContent('d8 ×2')
    expect(screen.getByRole('button', { name: 'Add d4' })).toHaveTextContent('d4 ×0')
    expect(sharedTestState.fetchSpy).not.toHaveBeenCalledWith(expect.stringContaining('/rolls'), expect.anything())
  })

  it('removing one d6 from a staged count of 2 decrements it to 1', async () => {
    const { user } = await openDockWithSession()
    await user.click(screen.getByRole('button', { name: /roll|dice/i }))
    await user.click(screen.getByRole('button', { name: 'Add d6' }))
    await user.click(screen.getByRole('button', { name: 'Add d6' }))
    await user.click(screen.getByRole('button', { name: 'Remove d6' }))
    expect(screen.getByRole('button', { name: 'Add d6' })).toHaveTextContent('d6 ×1')
  })

  it('staged count cannot go below zero', async () => {
    const { user } = await openDockWithSession()
    await user.click(screen.getByRole('button', { name: /roll|dice/i }))
    await user.click(screen.getByRole('button', { name: 'Remove d10' }))
    expect(screen.getByRole('button', { name: 'Add d10' })).toHaveTextContent('d10 ×0')
  })

  it('modifier is editable independent of staged dice', async () => {
    const { user } = await openDockWithSession()
    await user.click(screen.getByRole('button', { name: /roll|dice/i }))
    const modifierInput = screen.getByRole('textbox', { name: 'Modifier' })
    await user.clear(modifierInput)
    await user.type(modifierInput, '-2')
    expect(modifierInput).toHaveValue('-2')
    expect(screen.getByRole('button', { name: 'Add d6' })).toHaveTextContent('d6 ×0')
  })

  it('visibility selector defaults to group', async () => {
    const { user } = await openDockWithSession()
    await user.click(screen.getByRole('button', { name: /roll|dice/i }))
    expect(screen.getByRole('combobox', { name: 'Roll visibility' })).toHaveValue('group')
  })
})

describe('CampaignChat — dice pool commit', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    sharedTestState.capturedOnEvent = null
    setupFetchMock()
    document.getElementById('dice-pool-overlay-root')?.remove()
  })

  afterEach(() => {
    restoreFetch()
  })

  it('commits a mixed pool as one combined roll', async () => {
    mockedRollDicePool.mockReturnValue([
      { sides: 6, value: 3 }, { sides: 6, value: 5 },
      { sides: 8, value: 2 }, { sides: 8, value: 7 },
    ])
    sharedTestState.fetchSpy.mockImplementation((url: string, options?: RequestInit) => {
      if (url.includes('/members')) return Promise.resolve({ ok: true, json: () => Promise.resolve({ members: [] }) })
      if (url.includes('/rolls') && options?.method === 'POST') {
        return Promise.resolve({
          ok: true, status: 201,
          json: () => Promise.resolve({
            id: 'roll-1', campaignId: CAMPAIGN_ID, rollerName: 'tester',
            formula: '2d6+2d8+3', rolls: [3, 5, 2, 7], total: 20,
            visibility: { scope: 'group' }, createdAt: new Date().toISOString(),
          }),
        })
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve({ messages: [] }) })
    })

    const { user } = await openDockWithSession()
    await user.click(screen.getByRole('button', { name: /roll|dice/i }))
    await user.click(screen.getByRole('button', { name: 'Add d6' }))
    await user.click(screen.getByRole('button', { name: 'Add d6' }))
    await user.click(screen.getByRole('button', { name: 'Add d8' }))
    await user.click(screen.getByRole('button', { name: 'Add d8' }))
    const modifierInput = screen.getByRole('textbox', { name: 'Modifier' })
    await user.clear(modifierInput)
    await user.type(modifierInput, '3')
    await user.click(screen.getByRole('button', { name: 'Roll' }))

    await waitFor(() => {
      const call = sharedTestState.fetchSpy.mock.calls.find(
        (c: unknown[]) => (c[0] as string).includes('/rolls') && (c[1] as RequestInit)?.method === 'POST'
      )
      expect(call).toBeDefined()
      const body = JSON.parse((call![1] as RequestInit).body as string)
      expect(body.formula).toBe('2d6+2d8+3')
      expect(body.rolls).toEqual([3, 5, 2, 7])
      expect(body.total).toBe(20)
      expect(body.visibility).toEqual({ scope: 'group' })
    })
  })

  it('commit with zero modifier omits the modifier from formula', async () => {
    mockedRollDicePool.mockReturnValue([{ sides: 20, value: 15 }])
    sharedTestState.fetchSpy.mockImplementation((url: string, options?: RequestInit) => {
      if (url.includes('/members')) return Promise.resolve({ ok: true, json: () => Promise.resolve({ members: [] }) })
      if (url.includes('/rolls') && options?.method === 'POST') {
        return Promise.resolve({
          ok: true, status: 201,
          json: () => Promise.resolve({
            id: 'roll-2', campaignId: CAMPAIGN_ID, rollerName: 'tester',
            formula: '1d20', rolls: [15], total: 15,
            visibility: { scope: 'group' }, createdAt: new Date().toISOString(),
          }),
        })
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve({ messages: [] }) })
    })

    const { user } = await openDockWithSession()
    await user.click(screen.getByRole('button', { name: /roll|dice/i }))
    await user.click(screen.getByRole('button', { name: 'Add d20' }))
    await user.click(screen.getByRole('button', { name: 'Roll' }))

    await waitFor(() => {
      const call = sharedTestState.fetchSpy.mock.calls.find(
        (c: unknown[]) => (c[0] as string).includes('/rolls') && (c[1] as RequestInit)?.method === 'POST'
      )
      const body = JSON.parse((call![1] as RequestInit).body as string)
      expect(body.formula).toBe('1d20')
    })
  })

  it('adding a single die issues no POST; only Roll issues exactly one POST', async () => {
    mockedRollDicePool.mockReturnValue([{ sides: 20, value: 10 }])
    sharedTestState.fetchSpy.mockImplementation((url: string, options?: RequestInit) => {
      if (url.includes('/members')) return Promise.resolve({ ok: true, json: () => Promise.resolve({ members: [] }) })
      if (url.includes('/rolls') && options?.method === 'POST') {
        return Promise.resolve({
          ok: true, status: 201,
          json: () => Promise.resolve({
            id: 'roll-3', campaignId: CAMPAIGN_ID, rollerName: 'tester',
            formula: '1d20', rolls: [10], total: 10,
            visibility: { scope: 'group' }, createdAt: new Date().toISOString(),
          }),
        })
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve({ messages: [] }) })
    })

    const { user } = await openDockWithSession()
    await user.click(screen.getByRole('button', { name: /roll|dice/i }))
    await user.click(screen.getByRole('button', { name: 'Add d20' }))
    expect(
      sharedTestState.fetchSpy.mock.calls.filter(
        (c: unknown[]) => (c[0] as string).includes('/rolls') && (c[1] as RequestInit)?.method === 'POST'
      )
    ).toHaveLength(0)

    await user.click(screen.getByRole('button', { name: 'Roll' }))
    await waitFor(() => {
      expect(
        sharedTestState.fetchSpy.mock.calls.filter(
          (c: unknown[]) => (c[0] as string).includes('/rolls') && (c[1] as RequestInit)?.method === 'POST'
        )
      ).toHaveLength(1)
    })
  })

  it('Roll button is disabled when the pool is empty', async () => {
    const { user } = await openDockWithSession()
    await user.click(screen.getByRole('button', { name: /roll|dice/i }))
    expect(screen.getByRole('button', { name: 'Roll' })).toBeDisabled()
  })

  it('successful commit clears the staged pool', async () => {
    mockedRollDicePool.mockReturnValue([{ sides: 20, value: 10 }])
    sharedTestState.fetchSpy.mockImplementation((url: string, options?: RequestInit) => {
      if (url.includes('/members')) return Promise.resolve({ ok: true, json: () => Promise.resolve({ members: [] }) })
      if (url.includes('/rolls') && options?.method === 'POST') {
        return Promise.resolve({
          ok: true, status: 201,
          json: () => Promise.resolve({
            id: 'roll-4', campaignId: CAMPAIGN_ID, rollerName: 'tester',
            formula: '1d20', rolls: [10], total: 10,
            visibility: { scope: 'group' }, createdAt: new Date().toISOString(),
          }),
        })
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve({ messages: [] }) })
    })

    const { user } = await openDockWithSession()
    await user.click(screen.getByRole('button', { name: /roll|dice/i }))
    await user.click(screen.getByRole('button', { name: 'Add d20' }))
    await user.click(screen.getByRole('button', { name: 'Roll' }))

    await waitFor(() => expect(screen.getByRole('button', { name: 'Add d20' })).toHaveTextContent('d20 ×0'))
    expect(screen.getByRole('button', { name: 'Roll' })).toBeDisabled()
  })

  it('409 response shows inline error and preserves the staged pool', async () => {
    mockedRollDicePool.mockReturnValue([{ sides: 20, value: 10 }])
    sharedTestState.fetchSpy.mockImplementation((url: string, options?: RequestInit) => {
      if (url.includes('/members')) return Promise.resolve({ ok: true, json: () => Promise.resolve({ members: [] }) })
      if (url.includes('/rolls') && options?.method === 'POST') {
        return Promise.resolve({ ok: false, status: 409, json: () => Promise.resolve({}) })
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve({ messages: [] }) })
    })

    const { user } = await openDockWithSession()
    await user.click(screen.getByRole('button', { name: /roll|dice/i }))
    await user.click(screen.getByRole('button', { name: 'Add d20' }))
    await user.click(screen.getByRole('button', { name: 'Roll' }))

    await waitFor(() => expect(screen.getByText('No active session')).toBeInTheDocument())
    expect(screen.getByRole('button', { name: 'Add d20' })).toHaveTextContent('d20 ×1')
  })

  it('Roll and pool controls are disabled while a commit is in flight, re-enabled after', async () => {
    mockedRollDicePool.mockReturnValue([{ sides: 20, value: 10 }])
    let resolvePost: (value: unknown) => void
    sharedTestState.fetchSpy.mockImplementation((url: string, options?: RequestInit) => {
      if (url.includes('/members')) return Promise.resolve({ ok: true, json: () => Promise.resolve({ members: [] }) })
      if (url.includes('/rolls') && options?.method === 'POST') {
        return new Promise(resolve => { resolvePost = resolve })
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve({ messages: [] }) })
    })

    const { user } = await openDockWithSession()
    await user.click(screen.getByRole('button', { name: /roll|dice/i }))
    await user.click(screen.getByRole('button', { name: 'Add d20' }))
    user.click(screen.getByRole('button', { name: 'Roll' }))

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Roll' })).toBeDisabled()
      expect(screen.getByRole('button', { name: 'Add d20' })).toBeDisabled()
      expect(screen.getByRole('button', { name: 'Remove d20' })).toBeDisabled()
    })

    resolvePost!({
      ok: true, status: 201,
      json: () => Promise.resolve({
        id: 'roll-6', campaignId: CAMPAIGN_ID, rollerName: 'tester',
        formula: '1d20', rolls: [10], total: 10,
        visibility: { scope: 'group' }, createdAt: new Date().toISOString(),
      }),
    })

    await waitFor(() => expect(screen.getByRole('button', { name: 'Add d20' })).not.toBeDisabled())
  })

  it('non-409 failure (e.g. 500) shows inline error and preserves the staged pool', async () => {
    mockedRollDicePool.mockReturnValue([{ sides: 20, value: 10 }])
    sharedTestState.fetchSpy.mockImplementation((url: string, options?: RequestInit) => {
      if (url.includes('/members')) return Promise.resolve({ ok: true, json: () => Promise.resolve({ members: [] }) })
      if (url.includes('/rolls') && options?.method === 'POST') {
        return Promise.resolve({ ok: false, status: 500, json: () => Promise.resolve({}) })
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve({ messages: [] }) })
    })

    const { user } = await openDockWithSession()
    await user.click(screen.getByRole('button', { name: /roll|dice/i }))
    await user.click(screen.getByRole('button', { name: 'Add d20' }))
    await user.click(screen.getByRole('button', { name: 'Roll' }))

    await waitFor(() => expect(screen.getByText('Roll failed, try again')).toBeInTheDocument())
    expect(screen.getByRole('button', { name: 'Add d20' })).toHaveTextContent('d20 ×1')
  })

  it('a thrown rollDicePool error is caught and shows inline error instead of crashing', async () => {
    mockedRollDicePool.mockImplementation(() => { throw new Error('boom') })
    sharedTestState.fetchSpy.mockImplementation((url: string) => {
      if (url.includes('/members')) return Promise.resolve({ ok: true, json: () => Promise.resolve({ members: [] }) })
      return Promise.resolve({ ok: true, json: () => Promise.resolve({ messages: [] }) })
    })

    const { user } = await openDockWithSession()
    await user.click(screen.getByRole('button', { name: /roll|dice/i }))
    await user.click(screen.getByRole('button', { name: 'Add d20' }))
    await user.click(screen.getByRole('button', { name: 'Roll' }))

    await waitFor(() => expect(screen.getByText('Roll failed, try again')).toBeInTheDocument())
    expect(screen.getByRole('button', { name: 'Roll' })).not.toBeDisabled()
  })

  it('DM-only visibility sends correct scope', async () => {
    mockedRollDicePool.mockReturnValue([{ sides: 20, value: 10 }])
    sharedTestState.fetchSpy.mockImplementation((url: string, options?: RequestInit) => {
      if (url.includes('/members')) return Promise.resolve({ ok: true, json: () => Promise.resolve({ members: [] }) })
      if (url.includes('/rolls') && options?.method === 'POST') {
        return Promise.resolve({
          ok: true, status: 201,
          json: () => Promise.resolve({
            id: 'roll-5', campaignId: CAMPAIGN_ID, rollerName: 'tester',
            formula: '1d20', rolls: [10], total: 10,
            visibility: { scope: 'dm-only' }, createdAt: new Date().toISOString(),
          }),
        })
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve({ messages: [] }) })
    })

    const { user } = await openDockWithSession()
    await user.click(screen.getByRole('button', { name: /roll|dice/i }))
    await user.click(screen.getByRole('button', { name: 'Add d20' }))
    await user.selectOptions(screen.getByRole('combobox', { name: 'Roll visibility' }), 'dm-only')
    await user.click(screen.getByRole('button', { name: 'Roll' }))

    await waitFor(() => {
      const call = sharedTestState.fetchSpy.mock.calls.find(
        (c: unknown[]) => (c[0] as string).includes('/rolls') && (c[1] as RequestInit)?.method === 'POST'
      )
      const body = JSON.parse((call![1] as RequestInit).body as string)
      expect(body.visibility).toEqual({ scope: 'dm-only' })
    })
  })
})
