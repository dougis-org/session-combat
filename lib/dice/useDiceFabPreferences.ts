'use client'

import { useCallback, useEffect, useReducer, useState } from 'react'
import { LocalStore } from '@/lib/offline/LocalStore'
import {
  DEFAULT_COLORSET,
  DEFAULT_MATERIAL,
  resolveDiceAppearance,
} from '@/lib/dice/diceAppearance'
import { usePreferences } from '@/lib/preferences/usePreferences'

// localStorage key names (not secrets) for the 3D dice appearance.
// TODO(add-user-preference-persistence): these two map onto `PreferenceValues.dice.colorset`
// / `.material`; a later change can copy the scalar string values forward without a migration.
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

interface AppearanceState {
  /** Resolved (registry-validated) 3D dice appearance. */
  diceColorset: string
  diceMaterial: string
}

type AppearanceAction =
  | { type: 'INIT'; diceColorset: string; diceMaterial: string }
  | { type: 'SET_DICE_COLORSET'; value: string }
  | { type: 'SET_DICE_MATERIAL'; value: string }

function appearanceReducer(state: AppearanceState, action: AppearanceAction): AppearanceState {
  switch (action.type) {
    case 'INIT':
      return { diceColorset: action.diceColorset, diceMaterial: action.diceMaterial }
    case 'SET_DICE_COLORSET':
      return {
        ...state,
        diceColorset: resolveDiceAppearance(action.value, state.diceMaterial).colorset,
      }
    case 'SET_DICE_MATERIAL':
      return {
        ...state,
        diceMaterial: resolveDiceAppearance(state.diceColorset, action.value).material,
      }
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
 * Persisted dice-fab preferences. `sendToChat` and `disableAnimation` are backed by the
 * shared preferences provider (`usePreferences`), so they sync across tabs/devices for
 * authenticated users. `disableAnimation` remains tri-state so "never chosen" falls back to
 * `prefers-reduced-motion`; the first explicit toggle wins from then on even if the media
 * query later changes.
 *
 * The 3D dice appearance (`diceColorset` / `diceMaterial`) is not yet part of the v1
 * preference schema, so it stays on the local `LocalStore` + `safeGet`/`safeSet` +
 * `useReducer` INIT pattern and is resolved through the appearance registry so a stale or
 * hand-edited id degrades to the engine default. Storage being unavailable degrades to an
 * in-session value without throwing. The public shape is unchanged.
 */
export function useDiceFabPreferences(): DiceFabPreferences {
  const { preferences, setPreference } = usePreferences()

  // Captured once at first render; an explicit stored choice overrides it anyway.
  const [reducedMotion] = useState(prefersReducedMotion)

  const [appearance, dispatch] = useReducer(appearanceReducer, {
    diceColorset: DEFAULT_COLORSET,
    diceMaterial: DEFAULT_MATERIAL,
  })

  useEffect(() => {
    const resolved = resolveDiceAppearance(
      safeGet<unknown>(COLORSET_KEY),
      safeGet<unknown>(MATERIAL_KEY),
    )
    dispatch({
      type: 'INIT',
      diceColorset: resolved.colorset,
      diceMaterial: resolved.material,
    })
  }, [])

  const setSendToChat = useCallback(
    (value: boolean) => setPreference('dice.sendToChat', value),
    [setPreference],
  )
  const setDisableAnimation = useCallback(
    (value: boolean) => setPreference('dice.disableAnimation', value),
    [setPreference],
  )

  const setDiceColorset = useCallback((value: string) => {
    dispatch({ type: 'SET_DICE_COLORSET', value })
    safeSet(COLORSET_KEY, value)
  }, [])

  const setDiceMaterial = useCallback((value: string) => {
    dispatch({ type: 'SET_DICE_MATERIAL', value })
    safeSet(MATERIAL_KEY, value)
  }, [])

  const disableAnimationChoice = preferences.dice.disableAnimation
  const disableAnimation =
    disableAnimationChoice === null ? reducedMotion : disableAnimationChoice

  return {
    sendToChat: preferences.dice.sendToChat,
    setSendToChat,
    disableAnimation,
    disableAnimationChoice,
    setDisableAnimation,
    diceColorset: appearance.diceColorset,
    setDiceColorset,
    diceMaterial: appearance.diceMaterial,
    setDiceMaterial,
  }
}
