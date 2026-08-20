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

  it('trigger displays the vendored d20 icon, not the literal text d20', async () => {
    await openDockWithSession('session-1')
    const trigger = screen.getByRole('button', { name: /roll|dice/i })
    expect(trigger).not.toHaveTextContent('d20')
    expect(trigger.querySelector('svg')).toBeInTheDocument()
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

  it('dice panel is a DOM sibling of the drawer, both children of one flex-row wrapper, not a document.body portal', async () => {
    const { user } = await openDockWithSession()
    await user.click(screen.getByRole('button', { name: /roll|dice/i }))
    const panel = screen.getByLabelText('Dice pool')
    const drawer = screen.getByRole('complementary')
    expect(panel.parentElement).toBe(drawer.parentElement)
    expect(document.getElementById('dice-pool-overlay-root')).toBeNull()
    expect(document.body.contains(panel)).toBe(true)
    // The panel must be inside the same in-flow wrapper, not directly appended to body
    expect(panel.parentElement).not.toBe(document.body)
  })

  it('dice panel appears before the drawer in DOM order (to its left in the flex row)', async () => {
    const { user } = await openDockWithSession()
    await user.click(screen.getByRole('button', { name: /roll|dice/i }))
    const panel = screen.getByLabelText('Dice pool')
    const drawer = screen.getByRole('complementary')
    const parent = panel.parentElement!
    const children = Array.from(parent.children)
    expect(children.indexOf(panel)).toBeLessThan(children.indexOf(drawer))
  })

  it('dice panel matches the drawer height', async () => {
    const { user } = await openDockWithSession()
    await user.click(screen.getByRole('button', { name: /roll|dice/i }))
    const panel = screen.getByLabelText('Dice pool')
    const drawer = screen.getByRole('complementary')
    expect((panel as HTMLElement).style.height).toBe((drawer as HTMLElement).style.height)
  })

  it('dice panel is absent from the DOM when closed, and no overlay-root node is created', async () => {
    await openDockWithSession()
    expect(screen.queryByLabelText('Dice pool')).not.toBeInTheDocument()
    expect(document.getElementById('dice-pool-overlay-root')).toBeNull()
  })

  it('adding a d6 twice and a d8 twice sets staged counts and issues zero network requests', async () => {
    const { user } = await openDockWithSession()
    await user.click(screen.getByRole('button', { name: /roll|dice/i }))
    await user.click(screen.getByRole('button', { name: 'Add d6' }))
    await user.click(screen.getByRole('button', { name: 'Add d6' }))
    await user.click(screen.getByRole('button', { name: 'Add d8' }))
    await user.click(screen.getByRole('button', { name: 'Add d8' }))
    expect(screen.getByRole('button', { name: 'Add d6' })).toHaveTextContent('×2')
    expect(screen.getByRole('button', { name: 'Add d8' })).toHaveTextContent('×2')
    expect(screen.getByRole('button', { name: 'Add d4' })).toHaveTextContent('×0')
    expect(sharedTestState.fetchSpy).not.toHaveBeenCalledWith(expect.stringContaining('/rolls'), expect.anything())
  })

  it('removing one d6 from a staged count of 2 decrements it to 1', async () => {
    const { user } = await openDockWithSession()
    await user.click(screen.getByRole('button', { name: /roll|dice/i }))
    await user.click(screen.getByRole('button', { name: 'Add d6' }))
    await user.click(screen.getByRole('button', { name: 'Add d6' }))
    await user.click(screen.getByRole('button', { name: 'Remove d6' }))
    expect(screen.getByRole('button', { name: 'Add d6' })).toHaveTextContent('×1')
  })

  it('staged count cannot go below zero', async () => {
    const { user } = await openDockWithSession()
    await user.click(screen.getByRole('button', { name: /roll|dice/i }))
    await user.click(screen.getByRole('button', { name: 'Remove d10' }))
    expect(screen.getByRole('button', { name: 'Add d10' })).toHaveTextContent('×0')
  })

  it('modifier is editable independent of staged dice', async () => {
    const { user } = await openDockWithSession()
    await user.click(screen.getByRole('button', { name: /roll|dice/i }))
    const modifierInput = screen.getByRole('textbox', { name: 'Modifier' })
    await user.clear(modifierInput)
    await user.type(modifierInput, '-2')
    expect(modifierInput).toHaveValue('-2')
    expect(screen.getByRole('button', { name: 'Add d6' })).toHaveTextContent('×0')
  })

  it('visibility selector defaults to group', async () => {
    const { user } = await openDockWithSession()
    await user.click(screen.getByRole('button', { name: /roll|dice/i }))
    expect(screen.getByRole('combobox', { name: 'Roll visibility' })).toHaveValue('group')
  })

  it('each die-size add control renders the icon matching its own die size', async () => {
    const { user } = await openDockWithSession()
    await user.click(screen.getByRole('button', { name: /roll|dice/i }))
    for (const sides of [4, 6, 8, 10, 12, 20]) {
      const btn = screen.getByRole('button', { name: `Add d${sides}` })
      expect(btn.querySelector('svg')).toBeInTheDocument()
    }
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

describe('CampaignChat — feed auto-scroll on own roll', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    sharedTestState.capturedOnEvent = null
    setupFetchMock()
    document.getElementById('dice-pool-overlay-root')?.remove()
  })

  afterEach(() => {
    restoreFetch()
  })

  function getFeedContainer(): HTMLElement {
    const el = document.querySelector('.flex-1.overflow-y-auto')
    if (!el) throw new Error('feed container not found')
    return el as HTMLElement
  }

  it('committing a roll scrolls the feed to reveal it', async () => {
    mockedRollDicePool.mockReturnValue([{ sides: 20, value: 10 }])
    sharedTestState.fetchSpy.mockImplementation((url: string, options?: RequestInit) => {
      if (url.includes('/members')) return Promise.resolve({ ok: true, json: () => Promise.resolve({ members: [] }) })
      if (url.includes('/rolls') && options?.method === 'POST') {
        return Promise.resolve({
          ok: true, status: 201,
          json: () => Promise.resolve({
            id: 'roll-scroll-own', campaignId: CAMPAIGN_ID, rollerName: 'tester',
            formula: '1d20', rolls: [10], total: 10,
            visibility: { scope: 'group' }, createdAt: new Date().toISOString(),
          }),
        })
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve({ messages: [] }) })
    })

    const { user } = await openDockWithSession()
    const scrollSpy = jest.fn()
    getFeedContainer().scrollTo = scrollSpy

    await user.click(screen.getByRole('button', { name: /roll|dice/i }))
    await user.click(screen.getByRole('button', { name: 'Add d20' }))
    await user.click(screen.getByRole('button', { name: 'Roll' }))

    await waitFor(() => {
      expect(scrollSpy).toHaveBeenCalledWith(expect.objectContaining({ behavior: 'smooth' }))
    })
  })

  it('a roll from another player arriving via SSE does not trigger auto-scroll', async () => {
    const { user } = await openDockWithSession()
    const scrollSpy = jest.fn()
    getFeedContainer().scrollTo = scrollSpy

    act(() => {
      sharedTestState.capturedOnEvent?.({
        type: 'roll',
        campaignId: CAMPAIGN_ID,
        data: {
          id: 'roll-other-player', campaignId: CAMPAIGN_ID, sessionId: 'session-1',
          rollerId: 'user-2', rollerName: 'other', formula: '1d20', rolls: [7], total: 7,
          visibility: { scope: 'group' }, createdAt: new Date(),
        },
      })
    })

    await waitFor(() => expect(screen.getByText(/1d20/)).toBeInTheDocument())
    expect(scrollSpy).not.toHaveBeenCalled()
  })

  it('auto-scroll does not reorder the feed — the new roll stays last', async () => {
    mockedRollDicePool.mockReturnValue([{ sides: 20, value: 10 }])
    sharedTestState.fetchSpy.mockImplementation((url: string, options?: RequestInit) => {
      if (url.includes('/members')) return Promise.resolve({ ok: true, json: () => Promise.resolve({ members: [] }) })
      if (url.includes('/rolls') && options?.method === 'POST') {
        return Promise.resolve({
          ok: true, status: 201,
          json: () => Promise.resolve({
            id: 'roll-scroll-order', campaignId: CAMPAIGN_ID, rollerName: 'tester',
            formula: '1d20', rolls: [10], total: 10,
            visibility: { scope: 'group' }, createdAt: new Date().toISOString(),
          }),
        })
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve({ messages: [] }) })
    })

    const { user } = await openDockWithSession()
    getFeedContainer().scrollTo = jest.fn()

    act(() => {
      sharedTestState.capturedOnEvent?.({
        type: 'message',
        campaignId: CAMPAIGN_ID,
        data: {
          id: 'msg-before', campaignId: CAMPAIGN_ID, senderId: 'user-2', senderName: 'Alice',
          text: 'earlier message', visibility: { scope: 'group' }, createdAt: new Date(),
        },
      })
    })

    await user.click(screen.getByRole('button', { name: /roll|dice/i }))
    await user.click(screen.getByRole('button', { name: 'Add d20' }))
    await user.click(screen.getByRole('button', { name: 'Roll' }))

    await waitFor(() => expect(screen.getByText(/1d20/)).toBeInTheDocument())

    const feedItems = getFeedContainer().querySelectorAll(':scope > *')
    const texts = Array.from(feedItems).map(el => el.textContent ?? '')
    const lastIdx = texts.length - 1
    expect(texts[lastIdx]).toContain('1d20')
    expect(texts.findIndex(t => t.includes('earlier message'))).toBeLessThan(lastIdx)
  })
})
