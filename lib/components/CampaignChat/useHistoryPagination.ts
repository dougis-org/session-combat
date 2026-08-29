'use client'

import { useEffect, useRef, useState } from 'react'
import type { CampaignMessage, CampaignRoll } from '@/lib/types'
import type { FeedItem } from './useChatFeed'

interface UseHistoryPaginationArgs {
  campaignId: string
  activeSessionId: string | null
  isExpanded: boolean
  feedRef: React.RefObject<HTMLDivElement | null>
  seenIds: React.RefObject<Set<string>>
  setFeed: (updater: (prev: FeedItem[]) => FeedItem[]) => void
  requestGenerationRef: React.RefObject<number>
}

// Owns message/roll history fetch-on-expand and infinite-scroll pagination.
// Every async response is generation-guarded against `requestGenerationRef`
// (bumped by the caller whenever campaignId changes) so a slow response for
// a prior campaign can never write into the feed after the campaign switched.
export function useHistoryPagination({
  campaignId, activeSessionId, isExpanded, feedRef, seenIds, setFeed, requestGenerationRef,
}: UseHistoryPaginationArgs) {
  const cursorRef = useRef<string | null>(null)   // nextCursor from last fetch
  const hasMoreRef = useRef(true)
  const historyLoadedRef = useRef(false)          // guards against re-fetching after stream msgs arrive
  const [isLoadingHistory, setIsLoadingHistory] = useState(false)
  const isLoadingHistoryRef = useRef(false)

  // ── Reset pagination state whenever campaignId changes ──
  useEffect(() => {
    cursorRef.current = null
    hasMoreRef.current = true
    historyLoadedRef.current = false
  }, [campaignId])

  // ── History load on expand ──
  useEffect(() => {
    if (!isExpanded || historyLoadedRef.current) return
    historyLoadedRef.current = true
    setIsLoadingHistory(true)
    isLoadingHistoryRef.current = true
    const generation = requestGenerationRef.current

    const encodedCampaignId = encodeURIComponent(campaignId)
    const messagesParams = new URLSearchParams({ limit: '30' })
    const fetchMessages = fetch(`/api/campaigns/${encodedCampaignId}/messages?${messagesParams}`)
      .then(r => (r.ok ? r.json() : null))
      .catch(() => null)

    const fetchRolls = activeSessionId !== null
      ? fetch(`/api/campaigns/${encodedCampaignId}/rolls?${new URLSearchParams({ sessionId: activeSessionId, limit: '30' })}`)
          .then(r => (r.ok ? r.json() : null))
          .catch(() => null)
      : Promise.resolve(null)

    Promise.all([fetchMessages, fetchRolls])
      .then(([msgData, rollData]) => {
        // campaignId changed since this request started — discard stale results.
        if (generation !== requestGenerationRef.current) return
        if (!msgData?.messages) {
          // Let a later expand retry instead of permanently believing history loaded.
          historyLoadedRef.current = false
          return
        }

        const rawMsgs: CampaignMessage[] = [...msgData.messages].reverse()
        const rawRolls: CampaignRoll[] = rollData?.rolls ? [...rollData.rolls].reverse() : []

        const msgItems: FeedItem[] = rawMsgs
          .filter(m => !seenIds.current.has(m.id))
          .map(m => { seenIds.current.add(m.id); return { kind: 'message' as const, data: m } })

        const rollItems: FeedItem[] = rawRolls
          .filter(r => !seenIds.current.has(r.id))
          .map(r => { seenIds.current.add(r.id); return { kind: 'roll' as const, data: r } })

        const merged = [...msgItems, ...rollItems].sort(
          (a, b) => new Date(a.data.createdAt).getTime() - new Date(b.data.createdAt).getTime()
        )

        setFeed(prev => [...merged, ...prev])
        cursorRef.current = msgData.nextCursor ?? null
        hasMoreRef.current = !!msgData.nextCursor
      })
      .catch(() => { historyLoadedRef.current = false /* let a later expand retry */ })
      .finally(() => {
        if (generation !== requestGenerationRef.current) return
        setIsLoadingHistory(false)
        isLoadingHistoryRef.current = false
      })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isExpanded, campaignId])

  // ── Infinite scroll: prepend older pages ──
  useEffect(() => {
    if (!isExpanded) return
    const container = feedRef.current
    if (!container) return

    function handleScroll() {
      if (!container || container.scrollTop !== 0) return
      if (!hasMoreRef.current || isLoadingHistoryRef.current) return

      setIsLoadingHistory(true)
      isLoadingHistoryRef.current = true
      const prevScrollHeight = container.scrollHeight
      const generation = requestGenerationRef.current

      const cursor = cursorRef.current
      const params = new URLSearchParams({ limit: '30' })
      if (cursor) params.set('before', cursor)
      fetch(`/api/campaigns/${encodeURIComponent(campaignId)}/messages?${params}`)
        .then(r => (r.ok ? r.json() : null))
        .then(data => {
          if (generation !== requestGenerationRef.current) return
          if (!data?.messages) return
          // API returns newest-first; reverse so older messages prepend correctly
          const results: CampaignMessage[] = [...data.messages].reverse()
          const newMsgs = results.filter(m => !seenIds.current.has(m.id))
          newMsgs.forEach(m => seenIds.current.add(m.id))
          const newItems: FeedItem[] = newMsgs.map(m => ({ kind: 'message' as const, data: m }))
          setFeed(prev => [...newItems, ...prev])
          cursorRef.current = data.nextCursor ?? null
          hasMoreRef.current = !!data.nextCursor
          requestAnimationFrame(() => {
            if (!container) return
            container.scrollTop = container.scrollHeight - prevScrollHeight
          })
        })
        .catch(() => { /* leave page as-is */ })
        .finally(() => {
          if (generation !== requestGenerationRef.current) return
          setIsLoadingHistory(false)
          isLoadingHistoryRef.current = false
        })
    }

    container.addEventListener('scroll', handleScroll)
    return () => container.removeEventListener('scroll', handleScroll)
  }, [isExpanded, campaignId, feedRef, requestGenerationRef, seenIds, setFeed])

  return { isLoadingHistory }
}
