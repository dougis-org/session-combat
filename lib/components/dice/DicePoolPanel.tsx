'use client'

import { DIE_SIDES, MAX_PER_DIE } from '@/lib/utils/dice'
import { DIE_ICONS } from '@/lib/components/icons/dice'
import { isRollVisibilityScope, type DicePoolState } from '@/lib/dice/useDicePoolState'

interface DicePoolPanelProps {
  dp: DicePoolState
  panelRef: React.RefObject<HTMLDivElement | null>
  isRolling: boolean
  error: string | null
  onRoll: () => void
}

export function DicePoolPanel({ dp, panelRef, isRolling, error, onRoll }: DicePoolPanelProps) {
  if (!dp.isOpen) return null
  return (
    <div
      ref={panelRef}
      aria-label="Dice pool"
      className="bg-gray-800 border border-gray-700 rounded-lg shadow-xl p-3 w-64 flex-shrink-0 overflow-y-auto"
    >
      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap gap-1 items-center">
          {DIE_SIDES.map(sides => {
            const Icon = DIE_ICONS[sides]
            return (
              <div key={sides} className="flex items-center gap-0.5">
                <button
                  type="button"
                  onClick={() => dp.handleRemove(sides)}
                  disabled={isRolling}
                  aria-label={`Remove d${sides}`}
                  className="text-xs bg-gray-700 hover:bg-gray-600 disabled:opacity-50 text-white w-5 h-5 rounded"
                >
                  −
                </button>
                <button
                  type="button"
                  onClick={() => dp.handleAdd(sides)}
                  disabled={isRolling || dp.pool[sides] >= MAX_PER_DIE}
                  aria-label={`Add d${sides}`}
                  title={`d${sides}`}
                  className="text-xs bg-gray-700 hover:bg-gray-600 disabled:opacity-50 text-white px-2 py-1 rounded flex items-center gap-1"
                >
                  <Icon width={21} height={21} aria-hidden="true" />
                  ×{dp.pool[sides]}
                </button>
              </div>
            )
          })}
        </div>
        <div className="flex gap-1 items-center">
          <input
            type="text"
            inputMode="numeric"
            value={dp.modifierText}
            onChange={e => {
              const v = e.target.value
              if (v === '' || v === '-' || /^-?\d{1,3}$/.test(v)) dp.setModifierText(v)
            }}
            disabled={isRolling}
            aria-label="Modifier"
            className="w-14 text-xs bg-gray-700 border border-gray-600 text-white rounded px-1 py-0.5 disabled:opacity-50"
          />
          <select
            value={dp.visibility.scope}
            onChange={e => { if (isRollVisibilityScope(e.target.value)) dp.setVisibility({ scope: e.target.value }) }}
            disabled={isRolling}
            aria-label="Roll visibility"
            className="text-xs bg-gray-700 border border-gray-600 text-white rounded px-1 py-0.5 disabled:opacity-50"
          >
            <option value="group">Group</option>
            <option value="dm-only">DM-only</option>
          </select>
        </div>
        <button
          type="button"
          onClick={onRoll}
          disabled={dp.poolTotal === 0 || isRolling}
          className="text-xs bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white px-3 py-1 rounded"
        >
          Roll
        </button>
        {error && <p className="text-xs text-red-400">{error}</p>}
      </div>
    </div>
  )
}
