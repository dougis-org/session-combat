'use client'

import type { RollVisibility } from '@/lib/types'
import { rollSubmissionSchema } from '@/lib/validation/rollSubmission'

export type RollSubmitResult = 'success' | 'conflict' | 'error'

export function useRollSubmission(campaignId: string) {
  async function submitRoll(formula: string, rolls: number[], total: number, visibility: RollVisibility): Promise<RollSubmitResult> {
    const parsed = rollSubmissionSchema.safeParse({ formula, rolls, total, visibility })
    if (!parsed.success) {
      // Existing client logging convention: plain console.* (see useDiceAnimation.ts).
      // Return contract is unchanged (still collapses to 'error') — this is a
      // debuggability-only side channel, not a new error type.
      console.warn('[roll-submission] rejected locally by rollSubmissionSchema', parsed.error.issues)
      return 'error'
    }
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
