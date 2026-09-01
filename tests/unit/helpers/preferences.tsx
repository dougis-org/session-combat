import React from 'react'
import { PreferencesProvider } from '@/lib/preferences/usePreferences'

/** Wrapper for renderHook/render that mounts the preferences provider. */
export function makePreferencesWrapper(userId: string | null = null) {
  return function PreferencesWrapper({ children }: { children: React.ReactNode }) {
    return <PreferencesProvider userId={userId}>{children}</PreferencesProvider>
  }
}
