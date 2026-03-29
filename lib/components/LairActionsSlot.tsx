'use client';

import React from 'react';
import type { CombatantState, CreatureAbility } from '@/lib/types';
import { useCharge, restoreCharge, restoreAllCharges } from '@/lib/utils/combat';

interface LairActionsSlotProps {
  combatant: CombatantState;
  onUpdate: (updates: Partial<CombatantState>) => void;
  onNextTurn: () => void;
  isActive: boolean;
}

export function LairActionsSlot({ combatant, onUpdate, onNextTurn, isActive }: LairActionsSlotProps) {
  const actions = combatant.lairActions ?? [];

  if (!isActive) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 bg-gray-800 rounded-lg border border-gray-600 text-sm text-gray-300">
        <span>🏰</span>
        <span className="font-semibold text-purple-300">{combatant.name}</span>
        <span className="text-gray-500 text-xs ml-auto">Lair — Init {combatant.initiative}</span>
      </div>
    );
  }

  const applyToAction = (fn: (a: CreatureAbility) => CreatureAbility, index: number) => {
    onUpdate({ lairActions: actions.map((a, i) => i === index ? fn(a) : { ...a }) });
  };

  const handleRestoreAll = () => {
    onUpdate({ lairActions: restoreAllCharges(actions) });
  };

  return (
    <div className="bg-purple-900 bg-opacity-30 border border-purple-700 rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span>🏰</span>
          <h3 className="font-bold text-purple-300 text-sm">{combatant.name}</h3>
          <span className="text-xs text-gray-400 uppercase tracking-wide">Lair Actions</span>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            data-testid="lair-action-restore-all"
            className="text-xs px-2 py-1 rounded bg-purple-700 hover:bg-purple-600 text-white"
            onClick={handleRestoreAll}
          >
            Restore All
          </button>
          <button
            type="button"
            data-testid="lair-action-skip"
            className="text-xs px-3 py-1 rounded bg-gray-600 hover:bg-gray-500 text-white"
            onClick={onNextTurn}
          >
            Skip
          </button>
        </div>
      </div>

      <div className="space-y-2">
        {actions.map((action, index) => {
          const hasCharges = action.usesRemaining !== undefined;
          const exhausted = hasCharges && action.usesRemaining === 0;
          const canUse = !hasCharges || (action.usesRemaining !== undefined && action.usesRemaining > 0);

          return (
            <div
              key={`${action.name}-${index}`}
              data-testid={`lair-action-${index}`}
              className={`text-xs rounded p-2 bg-gray-800 ${exhausted ? 'exhausted opacity-50' : ''}`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <p className={`font-bold text-white ${exhausted ? 'line-through' : ''}`}>{action.name}</p>
                  <p className="text-gray-300 mt-0.5">{action.description}</p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  {hasCharges && (
                    <>
                      <button
                        type="button"
                        data-testid={`lair-action-decrement-${index}`}
                        aria-label={`Decrease uses for ${action.name}`}
                        className="px-1.5 py-0.5 rounded bg-gray-700 hover:bg-gray-600 text-white"
                        onClick={() => applyToAction(useCharge, index)}
                      >
                        −
                      </button>
                      <span className="text-amber-400 font-bold min-w-4 text-center">
                        {action.usesRemaining}
                      </span>
                      <button
                        type="button"
                        data-testid={`lair-action-increment-${index}`}
                        aria-label={`Increase uses for ${action.name}`}
                        className="px-1.5 py-0.5 rounded bg-gray-700 hover:bg-gray-600 text-white"
                        onClick={() => applyToAction(restoreCharge, index)}
                      >
                        +
                      </button>
                    </>
                  )}
                  <button
                    type="button"
                    data-testid={`lair-action-use-${index}`}
                    className="text-xs px-2 py-1 rounded bg-purple-800 hover:bg-purple-700 text-white whitespace-nowrap disabled:opacity-40 disabled:cursor-not-allowed"
                    disabled={!canUse}
                    onClick={() => applyToAction(useCharge, index)}
                  >
                    Use
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
