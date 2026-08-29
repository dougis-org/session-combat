'use client'

import type { MessageVisibility } from '@/lib/types'
import { resolveUsername, type EnrichedMember } from './ChatFeed'

interface MentionDropdownProps {
  results: EnrichedMember[]
  onSelect: (member: EnrichedMember) => void
}

export function MentionDropdown({ results, onSelect }: MentionDropdownProps) {
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

export function ChatComposer({
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
          aria-label="Message visibility"
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
          aria-label="Message"
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
