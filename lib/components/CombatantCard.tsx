'use client';

import { useState } from 'react';
import type { CombatantState } from '@/lib/types';
import { usesDeathSaves, applyDeathSaveRoll, toggleDeathSaveSlot, lifeStateDisplay } from '@/lib/combat/deathSaves';
import type { DeathSaveKind, DeathSaveSlotIndex } from '@/lib/combat/deathSaves';
import { DeathSaveTracker } from '@/lib/components/DeathSaveTracker';
import { rollDie } from '@/lib/utils/dice';
import { useCombatantHp } from '@/lib/hooks/useCombatantHp';
import { CombatantCardHeader, InitiativeControl } from '@/lib/components/combatant-card/CombatantCardHeader';
import { HpControls, HealthBar } from '@/lib/components/combatant-card/HpControls';
import { DamageEffectsPanel } from '@/lib/components/combatant-card/DamageEffectsPanel';
import { ConditionControls } from '@/lib/components/combatant-card/ConditionControls';
import { TargetingPanel } from '@/lib/components/combatant-card/TargetingPanel';

export interface CombatantCardProps {
  combatId: string;
  combatant: CombatantState;
  isActive: boolean;
  onUpdate: (updates: Partial<CombatantState>) => void;
  onRemove: () => void;
  onNextTurn?: () => void;
  onShowDetails?: (combatantId: string, position: { top: number; left: number }, options?: { focusSection?: 'legendary' }) => void;
  onSetInitiative?: (combatantId: string) => void;
  onShowRemoveConfirm?: (combatantId: string, position: { top: number; left: number }) => void;
  allCombatants?: CombatantState[];
  onUpdateCombatant?: (combatantId: string, updates: Partial<CombatantState>) => void;
  onConSaveRequired?: (dc: number) => void;
}

/**
 * Composition layer for one combatant in an active combat. Holds no HP, damage,
 * condition, or targeting business logic of its own: transition logic lives in
 * `lib/combat/`, HP-adjustment UI state in `useCombatantHp`, and the sub-panels
 * in `lib/components/combatant-card/`.
 */
export function CombatantCard(props: CombatantCardProps) {
  const {
    combatId,
    combatant,
    isActive,
    onUpdate,
    onRemove,
    onNextTurn,
    onShowDetails,
    onSetInitiative,
    onShowRemoveConfirm,
    allCombatants,
    onUpdateCombatant,
    onConSaveRequired,
  } = props;

  const hp = useCombatantHp({ combatId, combatant, onUpdate, onConSaveRequired });
  const [deathSaveNote, setDeathSaveNote] = useState<string | null>(null);

  const handleDeathSaveToggle = (kind: DeathSaveKind, index: DeathSaveSlotIndex) => {
    setDeathSaveNote(null);
    onUpdate(toggleDeathSaveSlot(combatant, kind, index));
  };

  const handleDeathSaveRoll = (): number => {
    const d20 = rollDie(20)[0];
    const { note, ...updates } = applyDeathSaveRoll(combatant, d20);
    setDeathSaveNote(note ?? null);
    onUpdate(updates);
    return d20;
  };

  const bgStyle = combatant.type === 'player'
    ? { backgroundImage: 'linear-gradient(to right, rgba(96, 165, 250, 0.18), rgba(96, 165, 250, 0.02))' }
    : { backgroundImage: 'linear-gradient(to right, rgba(239, 68, 68, 0.18), rgba(239, 68, 68, 0.02))' };

  const life = lifeStateDisplay(combatant);

  return (
    <div style={bgStyle} className={`rounded-lg px-4 py-4 ${isActive ? 'border-2 border-yellow-500' : 'border border-gray-700'} ${life.greyed ? 'opacity-50' : ''}`} data-testid="combatant-card" data-life-state={combatant.lifeState ?? 'active'} aria-current={isActive ? 'step' : undefined}>
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <div className="flex items-center gap-4 mb-2">
            <CombatantCardHeader
              combatant={combatant}
              isActive={isActive}
              onRemove={onRemove}
              onNextTurn={onNextTurn}
              onShowDetails={onShowDetails}
              onShowRemoveConfirm={onShowRemoveConfirm}
            />
            <HpControls
              hpAdjustment={hp.hpAdjustment}
              setHpAdjustment={hp.setHpAdjustment}
              isTempMode={hp.isTempMode}
              setIsTempMode={hp.setIsTempMode}
              selectedDamageType={hp.selectedDamageType}
              setSelectedDamageType={hp.setSelectedDamageType}
              canUndo={hp.canUndo}
              applyDamage={hp.applyDamage}
              applyHeal={hp.applyHeal}
              applySetTemp={hp.applySetTemp}
              undoHpChange={hp.undoHpChange}
            />
            <InitiativeControl combatant={combatant} onSetInitiative={onSetInitiative} />
          </div>

          <HealthBar combatant={combatant} />

          <DamageEffectsPanel
            activeEffects={combatant.activeDamageEffects ?? []}
            statImmunities={combatant.damageImmunities ?? []}
            statResistances={combatant.damageResistances ?? []}
            statVulnerabilities={combatant.damageVulnerabilities ?? []}
            selectedDamageType={hp.selectedDamageType}
            onUpdate={onUpdate}
          />

          {usesDeathSaves(combatant) && life.showTracker && (
            <DeathSaveTracker
              successes={combatant.deathSaves?.successes ?? 0}
              failures={combatant.deathSaves?.failures ?? 0}
              onToggle={handleDeathSaveToggle}
              onRoll={handleDeathSaveRoll}
            />
          )}

          {deathSaveNote && (
            <div className="mt-1 text-xs text-green-300 font-semibold" data-testid="death-save-note">
              {deathSaveNote}
            </div>
          )}

          {combatant.concentratingOn && (
            <span
              className="inline-block text-xs bg-indigo-800 text-indigo-200 px-2 py-0.5 rounded-full font-semibold mt-1 mr-1"
              data-testid="concentration-badge"
            >
              🎯 {combatant.concentratingOn}
            </span>
          )}

          {combatant.pendingConSaveDC !== undefined && (
            <div className="flex items-center gap-2 mt-1 bg-amber-900 border border-amber-600 rounded px-2 py-1 text-xs text-amber-200">
              <span>CON Save DC {combatant.pendingConSaveDC}</span>
              <button
                onClick={() => onUpdate({ pendingConSaveDC: undefined })}
                className="text-amber-400 hover:text-amber-200 leading-none"
                aria-label="Dismiss CON save"
                title="Dismiss CON save prompt"
              >
                ×
              </button>
            </div>
          )}

          <ConditionControls combatant={combatant} onUpdate={onUpdate} />

          <TargetingPanel
            combatId={combatId}
            combatant={combatant}
            allCombatants={allCombatants}
            onUpdate={onUpdate}
            onUpdateCombatant={onUpdateCombatant}
          />

          {combatant.notes && (
            <p className="text-sm text-gray-400 italic">{combatant.notes}</p>
          )}
        </div>
      </div>
    </div>
  );
}
