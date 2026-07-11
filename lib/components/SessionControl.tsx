'use client'

import { useState, useEffect } from 'react'
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

  // activeSessionId is canonical state from CampaignLayout (e.g. driven by the
  // session SSE event); once it changes, any stale error from a prior local
  // action is no longer relevant.
  useEffect(() => {
    setError(null)
  }, [activeSessionId])

  if (loading || !isDM) return null

  async function reconcileFromCampaign() {
    const res = await fetch(`/api/campaigns/${campaignId}`)
    if (!res.ok) {
      // A session is known to be active (that's why we're reconciling); without a
      // successful re-fetch we can't learn its id, so we must not report null here
      // or the UI would falsely claim no session is active.
      throw new Error(`reconcile fetch failed with status ${res.status}`)
    }
    const data = await res.json()
    const fetchedId = data?.activeSessionId
    // A successful re-fetch is authoritative: the session may have ended between
    // the 409 and this GET resolving, so a null/missing id here means "no active
    // session" rather than a failed reconciliation.
    if (fetchedId !== null && fetchedId !== undefined && typeof fetchedId !== 'string') {
      throw new Error('reconcile response returned a malformed activeSessionId')
    }
    onSessionChange(fetchedId === undefined ? null : fetchedId)
  }

  async function handleStart() {
    setBusy(true)
    setError(null)
    try {
      const res = await fetch(`/api/campaigns/${campaignId}/sessions/active`, { method: 'POST' })
      if (res.status === 201) {
        const log = await res.json()
        if (typeof log?.id !== 'string' || log.id === '') {
          console.error(`SessionControl.handleStart: malformed session id in 201 response for campaign ${campaignId}`, log)
          setError('Failed to start session, try again')
        } else {
          onSessionChange(log.id)
        }
      } else if (res.status === 409) {
        try {
          await reconcileFromCampaign()
        } catch (err) {
          console.error(`SessionControl.handleStart: reconciliation after 409 failed for campaign ${campaignId}`, err)
          setError('A session is already active, but the current state could not be refreshed — reload the page')
        }
      } else {
        console.error(`SessionControl.handleStart: unexpected status ${res.status} for campaign ${campaignId}`)
        setError('Failed to start session, try again')
      }
    } catch (err) {
      console.error(`SessionControl.handleStart failed for campaign ${campaignId}`, err)
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
      if (res.ok || res.status === 404) {
        onSessionChange(null)
      } else {
        console.error(`SessionControl.handleEnd: unexpected status ${res.status} for campaign ${campaignId}`)
        setError('Failed to end session, try again')
      }
    } catch (err) {
      console.error(`SessionControl.handleEnd failed for campaign ${campaignId}`, err)
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
      if (res.ok || res.status === 404) {
        onSessionChange(null)
      } else {
        console.error(`SessionControl.handleForceEnd: unexpected status ${res.status} for campaign ${campaignId}`)
        setError('Failed to reset session, try again')
      }
    } catch (err) {
      console.error(`SessionControl.handleForceEnd failed for campaign ${campaignId}`, err)
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
