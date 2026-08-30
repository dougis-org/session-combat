'use client'

import { useEffect, useState } from 'react'
import { useDicePoolState } from '@/lib/dice/useDicePoolState'
import { useRollSubmission } from '@/lib/dice/useRollSubmission'

interface UseCampaignDiceArgs {
  campaignId: string
  activeSessionId: string | null
  streamStatus: 'connecting' | 'open' | 'error'
  triggerRef: React.RefObject<HTMLButtonElement | null>
  panelRef: React.RefObject<HTMLDivElement | null>
}

// Wires the shared dice-pool/submission hooks to the chat-docked panel's
// trigger-disable rule (tied to this component's own SSE connection status).
export function useCampaignDice({ campaignId, activeSessionId, streamStatus, triggerRef, panelRef }: UseCampaignDiceArgs) {
  const { submitRoll } = useRollSubmission(campaignId)
  const isTriggerDisabled = activeSessionId !== null ? streamStatus !== 'open' : true
  const [isRolling, setIsRolling] = useState(false)
  const [rollError, setRollError] = useState<string | null>(null)
  const dicePool = useDicePoolState({ triggerRef, panelRef })

  useEffect(() => {
    if (activeSessionId === null) dicePool.setIsOpen(false)
  // dicePool.setIsOpen is a stable state setter; the rest of dicePool isn't needed here.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSessionId, dicePool.setIsOpen])

  async function handleDiceRoll() {
    if (dicePool.poolTotal === 0 || isRolling) return
    setIsRolling(true)
    setRollError(null)
    try {
      const built = dicePool.buildRoll()
      const result = await submitRoll(built.formula, built.rolls, built.total, dicePool.visibility)
      if (result === 'success') {
        dicePool.reset()
      } else if (result === 'conflict') {
        setRollError('No active session')
      } else {
        setRollError('Roll failed, try again')
      }
    } catch {
      setRollError('Roll failed, try again')
    } finally {
      setIsRolling(false)
    }
  }

  async function handlePercentileRoll() {
    if (isRolling) return
    setIsRolling(true)
    setRollError(null)
    try {
      const built = dicePool.buildPercentileRoll()
      const result = await submitRoll(built.formula, built.rolls, built.total, dicePool.visibility)
      if (result === 'success') {
        // Percentile is not a pooled roll — leave the staged pool untouched.
      } else if (result === 'conflict') {
        setRollError('No active session')
      } else {
        setRollError('Roll failed, try again')
      }
    } catch {
      setRollError('Roll failed, try again')
    } finally {
      setIsRolling(false)
    }
  }

  return { dicePool, isTriggerDisabled, isRolling, rollError, handleDiceRoll, handlePercentileRoll }
}
