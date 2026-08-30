'use client'

import { useCallback, useEffect, useReducer } from 'react'
import { LocalStore } from '@/lib/offline/LocalStore'

// localStorage key names (not secrets) for the global dice fab's persisted UI state
const SEND_TO_CHAT_KEY = 'dice-fab-send-to-chat' // nosemgrep
const DISABLE_ANIMATION_KEY = 'dice-fab-disable-animation' // nosemgrep

function safeGet<T>(key: string): T | null {
  try {
    return LocalStore.get<T>(key)
  } catch (err) {
    // Degrade to defaults, but keep the failure observable (matches lib/clientStorage).
    console.warn(`[dice-fab-prefs] localStorage read failed for "${key}"`, err)
    return null
  }
}

function safeSet(key: string, val: unknown): void {
  try {
    LocalStore.set(key, val)
  } catch (err) {
    // Storage unavailable — degrade to an in-session value, but log it.
    console.warn(`[dice-fab-prefs] localStorage write failed for "${key}"`, err)
  }
}

/** Reads `prefers-reduced-motion` defensively; false when unavailable (SSR / no matchMedia). */
function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false
  try {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
  } catch {
    return false
  }
}

interface State {
  sendToChat: boolean
  /** Tri-state: `true | false` once chosen, `null` while never chosen. */
  disableAnimationChoice: boolean | null
  reducedMotion: boolean
}

type Action =
  | { type: 'INIT'; sendToChat: boolean; disableAnimationChoice: boolean | null; reducedMotion: boolean }
  | { type: 'SET_SEND_TO_CHAT'; value: boolean }
  | { type: 'SET_DISABLE_ANIMATION'; value: boolean }

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'INIT':
      return {
        sendToChat: action.sendToChat,
        disableAnimationChoice: action.disableAnimationChoice,
        reducedMotion: action.reducedMotion,
      }
    case 'SET_SEND_TO_CHAT':
      return { ...state, sendToChat: action.value }
    case 'SET_DISABLE_ANIMATION':
      return { ...state, disableAnimationChoice: action.value }
  }
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
 * Two persisted dice-fab preferences, following the `useDockState` `LocalStore` +
 * `safeGet`/`safeSet` + `useReducer` INIT pattern (decision n125). `disableAnimation` is
 * stored tri-state so "never chosen" can fall back to `prefers-reduced-motion`; the first
 * explicit toggle wins from then on even if the media query later changes. Storage being
 * unavailable degrades to an in-session value without throwing.
 */
export function useDiceFabPreferences(): DiceFabPreferences {
  const [state, dispatch] = useReducer(reducer, {
    sendToChat: false,
    disableAnimationChoice: null,
    reducedMotion: false,
  })

  useEffect(() => {
    const storedSend = safeGet<unknown>(SEND_TO_CHAT_KEY)
    const storedDisable = safeGet<unknown>(DISABLE_ANIMATION_KEY)
    dispatch({
      type: 'INIT',
      sendToChat: typeof storedSend === 'boolean' ? storedSend : false,
      disableAnimationChoice: typeof storedDisable === 'boolean' ? storedDisable : null,
      reducedMotion: prefersReducedMotion(),
    })
  }, [])

  const setSendToChat = useCallback((value: boolean) => {
    dispatch({ type: 'SET_SEND_TO_CHAT', value })
    safeSet(SEND_TO_CHAT_KEY, value)
  }, [])

  const setDisableAnimation = useCallback((value: boolean) => {
    dispatch({ type: 'SET_DISABLE_ANIMATION', value })
    safeSet(DISABLE_ANIMATION_KEY, value)
  }, [])

  const disableAnimation =
    state.disableAnimationChoice === null ? state.reducedMotion : state.disableAnimationChoice

  return {
    sendToChat: state.sendToChat,
    setSendToChat,
    disableAnimation,
    disableAnimationChoice: state.disableAnimationChoice,
    setDisableAnimation,
  }
}
