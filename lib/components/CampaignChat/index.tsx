'use client'

import { useEffect, useRef, useState } from 'react'
import { useAuth } from '@/lib/hooks/useAuth'
import { DicePoolPanel } from '@/lib/components/dice/DicePoolPanel'
import { DiceTriggerButton } from '@/lib/components/dice/DiceTriggerButton'
import { announcePresence, clearPresence } from '@/lib/dice/diceSessionBridge'
import { SceneComposer } from '@/lib/components/SceneComposer'
import type { CampaignMessage } from '@/lib/types'
import { useDockState } from './useDockState'
import { useChatFeed } from './useChatFeed'
import { useComposer } from './useComposer'
import { useMembers } from './useMembers'
import { useCampaignDice } from './useCampaignDice'
import { ChatFeed } from './ChatFeed'
import { ChatComposer } from './Composer'
import { DragHandle } from './DragHandle'

interface CampaignChatProps {
  campaignId: string
  activeSessionId?: string | null
  onSessionChange?: (activeSessionId: string | null) => void
  onSizeChange?: (isLarge: boolean) => void
}

export function CampaignChat({ campaignId, activeSessionId = null, onSessionChange, onSizeChange }: CampaignChatProps) {
  const { user } = useAuth()
  const triggerRef = useRef<HTMLButtonElement>(null)
  const drawerRef = useRef<HTMLDivElement>(null)
  const feedRef = useRef<HTMLDivElement>(null)
  const diceTriggerRef = useRef<HTMLButtonElement>(null)
  const dicePanelRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const dock = useDockState({ triggerRef, drawerRef, onSizeChange })
  const chatFeed = useChatFeed({
    campaignId, activeSessionId, isExpanded: dock.isExpanded,
    currentUserId: user?.userId, feedRef, onSessionChange,
  })

  const members = useMembers(campaignId)
  const [showSceneComposer, setShowSceneComposer] = useState(false)

  const isDM = members.some(m => m.userId === user?.userId && m.role === 'dm')

  const composer = useComposer({
    campaignId, streamStatus: chatFeed.streamStatus,
    currentUserId: user?.userId, currentUsername: user?.username, currentUserEmail: user?.email,
    members, setFeed: chatFeed.setFeed, seenIds: chatFeed.seenIds,
  })

  const { dicePool, isTriggerDisabled, isRolling, rollError, handleDiceRoll, handlePercentileRoll } = useCampaignDice({
    campaignId, activeSessionId, streamStatus: chatFeed.streamStatus,
    triggerRef: diceTriggerRef, panelRef: dicePanelRef,
  })

  // ── Dice session bridge: announce/clear presence in lockstep with our own active session ──
  useEffect(() => {
    if (activeSessionId === null) return
    announcePresence({ campaignId, sessionId: activeSessionId })
    return () => { clearPresence() }
  }, [campaignId, activeSessionId])

  function handleSceneSuccess(msg: CampaignMessage) {
    if (!chatFeed.seenIds.current.has(msg.id)) {
      chatFeed.seenIds.current.add(msg.id)
      chatFeed.setFeed(prev => [...prev, { kind: 'message', data: msg }])
    }
    setShowSceneComposer(false)
  }

  function handleExpand() {
    chatFeed.markOpened()
    dock.handleExpand()
  }

  // ── Collapsed pill ──
  if (!dock.isExpanded) {
    return (
      <button
        ref={triggerRef}
        className="fixed bottom-4 right-4 z-40 bg-gray-800 border border-gray-700 rounded-full px-4 py-2 text-sm text-white hover:bg-gray-700 flex items-center gap-2"
        onClick={handleExpand}
      >
        Chat ›
        {chatFeed.unreadCount > 0 && (
          <span
            aria-label="unread messages"
            className="inline-flex items-center justify-center w-5 h-5 text-xs font-bold bg-red-500 text-white rounded-full"
          >
            {chatFeed.unreadCount}
          </span>
        )}
      </button>
    )
  }

  // ── Expanded drawer ──
  const drawerStyle = { height: dock.resolvedHeight }
  const drawerClass = dock.isLarge
    ? 'h-full w-80 flex flex-col bg-gray-800 border-l border-gray-700'
    : 'w-80 flex flex-col bg-gray-800 border-l border-t border-gray-700 rounded-tl-lg'
  const rowWrapperClass = dock.isLarge
    ? 'h-full flex flex-row items-stretch'
    : 'fixed bottom-0 right-0 z-40 flex flex-row items-end'

  return (
    <div className={rowWrapperClass}>
      <DicePoolPanel dp={dicePool} panelRef={dicePanelRef} isRolling={isRolling} error={rollError} onRoll={handleDiceRoll} onRollPercentile={handlePercentileRoll} />
      <div
        ref={drawerRef}
        role="complementary"
        aria-label="Campaign Chat"
        className={drawerClass}
        style={drawerStyle}
      >
        {!dock.isLarge && (
          <DragHandle
            onDragStart={dock.handleDragStart}
            currentHeightPx={dock.customHeight ?? Math.round(window.innerHeight * 0.33)}
          />
        )}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700 flex-shrink-0">
          <span className="text-sm font-semibold text-white">Campaign Chat</span>
          <div className="flex items-center gap-2">
            <button
              aria-pressed={dock.isPinned}
              aria-label={dock.isPinned ? 'Unpin chat' : 'Pin chat open'}
              onClick={dock.handlePinToggle}
              className="text-gray-400 hover:text-white"
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path d="M11.5 3a1.5 1.5 0 00-3 0v3.586L6.293 8.793A1 1 0 006 9.5v1a1 1 0 001 1h2.5v4.5a.5.5 0 001 0v-4.5H13a1 1 0 001-1v-1a1 1 0 00-.293-.707L11.5 6.586V3z" />
              </svg>
            </button>
            <button
              aria-label={dock.isLarge ? 'Collapse to compact view' : 'Expand to full height'}
              onClick={dock.handleToggleSize}
              className="text-gray-400 hover:text-white"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
                {dock.isLarge ? (
                  <>
                    <path d="M5.5 1a.5.5 0 010 1H2.707l3.147 3.146a.5.5 0 01-.708.708L2 2.707V5.5a.5.5 0 01-1 0V1.5A.5.5 0 011.5 1H5.5z" />
                    <path d="M10.5 15a.5.5 0 010-1h2.793l-3.147-3.146a.5.5 0 01.708-.708L14 13.293V10.5a.5.5 0 011 0v4a.5.5 0 01-.5.5H10.5z" />
                  </>
                ) : (
                  <>
                    <path d="M1.5 1H5.5a.5.5 0 010 1H2.707l3.147 3.146a.5.5 0 01-.708.708L2 2.707V5.5a.5.5 0 01-1 0V1.5A.5.5 0 011.5 1z" />
                    <path d="M14.5 15H10.5a.5.5 0 010-1h2.793l-3.147-3.146a.5.5 0 01.708-.708L14 13.293V10.5a.5.5 0 011 0v4a.5.5 0 01-.5.5z" />
                  </>
                )}
              </svg>
            </button>
            <button
              aria-label="Collapse chat"
              onClick={dock.handleCollapse}
              className="text-gray-400 hover:text-white text-lg leading-none"
            >
              ×
            </button>
          </div>
        </div>
        <ChatFeed
          feed={chatFeed.feed}
          isLoadingHistory={chatFeed.isLoadingHistory}
          members={members}
          feedRef={feedRef}
          campaignId={campaignId}
        />
        {isDM && !showSceneComposer && (
          <div className="border-t border-gray-700 px-3 py-2 flex-shrink-0">
            <button
              type="button"
              onClick={() => setShowSceneComposer(true)}
              className="text-xs bg-yellow-700 hover:bg-yellow-600 text-white px-3 py-1 rounded"
            >
              Push Scene
            </button>
          </div>
        )}
        {isDM && showSceneComposer && (
          <SceneComposer
            campaignId={campaignId}
            onSuccess={handleSceneSuccess}
            onCancel={() => setShowSceneComposer(false)}
          />
        )}
        <ChatComposer
          composerText={composer.composerText}
          onTextChange={composer.handleTextChange}
          onKeyDown={composer.handleComposerKeyDown}
          visibility={composer.visibility}
          onVisibilityChange={composer.handleVisibilityChange}
          isSending={composer.isSending}
          streamStatus={chatFeed.streamStatus}
          members={members}
          onSend={composer.handleSend}
          onBlur={composer.handleMentionBlur}
          mentionResults={composer.mentionResults}
          onMentionSelect={composer.handleMentionSelect}
          textareaRef={textareaRef}
        />
        <div className="border-t border-gray-700 p-2 flex-shrink-0 flex items-center justify-between">
          {activeSessionId === null && (
            <p className="text-xs text-gray-500">No active session</p>
          )}
          <DiceTriggerButton dp={dicePool} isDisabled={isTriggerDisabled} triggerRef={diceTriggerRef} />
        </div>
      </div>
    </div>
  )
}
