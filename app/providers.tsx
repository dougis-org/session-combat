'use client'

import React from 'react'
import { PreferencesProvider } from '@/lib/preferences/usePreferences'
import { useAuth } from '@/lib/hooks/useAuth'

/**
 * Client provider tree mounted once at the root layout, under the auth boundary
 * (`PreferencesProvider` reads `useAuth`). Preferences hydrate once per authenticated
 * session and are mirrored to `localStorage` for instant first paint.
 */
export function AppProviders({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  return (
    <PreferencesProvider userId={user?.userId ?? null}>{children}</PreferencesProvider>
  )
}
