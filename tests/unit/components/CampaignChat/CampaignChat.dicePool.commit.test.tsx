import { screen, waitFor } from '@testing-library/react'
import { rollDicePool } from '@/lib/utils/dice'
import { CAMPAIGN_ID, sharedTestState, setupFetchMock, restoreFetch, openDockWithSession } from './helpers'

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
  ...jest.requireActual('@/lib/utils/dice'),
  rollDicePool: jest.fn(),
}))

const mockedRollDicePool = rollDicePool as jest.Mock

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

    await waitFor(() => expect(screen.getByRole('button', { name: 'Add d20' })).toHaveTextContent('×0'))
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
    const modifierInput = screen.getByRole('textbox', { name: 'Modifier' })
    await user.clear(modifierInput)
    await user.type(modifierInput, '5')
    await user.selectOptions(screen.getByRole('combobox', { name: 'Roll visibility' }), 'dm-only')
    await user.click(screen.getByRole('button', { name: 'Roll' }))

    await waitFor(() => expect(screen.getByText('No active session')).toBeInTheDocument())
    expect(screen.getByRole('button', { name: 'Add d20' })).toHaveTextContent('×1')
    expect(modifierInput).toHaveValue('5')
    expect(screen.getByRole('combobox', { name: 'Roll visibility' })).toHaveValue('dm-only')
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
    expect(screen.getByRole('button', { name: 'Add d20' })).toHaveTextContent('×1')
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
