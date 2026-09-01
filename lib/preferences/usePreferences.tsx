'use client'

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react'
import { LocalStore } from '@/lib/offline/LocalStore'
import {
  DEFAULT_PREFERENCES,
  DeepPartial,
  PreferenceValues,
  resolvePreferences,
  sparseKnownValues,
} from '@/lib/preferences/schema'

/** Single LocalStore mirror key (under the `sessionCombat:v1:` prefix). Not a secret. */
export const PREFERENCES_MIRROR_KEY = 'preferences' // nosemgrep
const FULL_MIRROR_KEY = `sessionCombat:v1:${PREFERENCES_MIRROR_KEY}` // nosemgrep
const DEBOUNCE_MS = 600
const ENDPOINT = '/api/me/preferences'

export type PreferencePath =
  | 'dice.sendToChat'
  | 'dice.disableAnimation'
  | 'dice.color'
  | 'chat.pinned'
  | 'chat.size'

/** Legacy per-hook keys read exactly once, during first-login adoption. */
const LEGACY_KEYS: ReadonlyArray<{ legacy: string; path: PreferencePath }> = [
  { legacy: 'dice-fab-send-to-chat', path: 'dice.sendToChat' },
  { legacy: 'dice-fab-disable-animation', path: 'dice.disableAnimation' },
  { legacy: 'campaign-chat-pin', path: 'chat.pinned' },
  { legacy: 'campaign-chat-size', path: 'chat.size' },
]

function safeGet<T>(key: string): T | null {
  try {
    return LocalStore.get<T>(key)
  } catch (err) {
    console.warn(`[preferences] localStorage read failed for "${key}"`, err)
    return null
  }
}

function safeSet(key: string, value: unknown): void {
  try {
    LocalStore.set(key, value)
  } catch (err) {
    console.warn(`[preferences] localStorage write failed for "${key}"`, err)
  }
}

const splitPath = (path: PreferencePath) =>
  path.split('.') as [keyof PreferenceValues, string]

function withPath(
  base: PreferenceValues,
  path: PreferencePath,
  value: unknown,
): PreferenceValues {
  const [domain, key] = splitPath(path)
  return { ...base, [domain]: { ...base[domain], [key]: value } }
}

function mergeDelta(
  target: DeepPartial<PreferenceValues>,
  path: PreferencePath,
  value: unknown,
): void {
  const [domain, key] = splitPath(path)
  if (target[domain] === undefined) target[domain] = {} as Record<string, unknown>
  ;(target[domain] as Record<string, unknown>)[key] = value
}

/** Every known preference path — used to fold one sparse delta over another per-key. */
const ALL_PATHS: readonly PreferencePath[] = [
  'dice.sendToChat',
  'dice.disableAnimation',
  'dice.color',
  'chat.pinned',
  'chat.size',
]

/**
 * Deep-merge `incoming` onto `base`, key by key. A shallow `{ ...base, ...incoming }`
 * would replace a whole domain object (`dice`, `chat`) and silently drop sibling keys —
 * e.g. re-queuing a failed `dice.color` write would wipe a pending `dice.sendToChat`.
 * `base` wins only where `incoming` has no value for that exact path.
 */
function foldDelta(
  base: DeepPartial<PreferenceValues>,
  incoming: DeepPartial<PreferenceValues>,
): DeepPartial<PreferenceValues> {
  const out: DeepPartial<PreferenceValues> = {}
  for (const path of ALL_PATHS) {
    const fromIncoming = getAt(incoming, path)
    if (fromIncoming !== undefined) {
      mergeDelta(out, path, fromIncoming)
      continue
    }
    const fromBase = getAt(base, path)
    if (fromBase !== undefined) mergeDelta(out, path, fromBase)
  }
  return out
}

function getAt(source: DeepPartial<PreferenceValues>, path: PreferencePath): unknown {
  const [domain, key] = splitPath(path)
  const sub = source[domain] as Record<string, unknown> | undefined
  return sub ? sub[key] : undefined
}

const isEmptyDelta = (d: DeepPartial<PreferenceValues>): boolean =>
  Object.keys(d).length === 0

interface PreferencesContextValue {
  preferences: PreferenceValues
  setPreference: (path: PreferencePath, value: unknown) => void
  ready: boolean
}

const PreferencesContext = createContext<PreferencesContextValue | null>(null)

export function PreferencesProvider({
  userId = null,
  children,
}: {
  /** Authenticated user id, or `null` when logged out. Supplied by the auth boundary. */
  userId?: string | null
  children: React.ReactNode
}) {
  // Start from defaults so the server-rendered and first client-rendered markup
  // match; the mount effect below adopts the localStorage mirror before paint.
  const [preferences, setPreferences] = useState<PreferenceValues>(DEFAULT_PREFERENCES)
  const [ready, setReady] = useState(false)

  // Unsynced deltas awaiting a PATCH; survives failed requests so they retry.
  const pendingRef = useRef<DeepPartial<PreferenceValues>>({})
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  // Kept in sync by every code path that calls setPreferences below (never during render).
  const prefsRef = useRef(preferences)
  // Previous authenticated user id, to detect a user switch on this browser.
  const prevUserIdRef = useRef<string | null>(null)

  const flush = useCallback(async () => {
    if (!userId || isEmptyDelta(pendingRef.current)) return
    const body = pendingRef.current
    pendingRef.current = {}
    try {
      const res = await fetch(ENDPOINT, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (res.ok) return
      if (res.status >= 400 && res.status < 500) {
        // Permanent: this body will never be accepted. Drop it rather than
        // re-queue forever (which would also poison every later flush).
        console.error(
          `[preferences] server rejected preference update (${res.status}); discarding`,
          body,
        )
        return
      }
      throw new Error(`PATCH ${ENDPOINT} → ${res.status}`)
    } catch (err) {
      console.warn('[preferences] failed to persist preference change; will retry', err)
      // Re-queue (deep, per-key) so the next setPreference / hydration retries
      // without clobbering deltas queued while this request was in flight.
      pendingRef.current = foldDelta(body, pendingRef.current)
    }
  }, [userId])

  // Always points at the latest `flush` so the unmount effect can stay `[]`-deps
  // (fire on real unmount only, not on every `flush` identity change / user switch).
  const flushRef = useRef(flush)
  flushRef.current = flush

  const scheduleFlush = useCallback(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      void flush()
    }, DEBOUNCE_MS)
  }, [flush])

  const setPreference = useCallback(
    (path: PreferencePath, value: unknown) => {
      const next = withPath(prefsRef.current, path, value)
      prefsRef.current = next
      setPreferences(next)
      safeSet(PREFERENCES_MIRROR_KEY, next)
      if (userId) {
        mergeDelta(pendingRef.current, path, value)
        scheduleFlush()
      }
    },
    [userId, scheduleFlush],
  )

  // ── Hydrate once per authenticated session ──
  useEffect(() => {
    let cancelled = false

    const prevUserId = prevUserIdRef.current
    prevUserIdRef.current = userId
    // A different authenticated user on this browser (e.g. a silent session
    // expiry, where logout's LocalStore.clear() never ran) — discard the previous
    // user's mirror so it cannot be adopted onto this account.
    const switchedUser = prevUserId !== null && prevUserId !== userId
    if (switchedUser) {
      safeSet(PREFERENCES_MIRROR_KEY, resolvePreferences(null))
      pendingRef.current = {}
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }

    // Client-only: adopt the mirror now that localStorage is readable. The first
    // render used DEFAULT_PREFERENCES so SSR and hydration markup agree.
    const mirrored = switchedUser
      ? resolvePreferences(null)
      : resolvePreferences(safeGet(PREFERENCES_MIRROR_KEY))
    setPreferences(mirrored)
    prefsRef.current = mirrored

    if (!userId) {
      setReady(true)
      return
    }

    setReady(false)
    ;(async () => {
      const mirrorSparse = sparseKnownValues(safeGet(PREFERENCES_MIRROR_KEY))
      const legacySparse: DeepPartial<PreferenceValues> = {}
      for (const { legacy, path } of LEGACY_KEYS) {
        if (getAt(mirrorSparse, path) !== undefined) continue
        const raw = safeGet<unknown>(legacy)
        const adopted = sparseKnownValues(withPathObject(path, raw))
        const v = getAt(adopted, path)
        if (v !== undefined) mergeDelta(legacySparse, path, v)
      }

      let serverValues = resolvePreferences(mirrorSparse)
      let serverStored: DeepPartial<PreferenceValues> = {}
      try {
        const res = await fetch(ENDPOINT)
        if (!res.ok) throw new Error(`GET ${ENDPOINT} → ${res.status}`)
        const data = (await res.json()) as {
          values: unknown
          stored?: unknown
        }
        serverValues = resolvePreferences(data.values)
        serverStored = sparseKnownValues(data.stored ?? {})
      } catch (err) {
        console.warn('[preferences] hydration fetch failed; using local mirror', err)
        if (cancelled) return
        setPreferences(serverValues)
        prefsRef.current = serverValues
        setReady(true)
        void flush()
        return
      }
      if (cancelled) return

      // Reconcile: server wins where it has a stored delta; otherwise adopt a
      // non-default local value (mirror or legacy) and seed the server once.
      const adoption: DeepPartial<PreferenceValues> = {}
      let reconciled = serverValues
      const localSparse: DeepPartial<PreferenceValues> = {
        ...legacySparse,
      }
      for (const { path } of LEGACY_KEYS) {
        const fromMirror = getAt(mirrorSparse, path)
        if (fromMirror !== undefined) mergeDelta(localSparse, path, fromMirror)
      }

      for (const { path } of LEGACY_KEYS) {
        if (getAt(serverStored, path) !== undefined) continue
        const local = getAt(localSparse, path)
        if (local === undefined) continue
        if (
          JSON.stringify(local) ===
          JSON.stringify(getAt(DEFAULT_PREFERENCES as DeepPartial<PreferenceValues>, path))
        ) {
          continue
        }
        reconciled = withPath(reconciled, path, local)
        mergeDelta(adoption, path, local)
      }

      // Anything the user changed while the GET was in flight is newer than the
      // server snapshot — re-apply it on top of the reconciled result.
      let applied = reconciled
      for (const path of ALL_PATHS) {
        const pending = getAt(pendingRef.current, path)
        if (pending !== undefined) applied = withPath(applied, path, pending)
      }

      safeSet(PREFERENCES_MIRROR_KEY, applied)
      setPreferences(applied)
      prefsRef.current = applied
      setReady(true)

      if (!isEmptyDelta(adoption)) {
        pendingRef.current = foldDelta(adoption, pendingRef.current)
      }
      void flush()
    })()

    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId])

  // ── Cross-tab sync via the storage mirror (no PATCH from the receiving tab) ──
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key !== FULL_MIRROR_KEY) return
      const next = resolvePreferences(safeGet(PREFERENCES_MIRROR_KEY))
      if (JSON.stringify(next) === JSON.stringify(prefsRef.current)) return
      prefsRef.current = next
      setPreferences(next)
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  // Flush any pending delta on unmount (real unmount only — see flushRef).
  useEffect(
    () => () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
      void flushRef.current()
    },
    [],
  )

  return (
    <PreferencesContext.Provider value={{ preferences, setPreference, ready }}>
      {children}
    </PreferencesContext.Provider>
  )
}

function withPathObject(path: PreferencePath, value: unknown): DeepPartial<PreferenceValues> {
  const out: DeepPartial<PreferenceValues> = {}
  mergeDelta(out, path, value)
  return out
}

// ── Local-only fallback for use outside a <PreferencesProvider> ──
// Same behaviour as the logged-out provider path: reads/writes the LocalStore mirror,
// no server sync. Keeps preference-bound components working when no provider is mounted.
// Instance-local state (no module singleton) so it stays test-isolated.
function useFallbackPreferences(): PreferencesContextValue {
  const [preferences, setPreferencesState] = useState<PreferenceValues>(() =>
    resolvePreferences(safeGet(PREFERENCES_MIRROR_KEY)),
  )
  const ref = useRef(preferences)

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key !== FULL_MIRROR_KEY) return
      const next = resolvePreferences(safeGet(PREFERENCES_MIRROR_KEY))
      if (JSON.stringify(next) !== JSON.stringify(ref.current)) {
        ref.current = next
        setPreferencesState(next)
      }
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  const setPreference = useCallback((path: PreferencePath, value: unknown) => {
    const next = withPath(ref.current, path, value)
    ref.current = next
    setPreferencesState(next)
    safeSet(PREFERENCES_MIRROR_KEY, next)
  }, [])

  return { preferences, setPreference, ready: true }
}

/** Test-only no-op retained for call sites; instance-local fallback needs no reset. */
export function __resetFallbackPreferencesForTests(): void {}

export function usePreferences(): PreferencesContextValue {
  const ctx = useContext(PreferencesContext)
  const fallback = useFallbackPreferences()
  return ctx ?? fallback
}
