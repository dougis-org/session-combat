'use client'

import { useCallback, useEffect, useReducer } from 'react'
import { LocalStore } from '@/lib/offline/LocalStore'
import {
  DEFAULT_COLORSET,
  DEFAULT_MATERIAL,
  resolveDiceAppearance,
} from '@/lib/dice/diceAppearance'

// localStorage key names (not secrets) for the global dice fab's persisted UI state
const SEND_TO_CHAT_KEY = 'dice-fab-send-to-chat' // nosemgrep
const DISABLE_ANIMATION_KEY = 'dice-fab-disable-animation' // nosemgrep
// TODO(add-user-preference-persistence): these two map onto `PreferenceValues.dice.colorset`
// / `.material`; that branch can copy the scalar string values forward without a migration.
const COLORSET_KEY = 'dice-fab-colorset' // nosemgrep
const MATERIAL_KEY = 'dice-fab-material' // nosemgrep

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
  /** Resolved (registry-validated) 3D dice appearance. */
  diceColorset: string
  diceMaterial: string
}

type Action =
  | {
      type: 'INIT'
      sendToChat: boolean
      disableAnimationChoice: boolean | null
      reducedMotion: boolean
      diceColorset: string
      diceMaterial: string
    }
  | { type: 'SET_SEND_TO_CHAT'; value: boolean }
  | { type: 'SET_DISABLE_ANIMATION'; value: boolean }
  | { type: 'SET_DICE_COLORSET'; value: string }
  | { type: 'SET_DICE_MATERIAL'; value: string }

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'INIT':
      return {
        sendToChat: action.sendToChat,
        disableAnimationChoice: action.disableAnimationChoice,
        reducedMotion: action.reducedMotion,
        diceColorset: action.diceColorset,
        diceMaterial: action.diceMaterial,
      }
    case 'SET_SEND_TO_CHAT':
      return { ...state, sendToChat: action.value }
    case 'SET_DISABLE_ANIMATION':
      return { ...state, disableAnimationChoice: action.value }
    case 'SET_DICE_COLORSET':
      return { ...state, diceColorset: resolveDiceAppearance(action.value, state.diceMaterial).colorset }
    case 'SET_DICE_MATERIAL':
      return { ...state, diceMaterial: resolveDiceAppearance(state.diceColorset, action.value).material }
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
  /** Resolved 3D dice colorset id (`theme_colorset`); defaults to `white`. */
  diceColorset: string
  setDiceColorset: (value: string) => void
  /** Resolved 3D dice material id (`theme_material`); defaults to `glass`. */
  diceMaterial: string
  setDiceMaterial: (value: string) => void
}

/**
 * Persisted dice-fab preferences, following the `useDockState` `LocalStore` +
 * `safeGet`/`safeSet` + `useReducer` INIT pattern (decision n125). One `localStorage` key
 * per preference. `disableAnimation` is stored tri-state so "never chosen" can fall back to
 * `prefers-reduced-motion`; the first explicit toggle wins from then on even if the media
 * query later changes. The 3D dice appearance (`diceColorset` / `diceMaterial`) is resolved
 * through the appearance registry so a stale or hand-edited id degrades to the engine
 * default. Storage being unavailable degrades to an in-session value without throwing.
 */
export function useDiceFabPreferences(): DiceFabPreferences {
  const [state, dispatch] = useReducer(reducer, {
    sendToChat: false,
    disableAnimationChoice: null,
    reducedMotion: false,
    diceColorset: DEFAULT_COLORSET,
    diceMaterial: DEFAULT_MATERIAL,
  })

  useEffect(() => {
    const storedSend = safeGet<unknown>(SEND_TO_CHAT_KEY)
    const storedDisable = safeGet<unknown>(DISABLE_ANIMATION_KEY)
    const appearance = resolveDiceAppearance(
      safeGet<unknown>(COLORSET_KEY),
      safeGet<unknown>(MATERIAL_KEY),
    )
    dispatch({
      type: 'INIT',
      sendToChat: typeof storedSend === 'boolean' ? storedSend : false,
      disableAnimationChoice: typeof storedDisable === 'boolean' ? storedDisable : null,
      reducedMotion: prefersReducedMotion(),
      diceColorset: appearance.colorset,
      diceMaterial: appearance.material,
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

  const setDiceColorset = useCallback((value: string) => {
    dispatch({ type: 'SET_DICE_COLORSET', value })
    safeSet(COLORSET_KEY, value)
  }, [])

  const setDiceMaterial = useCallback((value: string) => {
    dispatch({ type: 'SET_DICE_MATERIAL', value })
    safeSet(MATERIAL_KEY, value)
  }, [])

  const disableAnimation =
    state.disableAnimationChoice === null ? state.reducedMotion : state.disableAnimationChoice

  return {
    sendToChat: state.sendToChat,
    setSendToChat,
    disableAnimation,
    disableAnimationChoice: state.disableAnimationChoice,
    setDisableAnimation,
    diceColorset: state.diceColorset,
    setDiceColorset,
    diceMaterial: state.diceMaterial,
    setDiceMaterial,
  }
}
