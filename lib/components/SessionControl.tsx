'use client'

import { useState } from 'react'
import { useIsDM } from '@/lib/hooks/useIsDM'

interface SessionControlProps {
  campaignId: string
  activeSessionId: string | null
  onSessionChange: (id: string | null) => void
}

export function SessionControl({ campaignId, activeSessionId, onSessionChange }: SessionControlProps) {
  const { isDM, loading } = useIsDM(campaignId)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (loading || !isDM) return null

  async function reconcileFromCampaign() {
    const res = await fetch(`/api/campaigns/${campaignId}`)
    const data = res.ok ? await res.json() : null
    onSessionChange(data?.activeSessionId ?? null)
  }

  async function handleStart() {
    setBusy(true)
    setError(null)
    try {
      const res = await fetch(`/api/campaigns/${campaignId}/sessions/active`, { method: 'POST' })
      if (res.status === 201) {
        const log = await res.json()
        onSessionChange(log.id)
      } else if (res.status === 409) {
        await reconcileFromCampaign()
      } else {
        setError('Failed to start session, try again')
      }
    } catch {
      setError('Failed to start session, try again')
    } finally {
      setBusy(false)
    }
  }

  async function handleEnd() {
    setBusy(true)
    setError(null)
    try {
      const res = await fetch(`/api/campaigns/${campaignId}/sessions/active`, { method: 'DELETE' })
      if (res.status === 200 || res.status === 404) {
        onSessionChange(null)
      } else {
        setError('Failed to end session, try again')
      }
    } catch {
      setError('Failed to end session, try again')
    } finally {
      setBusy(false)
    }
  }

  async function handleForceEnd() {
    setBusy(true)
    setError(null)
    try {
      const res = await fetch(`/api/campaigns/${campaignId}/sessions/active?force=true`, { method: 'DELETE' })
      if (res.ok) {
        onSessionChange(null)
      } else {
        setError('Failed to reset session, try again')
      }
    } catch {
      setError('Failed to reset session, try again')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex items-center gap-2">
      {activeSessionId === null ? (
        <button
          type="button"
          onClick={handleStart}
          disabled={busy}
          className="text-sm bg-green-700 hover:bg-green-600 disabled:opacity-50 text-white px-3 py-1.5 rounded-md"
        >
          Start Session
        </button>
      ) : (
        <>
          <button
            type="button"
            onClick={handleEnd}
            disabled={busy}
            className="text-sm bg-red-700 hover:bg-red-600 disabled:opacity-50 text-white px-3 py-1.5 rounded-md"
          >
            End Session
          </button>
          <button
            type="button"
            onClick={handleForceEnd}
            disabled={busy}
            className="text-xs text-gray-400 hover:text-gray-200 disabled:opacity-50 underline"
          >
            Force end (recovery)
          </button>
        </>
      )}
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  )
}
