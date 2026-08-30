'use client'

import { DIE_ICONS, DiceD10Icon } from '@/lib/components/icons/dice'
import type { DieSides } from '@/lib/utils/dice'

/** `'%'` selects the percentile variant (two d10 icons + the `d%` label). */
export type DieGlyphSides = DieSides | '%'

interface DieGlyphProps {
  sides: DieGlyphSides
}

/**
 * Presentational only: pairs a die's vendored icon(s) with its always-visible
 * `d{sides}` text label. The single home of the icon/label pairing shared by
 * every die control in the chat-dock panel and the global dice fab. No roll or
 * state logic lives here.
 */
export function DieGlyph({ sides }: DieGlyphProps) {
  const label = sides === '%' ? 'd%' : `d${sides}`
  const Icon = sides === '%' ? DiceD10Icon : DIE_ICONS[sides]
  return (
    <span className="flex flex-col items-center gap-0.5 leading-none">
      <span className="flex items-center">
        <Icon width={21} height={21} aria-hidden="true" />
        {sides === '%' && <Icon width={21} height={21} aria-hidden="true" />}
      </span>
      <span className="text-[10px] text-gray-300">{label}</span>
    </span>
  )
}
