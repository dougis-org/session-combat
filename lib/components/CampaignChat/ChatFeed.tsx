'use client'

import { DiceD20Icon } from '@/lib/components/icons/dice'
import { SceneFeedItem } from '@/lib/components/SceneFeedItem'
import type { CampaignMessage, CampaignRoll, MessageVisibility } from '@/lib/types'
import type { FeedItem } from './useChatFeed'

export interface EnrichedMember {
  id: string
  userId: string
  username: string
  role: string
  status: string
}

export function resolveUsername(members: EnrichedMember[], toUserId: string): string {
  return members.find(m => m.userId === toUserId)?.username ?? toUserId
}

export function getVisibilityMarker(members: EnrichedMember[], visibility: MessageVisibility): string | null {
  if (visibility.scope === 'dm-only') return '[DM]'
  if (visibility.scope === 'direct') return `[→ @${resolveUsername(members, visibility.toUserId)}]`
  return null
}

function RollFeedItem({ roll }: { roll: CampaignRoll }) {
  const ts = new Date(roll.createdAt).toLocaleTimeString()
  const breakdown = `[${roll.rolls.join(', ')}]`
  const dmMarker = roll.visibility.scope === 'dm-only' ? '[DM]' : null

  return (
    <div className="text-sm text-gray-200 bg-gray-700/50 rounded px-2 py-1.5">
      <div className="flex items-center gap-1 flex-wrap">
        <DiceD20Icon width={14} height={14} aria-hidden="true" />
        <span className="font-semibold text-white">{roll.rollerName}</span>
        <span className="text-gray-500 text-xs">{ts}</span>
        {dmMarker && <span className="ml-1 text-xs text-yellow-400">{dmMarker}</span>}
      </div>
      <div className="mt-0.5 text-gray-300">
        {roll.formula} → {breakdown} = <span className="font-bold text-white">{roll.total}</span>
      </div>
    </div>
  )
}

function ChatMessageItem({ msg, members }: { msg: CampaignMessage; members: EnrichedMember[] }) {
  const marker = getVisibilityMarker(members, msg.visibility)
  const ts = new Date(msg.createdAt).toLocaleTimeString()
  return (
    <div className="text-sm text-gray-200">
      <span className="font-semibold text-white">{msg.senderName}</span>
      {' '}
      <span className="text-gray-500 text-xs">{ts}</span>
      {marker && <span className="ml-1 text-xs text-yellow-400">{marker}</span>}
      <div className="mt-0.5 text-gray-300">{msg.text}</div>
    </div>
  )
}

interface ChatFeedProps {
  feed: FeedItem[]
  isLoadingHistory: boolean
  members: EnrichedMember[]
  feedRef: React.RefObject<HTMLDivElement | null>
  campaignId: string
}

export function ChatFeed({ feed, isLoadingHistory, members, feedRef, campaignId }: ChatFeedProps) {
  return (
    <div ref={feedRef} className="flex-1 overflow-y-auto p-4 flex flex-col gap-2">
      {isLoadingHistory && (
        <div className="text-center text-xs text-gray-500 py-1">Loading…</div>
      )}
      {feed.length === 0 && !isLoadingHistory && (
        <p className="text-gray-500 text-sm">No messages yet.</p>
      )}
      {feed.map(item => {
        if (item.kind === 'roll') return <RollFeedItem key={item.data.id} roll={item.data} />
        const msg = item.data
        if (msg.kind === 'scene') return <SceneFeedItem key={msg.id} message={msg} campaignId={campaignId} />
        return <ChatMessageItem key={msg.id} msg={msg} members={members} />
      })}
    </div>
  )
}
