import React from 'react'
import { DeepPartial, DEFAULT_PREFERENCES, PreferenceValues } from '@/lib/preferences/schema'

const freshDefaults = (): PreferenceValues => ({
  dice: { ...DEFAULT_PREFERENCES.dice },
  chat: { ...DEFAULT_PREFERENCES.chat },
})

/**
 * Test double for `@/lib/preferences/usePreferences`. Wire it in a test file with:
 *   jest.mock('@/lib/preferences/usePreferences', () =>
 *     require('@/tests/unit/helpers/preferencesTestDouble'))
 * then drive it via `__setPreferences` / `setPreferenceMock` / `__resetPreferences`.
 */
export const PREFERENCES_MIRROR_KEY = 'preferences'

let current: PreferenceValues = freshDefaults()

export const setPreferenceMock = jest.fn((path: string, value: unknown) => {
  const [domain, key] = path.split('.') as [keyof PreferenceValues, string]
  current = { ...current, [domain]: { ...current[domain], [key]: value } }
})

export function __setPreferences(patch: DeepPartial<PreferenceValues>): void {
  current = {
    dice: { ...current.dice, ...(patch.dice ?? {}) },
    chat: { ...current.chat, ...(patch.chat ?? {}) },
  } as PreferenceValues
}

export function __resetPreferences(): void {
  current = freshDefaults()
  setPreferenceMock.mockClear()
}

export function usePreferences() {
  return { preferences: current, setPreference: setPreferenceMock, ready: true }
}

export function PreferencesProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}

export function __resetFallbackPreferencesForTests(): void {}
