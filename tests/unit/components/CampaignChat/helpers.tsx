import React from 'react'
import { render, screen, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { CampaignChat } from '@/lib/components/CampaignChat'
import { useActiveSessionIdCore } from '@/lib/hooks/useActiveSessionId'
import type { CampaignStreamEvent, CampaignMessage, CampaignRoll, MessageVisibility } from '@/lib/types'

export const CAMPAIGN_ID = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'

export const sharedTestState: {
  capturedOnEvent: ((e: CampaignStreamEvent) => void) | null
  fetchSpy: jest.Mock
} = {
  capturedOnEvent: null,
  fetchSpy: jest.fn(),
}

// Every CampaignChat test file must declare
// `jest.mock('@/lib/hooks/useActiveSessionId', () => ({ useActiveSessionIdCore: jest.fn() }))`
// itself (jest.mock hoisting is per-file) before this helper is used. This
// backs the mock with real React state so that CampaignChat's own
// setActiveSessionId/handleStreamEvent calls re-render it exactly as the
// real (non-subscribing) core hook would — without opening any subscription.
export function mockActiveSessionIdCore(initial: string | null | undefined) {
  const setActiveSessionId = jest.fn()
  const handleStreamEvent = jest.fn()
  ;(useActiveSessionIdCore as jest.Mock).mockImplementation(() => {
    const [value, setValue] = React.useState(initial)
    setActiveSessionId.mockImplementation((id: string | null) => setValue(id))
    handleStreamEvent.mockImplementation((e: CampaignStreamEvent) => {
      if (e.type === 'session') setValue(e.data.activeSessionId)
    })
    return { activeSessionId: value, setActiveSessionId, handleStreamEvent }
  })
  return { setActiveSessionId, handleStreamEvent }
}

const originalFetch = global.fetch

export function setupFetchMock(overrides?: Record<string, unknown>) {
  type Handler = (options?: RequestInit) => unknown
  const routes: Array<[string, Handler]> = [
    ['/attachments', () => overrides?.attachments ?? { attachmentId: 'att-test' }],
    ['/members', () => overrides?.members ?? { members: [] }],
    ['/rolls', () => overrides?.rolls ?? { rolls: [] }],
    ['/messages', (options) =>
      options?.method === 'POST'
        ? (overrides?.sceneMessage ?? {
            id: 'scene-1',
            kind: 'scene',
            text: '',
            attachmentId: 'att-test',
            visibility: { scope: 'group' },
            campaignId: CAMPAIGN_ID,
            senderId: 'user-1',
            senderName: 'DM',
            createdAt: new Date().toISOString(),
          })
        : (overrides?.messages ?? { messages: [] })
    ],
  ]

  const spy = jest.fn().mockImplementation((url: string, options?: RequestInit) => {
    const entry = routes.find(([pattern]) => url.includes(pattern))
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve(entry ? entry[1](options) : {}),
    })
  })
  sharedTestState.fetchSpy = spy
  global.fetch = spy as unknown as typeof global.fetch
}

export function restoreFetch() {
  global.fetch = originalFetch
}

// Local test-file helpers in sibling CampaignChat.*.test.tsx files must not
// reuse any of the export names below (openDock, openDockWithSession, etc.) —
// pick a distinct name to avoid shadowing.
export async function openDock() {
  mockActiveSessionIdCore(null)
  const user = userEvent.setup()
  render(<CampaignChat campaignId={CAMPAIGN_ID} />)
  await user.click(screen.getByRole('button', { name: /chat/i }))
  return user
}

export async function openDockWithSession(activeSessionId: string | null = 'session-1') {
  const { setActiveSessionId } = mockActiveSessionIdCore(activeSessionId)
  const user = userEvent.setup()
  const { rerender } = render(<CampaignChat campaignId={CAMPAIGN_ID} />)
  await user.click(screen.getByRole('button', { name: /chat/i }))
  return { user, rerender, setActiveSessionId }
}

// Like openDockWithSession, but drives the REAL (unmocked) useActiveSessionIdCore
// via a mocked fetch instead of mocking the hook module directly — for tests
// that need to exercise the actual fetch -> hook -> render path. Pass 'error'
// to simulate a failed campaign fetch instead of a resolved activeSessionId.
export async function openDockWithSessionViaRealFetch(activeSessionId: string | null | 'error') {
  const spy = jest.fn().mockImplementation((url: string, options?: RequestInit) => {
    if (url === `/api/campaigns/${CAMPAIGN_ID}`) {
      if (activeSessionId === 'error') {
        return Promise.resolve({ ok: false, status: 500, json: () => Promise.resolve({}) })
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve({ activeSessionId }) })
    }
    if (url.includes('/members')) return Promise.resolve({ ok: true, json: () => Promise.resolve({ members: [] }) })
    if (url.includes('/rolls')) return Promise.resolve({ ok: true, json: () => Promise.resolve({ rolls: [] }) })
    return Promise.resolve({ ok: true, json: () => Promise.resolve(options?.method === 'POST' ? {} : { messages: [] }) })
  })
  sharedTestState.fetchSpy = spy
  global.fetch = spy as unknown as typeof global.fetch

  const user = userEvent.setup()
  render(<CampaignChat campaignId={CAMPAIGN_ID} />)
  await user.click(screen.getByRole('button', { name: /chat/i }))
  return { user }
}

export function fireMsg(
  overrides: Partial<{
    id: string
    senderId: string
    senderName: string
    text: string
    visibility: MessageVisibility
    createdAt: Date
  }> = {}
) {
  act(() => {
    sharedTestState.capturedOnEvent?.({
      type: 'message',
      campaignId: CAMPAIGN_ID,
      data: {
        id: overrides.id ?? 'msg-default',
        campaignId: CAMPAIGN_ID,
        senderId: overrides.senderId ?? 'user-1',
        senderName: overrides.senderName ?? 'Alice',
        text: overrides.text ?? 'Hello',
        visibility: overrides.visibility ?? { scope: 'group' },
        createdAt: overrides.createdAt ?? new Date(),
      } as CampaignMessage,
    })
  })
}

export function rollResponse(
  overrides: Partial<{
    id: string
    formula: string
    rolls: number[]
    total: number
    visibility: MessageVisibility
  }> = {}
) {
  return {
    id: overrides.id ?? 'roll-test',
    campaignId: CAMPAIGN_ID,
    rollerName: 'tester',
    formula: overrides.formula ?? '1d20',
    rolls: overrides.rolls ?? [10],
    total: overrides.total ?? 10,
    visibility: overrides.visibility ?? { scope: 'group' },
    createdAt: new Date().toISOString(),
  }
}

function rollPostRoute(handler: (options?: RequestInit) => unknown) {
  sharedTestState.fetchSpy.mockImplementation((url: string, options?: RequestInit) => {
    if (url.includes('/members')) return Promise.resolve({ ok: true, json: () => Promise.resolve({ members: [] }) })
    if (url.includes('/rolls') && options?.method === 'POST') return Promise.resolve(handler(options))
    return Promise.resolve({ ok: true, json: () => Promise.resolve({ messages: [] }) })
  })
}

export function mockRollPost(result: { status: 201; body: ReturnType<typeof rollResponse> } | { status: 409 | 500 }) {
  rollPostRoute(() =>
    result.status === 201
      ? { ok: true, status: 201, json: () => Promise.resolve(result.body) }
      : { ok: false, status: result.status, json: () => Promise.resolve({}) }
  )
}

export function mockRollPostPending() {
  let resolvePost!: (value: unknown) => void
  rollPostRoute(() => new Promise(resolve => { resolvePost = resolve }))
  return { resolve: (body: unknown) => resolvePost(body) }
}

export function makeRoll(overrides: Partial<CampaignRoll> = {}): CampaignRoll {
  return {
    id: 'roll-1',
    campaignId: CAMPAIGN_ID,
    sessionId: 'session-1',
    rollerId: 'user-1',
    rollerName: 'thegm',
    formula: '1d20+3',
    rolls: [17],
    total: 20,
    visibility: { scope: 'group' },
    createdAt: new Date('2026-01-01T12:00:00Z'),
    ...overrides,
  }
}

export function withMembers(
  extra: Array<{ id: string; userId: string; username: string; role?: string; status?: string }> = []
) {
  setupFetchMock({
    members: {
      members: [
        { id: 'm1', userId: 'u1', username: 'alice', role: 'player', status: 'active' },
        ...extra.map(m => ({
          role: 'player',
          status: 'active',
          ...m,
        })),
      ],
    },
  })
}
