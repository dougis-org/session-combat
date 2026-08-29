'use client'

import type { RollVisibility } from '@/lib/types'

export type RollSubmitResult = 'success' | 'conflict' | 'error'

export function useRollSubmission(campaignId: string) {
  async function submitRoll(formula: string, rolls: number[], total: number, visibility: RollVisibility): Promise<RollSubmitResult> {
    try {
      const res = await fetch(`/api/campaigns/${encodeURIComponent(campaignId)}/rolls`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ formula, rolls, total, visibility }),
      })
      if (res.status === 201) return 'success'
      if (res.status === 409) return 'conflict'
      return 'error'
    } catch {
      return 'error'
    }
  }

  return { submitRoll }
}
