import { render, screen, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { CampaignChat } from '@/lib/components/CampaignChat'
import type { CampaignStreamEvent } from '@/lib/types'

export const CAMPAIGN_ID = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'

export const sharedTestState: {
  capturedOnEvent: ((e: CampaignStreamEvent) => void) | null
  fetchSpy: jest.Mock
} = {
  capturedOnEvent: null,
  fetchSpy: jest.fn(),
}

const originalFetch = global.fetch

export function setupFetchMock(overrides?: Record<string, unknown>) {
  const spy = jest.fn().mockImplementation((url: string, options?: RequestInit) => {
    if (url.includes('/attachments')) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(overrides?.attachments ?? { attachmentId: 'att-test' }),
      })
    }
    if (url.includes('/members')) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(overrides?.members ?? { members: [] }),
      })
    }
    if (url.includes('/messages')) {
      if (options?.method === 'POST') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(
            overrides?.sceneMessage ?? {
              id: 'scene-1',
              kind: 'scene',
              text: '',
              attachmentId: 'att-test',
              visibility: { scope: 'group' },
              campaignId: CAMPAIGN_ID,
              senderId: 'user-1',
              senderName: 'DM',
              createdAt: new Date().toISOString(),
            }
          ),
        })
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(overrides?.messages ?? { messages: [] }),
      })
    }
    return Promise.resolve({ ok: true, json: () => Promise.resolve({}) })
  })
  sharedTestState.fetchSpy = spy
  global.fetch = spy as unknown as typeof global.fetch
}

export function restoreFetch() {
  global.fetch = originalFetch
}

export async function openDock() {
  const user = userEvent.setup()
  render(<CampaignChat campaignId={CAMPAIGN_ID} />)
  await user.click(screen.getByRole('button', { name: /chat/i }))
  return user
}

export function fireMsg(
  overrides: Partial<{
    id: string
    senderId: string
    senderName: string
    text: string
    visibility: { scope: string; toUserId?: string }
    createdAt: string
  }> = {}
) {
  const visibility = overrides.visibility ?? { scope: 'group' }
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
        visibility: visibility as any,
        createdAt: overrides.createdAt ?? new Date().toISOString(),
      } as any,
    })
  })
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
