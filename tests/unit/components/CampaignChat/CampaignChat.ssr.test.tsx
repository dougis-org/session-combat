/** @jest-environment node */

// Supersedes the removed CampaignChat.dicePool.ssr.test.tsx: with the docked
// dice panel/trigger gone, the dock shell must still server-render without any
// document / portal-root access.

jest.mock('@/lib/offline/LocalStore', () => ({
  LocalStore: { get: jest.fn(), set: jest.fn(), remove: jest.fn() },
}))

jest.mock('@/lib/hooks/useCampaignStream', () => ({
  useCampaignStream: jest.fn(() => ({ status: 'connecting' })),
}))

jest.mock('@/lib/hooks/useAuth', () => ({
  useAuth: jest.fn(() => ({ user: null, loading: true })),
}))

describe('CampaignChat — SSR safety', () => {
  test('server-rendering the dice-free chat dock does not access document', async () => {
    const { renderToString } = await import('react-dom/server')
    const React = await import('react')
    const { CampaignChat } = await import('@/lib/components/CampaignChat')

    expect(() =>
      renderToString(
        React.createElement(CampaignChat, { campaignId: 'campaign-1', activeSessionId: null }),
      ),
    ).not.toThrow()
  })
})
