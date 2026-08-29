'use client'

import { useEffect, useRef, useState } from 'react'
import { LocalStore } from '@/lib/offline/LocalStore'
import { useCampaignStream } from '@/lib/hooks/useCampaignStream'
import type { CampaignMessage, CampaignRoll, CampaignStreamEvent } from '@/lib/types'
import { useHistoryPagination } from './useHistoryPagination'

export type FeedItem =
  | { kind: 'message'; data: CampaignMessage }
  | { kind: 'roll'; data: CampaignRoll }

function safeGet<T>(key: string): T | null {
  try { return LocalStore.get<T>(key) } catch { return null }
}

function safeSet(key: string, val: unknown): boolean {
  try { LocalStore.set(key, val); return true } catch { return false }
}

interface UseChatFeedArgs {
  campaignId: string
  activeSessionId: string | null
  isExpanded: boolean
  currentUserId: string | undefined
  feedRef: React.RefObject<HTMLDivElement | null>
  onSessionChange?: (activeSessionId: string | null) => void
}

export function useChatFeed({ campaignId, activeSessionId, isExpanded, currentUserId, feedRef, onSessionChange }: UseChatFeedArgs) {
  const [feed, setFeed] = useState<FeedItem[]>([])
  const seenIds = useRef<Set<string>>(new Set())

  const [unreadCount, setUnreadCount] = useState(0)
  const lastOpenKey = `campaign-chat-last-open-${campaignId}`
  const lastOpenRef = useRef<Date>(new Date(0))

  // Bumped whenever campaignId changes so in-flight requests started for a
  // prior campaign can detect they're stale and discard their response
  // instead of writing into the new campaign's feed.
  const requestGenerationRef = useRef(0)

  function scrollToBottom(force = false) {
    // Measure proximity to the bottom now, before the pending feed update
    // commits — measuring inside the rAF below would include the height of
    // the roll card that's about to be appended, making every remote roll
    // look "far away" even when the user was already at the bottom.
    const container = feedRef.current
    const wasNearBottom = container
      ? container.scrollHeight - container.scrollTop - container.clientHeight <= 100
      : true
    requestAnimationFrame(() => {
      const el = feedRef.current
      if (!el) return
      // Don't yank a user who has scrolled up to read history (or is
      // sitting at scrollTop 0 to trigger the older-page load below)
      // down to the bottom just because a roll from another player came in.
      if (!force && !wasNearBottom) return
      el.scrollTo?.({ top: el.scrollHeight, behavior: 'smooth' })
    })
  }

  // ── SSE stream ──
  function onStreamEvent(e: CampaignStreamEvent) {
    if (e.type === 'message') {
      const msg = e.data
      if (seenIds.current.has(msg.id)) return
      seenIds.current.add(msg.id)
      setFeed(prev => [...prev, { kind: 'message', data: msg }])
      if (!isExpanded && new Date(msg.createdAt) > lastOpenRef.current) {
        setUnreadCount(c => c + 1)
      }
    } else if (e.type === 'roll') {
      const roll = e.data
      if (seenIds.current.has(roll.id)) return
      seenIds.current.add(roll.id)
      setFeed(prev => [...prev, { kind: 'roll', data: roll }])
      // A submitted roll only ever enters the feed via this stream event —
      // force-scroll when it's the local user's own roll, matching the
      // behavior previously provided by the now-removed optimistic append.
      scrollToBottom(roll.rollerId === currentUserId)
    } else if (e.type === 'session') {
      onSessionChange?.(e.data.activeSessionId)
    }
  }

  const { status: streamStatus } = useCampaignStream(campaignId, onStreamEvent)

  // ── Reset all campaign-scoped state whenever campaignId changes ──
  // (defense in depth alongside the `key={campaignId}` remount the current
  // call site already uses; keeps this hook safe to reuse without a key)
  useEffect(() => {
    requestGenerationRef.current += 1
    setFeed([])
    seenIds.current = new Set()
    setUnreadCount(0)
    const stored = safeGet<string>(lastOpenKey)
    lastOpenRef.current = stored ? new Date(stored) : new Date(0)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [campaignId])

  const { isLoadingHistory } = useHistoryPagination({
    campaignId, activeSessionId, isExpanded, feedRef, seenIds, setFeed, requestGenerationRef,
  })

  function markOpened() {
    const now = new Date()
    if (safeSet(lastOpenKey, now.toISOString())) lastOpenRef.current = now
    setUnreadCount(0)
  }

  return {
    feed, setFeed, seenIds,
    isLoadingHistory, unreadCount, markOpened,
    streamStatus,
  }
}
