'use client';

import { useMemo, useState } from 'react';
import type { CombatantState, StatusCondition } from '@/lib/types';
import type { DamageType } from '@/lib/constants';
import { lifeStateDisplay } from '@/lib/combat/deathSaves';
import { applyHpChange } from '@/lib/combat/applyHpChange';
import { isValidHpAmount } from '@/lib/combat/hpAmount';
import { pushHpHistory } from '@/lib/utils/hpHistory';
import { TargetActionModal } from '@/lib/components/TargetActionModal';
import { TargetCheckboxColumn } from '@/lib/components/combatant-card/TargetCheckboxColumn';
import { parseConditionForm } from '@/lib/components/combatant-card/ConditionFormModal';

interface TargetingPanelProps {
  combatId: string;
  combatant: CombatantState;
  allCombatants?: CombatantState[];
  onUpdate: (updates: Partial<CombatantState>) => void;
  onUpdateCombatant?: (combatantId: string, updates: Partial<CombatantState>) => void;
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
}: TargetingPanelProps) {
  const [showTargeting, setShowTargeting] = useState(false);
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
    if (!selectedTargetId || !onUpdateCombatant || !isValidHpAmount(damage)) return;
    const target = combatantMap.get(selectedTargetId);
    if (target) {
      const result = applyHpChange(target, { kind: 'damage', amount: damage, damageType });
      onUpdateCombatant(selectedTargetId, result.updates);
      if (result.history) {
        pushHpHistory(combatId, target.id, { ...result.history, timestamp: Date.now() });
      }
    }
    setSelectedTargetId(null);
  };

  const addConditionToTarget = (name: string, duration?: number) => {
    if (!selectedTargetId || !onUpdateCombatant) return;
    const target = combatantMap.get(selectedTargetId);
    const parsed = parseConditionForm(name, duration != null ? String(duration) : '');
    if (target && parsed) {
      const condition: StatusCondition = {
        id: crypto.randomUUID(),
        name: parsed.name,
        description: '',
        duration: parsed.duration,
      };
      onUpdateCombatant(selectedTargetId, { conditions: [...target.conditions, condition] });
    }
    setSelectedTargetId(null);
  };

  const selectedTarget = selectedTargetId
    ? allCombatants?.find(c => c.id === selectedTargetId)
    : null;

  return (
    <>
      <button
        onClick={() => setShowTargeting(!showTargeting)}
        className="bg-orange-600 hover:bg-orange-700 px-2 py-1 rounded text-xs self-start"
        title="Set targets for this combatant"
      >
        Add Target(s)
      </button>

      {combatant.targetIds && combatant.targetIds.length > 0 && (
        <div className="mb-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm text-purple-400 font-semibold">Targets:</span>
            {combatant.targetIds.map(targetId => {
              const target = combatantMap.get(targetId);
              const targetLife = target ? lifeStateDisplay(target) : null;
              return target ? (
                <div key={targetId} className="relative inline-block">
                  <button
                    onClick={() => setSelectedTargetId(targetId)}
                    onMouseEnter={() => setHoveredTargetId(targetId)}
                    onMouseLeave={() => setHoveredTargetId(null)}
                    className={`px-2 py-1 rounded text-xs font-semibold cursor-pointer transition-all hover:opacity-80 ${target.type === 'player' ? 'bg-blue-600 hover:bg-blue-700 text-blue-100' : 'bg-red-600 hover:bg-red-700 text-red-100'}`}
                  >
                    {target.name}
                  </button>
                  {hoveredTargetId === targetId && (
                    <div className="absolute bottom-full left-0 mb-2 bg-gray-900 border border-gray-700 rounded shadow-lg pointer-events-none z-50 min-w-max">
                      <div className="px-3 py-2 space-y-1">
                        <div className="text-xs text-gray-400">
                          <div>AC: {target.ac}</div>
                          <div className="flex items-center gap-1">
                            HP: <span className={target.hp === 0 ? 'text-red-400' : 'text-gray-300'}>{target.hp}/{target.maxHp}</span>
                            {targetLife?.badge && (
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
              onClick={() => setShowTargeting(false)}
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
