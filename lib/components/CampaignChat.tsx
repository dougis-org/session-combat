'use client'

import { useReducer, useEffect, useRef } from 'react'
import { LocalStore } from '@/lib/offline/LocalStore'

const PIN_KEY = 'campaign-chat-pin'

type DockState = { isExpanded: boolean; isPinned: boolean }
type DockAction =
  | { type: 'INIT'; pinned: boolean }
  | { type: 'EXPAND' }
  | { type: 'COLLAPSE' }
  | { type: 'PIN' }
  | { type: 'UNPIN' }

function dockReducer(state: DockState, action: DockAction): DockState {
  switch (action.type) {
    case 'INIT':
      return { isExpanded: action.pinned, isPinned: action.pinned }
    case 'EXPAND':
      return { ...state, isExpanded: true }
    case 'COLLAPSE':
      return { ...state, isExpanded: false }
    case 'PIN':
      return { ...state, isPinned: true }
    case 'UNPIN':
      return { ...state, isPinned: false }
  }
}

export function CampaignChat() {
  const [{ isExpanded, isPinned }, dispatch] = useReducer(dockReducer, {
    isExpanded: false,
    isPinned: false,
  })
  const triggerRef = useRef<HTMLButtonElement>(null)
  const isMounted = useRef(false)

  useEffect(() => {
    let pinned = false
    try {
      pinned = !!LocalStore.get<boolean>(PIN_KEY)
    } catch {
      // storage unavailable: start collapsed
    }
    dispatch({ type: 'INIT', pinned })
  }, [])

  // Restore focus to the pill after the drawer closes. Skip on initial mount
  // so we don't steal focus when the page first loads or auto-expands from pin.
  useEffect(() => {
    if (!isMounted.current) {
      isMounted.current = true
      return
    }
    if (!isExpanded) {
      triggerRef.current?.focus()
    }
  }, [isExpanded])

  useEffect(() => {
    if (!isExpanded) return
    const handler = (event: KeyboardEvent) => {
      if (event.key === 'Escape') dispatch({ type: 'COLLAPSE' })
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [isExpanded])

  function handlePinToggle() {
    if (isPinned) {
      try {
        LocalStore.remove(PIN_KEY)
      } catch {
        // storage unavailable: pin cleared in memory only
      }
      dispatch({ type: 'UNPIN' })
    } else {
      try {
        LocalStore.set(PIN_KEY, true)
        dispatch({ type: 'PIN' })
      } catch {
        // StorageQuotaError: pin preference not persisted; drawer stays open
      }
    }
  }

  if (!isExpanded) {
    return (
      <button
        ref={triggerRef}
        className="fixed bottom-4 right-4 z-40 bg-gray-800 border border-gray-700 rounded-full px-4 py-2 text-sm text-white hover:bg-gray-700"
        onClick={() => dispatch({ type: 'EXPAND' })}
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
      <div className="flex-1 overflow-y-auto p-4">
        <p className="text-gray-500 text-sm">No messages yet.</p>
      </div>
    </div>
  )
}
