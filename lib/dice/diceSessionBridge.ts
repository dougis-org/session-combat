import type { RollVisibility } from '@/lib/types'

export interface DicePresence {
  campaignId: string
  sessionId: string
}

export interface RollRequestPayload {
  campaignId: string
  sessionId: string
  roll: {
    formula: string
    rolls: number[]
    total: number
    visibility: RollVisibility
  }
}

type PresenceListener = (presence: DicePresence | null) => void
type RollRequestListener = (payload: RollRequestPayload) => void

let currentPresence: DicePresence | null = null
const presenceListeners = new Set<PresenceListener>()
const rollRequestListeners = new Set<RollRequestListener>()

export function announcePresence(presence: DicePresence): void {
  currentPresence = presence
  presenceListeners.forEach(cb => cb(currentPresence))
}

export function clearPresence(): void {
  currentPresence = null
  presenceListeners.forEach(cb => cb(null))
}

export function onPresenceChange(cb: PresenceListener): () => void {
  presenceListeners.add(cb)
  cb(currentPresence)
  return () => { presenceListeners.delete(cb) }
}

export function requestRoll(payload: RollRequestPayload): void {
  rollRequestListeners.forEach(cb => cb(payload))
}

export function onRollRequested(cb: RollRequestListener): () => void {
  rollRequestListeners.add(cb)
  return () => { rollRequestListeners.delete(cb) }
}

export function resetDiceSessionBridge(): void {
  currentPresence = null
  presenceListeners.clear()
  rollRequestListeners.clear()
}
