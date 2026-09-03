'use client';

import { useState } from 'react';
import type { CombatantState, StatusCondition } from '@/lib/types';
import { ConditionFormModal } from '@/lib/components/combatant-card/ConditionFormModal';

interface ConditionControlsProps {
  combatant: CombatantState;
  onUpdate: (updates: Partial<CombatantState>) => void;
}

/**
 * The "Add Condition" trigger (opening `ConditionFormModal` — no `window.prompt`),
 * the conditions list with its expand/collapse toggle, and per-condition remove
 * buttons for the current combatant.
 */
export function ConditionControls({ combatant, onUpdate }: ConditionControlsProps) {
  const [showConditions, setShowConditions] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  const addCondition = (condition: StatusCondition) => {
    onUpdate({ conditions: [...combatant.conditions, condition] });
  };

  const removeCondition = (conditionId: string) => {
    onUpdate({ conditions: combatant.conditions.filter(c => c.id !== conditionId) });
  };

  return (
    <>
      <button
        onClick={() => setModalOpen(true)}
        className="bg-purple-600 hover:bg-purple-700 px-2 py-1 rounded text-xs self-start"
      >
        Add Condition
      </button>

      {combatant.conditions.length > 0 && (
        <div className="mb-2">
          <button
            onClick={() => setShowConditions(!showConditions)}
            className="text-sm text-blue-400 hover:text-blue-300"
          >
            Conditions ({combatant.conditions.length})
          </button>
          {showConditions && (
            <div className="mt-2 space-y-1">
              {combatant.conditions.map(condition => (
                <div key={condition.id} className="bg-gray-700 rounded px-2 py-1 text-sm flex justify-between items-center">
                  <span>
                    {condition.name}
                    {condition.duration && ` (${condition.duration} rounds)`}
                  </span>
                  <button
                    onClick={() => removeCondition(condition.id)}
                    className="text-red-400 hover:text-red-300 text-xs"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {modalOpen && (
        <ConditionFormModal
          combatantName={combatant.name}
          onSubmit={addCondition}
          onClose={() => setModalOpen(false)}
        />
      )}
    </>
  );
}
