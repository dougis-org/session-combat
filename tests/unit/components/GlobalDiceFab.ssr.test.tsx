/** @jest-environment node */

jest.mock('@/lib/hooks/useAuth', () => ({
  useAuth: jest.fn(() => ({ user: null, loading: true })),
}))

describe('GlobalDiceFab — SSR safety', () => {
  test('server-rendering the fab does not access document', async () => {
    const { renderToString } = await import('react-dom/server')
    const React = await import('react')
    const { GlobalDiceFab } = await import('@/lib/components/GlobalDiceFab')

    expect(() =>
      renderToString(React.createElement(GlobalDiceFab))
    ).not.toThrow()
  })
})
