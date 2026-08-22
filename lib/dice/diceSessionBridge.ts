import type { RollVisibility } from '@/lib/types'

export interface DicePresence {
  campaignId: string
  sessionId: string
}

export type RollOutcome = {
  formula: string
  rolls: number[]
  total: number
  visibility: RollVisibility
}

export type RollRequestResult = 'success' | 'conflict' | 'error' | 'ignored'

export interface RollRequestPayload {
  campaignId: string
  sessionId: string
  roll: RollOutcome
  /**
   * Optional ack, invoked by whichever CampaignChat instance (if any) receives this
   * request — 'ignored' if it didn't match that instance's own campaign/session,
   * otherwise the outcome of the underlying roll submission. Never invoked more than
   * once per request; not invoked at all if no CampaignChat instance is mounted.
   */
  onResult?: (result: RollRequestResult) => void
}

type PresenceListener = (presence: DicePresence | null) => void
type RollRequestListener = (payload: RollRequestPayload) => void

// Single active session/presence is intentional: this bridge assumes at most one
// CampaignChat instance is mounted app-wide at a time (the app has one session-chat
// surface). If that ever changes, presence and roll-request delivery need rethinking.
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

function isValidPresence(value: unknown): value is DicePresence {
  if (!value || typeof value !== 'object') return false
  const v = value as Record<string, unknown>
  return isNonEmptyBoundedString(v.campaignId, MAX_ID_LENGTH) && isNonEmptyBoundedString(v.sessionId, MAX_ID_LENGTH)
}

function isValidRollRequestPayload(payload: unknown): payload is RollRequestPayload {
  if (!payload || typeof payload !== 'object') return false
  const p = payload as Record<string, unknown>
  if (!isNonEmptyBoundedString(p.campaignId, MAX_ID_LENGTH)) return false
  if (!isNonEmptyBoundedString(p.sessionId, MAX_ID_LENGTH)) return false
  if (p.onResult !== undefined && typeof p.onResult !== 'function') return false

  const roll = p.roll as Record<string, unknown> | undefined
  if (!roll || typeof roll !== 'object') return false
  if (!isNonEmptyBoundedString(roll.formula, MAX_FORMULA_LENGTH)) return false
  if (!Array.isArray(roll.rolls) || roll.rolls.length === 0 || roll.rolls.length > MAX_DICE_IN_ROLL) return false
  if (!roll.rolls.every(v => typeof v === 'number' && Number.isFinite(v) && v >= 0 && v <= MAX_DIE_VALUE)) return false
  if (typeof roll.total !== 'number' || !Number.isFinite(roll.total) || Math.abs(roll.total) > MAX_TOTAL_MAGNITUDE) return false
  const visibility = roll.visibility as { scope?: unknown } | undefined
  if (!visibility || (visibility.scope !== 'group' && visibility.scope !== 'dm-only')) return false

  return true
}

export function announcePresence(presence: DicePresence): void {
  if (!isValidPresence(presence)) return
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
  if (!isValidRollRequestPayload(payload)) {
    (payload as Partial<RollRequestPayload>)?.onResult?.('error')
    return
  }
  rollRequestListeners.forEach(cb => {
    try {
      cb(payload)
    } catch (err) {
      console.error('diceSessionBridge: roll-request listener threw', err)
    }
  })
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
