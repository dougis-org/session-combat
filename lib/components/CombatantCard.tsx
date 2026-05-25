'use client';

import { useState, useRef, useEffect, useMemo, MouseEvent } from 'react';
import { CombatantState, ActiveDamageEffect, StatusCondition } from '@/lib/types';
import { applyDamage as calcApplyDamage, applyHealing as calcApplyHealing, setTempHp as calcSetTempHp, applyDamageWithType as calcApplyDamageWithType, mergeActiveDamageEffects, removeActiveDamageEffects } from '@/lib/utils/combat';
import { pushHpHistory, popHpHistory, getHpHistoryStack } from '@/lib/utils/hpHistory';
import { DAMAGE_TYPE_GROUPS, DAMAGE_EFFECT_PRESETS, DamageType } from '@/lib/constants';
import { LegendaryActionsPanel } from '@/lib/components/LegendaryActionsPanel';
import { LairActionsSlot } from '@/lib/components/LairActionsSlot';
import { TargetActionModal } from '@/lib/components/TargetActionModal';

export interface CombatantCardProps {
  combatId: string;
  combatant: CombatantState;
  isActive: boolean;
  onUpdate: (updates: Partial<CombatantState>) => void;
  onRemove: () => void;
  onNextTurn?: () => void;
  onShowDetails?: (combatantId: string, position: { top: number; left: number }) => void;
  onSetInitiative?: (combatantId: string) => void;
  onShowRemoveConfirm?: (combatantId: string, position: { top: number; left: number }) => void;
  allCombatants?: CombatantState[];
  onUpdateCombatant?: (combatantId: string, updates: Partial<CombatantState>) => void;
}

function applyTypedDamage(
  hp: number,
  tempHp: number,
  damage: number,
  damageType: DamageType | '',
  combatant: Pick<CombatantState, 'damageResistances' | 'damageImmunities' | 'damageVulnerabilities' | 'activeDamageEffects'>
): { hp: number; tempHp: number } {
  if (damageType) {
    return calcApplyDamageWithType(hp, tempHp, damage, damageType, {
      damageResistances: combatant.damageResistances,
      damageImmunities: combatant.damageImmunities,
      damageVulnerabilities: combatant.damageVulnerabilities,
      activeDamageEffects: combatant.activeDamageEffects,
    });
  }
  return calcApplyDamage(hp, tempHp, damage);
}

function DamageEffectsPanel({
  activeEffects,
  statImmunities,
  statResistances,
  statVulnerabilities,
  selectedDamageType,
  onUpdate,
}: {
  activeEffects: ActiveDamageEffect[];
  statImmunities: DamageType[];
  statResistances: DamageType[];
  statVulnerabilities: DamageType[];
  selectedDamageType: DamageType | '';
  onUpdate: (updates: Partial<CombatantState>) => void;
}) {
  const [showEffectsPanel, setShowEffectsPanel] = useState(false);
  const [pendingPreset, setPendingPreset] = useState<{ label: string; kind: 'resistance' | 'immunity' | 'vulnerability'; choices: DamageType[] } | null>(null);

  return (
    <div className="mt-1 mb-1">
      <div className="flex items-center gap-2 flex-wrap">
        {statImmunities.map(t => (
          <span key={`imm-${t}`} className="text-xs bg-purple-900 text-purple-200 px-1.5 py-0.5 rounded font-semibold" title="Immunity (from stats)">
            IMM: {t}
          </span>
        ))}
        {statResistances.map(t => (
          <span key={`res-${t}`} className="text-xs bg-green-900 text-green-200 px-1.5 py-0.5 rounded" title="Resistance (from stats)">
            RES: {t}
          </span>
        ))}
        {statVulnerabilities.map(t => (
          <span key={`vuln-${t}`} className="text-xs bg-red-900 text-red-200 px-1.5 py-0.5 rounded" title="Vulnerability (from stats)">
            VULN: {t}
          </span>
        ))}
        {activeEffects.map(e => (
          <span key={`active-${e.type}-${e.kind}`} className="text-xs bg-yellow-800 text-yellow-200 px-1.5 py-0.5 rounded flex items-center gap-1" title={e.label}>
            {e.kind === 'immunity' ? 'IMM' : e.kind === 'resistance' ? 'RES' : 'VULN'}: {e.type} ✱
            <button
              onClick={() => onUpdate({ activeDamageEffects: removeActiveDamageEffects(activeEffects, e.type, e.kind) })}
              className="ml-0.5 text-yellow-300 hover:text-white leading-none"
              title={`Remove ${e.label}`}
              aria-label={`Remove ${e.label}`}
            >✕</button>
          </span>
        ))}
        <button
          onClick={() => { setShowEffectsPanel(v => { if (v) setPendingPreset(null); return !v; }); }}
          className="text-xs text-teal-400 hover:text-teal-300 underline"
          title="Add temporary combat damage effects"
        >
          {showEffectsPanel ? 'Hide effects' : '+ Add effect'}
        </button>
      </div>
      {showEffectsPanel && (
        <div className="mt-2 bg-gray-800 border border-teal-700 rounded p-3 space-y-2">
          {pendingPreset ? (
            <>
              <p className="text-xs text-teal-300 font-semibold">{pendingPreset.label}: choose a damage type</p>
              <div className="flex flex-wrap gap-1">
                {pendingPreset.choices.map(t => (
                  <button
                    key={t}
                    onClick={() => {
                      const effect: ActiveDamageEffect = { type: t, kind: pendingPreset.kind, label: pendingPreset.label };
                      onUpdate({ activeDamageEffects: mergeActiveDamageEffects(activeEffects, [effect]) });
                      setPendingPreset(null);
                      setShowEffectsPanel(false);
                    }}
                    className="text-xs bg-teal-800 hover:bg-teal-700 text-teal-200 border border-teal-600 px-2 py-0.5 rounded capitalize"
                  >
                    {t}
                  </button>
                ))}
                <button
                  onClick={() => setPendingPreset(null)}
                  className="text-xs text-gray-400 hover:text-gray-300 px-1"
                >
                  ← Back
                </button>
              </div>
            </>
          ) : (
            <>
              <p className="text-xs text-teal-300 font-semibold">Apply a combat damage effect:</p>
              <div className="flex flex-wrap gap-2">
                {DAMAGE_EFFECT_PRESETS.map(preset => {
                  const hasNullType = preset.effects.some(e => e.type === null);
                  return (
                    <button
                      key={preset.id}
                      onClick={() => {
                        if (hasNullType) {
                          const nullEffect = preset.effects.find(e => e.type === null)!;
                          const choices: DamageType[] = nullEffect.choicesLimited ??
                            ([...DAMAGE_TYPE_GROUPS.Physical, ...DAMAGE_TYPE_GROUPS.Elemental, ...DAMAGE_TYPE_GROUPS['Energy & Planar'], ...DAMAGE_TYPE_GROUPS.Other]);
                          setPendingPreset({ label: preset.label, kind: nullEffect.kind, choices });
                        } else {
                          const newEffects = preset.effects.map(e => ({
                            type: e.type as DamageType,
                            kind: e.kind,
                            label: preset.label,
                          }));
                          onUpdate({ activeDamageEffects: mergeActiveDamageEffects(activeEffects, newEffects) });
                          setShowEffectsPanel(false);
                        }
                      }}
                      className="text-xs bg-teal-700 hover:bg-teal-600 text-white px-2 py-1 rounded"
                      title={preset.description}
                    >
                      {preset.label}{hasNullType ? ' →' : ''}
                    </button>
                  );
                })}
              </div>
            </>
          )}
          <div className="flex items-center gap-2 pt-1">
            <span className="text-xs text-gray-400">Custom:</span>
            {(['resistance', 'immunity', 'vulnerability'] as const).map(kind => (
              selectedDamageType ? (
                <button
                  key={kind}
                  onClick={() => {
                    const effect: ActiveDamageEffect = { type: selectedDamageType, kind, label: `${kind} (${selectedDamageType})` };
                    onUpdate({ activeDamageEffects: mergeActiveDamageEffects(activeEffects, [effect]) });
                    setShowEffectsPanel(false);
                  }}
                  className="text-xs bg-gray-700 hover:bg-gray-600 border border-teal-600 text-teal-200 px-2 py-1 rounded capitalize"
                >
                  {kind} ({selectedDamageType})
                </button>
              ) : null
            ))}
            {!selectedDamageType && <span className="text-xs text-gray-500 italic">Select a damage type above first</span>}
          </div>
        </div>
      )}
    </div>
  );
}

function TargetCheckboxColumn({
  title,
  textColor,
  targets,
  selectedIds,
  onToggle,
}: {
  title: string;
  textColor: string;
  targets: CombatantState[];
  selectedIds: string[];
  onToggle: (id: string, checked: boolean) => void;
}) {
  return (
    <div>
      <h5 className={`text-xs font-semibold ${textColor} mb-2 uppercase`}>{title}</h5>
      <div className="space-y-2">
        {targets
          .sort((a, b) => a.name.localeCompare(b.name))
          .map(target => (
            <label key={target.id} className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={selectedIds.includes(target.id)}
                onChange={(e) => onToggle(target.id, e.target.checked)}
                className="w-4 h-4 rounded bg-gray-700 border border-gray-600 cursor-pointer"
              />
              <span className={`text-sm ${textColor}`}>{target.name}</span>
            </label>
          ))}
      </div>
    </div>
  );
}

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
  } = props;
  const combatantMap = useMemo(() => new Map(allCombatants?.map(c => [c.id, c])), [allCombatants]);

  const [isEditing, setIsEditing] = useState(false);
  const [showConditions, setShowConditions] = useState(false);
  const [hpAdjustment, setHpAdjustment] = useState('');
  const [showTargeting, setShowTargeting] = useState(false);
  const [selectedTargetId, setSelectedTargetId] = useState<string | null>(null);
  const [hoveredTargetId, setHoveredTargetId] = useState<string | null>(null);
  const [isTempMode, setIsTempMode] = useState(false);
  const [selectedDamageType, setSelectedDamageType] = useState<DamageType | ''>('');
  // Bumped after this card's own push/pop to keep the Undo button enabled state in sync
  const [historyVersion, setHistoryVersion] = useState(0);

  const adjustHp = (amount: number) => {
    const prevHp = combatant.hp;
    const prevTempHp = combatant.tempHp ?? 0;
    if (amount < 0) {
      const rawDamage = -amount;
      const { hp: resultHp, tempHp: resultTempHp } = applyTypedDamage(prevHp, prevTempHp, rawDamage, selectedDamageType, combatant);
      if (resultHp !== prevHp || resultTempHp !== prevTempHp) {
        pushHpHistory(combatId, combatant.id, { hp: prevHp, tempHp: prevTempHp, type: 'damage', amount: rawDamage, timestamp: Date.now() });
        setHistoryVersion(v => v + 1);
      }
      onUpdate({ hp: resultHp, tempHp: resultTempHp });
    } else {
      const result = calcApplyHealing(prevHp, combatant.maxHp, amount);
      if (result.hp !== prevHp) {
        pushHpHistory(combatId, combatant.id, { hp: prevHp, tempHp: prevTempHp, type: 'healing', amount, timestamp: Date.now() });
        setHistoryVersion(v => v + 1);
      }
      onUpdate({ hp: result.hp });
    }
  };

  const handleHpAdjustmentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setHpAdjustment(value);
  };

  const applyDamage = () => {
    const amount = parseInt(hpAdjustment) || 0;
    if (amount > 0) {
      adjustHp(-amount);
      setHpAdjustment('');
    }
  };

  const applyHeal = () => {
    const amount = parseInt(hpAdjustment) || 0;
    if (amount > 0) {
      adjustHp(amount);
      setHpAdjustment('');
    }
  };

  const applySetTemp = () => {
    const amount = parseInt(hpAdjustment) || 0;
    if (amount > 0) {
      const currentTempHp = combatant.tempHp ?? 0;
      const result = calcSetTempHp(currentTempHp, amount);
      if (result.tempHp === currentTempHp) {
        setHpAdjustment('');
        return;
      }
      pushHpHistory(combatId, combatant.id, {
        hp: combatant.hp,
        tempHp: currentTempHp,
        type: 'tempHp',
        amount,
        timestamp: Date.now(),
      });
      setHistoryVersion(v => v + 1);
      onUpdate({ tempHp: result.tempHp });
      setHpAdjustment('');
    }
  };

  const undoHpChange = () => {
    const entry = popHpHistory(combatId, combatant.id);
    if (!entry) return;
    setHistoryVersion(v => v + 1);
    onUpdate({ hp: entry.hp, tempHp: entry.tempHp });
  };

  const addCondition = () => {
    const name = prompt('Condition name:');
    if (!name) return;

    const durationStr = prompt('Duration in rounds (leave empty for permanent):');
    const duration = durationStr ? parseInt(durationStr) : undefined;

    const newCondition: StatusCondition = {
      id: crypto.randomUUID(),
      name,
      description: '',
      duration,
    };

    onUpdate({
      conditions: [...combatant.conditions, newCondition],
    });
  };

  const removeCondition = (conditionId: string) => {
    onUpdate({
      conditions: combatant.conditions.filter(c => c.id !== conditionId),
    });
  };

  const applyDamageToTarget = (damage: number, damageType: DamageType | '') => {
    if (!selectedTargetId || !onUpdateCombatant) return;

    const target = combatantMap.get(selectedTargetId);
    if (target) {
      const targetHp = target.hp;
      const targetTempHp = target.tempHp ?? 0;
      const { hp: resultHp, tempHp: resultTempHp } = applyTypedDamage(targetHp, targetTempHp, damage, damageType, target);
      if (resultHp !== targetHp || resultTempHp !== targetTempHp) {
        pushHpHistory(combatId, target.id, { hp: targetHp, tempHp: targetTempHp, type: 'damage', amount: damage, timestamp: Date.now() });
      }
      onUpdateCombatant(selectedTargetId, { hp: resultHp, tempHp: resultTempHp });
    }

    setSelectedTargetId(null);
  };

  const addConditionToTarget = (name: string, duration?: number) => {
    if (!selectedTargetId || !onUpdateCombatant) return;

    const target = combatantMap.get(selectedTargetId);
    if (target) {
      const condition: StatusCondition = {
        id: crypto.randomUUID(),
        name,
        description: '',
        duration,
      };

      onUpdateCombatant(selectedTargetId, {
        conditions: [...target.conditions, condition],
      });
    }

    setSelectedTargetId(null);
  };

  const tempHp = combatant.tempHp ?? 0;
  const hpTotal = combatant.maxHp + tempHp;
  const hpPercent = hpTotal > 0 ? (combatant.hp / hpTotal) * 100 : 0;
  const tempHpPercent = hpTotal > 0 ? (tempHp / hpTotal) * 100 : 0;
  const hpColor = combatant.maxHp > 0 ? ((combatant.hp / combatant.maxHp) > 0.5 ? 'bg-green-500' : (combatant.hp / combatant.maxHp) > 0.25 ? 'bg-yellow-500' : 'bg-red-500') : 'bg-red-500';

  // Derived damage modifier fields for display and active effects panel
  const statResistances = combatant.damageResistances ?? [];
  const statImmunities = combatant.damageImmunities ?? [];
  const statVulnerabilities = combatant.damageVulnerabilities ?? [];
  const activeEffects = combatant.activeDamageEffects ?? [];
  // Background gradient based on combatant type - stronger fade from left to right
  const bgStyle = combatant.type === 'player'
    ? { backgroundImage: 'linear-gradient(to right, rgba(96, 165, 250, 0.18), rgba(96, 165, 250, 0.02))' }
    : { backgroundImage: 'linear-gradient(to right, rgba(239, 68, 68, 0.18), rgba(239, 68, 68, 0.02))' };

  return (
    <div style={bgStyle} className={`rounded-lg px-4 py-4 ${isActive ? 'border-2 border-yellow-500' : 'border border-gray-700'}`}>
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <div className="flex items-center gap-4 mb-2">
            <div className="flex items-center gap-2">
              <button
                onClick={(e) => {
                  const rect = (e.currentTarget as HTMLButtonElement).getBoundingClientRect();
                  onShowDetails?.(combatant.id, {
                    top: rect.bottom,
                    left: rect.left,
                  });
                }}
                className="hover:opacity-80 transition-opacity"
                title={`See full ${combatant.type === 'player' ? 'Character' : 'Monster'} information`}
                type="button"
                data-testid="combatant-detail-toggle"
              >
                <svg
                  className="w-5 h-5 text-gray-400 hover:text-gray-300 cursor-pointer"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
              <h3 className="text-xl font-semibold">{combatant.name} {combatant.hp <= 0 && '☠️'}</h3>
              <button
                onClick={(e) => {
                  const rect = (e.currentTarget as HTMLButtonElement).getBoundingClientRect();
                  onShowRemoveConfirm?.(combatant.id, {
                    top: rect.bottom + window.scrollY,
                    left: rect.left + window.scrollX,
                  });
                }}
                className="text-red-500 hover:text-red-400 text-xl leading-none"
                title="Remove combatant"
              >
                ✕
              </button>
              {isActive && onNextTurn && (
                <button
                  onClick={onNextTurn}
                  className="px-2 py-1 rounded text-xs bg-yellow-600 hover:bg-yellow-700 animate-pulse font-semibold"
                >
                  Current Turn (done)
                </button>
              )}
            </div>
            {!isActive && <div className="w-40"></div>}
            <div className="flex items-center gap-2">
              <p className="text-xs text-gray-400">AC</p>
              <p className="text-lg font-bold">{combatant.ac}</p>
            </div>
            <span className="text-sm text-gray-400 whitespace-nowrap">Hit Points:</span>
            <span className="text-lg font-bold">
              Current: <span className={hpColor === 'bg-green-500' ? 'text-green-500' : hpColor === 'bg-yellow-500' ? 'text-yellow-500' : 'text-red-500'}>{combatant.hp}</span> Max: {combatant.maxHp}{tempHp > 0 && <span className="text-blue-400"> +{tempHp} tmp</span>}
            </span>
            {(combatant.legendaryActionCount ?? 0) > 0 && (
              <span
                className="text-sm font-semibold text-amber-400 whitespace-nowrap"
                data-testid="legendary-action-badge"
              >
                ⚡ {combatant.legendaryActionsRemaining ?? combatant.legendaryActionCount}/{combatant.legendaryActionCount}
              </span>
            )}
            <input
              type="number"
              placeholder="0"
              value={hpAdjustment}
              onChange={handleHpAdjustmentChange}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  if (e.shiftKey) {
                    isTempMode ? applySetTemp() : applyHeal();
                  } else {
                    applyDamage();
                  }
                }
              }}
              className="w-14 bg-gray-700 rounded px-2 py-1 text-xs text-center text-white"
            />
            <select
              value={selectedDamageType}
              onChange={(e) => setSelectedDamageType(e.target.value as DamageType | '')}
              className="bg-gray-700 rounded px-1 py-1 text-xs text-white border border-gray-600"
              title="Damage type (for resistance/immunity/vulnerability)"
              aria-label="Damage type (for resistance/immunity/vulnerability)"
            >
              <option value="">Type</option>
              {Object.entries(DAMAGE_TYPE_GROUPS).map(([group, types]) => (
                <optgroup key={group} label={group}>
                  {types.map(t => (
                    <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
                  ))}
                </optgroup>
              ))}
            </select>
            <button
              onClick={applyDamage}
              title={selectedDamageType ? `Apply ${selectedDamageType} damage (with resistances)` : "Apply damage (Enter)"}
              className={`px-2 py-1 rounded text-xs ${selectedDamageType ? 'bg-orange-600 hover:bg-orange-700' : 'bg-red-600 hover:bg-red-700'}`}
            >
              Damage
            </button>
            <button
              onClick={isTempMode ? applySetTemp : applyHeal}
              title={isTempMode ? "Set temporary HP" : "Apply healing (Shift+Enter)"}
              className="bg-green-600 hover:bg-green-700 px-2 py-1 rounded text-xs"
            >
              {isTempMode ? 'Set Temp' : 'Heal'}
            </button>
            <label className="flex items-center gap-1 text-xs text-gray-300 cursor-pointer">
              <input
                type="checkbox"
                checked={isTempMode}
                onChange={(e) => setIsTempMode(e.target.checked)}
                className="cursor-pointer"
              />
              Temp
            </label>
            <button
              onClick={undoHpChange}
              disabled={getHpHistoryStack(combatId, combatant.id).length === 0}
              title="Undo last HP change"
              data-testid="undo-hp-change"
              className="px-2 py-1 rounded text-xs bg-gray-600 hover:bg-gray-500 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Undo HP
            </button>
            <div className="flex items-center gap-2 ml-auto pr-4">
              <button
                onClick={() => onSetInitiative?.(combatant.id)}
                className="flex items-center gap-1 hover:opacity-80 cursor-pointer transition-opacity"
              >
                <p className="text-xs text-gray-400">Initiative</p>
                <p className="text-lg font-bold">{combatant.initiative}</p>
                {combatant.initiativeRoll && (
                  <p className="text-xs text-gray-500 whitespace-nowrap">
                    {combatant.initiativeRoll.method === 'rolled'
                      ? [
                          combatant.initiativeRoll.advantage
                            ? `d20:${combatant.initiativeRoll.roll}↑${combatant.initiativeRoll.altRoll != null ? ` (dropped:${combatant.initiativeRoll.altRoll})` : ''}`
                            : `d20:${combatant.initiativeRoll.roll}`,
                          `+${combatant.initiativeRoll.bonus}`,
                          combatant.initiativeRoll.flatBonus
                            ? `${combatant.initiativeRoll.flatBonus > 0 ? '+' : ''}${combatant.initiativeRoll.flatBonus}`
                            : null,
                        ].filter(Boolean).join('')
                      : [
                          combatant.initiativeRoll.roll != null
                            ? String(combatant.initiativeRoll.roll)
                            : null,
                          combatant.initiativeRoll.bonus !== 0
                            ? `${combatant.initiativeRoll.bonus > 0 ? '+' : ''}${combatant.initiativeRoll.bonus}`
                            : null,
                          combatant.initiativeRoll.flatBonus
                            ? `${combatant.initiativeRoll.flatBonus > 0 ? '+' : ''}${combatant.initiativeRoll.flatBonus}`
                            : null,
                        ].filter((part): part is string => part != null).join('') || 'Manual'}
                  </p>
                )}
              </button>
            </div>
          </div>

          <div className="w-4/5 bg-gray-700 rounded-full h-2 flex overflow-hidden">
            <div className={`${hpColor} h-2 transition-all`} data-testid="health-bar" style={{ width: `${hpPercent}%` }} />
            {tempHp > 0 && (
              <div className="bg-blue-400 h-2 transition-all" data-testid="temp-hp-bar" style={{ width: `${tempHpPercent}%` }} />
            )}
          </div>

          <DamageEffectsPanel
            activeEffects={activeEffects}
            statImmunities={statImmunities}
            statResistances={statResistances}
            statVulnerabilities={statVulnerabilities}
            selectedDamageType={selectedDamageType}
            onUpdate={onUpdate}
          />

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

          {combatant.targetIds && combatant.targetIds.length > 0 && (
            <div className="mb-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm text-purple-400 font-semibold">Targets:</span>
                {combatant.targetIds.map(targetId => {
                  const target = combatantMap.get(targetId);
                  return target ? (
                    <div key={targetId} className="relative inline-block">
                      <button
                        onClick={() => {
                          setSelectedTargetId(targetId);
                        }}
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
                                {target.hp === 0 && <span className="text-red-400 text-lg">☠</span>}
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

          {combatant.notes && (
            <p className="text-sm text-gray-400 italic">{combatant.notes}</p>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <button
            onClick={() => setShowTargeting(!showTargeting)}
            className="bg-orange-600 hover:bg-orange-700 px-2 py-1 rounded text-xs"
            title="Set targets for this combatant"
          >
            Add Target(s)
          </button>
          <button
            onClick={addCondition}
            className="bg-purple-600 hover:bg-purple-700 px-2 py-1 rounded text-xs"
          >
            Add Condition
          </button>
        </div>
      </div>

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
              onToggle={(id, checked) =>
                onUpdate({
                  targetIds: checked
                    ? [...(combatant.targetIds ?? []), id]
                    : (combatant.targetIds ?? []).filter(t => t !== id),
                })
              }
            />
            <TargetCheckboxColumn
              title="Party"
              textColor="text-blue-300"
              targets={allCombatants.filter(c => c.id !== combatant.id && c.type === 'player')}
              selectedIds={combatant.targetIds ?? []}
              onToggle={(id, checked) =>
                onUpdate({
                  targetIds: checked
                    ? [...(combatant.targetIds ?? []), id]
                    : (combatant.targetIds ?? []).filter(t => t !== id),
                })
              }
            />
          </div>
        </div>
      )}

      {/* Target Action Modal */}
      {selectedTargetId && allCombatants && (() => {
        const target = allCombatants.find(c => c.id === selectedTargetId);
        if (!target) return null;
        return (
          <TargetActionModal
            target={target}
            onClose={() => setSelectedTargetId(null)}
            onApplyDamage={applyDamageToTarget}
            onAddCondition={addConditionToTarget}
          />
        );
      })()}
    </div>
  );
}
