'use client';

import { useState } from 'react';
import type { ActiveDamageEffect, CombatantState } from '@/lib/types';
import { mergeActiveDamageEffects, removeActiveDamageEffects } from '@/lib/utils/combat';
import { DAMAGE_TYPE_GROUPS, DAMAGE_EFFECT_PRESETS, DamageType } from '@/lib/constants';

export function DamageEffectsPanel({
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
