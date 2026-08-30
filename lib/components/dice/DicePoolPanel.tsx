'use client'

import { DIE_SIDES } from '@/lib/utils/dice'
import { isRollVisibilityScope, type DicePoolState } from '@/lib/dice/useDicePoolState'
import { DiePoolButton } from './DiePoolButton'
import { PercentileButton } from './PercentileButton'

interface DicePoolPanelProps {
  dp: DicePoolState
  panelRef: React.RefObject<HTMLDivElement | null>
  isRolling: boolean
  error: string | null
  onRoll: () => void
  onRollPercentile: () => void
}

export function DicePoolPanel({ dp, panelRef, isRolling, error, onRoll, onRollPercentile }: DicePoolPanelProps) {
  if (!dp.isOpen) return null
  return (
    <div
      ref={panelRef}
      aria-label="Dice pool"
      className="bg-gray-800 border border-gray-700 rounded-lg shadow-xl p-3 w-64 flex-shrink-0 overflow-y-auto"
    >
      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap gap-1 items-center">
          {DIE_SIDES.map(sides => (
            <DiePoolButton
              key={sides}
              sides={sides}
              count={dp.pool[sides]}
              onAdd={dp.handleAdd}
              onRemove={dp.handleRemove}
              disabled={isRolling}
            />
          ))}
          <PercentileButton onRoll={onRollPercentile} disabled={isRolling} />
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
