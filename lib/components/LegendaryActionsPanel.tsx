'use client';

import React from 'react';
import { CombatantState } from '@/lib/types';
import {
  useLegendaryAction as calcUseLegendaryAction,
  resetLegendaryActions,
  decrementLegendaryPool,
  incrementLegendaryPool,
} from '@/lib/utils/combat';

interface LegendaryActionsPanelProps {
  combatant: CombatantState;
  onUpdate: (updates: Partial<CombatantState>) => void;
}

export function LegendaryActionsPanel({ combatant, onUpdate }: LegendaryActionsPanelProps) {
  if (!combatant.legendaryActions || combatant.legendaryActions.length === 0) return null;

  const rawCount = combatant.legendaryActionCount ?? 0;
  const lacCount = Number.isFinite(rawCount) ? Math.max(0, Math.trunc(rawCount)) : 0;
  const rawRemaining = combatant.legendaryActionsRemaining ?? lacCount;
  const lacRemaining = Number.isFinite(rawRemaining) ? Math.max(0, Math.min(Math.trunc(rawRemaining), lacCount)) : 0;

  const handleDecrementPool = () => onUpdate(decrementLegendaryPool(lacCount, lacRemaining));
  const handleIncrementPool = () => onUpdate(incrementLegendaryPool(lacCount, lacRemaining));

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <p className="text-gray-400 text-sm font-semibold">
          LEGENDARY ACTIONS
          {lacCount > 0 && (
            <span className="text-amber-400 ml-1">
              — ⚡ {lacRemaining} remaining
            </span>
          )}
        </p>
        {lacCount > 0 && (
          <button
            type="button"
            className="text-xs px-2 py-1 rounded bg-amber-700 hover:bg-amber-600 text-white"
            data-testid="legendary-action-restore"
            onClick={() => onUpdate(resetLegendaryActions(lacCount))}
          >
            Restore All
          </button>
        )}
      </div>
      <div className="flex items-center gap-2 mb-3" data-testid="legendary-action-pool-editor">
        <span className="text-xs text-gray-400">Pool:</span>
        <button
          type="button"
          aria-label="Decrease legendary action pool"
          className="px-2 py-0.5 rounded bg-gray-700 hover:bg-gray-600 text-white text-sm"
          onClick={handleDecrementPool}
        >
          −
        </button>
        <span className="text-sm font-bold text-amber-400 min-w-6 text-center">{lacCount}</span>
        <button
          type="button"
          aria-label="Increase legendary action pool"
          className="px-2 py-0.5 rounded bg-gray-700 hover:bg-gray-600 text-white text-sm"
          onClick={handleIncrementPool}
        >
          +
        </button>
      </div>
      <div className="space-y-2">
        {combatant.legendaryActions.map((action, index) => {
          const rawCost = action.cost ?? 1;
          const cost = Number.isFinite(rawCost) && rawCost > 0 ? Math.trunc(rawCost) : 1;
          const canUse = lacCount > 0 && lacRemaining >= cost;
          return (
            <div key={action.name} className="text-xs">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-bold text-white">{action.name}</p>
                  <p className="text-gray-300">{action.description}</p>
                </div>
                {lacCount > 0 && (
                  <button
                    type="button"
                    className="text-xs px-2 py-1 rounded bg-amber-800 hover:bg-amber-700 text-white whitespace-nowrap disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
                    data-testid={`legendary-action-use-${index}`}
                    disabled={!canUse}
                    onClick={() => onUpdate(calcUseLegendaryAction(lacRemaining, cost))}
                  >
                    Use — {cost} ⚡
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
