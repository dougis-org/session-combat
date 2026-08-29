export interface DicePresence {
  campaignId: string
  sessionId: string
}

type PresenceListener = (presence: DicePresence | null) => void

// Single active session/presence is intentional: this bridge assumes at most one
// CampaignChat instance is mounted app-wide at a time (the app has one session-chat
// surface). If that ever changes, presence delivery needs rethinking.
let currentPresence: DicePresence | null = null
const presenceListeners = new Set<PresenceListener>()

const MAX_ID_LENGTH = 200

function isNonEmptyBoundedString(value: unknown, maxLength: number): value is string {
  return typeof value === 'string' && value.length > 0 && value.length <= maxLength
}

function isValidPresence(value: unknown): value is DicePresence {
  if (!value || typeof value !== 'object') return false
  const v = value as Record<string, unknown>
  return isNonEmptyBoundedString(v.campaignId, MAX_ID_LENGTH) && isNonEmptyBoundedString(v.sessionId, MAX_ID_LENGTH)
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

export function resetDiceSessionBridge(): void {
  currentPresence = null
  presenceListeners.clear()
}
