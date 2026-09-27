import { renderHook } from '@testing-library/react'
import { useRollSubmission } from '@/lib/dice/useRollSubmission'
import { MAX_DICE_IN_ROLL, MAX_DIE_VALUE, MAX_FORMULA_LENGTH, MAX_TOTAL_MAGNITUDE } from '@/lib/validation/rollSubmission'

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

  it.each<[string, string, number[], number]>([
    ['an oversized formula', 'd'.repeat(MAX_FORMULA_LENGTH + 1), [10], 10],
    ['an oversized rolls array', '1d20', new Array(MAX_DICE_IN_ROLL + 1).fill(1), 10],
    ['a die value above the maximum', 'd%', [MAX_DIE_VALUE + 1], MAX_DIE_VALUE + 1],
    ['a die value below the minimum', '1d20', [0], 0],
    ['a non-integer die value', '1d20', [10.5], 10],
    ['a total above the positive magnitude bound', '1d20', [10], MAX_TOTAL_MAGNITUDE + 1],
    ['a total beyond the negative magnitude bound', '1d20', [10], -(MAX_TOTAL_MAGNITUDE + 1)],
    ['a NaN total', '1d20', [10], NaN],
    ['an infinite total', '1d20', [10], Infinity],
    ['an empty formula', '', [10], 10],
    ['a whitespace-only formula', '   ', [10], 10],
  ])('rejects %s locally without calling fetch', async (_description, formula, rolls, total) => {
    global.fetch = jest.fn() as unknown as typeof fetch
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {})
    try {
      const result = setup()
      const outcome = await result.current.submitRoll(formula, rolls, total, { scope: 'group' })
      expect(outcome).toBe('error')
      expect(global.fetch).not.toHaveBeenCalled()
      expect(warnSpy).toHaveBeenCalledWith(
        '[roll-submission] rejected locally by rollSubmissionSchema',
        expect.any(Array)
      )
    } finally {
      warnSpy.mockRestore()
    }
  })

  it('rejects an invalid visibility.scope locally without calling fetch', async () => {
    global.fetch = jest.fn() as unknown as typeof fetch
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {})
    try {
      const result = setup()
      const outcome = await result.current.submitRoll('1d20', [10], 10, { scope: 'not-a-real-scope' } as unknown as Parameters<typeof result.current.submitRoll>[3])
      expect(outcome).toBe('error')
      expect(global.fetch).not.toHaveBeenCalled()
      expect(warnSpy).toHaveBeenCalledWith(
        '[roll-submission] rejected locally by rollSubmissionSchema',
        expect.any(Array)
      )
    } finally {
      warnSpy.mockRestore()
    }
  })

  it('still submits a legitimate negative total (penalty roll) at the negative magnitude boundary', async () => {
    global.fetch = jest.fn().mockResolvedValue({ status: 201 }) as unknown as typeof fetch
    const result = setup()
    const outcome = await result.current.submitRoll('1d20', [10], -MAX_TOTAL_MAGNITUDE, { scope: 'group' })
    expect(outcome).toBe('success')
    expect(global.fetch).toHaveBeenCalledWith(
      `/api/campaigns/${CAMPAIGN_ID}/rolls`,
      expect.objectContaining({
        body: JSON.stringify({ formula: '1d20', rolls: [10], total: -MAX_TOTAL_MAGNITUDE, visibility: { scope: 'group' } }),
      })
    )
  })

  it('still submits a maximum-size pool roll payload', async () => {
    global.fetch = jest.fn().mockResolvedValue({ status: 201 }) as unknown as typeof fetch
    const result = setup()
    const maxRolls = new Array(MAX_DICE_IN_ROLL).fill(MAX_DIE_VALUE)
    const formula = `${MAX_DICE_IN_ROLL}d${MAX_DIE_VALUE}`
    const total = MAX_DICE_IN_ROLL * MAX_DIE_VALUE
    const outcome = await result.current.submitRoll(formula, maxRolls, total, { scope: 'group' })
    expect(outcome).toBe('success')
    expect(global.fetch).toHaveBeenCalledWith(
      `/api/campaigns/${CAMPAIGN_ID}/rolls`,
      expect.objectContaining({
        body: JSON.stringify({ formula, rolls: maxRolls, total, visibility: { scope: 'group' } }),
      })
    )
  })

  it('still submits a d% percentile roll payload', async () => {
    global.fetch = jest.fn().mockResolvedValue({ status: 201 }) as unknown as typeof fetch
    const result = setup()
    const outcome = await result.current.submitRoll('d%', [42], 42, { scope: 'group' })
    expect(outcome).toBe('success')
    expect(global.fetch).toHaveBeenCalledWith(
      `/api/campaigns/${CAMPAIGN_ID}/rolls`,
      expect.objectContaining({
        body: JSON.stringify({ formula: 'd%', rolls: [42], total: 42, visibility: { scope: 'group' } }),
      })
    )
  })
})
