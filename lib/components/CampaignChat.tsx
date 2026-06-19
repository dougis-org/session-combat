'use client'

import { useReducer, useEffect, useRef, useState } from 'react'
import { LocalStore } from '@/lib/offline/LocalStore'
import { useCampaignStream } from '@/lib/hooks/useCampaignStream'
import { useAuth } from '@/lib/hooks/useAuth'
import type { CampaignMessage, CampaignStreamEvent, MessageVisibility } from '@/lib/types'

const PIN_KEY = 'campaign-chat-pin'

interface EnrichedMember {
  id: string
  userId: string
  username: string
  role: string
  status: string
}

// ── LocalStore helpers ────────────────────────────────────────────

function safeGet<T>(key: string): T | null {
  try { return LocalStore.get<T>(key) } catch { return null }
}

function safeSet(key: string, val: unknown): boolean {
  try { LocalStore.set(key, val); return true } catch { return false }
}

function safeRemove(key: string) {
  try { LocalStore.remove(key) } catch { /* storage unavailable */ }
}

// ── Dock reducer ──────────────────────────────────────────────────

type DockState = { isExpanded: boolean; isPinned: boolean }
type DockAction =
  | { type: 'INIT'; pinned: boolean }
  | { type: 'EXPAND' }
  | { type: 'COLLAPSE' }
  | { type: 'PIN' }
  | { type: 'UNPIN' }

function dockReducer(state: DockState, action: DockAction): DockState {
  switch (action.type) {
    case 'INIT':    return { isExpanded: action.pinned, isPinned: action.pinned }
    case 'EXPAND':  return { ...state, isExpanded: true }
    case 'COLLAPSE':return { ...state, isExpanded: false }
    case 'PIN':     return { ...state, isPinned: true }
    case 'UNPIN':   return { ...state, isPinned: false }
  }
}

// ── Sub-components ────────────────────────────────────────────────

function resolveUsername(members: EnrichedMember[], toUserId: string): string {
  return members.find(m => m.userId === toUserId)?.username ?? toUserId
}

interface ChatFeedProps {
  messages: CampaignMessage[]
  isLoadingHistory: boolean
  members: EnrichedMember[]
  feedRef: React.RefObject<HTMLDivElement | null>
}

function ChatFeed({ messages, isLoadingHistory, members, feedRef }: ChatFeedProps) {
  function visibilityMarker(visibility: MessageVisibility): string | null {
    if (visibility.scope === 'dm-only') return '[DM]'
    if (visibility.scope === 'direct') return `[→ @${resolveUsername(members, visibility.toUserId)}]`
    return null
  }

  return (
    <div ref={feedRef} className="flex-1 overflow-y-auto p-4 flex flex-col gap-2">
      {isLoadingHistory && (
        <div className="text-center text-xs text-gray-500 py-1">Loading…</div>
      )}
      {messages.length === 0 && !isLoadingHistory && (
        <p className="text-gray-500 text-sm">No messages yet.</p>
      )}
      {messages.map(msg => {
        const marker = visibilityMarker(msg.visibility)
        const ts = new Date(msg.createdAt).toLocaleTimeString()
        return (
          <div key={msg.id} className="text-sm text-gray-200">
            <span className="font-semibold text-white">{msg.senderName}</span>
            {' '}
            <span className="text-gray-500 text-xs">{ts}</span>
            {marker && <span className="ml-1 text-xs text-yellow-400">{marker}</span>}
            <div className="mt-0.5 text-gray-300">{msg.text}</div>
          </div>
        )
      })}
    </div>
  )
}

interface MentionDropdownProps {
  results: EnrichedMember[]
  onSelect: (member: EnrichedMember) => void
}

function MentionDropdown({ results, onSelect }: MentionDropdownProps) {
  if (results.length === 0) return null
  return (
    <ul className="absolute bottom-full left-0 right-0 mb-1 bg-gray-700 border border-gray-600 rounded shadow-lg z-50 max-h-40 overflow-y-auto">
      {results.map(member => (
        <li key={member.userId}>
          <button
            type="button"
            className="w-full text-left px-3 py-1.5 text-sm text-white hover:bg-gray-600"
            onMouseDown={e => { e.preventDefault(); onSelect(member) }}
          >
            @{member.username}
          </button>
        </li>
      ))}
    </ul>
  )
}

interface ChatComposerProps {
  composerText: string
  onTextChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void
  onKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void
  visibility: MessageVisibility
  onVisibilityChange: (scope: string) => void
  isSending: boolean
  streamStatus: 'connecting' | 'open' | 'error'
  members: EnrichedMember[]
  onSend: () => void
  onBlur: () => void
  mentionResults: EnrichedMember[]
  onMentionSelect: (member: EnrichedMember) => void
  textareaRef: React.RefObject<HTMLTextAreaElement | null>
}

function ChatComposer({
  composerText, onTextChange, onKeyDown, visibility, onVisibilityChange,
  isSending, streamStatus, members, onSend, onBlur,
  mentionResults, onMentionSelect, textareaRef,
}: ChatComposerProps) {
  const isDisabled = streamStatus !== 'open' || isSending

  return (
    <div className="border-t border-gray-700 p-3 flex-shrink-0 flex flex-col gap-2">
      {streamStatus !== 'open' && (
        <p className="text-xs text-yellow-400">Reconnecting…</p>
      )}
      <div className="flex gap-2 items-center">
        <select
          value={visibility.scope}
          onChange={e => onVisibilityChange(e.target.value)}
          disabled={isDisabled}
          className="text-xs bg-gray-700 border border-gray-600 text-white rounded px-1 py-0.5"
        >
          <option value="group">Group</option>
          <option value="dm-only">DM-only</option>
          <option value="direct">Whisper</option>
        </select>
        {visibility.scope === 'direct' && visibility.toUserId && (
          <span className="text-xs text-yellow-400">
            → @{resolveUsername(members, visibility.toUserId)}
          </span>
        )}
      </div>
      <div className="relative">
        <MentionDropdown results={mentionResults} onSelect={onMentionSelect} />
        <textarea
          ref={textareaRef}
          value={composerText}
          onChange={onTextChange}
          onKeyDown={onKeyDown}
          onBlur={onBlur}
          disabled={isDisabled}
          rows={2}
          placeholder={isDisabled ? '' : 'Type a message…'}
          className="w-full bg-gray-700 border border-gray-600 text-white text-sm rounded px-2 py-1.5 resize-none placeholder-gray-500 disabled:opacity-50"
        />
      </div>
      <button
        type="button"
        onClick={onSend}
        disabled={isDisabled}
        className="self-end text-xs bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white px-3 py-1 rounded"
      >
        Send
      </button>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────

export function CampaignChat({ campaignId }: { campaignId: string }) {
  const { user } = useAuth()
  const [{ isExpanded, isPinned }, dispatch] = useReducer(dockReducer, {
    isExpanded: false,
    isPinned: false,
  })
  const triggerRef = useRef<HTMLButtonElement>(null)
  const isMounted = useRef(false)

  const [messages, setMessages] = useState<CampaignMessage[]>([])
  const seenIds = useRef<Set<string>>(new Set())

  const [members, setMembers] = useState<EnrichedMember[]>([])

  // Pagination state lives in refs — never rendered, only read by the scroll handler
  const cursorRef = useRef<string | null>(null)   // nextCursor from last fetch
  const hasMoreRef = useRef(true)
  const historyLoadedRef = useRef(false)          // guards against re-fetching after stream msgs arrive
  const [isLoadingHistory, setIsLoadingHistory] = useState(false)
  const isLoadingHistoryRef = useRef(false)
  const feedRef = useRef<HTMLDivElement>(null)

  const [unreadCount, setUnreadCount] = useState(0)
  const lastOpenKey = `campaign-chat-last-open-${campaignId}`
  const lastOpenRef = useRef<Date>(new Date(0))

  const [composerText, setComposerText] = useState('')
  const [visibility, setVisibility] = useState<MessageVisibility>({ scope: 'group' })
  const [isSending, setIsSending] = useState(false)
  const [mentionQuery, setMentionQuery] = useState<string | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const mentionResults = mentionQuery !== null
    ? members.filter(m => m.status === 'active' && m.username.toLowerCase().startsWith(mentionQuery.toLowerCase()))
    : []

  // ── SSE stream ──
  function onStreamEvent(e: CampaignStreamEvent) {
    if (e.type !== 'message') return
    const msg = e.data
    if (seenIds.current.has(msg.id)) return
    seenIds.current.add(msg.id)
    setMessages(prev => [...prev, msg])
    if (!isExpanded && new Date(msg.createdAt) > lastOpenRef.current) {
      setUnreadCount(c => c + 1)
    }
  }

  const { status: streamStatus } = useCampaignStream(campaignId, onStreamEvent)

  // ── Init: pin state + last-open timestamp ──
  useEffect(() => {
    dispatch({ type: 'INIT', pinned: !!safeGet<boolean>(PIN_KEY) })
    const stored = safeGet<string>(lastOpenKey)
    if (stored) lastOpenRef.current = new Date(stored)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── Restore focus after drawer closes ──
  useEffect(() => {
    if (!isMounted.current) { isMounted.current = true; return }
    if (!isExpanded) triggerRef.current?.focus()
  }, [isExpanded])

  // ── Keyboard: Escape to collapse ──
  useEffect(() => {
    if (!isExpanded) return
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') dispatch({ type: 'COLLAPSE' }) }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [isExpanded])

  // ── Fetch members on mount ──
  useEffect(() => {
    let cancelled = false
    fetch(`/api/campaigns/${campaignId}/members`)
      .then(r => (r.ok ? r.json() : null))
      .then(data => {
        if (!cancelled && data?.members) {
          setMembers((data.members as EnrichedMember[]).filter(m => m.status === 'active'))
        }
      })
      .catch(() => { /* leave members empty */ })
    return () => { cancelled = true }
  }, [campaignId])

  // ── History load on expand ──
  useEffect(() => {
    if (!isExpanded || historyLoadedRef.current) return
    historyLoadedRef.current = true
    setIsLoadingHistory(true)
    isLoadingHistoryRef.current = true
    fetch(`/api/campaigns/${campaignId}/messages?limit=30`)
      .then(r => (r.ok ? r.json() : null))
      .then(data => {
        if (!data?.messages) return
        // API returns newest-first; reverse so feed shows oldest at top, newest at bottom
        const results: CampaignMessage[] = [...data.messages].reverse()
        // Deduplicate against stream messages that may have arrived while loading
        const newMsgs = results.filter(m => !seenIds.current.has(m.id))
        newMsgs.forEach(m => seenIds.current.add(m.id))
        setMessages(prev => [...newMsgs, ...prev])
        cursorRef.current = data.nextCursor ?? null
        hasMoreRef.current = !!data.nextCursor
      })
      .catch(() => { /* leave feed empty */ })
      .finally(() => { setIsLoadingHistory(false); isLoadingHistoryRef.current = false })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isExpanded])

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

      const cursor = cursorRef.current
      fetch(`/api/campaigns/${campaignId}/messages?limit=30${cursor ? `&before=${encodeURIComponent(cursor)}` : ''}`)
        .then(r => (r.ok ? r.json() : null))
        .then(data => {
          if (!data?.messages) return
          // API returns newest-first; reverse so older messages prepend correctly
          const results: CampaignMessage[] = [...data.messages].reverse()
          const newMsgs = results.filter(m => !seenIds.current.has(m.id))
          newMsgs.forEach(m => seenIds.current.add(m.id))
          setMessages(prev => [...newMsgs, ...prev])
          cursorRef.current = data.nextCursor ?? null
          hasMoreRef.current = !!data.nextCursor
          requestAnimationFrame(() => {
            if (!container) return
            container.scrollTop = container.scrollHeight - prevScrollHeight
          })
        })
        .catch(() => { /* leave page as-is */ })
        .finally(() => { setIsLoadingHistory(false); isLoadingHistoryRef.current = false })
    }

    container.addEventListener('scroll', handleScroll)
    return () => container.removeEventListener('scroll', handleScroll)
  }, [isExpanded, campaignId])

  // ── Handlers ──

  function handlePinToggle() {
    if (isPinned) {
      safeRemove(PIN_KEY)
      dispatch({ type: 'UNPIN' })
    } else if (safeSet(PIN_KEY, true)) {
      dispatch({ type: 'PIN' })
    }
  }

  function handleExpand() {
    const now = new Date()
    if (safeSet(lastOpenKey, now.toISOString())) lastOpenRef.current = now
    setUnreadCount(0)
    dispatch({ type: 'EXPAND' })
  }

  function handleTextChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    const text = e.target.value
    setComposerText(text)
    const cursorPos = e.target.selectionStart ?? text.length
    const match = /@(\w*)$/.exec(text.slice(0, cursorPos))
    if (match) {
      setMentionQuery(match[1])
    } else {
      setMentionQuery(null)
      // Only revert direct→group when a mention target was previously selected and has been cleared
      if (visibility.scope === 'direct' && visibility.toUserId) setVisibility({ scope: 'group' })
    }
  }

  function handleVisibilityChange(scope: string) {
    if (scope === 'direct') {
      setVisibility({ scope: 'direct', toUserId: '' })
    } else {
      setMentionQuery(null)
      setVisibility(scope === 'dm-only' ? { scope: 'dm-only' } : { scope: 'group' })
    }
  }

  function handleMentionSelect(member: EnrichedMember) {
    const query = mentionQuery ?? ''
    const idx = composerText.lastIndexOf(`@${query}`)
    const replaced = idx !== -1
      ? composerText.slice(0, idx) + `@${member.username}` + composerText.slice(idx + query.length + 1)
      : composerText + `@${member.username}`
    setComposerText(replaced)
    setMentionQuery(null)
    setVisibility({ scope: 'direct', toUserId: member.userId })
  }

  function handleMentionBlur() {
    setTimeout(() => setMentionQuery(null), 100)
  }

  function handleComposerKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Escape') { setMentionQuery(null); return }
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() }
  }

  async function handleSend() {
    if (!composerText.trim() || streamStatus !== 'open' || isSending) return
    if (visibility.scope === 'direct' && !visibility.toUserId) return
    setIsSending(true)
    const optimisticMsg: CampaignMessage = {
      id: `pending-${Date.now()}`,
      campaignId,
      senderId: user?.userId ?? '',
      senderName: user?.username ?? user?.email ?? '',
      text: composerText,
      visibility,
      createdAt: new Date(),
    }
    setMessages(prev => [...prev, optimisticMsg])
    seenIds.current.add(optimisticMsg.id)

    try {
      const response = await fetch(`/api/campaigns/${campaignId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: composerText.trim(), visibility }),
      })
      if (response.ok) {
        setComposerText('')
        setVisibility({ scope: 'group' })
        setMentionQuery(null)
      }
    } catch {
      // keep composerText so user can retry
    } finally {
      setIsSending(false)
    }
  }

  // ── Collapsed pill ──
  if (!isExpanded) {
    return (
      <button
        ref={triggerRef}
        className="fixed bottom-4 right-4 z-40 bg-gray-800 border border-gray-700 rounded-full px-4 py-2 text-sm text-white hover:bg-gray-700 flex items-center gap-2"
        onClick={handleExpand}
      >
        Chat ›
        {unreadCount > 0 && (
          <span
            aria-label="unread messages"
            className="inline-flex items-center justify-center w-5 h-5 text-xs font-bold bg-red-500 text-white rounded-full"
          >
            {unreadCount}
          </span>
        )}
      </button>
    )
  }

  // ── Expanded drawer ──
  return (
    <div
      role="complementary"
      aria-label="Campaign Chat"
      className="fixed bottom-0 right-0 z-40 w-80 flex flex-col bg-gray-800 border-l border-t border-gray-700 rounded-tl-lg"
      style={{ height: '33vh' }}
    >
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700 flex-shrink-0">
        <span className="text-sm font-semibold text-white">Campaign Chat</span>
        <div className="flex items-center gap-2">
          <button
            aria-pressed={isPinned}
            aria-label={isPinned ? 'Unpin chat' : 'Pin chat open'}
            onClick={handlePinToggle}
            className="text-gray-400 hover:text-white"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path d="M11.5 3a1.5 1.5 0 00-3 0v3.586L6.293 8.793A1 1 0 006 9.5v1a1 1 0 001 1h2.5v4.5a.5.5 0 001 0v-4.5H13a1 1 0 001-1v-1a1 1 0 00-.293-.707L11.5 6.586V3z" />
            </svg>
          </button>
          <button
            aria-label="Collapse chat"
            onClick={() => dispatch({ type: 'COLLAPSE' })}
            className="text-gray-400 hover:text-white text-lg leading-none"
          >
            ×
          </button>
        </div>
      </div>
      <ChatFeed
        messages={messages}
        isLoadingHistory={isLoadingHistory}
        members={members}
        feedRef={feedRef}
      />
      <ChatComposer
        composerText={composerText}
        onTextChange={handleTextChange}
        onKeyDown={handleComposerKeyDown}
        visibility={visibility}
        onVisibilityChange={handleVisibilityChange}
        isSending={isSending}
        streamStatus={streamStatus}
        members={members}
        onSend={handleSend}
        onBlur={handleMentionBlur}
        mentionResults={mentionResults}
        onMentionSelect={handleMentionSelect}
        textareaRef={textareaRef}
      />
    </div>
  )
}
