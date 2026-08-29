'use client'

import { useState } from 'react'
import type { CampaignMessage, MessageVisibility } from '@/lib/types'
import type { EnrichedMember } from './ChatFeed'
import type { FeedItem } from './useChatFeed'

interface UseComposerArgs {
  campaignId: string
  streamStatus: 'connecting' | 'open' | 'error'
  currentUserId: string | undefined
  currentUsername: string | undefined
  currentUserEmail: string | undefined
  members: EnrichedMember[]
  setFeed: (updater: (prev: FeedItem[]) => FeedItem[]) => void
  seenIds: React.RefObject<Set<string>>
}

export function useComposer({
  campaignId, streamStatus, currentUserId, currentUsername, currentUserEmail,
  members, setFeed, seenIds,
}: UseComposerArgs) {
  const [composerText, setComposerText] = useState('')
  const [visibility, setVisibility] = useState<MessageVisibility>({ scope: 'group' })
  const [isSending, setIsSending] = useState(false)
  const [mentionQuery, setMentionQuery] = useState<string | null>(null)

  const mentionResults = mentionQuery !== null
    ? members.filter(m => m.status === 'active' && m.username.toLowerCase().startsWith(mentionQuery.toLowerCase()))
    : []

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
      senderId: currentUserId ?? '',
      senderName: currentUsername ?? currentUserEmail ?? '',
      text: composerText,
      visibility,
      createdAt: new Date(),
    }
    setFeed(prev => [...prev, { kind: 'message', data: optimisticMsg }])
    seenIds.current.add(optimisticMsg.id)

    try {
      const response = await fetch(`/api/campaigns/${encodeURIComponent(campaignId)}/messages`, {
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

  return {
    composerText, visibility, isSending, mentionResults,
    handleTextChange, handleVisibilityChange, handleMentionSelect, handleMentionBlur,
    handleComposerKeyDown, handleSend,
  }
}
