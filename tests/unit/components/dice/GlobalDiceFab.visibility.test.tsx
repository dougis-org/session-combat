import { render, screen } from '@testing-library/react'
import { GlobalDiceFab } from '@/lib/components/GlobalDiceFab'
import { mockAuthed, mockUnauthed } from './__helpers__/globalDiceFabHarness'

jest.mock('@/lib/hooks/useAuth', () => ({
  useAuth: jest.fn(),
}))

jest.mock('@/lib/utils/dice', () => ({
  ...jest.requireActual('@/lib/utils/dice'),
  rollDicePool: jest.fn(),
}))

const runMock = jest.fn().mockResolvedValue(true)
const teardownMock = jest.fn()
const useDiceAnimationMock = jest.fn(() => ({ status: 'idle', run: runMock, teardown: teardownMock }))
jest.mock('@/lib/dice/useDiceAnimation', () => ({
  ...jest.requireActual('@/lib/dice/useDiceAnimation'),
  useDiceAnimation: (...args: unknown[]) => useDiceAnimationMock(...(args as [])),
}))

describe('GlobalDiceFab — visibility', () => {
  it('renders for an authenticated user with an accessible name matching roll/dice', () => {
    mockAuthed()
    render(<GlobalDiceFab />)
    expect(screen.getByRole('button', { name: /roll|dice/i })).toBeInTheDocument()
  })

  it('is absent for an unauthenticated user', () => {
    mockUnauthed()
    const { container } = render(<GlobalDiceFab />)
    expect(container).toBeEmptyDOMElement()
  })
})
