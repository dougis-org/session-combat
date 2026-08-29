'use client'

import { DieGlyph } from './DieGlyph'

interface PercentileButtonProps {
  onRoll: () => void
  /** Disables the control on the same terms as the pool "Roll" commit control. */
  disabled?: boolean
}

/**
 * Standalone percentile (d%) control: a single button rendering the `DieGlyph`
 * `d%` variant. No staged count, no remove affordance — it is not a poolable
 * die. Fires exactly one `onRoll` per click.
 */
export function PercentileButton({ onRoll, disabled = false }: PercentileButtonProps) {
  return (
    <button
      type="button"
      onClick={onRoll}
      disabled={disabled}
      aria-label="Roll percentile (d%)"
      className="text-xs bg-gray-700 hover:bg-gray-600 disabled:opacity-50 text-white px-2 py-1 rounded flex items-center"
    >
      <DieGlyph sides="%" />
    </button>
  )
}
