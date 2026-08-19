/** @jest-environment node */

jest.mock('@/lib/offline/LocalStore', () => ({
  LocalStore: { get: jest.fn(), set: jest.fn(), remove: jest.fn() },
}))

jest.mock('@/lib/hooks/useCampaignStream', () => ({
  useCampaignStream: jest.fn(() => ({ status: 'connecting' })),
}))

jest.mock('@/lib/hooks/useAuth', () => ({
  useAuth: jest.fn(() => ({ user: null, loading: true })),
}))

describe('CampaignChat dice pop-out — SSR safety', () => {
  test('server-rendering the chat dock does not access document', async () => {
    const { renderToString } = await import('react-dom/server')
    const React = await import('react')
    const { CampaignChat } = await import('@/lib/components/CampaignChat')

    expect(() =>
      renderToString(React.createElement(CampaignChat, { campaignId: 'campaign-1' }))
    ).not.toThrow()
  })
})
