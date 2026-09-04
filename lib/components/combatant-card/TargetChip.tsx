'use client';

import type { CombatantState } from '@/lib/types';
import { lifeStateDisplay } from '@/lib/combat/deathSaves';

interface TargetChipProps {
  target: CombatantState;
  isHovered: boolean;
  onSelect: () => void;
  onHoverEnter: () => void;
  onHoverLeave: () => void;
}

/**
 * One target's clickable chip plus its hover tooltip (AC, HP, life-state,
 * conditions). Split out of `TargetingPanel` so the chip's own conditionals
 * (life-state badge, condition list, duration suffix) don't inflate the
 * complexity of the panel's target-list render.
 */
export function TargetChip({ target, isHovered, onSelect, onHoverEnter, onHoverLeave }: TargetChipProps) {
  const targetLife = lifeStateDisplay(target);

  return (
    <div className="relative inline-block">
      <button
        onClick={onSelect}
        onMouseEnter={onHoverEnter}
        onMouseLeave={onHoverLeave}
        className={`px-2 py-1 rounded text-xs font-semibold cursor-pointer transition-all hover:opacity-80 ${target.type === 'player' ? 'bg-blue-600 hover:bg-blue-700 text-blue-100' : 'bg-red-600 hover:bg-red-700 text-red-100'}`}
      >
        {target.name}
      </button>
      {isHovered && (
        <div className="absolute bottom-full left-0 mb-2 bg-gray-900 border border-gray-700 rounded shadow-lg pointer-events-none z-50 min-w-max">
          <div className="px-3 py-2 space-y-1">
            <div className="text-xs text-gray-400">
              <div>AC: {target.ac}</div>
              <div className="flex items-center gap-1">
                HP: <span className={target.hp === 0 ? 'text-red-400' : 'text-gray-300'}>{target.hp}/{target.maxHp}</span>
                {targetLife.badge && (
                  <span
                    className={`text-xs font-semibold ${target.lifeState === 'dead' || !target.lifeState ? 'text-red-400' : 'text-gray-300'}`}
                    data-testid="target-life-state"
                  >
                    {targetLife.badge}
                  </span>
                )}
              </div>
            </div>
            {target.conditions.length > 0 && (
              <div className="text-xs space-y-1 pt-1">
                {target.conditions.map((condition) => (
                  <div key={condition.id} className="text-yellow-400">
                    • {condition.name}
                    {condition.duration && ` (${condition.duration})`}
                  </div>
                ))}
              </div>
            )}
            <div className="border-t border-gray-600 mt-2 pt-2 text-xs text-gray-400 italic">
              Click to apply damage or add condition
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
