'use client'

import { MAX_PER_DIE, type DieSides } from '@/lib/utils/dice'
import { DieGlyph } from './DieGlyph'

interface DiePoolButtonProps {
  sides: DieSides
  count: number
  onAdd: (sides: DieSides) => void
  onRemove: (sides: DieSides) => void
  /** Disables both controls (e.g. while a roll is in flight). */
  disabled?: boolean
}

/**
 * A single pool die control: a `Remove d{sides}` button, then an `Add d{sides}`
 * button wrapping the shared `DieGlyph` with a `×{count}` staged-count badge.
 * Holds no roll logic — the parent supplies `onAdd` / `onRemove`. Carries no
 * `title` tooltip: the visible label in `DieGlyph` supersedes it.
 */
export function DiePoolButton({ sides, count, onAdd, onRemove, disabled = false }: DiePoolButtonProps) {
  return (
    <div className="flex items-center gap-0.5">
      <button
        type="button"
        onClick={() => onRemove(sides)}
        disabled={disabled}
        aria-label={`Remove d${sides}`}
        className="text-xs bg-gray-700 hover:bg-gray-600 disabled:opacity-50 text-white w-5 h-5 rounded"
      >
        −
      </button>
      <button
        type="button"
        onClick={() => onAdd(sides)}
        disabled={disabled || count >= MAX_PER_DIE}
        aria-label={`Add d${sides}`}
        className="text-xs bg-gray-700 hover:bg-gray-600 disabled:opacity-50 text-white px-2 py-1 rounded flex items-center gap-1"
      >
        <DieGlyph sides={sides} />
        <span>×{count}</span>
      </button>
    </div>
  )
}
