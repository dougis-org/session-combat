import { screen, waitFor } from '@testing-library/react'
import { rollDicePool } from '@/lib/utils/dice'
import {
  sharedTestState, setupFetchMock, restoreFetch, openDockWithSession,
  rollResponse, mockRollPost, mockRollPostPending,
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

jest.mock('@/lib/utils/dice', () => ({
  ...jest.requireActual('@/lib/utils/dice'),
  rollDicePool: jest.fn(),
}))

const mockedRollDicePool = rollDicePool as jest.Mock

function postedRollBody() {
  const call = sharedTestState.fetchSpy.mock.calls.find(
    (c: unknown[]) => (c[0] as string).includes('/rolls') && (c[1] as RequestInit)?.method === 'POST'
  )
  return call ? JSON.parse((call[1] as RequestInit).body as string) : undefined
}

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
    mockRollPost({ status: 201, body: rollResponse({ id: 'roll-1', formula: '2d6+2d8+3', rolls: [3, 5, 2, 7], total: 20 }) })

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
      const body = postedRollBody()
      expect(body).toBeDefined()
      expect(body.formula).toBe('2d6+2d8+3')
      expect(body.rolls).toEqual([3, 5, 2, 7])
      expect(body.total).toBe(20)
      expect(body.visibility).toEqual({ scope: 'group' })
    })
  })

  it('commit with zero modifier omits the modifier from formula', async () => {
    mockedRollDicePool.mockReturnValue([{ sides: 20, value: 15 }])
    mockRollPost({ status: 201, body: rollResponse({ id: 'roll-2', formula: '1d20', rolls: [15], total: 15 }) })

    const { user } = await openDockWithSession()
    await user.click(screen.getByRole('button', { name: /roll|dice/i }))
    await user.click(screen.getByRole('button', { name: 'Add d20' }))
    await user.click(screen.getByRole('button', { name: 'Roll' }))

    await waitFor(() => expect(postedRollBody().formula).toBe('1d20'))
  })

  it('adding a single die issues no POST; only Roll issues exactly one POST', async () => {
    mockedRollDicePool.mockReturnValue([{ sides: 20, value: 10 }])
    mockRollPost({ status: 201, body: rollResponse({ id: 'roll-3' }) })

    const postCount = () =>
      sharedTestState.fetchSpy.mock.calls.filter(
        (c: unknown[]) => (c[0] as string).includes('/rolls') && (c[1] as RequestInit)?.method === 'POST'
      ).length

    const { user } = await openDockWithSession()
    await user.click(screen.getByRole('button', { name: /roll|dice/i }))
    await user.click(screen.getByRole('button', { name: 'Add d20' }))
    expect(postCount()).toBe(0)

    await user.click(screen.getByRole('button', { name: 'Roll' }))
    await waitFor(() => expect(postCount()).toBe(1))
  })

  it('Roll button is disabled when the pool is empty', async () => {
    const { user } = await openDockWithSession()
    await user.click(screen.getByRole('button', { name: /roll|dice/i }))
    expect(screen.getByRole('button', { name: 'Roll' })).toBeDisabled()
  })

  it('successful commit clears the staged pool', async () => {
    mockedRollDicePool.mockReturnValue([{ sides: 20, value: 10 }])
    mockRollPost({ status: 201, body: rollResponse({ id: 'roll-4' }) })

    const { user } = await openDockWithSession()
    await user.click(screen.getByRole('button', { name: /roll|dice/i }))
    await user.click(screen.getByRole('button', { name: 'Add d20' }))
    await user.click(screen.getByRole('button', { name: 'Roll' }))

    await waitFor(() => expect(screen.getByRole('button', { name: 'Add d20' })).toHaveTextContent('×0'))
    expect(screen.getByRole('button', { name: 'Roll' })).toBeDisabled()
  })

  it('409 response shows inline error and preserves the staged pool', async () => {
    mockedRollDicePool.mockReturnValue([{ sides: 20, value: 10 }])
    mockRollPost({ status: 409 })

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
    const pending = mockRollPostPending()

    const { user } = await openDockWithSession()
    await user.click(screen.getByRole('button', { name: /roll|dice/i }))
    await user.click(screen.getByRole('button', { name: 'Add d20' }))
    user.click(screen.getByRole('button', { name: 'Roll' }))

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Roll' })).toBeDisabled()
      expect(screen.getByRole('button', { name: 'Add d20' })).toBeDisabled()
      expect(screen.getByRole('button', { name: 'Remove d20' })).toBeDisabled()
    })

    pending.resolve({ ok: true, status: 201, json: () => Promise.resolve(rollResponse({ id: 'roll-6' })) })

    await waitFor(() => expect(screen.getByRole('button', { name: 'Add d20' })).not.toBeDisabled())
  })

  it('non-409 failure (e.g. 500) shows inline error and preserves the staged pool', async () => {
    mockedRollDicePool.mockReturnValue([{ sides: 20, value: 10 }])
    mockRollPost({ status: 500 })

    const { user } = await openDockWithSession()
    await user.click(screen.getByRole('button', { name: /roll|dice/i }))
    await user.click(screen.getByRole('button', { name: 'Add d20' }))
    await user.click(screen.getByRole('button', { name: 'Roll' }))

    await waitFor(() => expect(screen.getByText('Roll failed, try again')).toBeInTheDocument())
    expect(screen.getByRole('button', { name: 'Add d20' })).toHaveTextContent('×1')
  })

  it('a thrown rollDicePool error is caught and shows inline error instead of crashing', async () => {
    mockedRollDicePool.mockImplementation(() => { throw new Error('boom') })

    const { user } = await openDockWithSession()
    await user.click(screen.getByRole('button', { name: /roll|dice/i }))
    await user.click(screen.getByRole('button', { name: 'Add d20' }))
    await user.click(screen.getByRole('button', { name: 'Roll' }))

    await waitFor(() => expect(screen.getByText('Roll failed, try again')).toBeInTheDocument())
    expect(screen.getByRole('button', { name: 'Roll' })).not.toBeDisabled()
  })

  it('the percentile control commits exactly one d% roll and leaves the staged pool alone', async () => {
    mockedRollDicePool.mockReturnValue([{ sides: 20, value: 10 }])
    mockRollPost({ status: 201, body: rollResponse({ id: 'roll-pct', formula: 'd%', rolls: [42], total: 42 }) })

    const postCount = () =>
      sharedTestState.fetchSpy.mock.calls.filter(
        (c: unknown[]) => (c[0] as string).includes('/rolls') && (c[1] as RequestInit)?.method === 'POST'
      ).length

    const { user } = await openDockWithSession()
    await user.click(screen.getByRole('button', { name: /roll|dice/i }))
    await user.click(screen.getByRole('button', { name: 'Add d6' }))
    await user.click(screen.getByRole('button', { name: /percentile|d%/i }))

    await waitFor(() => expect(postCount()).toBe(1))
    const body = postedRollBody()
    expect(body.formula).toBe('d%')
    expect(body.rolls).toHaveLength(1)
    expect(body.rolls[0]).toBeGreaterThanOrEqual(1)
    expect(body.rolls[0]).toBeLessThanOrEqual(100)
    expect(body.total).toBe(body.rolls[0])
    expect(body.visibility).toEqual({ scope: 'group' })
    // staged pool untouched
    expect(screen.getByRole('button', { name: 'Add d6' })).toHaveTextContent('×1')
  })

  it('a 409 on the percentile control shows "No active session" and preserves the pool', async () => {
    mockRollPost({ status: 409 })
    const { user } = await openDockWithSession()
    await user.click(screen.getByRole('button', { name: /roll|dice/i }))
    await user.click(screen.getByRole('button', { name: 'Add d6' }))
    await user.click(screen.getByRole('button', { name: /percentile|d%/i }))
    await waitFor(() => expect(screen.getByText('No active session')).toBeInTheDocument())
    expect(screen.getByRole('button', { name: 'Add d6' })).toHaveTextContent('×1')
  })

  it('a non-409 failure on the percentile control shows "Roll failed, try again" and clears on retry', async () => {
    mockRollPost({ status: 500 })
    const { user } = await openDockWithSession()
    await user.click(screen.getByRole('button', { name: /roll|dice/i }))
    await user.click(screen.getByRole('button', { name: /percentile|d%/i }))
    await waitFor(() => expect(screen.getByText('Roll failed, try again')).toBeInTheDocument())

    // a subsequent successful percentile roll clears the error
    mockRollPost({ status: 201, body: rollResponse({ id: 'roll-pct-ok', formula: 'd%', rolls: [7], total: 7 }) })
    await user.click(screen.getByRole('button', { name: /percentile|d%/i }))
    await waitFor(() => expect(screen.queryByText('Roll failed, try again')).not.toBeInTheDocument())
  })

  it('the percentile control cannot double-fire while a roll is in flight', async () => {
    const pending = mockRollPostPending()
    const postCount = () =>
      sharedTestState.fetchSpy.mock.calls.filter(
        (c: unknown[]) => (c[0] as string).includes('/rolls') && (c[1] as RequestInit)?.method === 'POST'
      ).length

    const { user } = await openDockWithSession()
    await user.click(screen.getByRole('button', { name: /roll|dice/i }))
    const pct = screen.getByRole('button', { name: /percentile|d%/i })
    user.click(pct)
    await waitFor(() => expect(pct).toBeDisabled())
    await user.click(pct).catch(() => {})
    expect(postCount()).toBe(1)

    pending.resolve({ ok: true, status: 201, json: () => Promise.resolve(rollResponse({ id: 'roll-pct-p', formula: 'd%', rolls: [5], total: 5 })) })
    await waitFor(() => expect(pct).not.toBeDisabled())
  })

  it('DM-only visibility sends correct scope', async () => {
    mockedRollDicePool.mockReturnValue([{ sides: 20, value: 10 }])
    mockRollPost({ status: 201, body: rollResponse({ id: 'roll-5', visibility: { scope: 'dm-only' } }) })

    const { user } = await openDockWithSession()
    await user.click(screen.getByRole('button', { name: /roll|dice/i }))
    await user.click(screen.getByRole('button', { name: 'Add d20' }))
    await user.selectOptions(screen.getByRole('combobox', { name: 'Roll visibility' }), 'dm-only')
    await user.click(screen.getByRole('button', { name: 'Roll' }))

    await waitFor(() => expect(postedRollBody().visibility).toEqual({ scope: 'dm-only' }))
  })
})
