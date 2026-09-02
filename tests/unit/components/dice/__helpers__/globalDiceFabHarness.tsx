import { screen } from '@testing-library/react'
import type userEvent from '@testing-library/user-event'
import { rollDicePool } from '@/lib/utils/dice'
import { LocalStore } from '@/lib/offline/LocalStore'
import { resetDiceSessionBridge } from '@/lib/dice/diceSessionBridge'

/**
 * Shared harness for the GlobalDiceFab spec family (see tests/unit/components/dice/*.test.tsx).
 *
 * Option B from issue #654: each spec file keeps its own three `jest.mock()` calls
 * (they must be hoisted per file) plus the `runMock` / `teardownMock` /
 * `useDiceAnimationMock` scaffold it needs. Everything else — the auth/fetch/matchMedia
 * fakes and the per-test reset hooks — lives here and is imported by each file.
 */

export const mockedUseAuth = jest.requireMock('@/lib/hooks/useAuth').useAuth as jest.Mock
export const mockedRollDicePool = rollDicePool as jest.Mock

const originalFetch = global.fetch

export function mockAuthed() {
  mockedUseAuth.mockReturnValue({
    user: { userId: 'user-1', email: 'a@b.com', username: 'tester' },
    loading: false,
  })
}

export function mockUnauthed() {
  mockedUseAuth.mockReturnValue({ user: null, loading: false })
}

export function mockMatchMedia(reduceMotion = false) {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    configurable: true,
    value: jest.fn().mockImplementation((query: string) => ({
      matches: query.includes('prefers-reduced-motion') ? reduceMotion : false,
      media: query,
      onchange: null,
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      addListener: jest.fn(),
      removeListener: jest.fn(),
      dispatchEvent: jest.fn(),
    })),
  })
}

export function mockRollPost(result: { status: 201 } | { status: 409 | 500 } | { throws: true }) {
  global.fetch = jest.fn().mockImplementation(() => {
    if ('throws' in result) return Promise.reject(new Error('network down'))
    if (result.status === 201) {
      return Promise.resolve({ status: 201, json: () => Promise.resolve({ id: 'roll-sent' }) })
    }
    return Promise.resolve({ status: result.status, json: () => Promise.resolve({}) })
  }) as unknown as typeof fetch
}

export async function open(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole('button', { name: /roll|dice/i }))
}

beforeEach(() => {
  jest.clearAllMocks()
  LocalStore.clear()
  mockMatchMedia(false)
  resetDiceSessionBridge()
  mockedRollDicePool.mockReturnValue([{ sides: 20, value: 14 }])
})

afterEach(() => {
  resetDiceSessionBridge()
  global.fetch = originalFetch
})
