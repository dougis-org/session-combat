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

// Bridge-boundary sanity bounds. This is defense-in-depth, not a trust boundary — the
// server route (app/api/campaigns/[id]/rolls/route.ts) remains the sole authority and
// re-validates every field regardless of caller. These bounds only stop an obviously
// malformed or absurd payload from reaching a subscriber at all.
const MAX_ID_LENGTH = 200
const MAX_FORMULA_LENGTH = 200
const MAX_DICE_IN_ROLL = 120
const MAX_DIE_VALUE = 100
const MAX_TOTAL_MAGNITUDE = 100_000

function isNonEmptyBoundedString(value: unknown, maxLength: number): value is string {
  return typeof value === 'string' && value.length > 0 && value.length <= maxLength
}

function isValidRollRequestPayload(payload: RollRequestPayload): boolean {
  if (!isNonEmptyBoundedString(payload?.campaignId, MAX_ID_LENGTH)) return false
  if (!isNonEmptyBoundedString(payload?.sessionId, MAX_ID_LENGTH)) return false

  const roll = payload?.roll
  if (!roll || typeof roll !== 'object') return false
  if (!isNonEmptyBoundedString(roll.formula, MAX_FORMULA_LENGTH)) return false
  if (!Array.isArray(roll.rolls) || roll.rolls.length === 0 || roll.rolls.length > MAX_DICE_IN_ROLL) return false
  if (!roll.rolls.every(v => typeof v === 'number' && Number.isFinite(v) && v >= 0 && v <= MAX_DIE_VALUE)) return false
  if (typeof roll.total !== 'number' || !Number.isFinite(roll.total) || Math.abs(roll.total) > MAX_TOTAL_MAGNITUDE) return false
  if (!roll.visibility || (roll.visibility.scope !== 'group' && roll.visibility.scope !== 'dm-only')) return false

  return true
}

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
  if (!isValidRollRequestPayload(payload)) return
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
