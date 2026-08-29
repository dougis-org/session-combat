import { renderHook } from '@testing-library/react'
import { useRollSubmission } from '@/lib/dice/useRollSubmission'

const CAMPAIGN_ID = 'campaign-1'
const originalFetch = global.fetch

afterEach(() => {
  global.fetch = originalFetch
})

function setup() {
  return renderHook(() => useRollSubmission(CAMPAIGN_ID)).result
}

describe('useRollSubmission', () => {
  it('201 response resolves to success', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      status: 201,
      json: () => Promise.resolve({ id: 'roll-1' }),
    }) as unknown as typeof fetch

    const result = setup()
    const outcome = await result.current.submitRoll('1d20', [10], 10, { scope: 'group' })
    expect(outcome).toBe('success')
    expect(global.fetch).toHaveBeenCalledWith(
      `/api/campaigns/${CAMPAIGN_ID}/rolls`,
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ formula: '1d20', rolls: [10], total: 10, visibility: { scope: 'group' } }),
      })
    )
  })

  it('a bodyless 201 response still resolves to success (response body is never parsed)', async () => {
    const jsonSpy = jest.fn()
    global.fetch = jest.fn().mockResolvedValue({ status: 201, json: jsonSpy }) as unknown as typeof fetch
    const result = setup()
    const outcome = await result.current.submitRoll('1d20', [10], 10, { scope: 'group' })
    expect(outcome).toBe('success')
    expect(jsonSpy).not.toHaveBeenCalled()
  })

  it('URL-encodes the campaign id when building the request path', async () => {
    global.fetch = jest.fn().mockResolvedValue({ status: 201 }) as unknown as typeof fetch
    const { result } = renderHook(() => useRollSubmission('camp/with spaces'))
    await result.current.submitRoll('1d20', [10], 10, { scope: 'group' })
    expect(global.fetch).toHaveBeenCalledWith(
      `/api/campaigns/${encodeURIComponent('camp/with spaces')}/rolls`,
      expect.anything()
    )
  })

  it('409 response resolves to conflict', async () => {
    global.fetch = jest.fn().mockResolvedValue({ status: 409, json: () => Promise.resolve({}) }) as unknown as typeof fetch
    const result = setup()
    expect(await result.current.submitRoll('1d20', [10], 10, { scope: 'group' })).toBe('conflict')
  })

  it('other non-2xx status resolves to error', async () => {
    global.fetch = jest.fn().mockResolvedValue({ status: 500, json: () => Promise.resolve({}) }) as unknown as typeof fetch
    const result = setup()
    expect(await result.current.submitRoll('1d20', [10], 10, { scope: 'group' })).toBe('error')
  })

  it('a thrown network error resolves to error', async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error('network down')) as unknown as typeof fetch
    const result = setup()
    expect(await result.current.submitRoll('1d20', [10], 10, { scope: 'group' })).toBe('error')
  })
})
