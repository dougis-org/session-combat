'use client'

import { useCallback, useSyncExternalStore } from 'react'
import { usePreferences } from '@/lib/preferences/usePreferences'

const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)'

/** Reads `prefers-reduced-motion` defensively; false when unavailable (SSR / no matchMedia). */
function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false
  try {
    return window.matchMedia(REDUCED_MOTION_QUERY).matches
  } catch {
    return false
  }
}

/** `useSyncExternalStore` subscribe fn for the reduced-motion media query. */
function subscribeReducedMotion(onChange: () => void): () => void {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return () => {}
  const mq = window.matchMedia(REDUCED_MOTION_QUERY)
  mq.addEventListener('change', onChange)
  return () => mq.removeEventListener('change', onChange)
}

export interface DiceFabPreferences {
  /** Whether a roll should auto-submit to session chat (when a session is present). */
  sendToChat: boolean
  setSendToChat: (value: boolean) => void
  /** Resolved value: explicit stored choice if any, otherwise `prefers-reduced-motion`. */
  disableAnimation: boolean
  /** The raw stored tri-state: `true | false` once chosen, `null` while never chosen. */
  disableAnimationChoice: boolean | null
  setDisableAnimation: (value: boolean) => void
}

/**
 * Persisted dice-fab preferences. `sendToChat` and `disableAnimation` are backed by the
 * shared preferences provider (`usePreferences`), so they sync across tabs/devices for
 * authenticated users. `disableAnimation` remains tri-state so "never chosen" falls back to
 * `prefers-reduced-motion`; the first explicit toggle wins from then on even if the media
 * query later changes.
 */
export function useDiceFabPreferences(): DiceFabPreferences {
  const { preferences, setPreference } = usePreferences()

  // Server snapshot is `false` so SSR and the first client render agree; the client
  // then reflects the real media query (and live changes to it). An explicit stored
  // choice overrides this anyway.
  const reducedMotion = useSyncExternalStore(
    subscribeReducedMotion,
    prefersReducedMotion,
    () => false,
  )

  const setSendToChat = useCallback(
    (value: boolean) => setPreference('dice.sendToChat', value),
    [setPreference],
  )
  const setDisableAnimation = useCallback(
    (value: boolean) => setPreference('dice.disableAnimation', value),
    [setPreference],
  )

  const disableAnimationChoice = preferences.dice.disableAnimation
  const disableAnimation =
    disableAnimationChoice === null ? reducedMotion : disableAnimationChoice

  return {
    sendToChat: preferences.dice.sendToChat,
    setSendToChat,
    disableAnimation,
    disableAnimationChoice,
    setDisableAnimation,
  }
}
