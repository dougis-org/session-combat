'use client';

import { useMemo, useState } from 'react';
import type { CombatantState, StatusCondition } from '@/lib/types';
import type { DamageType } from '@/lib/constants';
import { applyHpChange } from '@/lib/combat/applyHpChange';
import { isValidHpAmount } from '@/lib/combat/hpAmount';
import { pushHpHistory } from '@/lib/utils/hpHistory';
import { TargetActionModal } from '@/lib/components/TargetActionModal';
import { TargetCheckboxColumn } from '@/lib/components/combatant-card/TargetCheckboxColumn';
import { TargetChip } from '@/lib/components/combatant-card/TargetChip';
import { parseConditionForm } from '@/lib/components/combatant-card/ConditionFormModal';

interface TargetingPanelProps {
  combatId: string;
  combatant: CombatantState;
  allCombatants?: CombatantState[];
  onUpdate: (updates: Partial<CombatantState>) => void;
  onUpdateCombatant?: (combatantId: string, updates: Partial<CombatantState>) => void;
  /** Whether the target-selection panel is open (trigger lives in the card action column). */
  showTargeting: boolean;
  onCloseTargeting: () => void;
}

/**
 * The "Add Target(s)" trigger, the Party/Enemies selection panel, the rendered
 * target chips with their hover tooltip, and the `TargetActionModal` wiring.
 * Cross-combatant damage routes through the shared `applyHpChange` orchestrator
 * so a target's life-state / concentration transitions match the self path.
 */
export function TargetingPanel({
  combatId,
  combatant,
  allCombatants,
  onUpdate,
  onUpdateCombatant,
  showTargeting,
  onCloseTargeting,
}: TargetingPanelProps) {
  const [selectedTargetId, setSelectedTargetId] = useState<string | null>(null);
  const [hoveredTargetId, setHoveredTargetId] = useState<string | null>(null);

  const combatantMap = useMemo(
    () => new Map(allCombatants?.map(c => [c.id, c])),
    [allCombatants]
  );

  const toggleTarget = (id: string, checked: boolean) => {
    onUpdate({
      targetIds: checked
        ? [...(combatant.targetIds ?? []), id]
        : (combatant.targetIds ?? []).filter(t => t !== id),
    });
  };

  const applyDamageToTarget = (damage: number, damageType: DamageType | '') => {
    const target = selectedTargetId ? combatantMap.get(selectedTargetId) : undefined;
    if (target && onUpdateCombatant && isValidHpAmount(damage)) {
      const result = applyHpChange(target, { kind: 'damage', amount: damage, damageType });
      onUpdateCombatant(target.id, result.updates);
      if (result.history) {
        pushHpHistory(combatId, target.id, { ...result.history, timestamp: Date.now() });
      }
    }
    setSelectedTargetId(null);
  };

  const addConditionToTarget = (name: string, duration?: number) => {
    const target = selectedTargetId ? combatantMap.get(selectedTargetId) : undefined;
    // Validate the name strictly; keep the condition but drop an out-of-range
    // duration rather than discarding the whole thing.
    const parsedName = parseConditionForm(name, '');
    if (target && onUpdateCombatant && parsedName) {
      const validDuration =
        duration != null && Number.isSafeInteger(duration) && duration >= 1 && duration <= 10_000
          ? duration
          : undefined;
      const condition: StatusCondition = {
        id: crypto.randomUUID(),
        name: parsedName.name,
        description: '',
        duration: validDuration,
      };
      onUpdateCombatant(target.id, { conditions: [...target.conditions, condition] });
    }
    setSelectedTargetId(null);
  };

  const selectedTarget = selectedTargetId
    ? allCombatants?.find(c => c.id === selectedTargetId)
    : null;

  return (
    <>
      {combatant.targetIds && combatant.targetIds.length > 0 && (
        <div className="mb-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm text-purple-400 font-semibold">Targets:</span>
            {combatant.targetIds.map(targetId => {
              const target = combatantMap.get(targetId);
              return target ? (
                <TargetChip
                  key={targetId}
                  target={target}
                  isHovered={hoveredTargetId === targetId}
                  onSelect={() => setSelectedTargetId(targetId)}
                  onHoverEnter={() => setHoveredTargetId(targetId)}
                  onHoverLeave={() => setHoveredTargetId(null)}
                />
              ) : null;
            })}
          </div>
        </div>
      )}

      {showTargeting && allCombatants && (
        <div className="mt-4 bg-gray-800 rounded p-4 border border-purple-600">
          <div className="flex justify-between items-center mb-3">
            <h4 className="text-sm font-semibold text-purple-300">Select targets for {combatant.name}</h4>
            <button
              onClick={onCloseTargeting}
              className="text-gray-400 hover:text-gray-300 text-lg"
            >
              ✕
            </button>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <TargetCheckboxColumn
              title="Enemies"
              textColor="text-red-300"
              targets={allCombatants.filter(c => c.id !== combatant.id && c.type !== 'player' && c.type !== 'lair')}
              selectedIds={combatant.targetIds ?? []}
              onToggle={toggleTarget}
            />
            <TargetCheckboxColumn
              title="Party"
              textColor="text-blue-300"
              targets={allCombatants.filter(c => c.id !== combatant.id && c.type === 'player')}
              selectedIds={combatant.targetIds ?? []}
              onToggle={toggleTarget}
            />
          </div>
        </div>
      )}

      {selectedTarget && (
        <TargetActionModal
          target={selectedTarget}
          onClose={() => setSelectedTargetId(null)}
          onApplyDamage={applyDamageToTarget}
          onAddCondition={addConditionToTarget}
        />
      )}
    </>
  );
}
