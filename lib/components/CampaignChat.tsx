'use client'

import { useState, useEffect } from 'react'
import { LocalStore } from '@/lib/offline/LocalStore'

const PIN_KEY = 'campaign-chat-pin'

export function CampaignChat() {
  const [isExpanded, setIsExpanded] = useState(false)
  const [isPinned, setIsPinned] = useState(false)

  useEffect(() => {
    const pinned = LocalStore.get<boolean>(PIN_KEY)
    if (pinned) {
      setIsExpanded(true)
      setIsPinned(true)
    }
  }, [])

  useEffect(() => {
    if (!isExpanded) return
    const handler = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsExpanded(false)
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [isExpanded])

  function handlePinToggle() {
    if (isPinned) {
      LocalStore.remove(PIN_KEY)
      setIsPinned(false)
    } else {
      try {
        LocalStore.set(PIN_KEY, true)
        setIsPinned(true)
      } catch {
        // StorageQuotaError: pin preference not persisted; drawer stays open
      }
    }
  }

  if (!isExpanded) {
    return (
      <button
        className="fixed bottom-4 right-4 z-40 bg-gray-800 border border-gray-700 rounded-full px-4 py-2 text-sm text-white hover:bg-gray-700"
        onClick={() => setIsExpanded(true)}
      >
        Chat ›
      </button>
    )
  }

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
            <svg
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="currentColor"
              aria-hidden="true"
            >
              <path d="M10 2a1 1 0 011 1v1.07A6.002 6.002 0 0115.93 9H17a1 1 0 010 2h-1.07A6.002 6.002 0 0111 15.93V17a1 1 0 01-2 0v-1.07A6.002 6.002 0 014.07 11H3a1 1 0 010-2h1.07A6.002 6.002 0 019 4.07V3a1 1 0 011-1z" />
            </svg>
          </button>
          <button
            aria-label="Collapse chat"
            onClick={() => setIsExpanded(false)}
            className="text-gray-400 hover:text-white text-lg leading-none"
          >
            ×
          </button>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-4">
        <p className="text-gray-500 text-sm">No messages yet.</p>
      </div>
    </div>
  )
}
