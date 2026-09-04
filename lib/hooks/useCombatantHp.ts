'use client';

import { useCallback, useState } from 'react';
import type { CombatantState } from '@/lib/types';
import type { DamageType } from '@/lib/constants';
import { applyHpChange, type HpChangeIntent } from '@/lib/combat/applyHpChange';
import { parseHpAmount } from '@/lib/combat/hpAmount';
import { pushHpHistory, popHpHistory, getHpHistoryStack } from '@/lib/utils/hpHistory';

export interface UseCombatantHpArgs {
  combatId: string;
  combatant: CombatantState;
  onUpdate: (updates: Partial<CombatantState>) => void;
  onConSaveRequired?: (dc: number) => void;
  /** Called when a damage action transitions the combatant fresh into `dying`. */
  onEnteredDying?: () => void;
}

export interface UseCombatantHpResult {
  hpAdjustment: string;
  setHpAdjustment: (value: string) => void;
  isTempMode: boolean;
  setIsTempMode: (value: boolean) => void;
  selectedDamageType: DamageType | '';
  setSelectedDamageType: (type: DamageType | '') => void;
  canUndo: boolean;
  applyDamage: () => void;
  applyHeal: () => void;
  applySetTemp: () => void;
  undoHpChange: () => void;
}

/**
 * Owns the HP-adjustment UI state for one combatant card and performs the
 * `pushHpHistory` / `onConSaveRequired` plumbing around the pure `applyHpChange`
 * orchestrator. All transition logic lives in `applyHpChange`; this hook only
 * parses the field, wires side effects, and tracks the undo-history length.
 */
export function useCombatantHp({
  combatId,
  combatant,
  onUpdate,
  onConSaveRequired,
  onEnteredDying,
}: UseCombatantHpArgs): UseCombatantHpResult {
  const [hpAdjustment, setHpAdjustment] = useState('');
  const [isTempMode, setIsTempMode] = useState(false);
  const [selectedDamageType, setSelectedDamageType] = useState<DamageType | ''>('');
  const [historyLength, setHistoryLength] = useState(
    () => getHpHistoryStack(combatId, combatant.id).length
  );

  const run = useCallback(
    (kind: HpChangeIntent['kind']) => {
      const amount = parseHpAmount(hpAdjustment);
      if (amount === null) return;

      const result = applyHpChange(combatant, {
        kind,
        amount,
        damageType: selectedDamageType,
      });

      const hasUpdates = Object.keys(result.updates).length > 0;
      if (hasUpdates || kind !== 'setTemp') {
        onUpdate(result.updates);
      }

      if (result.history) {
        pushHpHistory(combatId, combatant.id, {
          ...result.history,
          timestamp: Date.now(),
        });
        setHistoryLength(getHpHistoryStack(combatId, combatant.id).length);
      }

      if (result.conSaveRequired !== undefined) {
        onConSaveRequired?.(result.conSaveRequired);
      }

      if (result.enteredDying) {
        onEnteredDying?.();
      }

      setHpAdjustment('');
    },
    [combatId, combatant, hpAdjustment, selectedDamageType, onUpdate, onConSaveRequired, onEnteredDying]
  );

  const applyDamage = useCallback(() => run('damage'), [run]);
  const applyHeal = useCallback(() => run('heal'), [run]);
  const applySetTemp = useCallback(() => run('setTemp'), [run]);

  const undoHpChange = useCallback(() => {
    const entry = popHpHistory(combatId, combatant.id);
    if (!entry) return;
    setHistoryLength(getHpHistoryStack(combatId, combatant.id).length);
    onUpdate({ hp: entry.hp, tempHp: entry.tempHp });
  }, [combatId, combatant.id, onUpdate]);

  return {
    hpAdjustment,
    setHpAdjustment,
    isTempMode,
    setIsTempMode,
    selectedDamageType,
    setSelectedDamageType,
    canUndo: historyLength > 0,
    applyDamage,
    applyHeal,
    applySetTemp,
    undoHpChange,
  };
}
