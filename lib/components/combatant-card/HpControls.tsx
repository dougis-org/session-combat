'use client';

import type { CombatantState } from '@/lib/types';
import { DAMAGE_TYPE_GROUPS, DamageType } from '@/lib/constants';
import { healthBarColor } from '@/lib/components/combatant-card/healthBarColor';
import type { UseCombatantHpResult } from '@/lib/hooks/useCombatantHp';

type HpControlsProps = Pick<
  UseCombatantHpResult,
  | 'hpAdjustment'
  | 'setHpAdjustment'
  | 'isTempMode'
  | 'setIsTempMode'
  | 'selectedDamageType'
  | 'setSelectedDamageType'
  | 'canUndo'
  | 'applyDamage'
  | 'applyHeal'
  | 'applySetTemp'
  | 'undoHpChange'
>;

/**
 * HP-adjustment input, damage-type select, Damage / Heal / Set Temp / Undo
 * buttons and the Temp-mode checkbox. All state and callbacks come from
 * `useCombatantHp`. Returns a fragment so these controls stay inline in the
 * header flex row.
 */
export function HpControls({
  hpAdjustment,
  setHpAdjustment,
  isTempMode,
  setIsTempMode,
  selectedDamageType,
  setSelectedDamageType,
  canUndo,
  applyDamage,
  applyHeal,
  applySetTemp,
  undoHpChange,
}: HpControlsProps) {
  return (
    <>
      <input
        type="number"
        placeholder="0"
        value={hpAdjustment}
        onChange={(e) => setHpAdjustment(e.target.value)}
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
        title={selectedDamageType ? `Apply ${selectedDamageType} damage (with resistances)` : 'Apply damage (Enter)'}
        className={`px-2 py-1 rounded text-xs ${selectedDamageType ? 'bg-orange-600 hover:bg-orange-700' : 'bg-red-600 hover:bg-red-700'}`}
      >
        Damage
      </button>
      <button
        onClick={isTempMode ? applySetTemp : applyHeal}
        title={isTempMode ? 'Set temporary HP' : 'Apply healing (Shift+Enter)'}
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
        disabled={!canUndo}
        title="Undo last HP change"
        data-testid="undo-hp-change"
        className="px-2 py-1 rounded text-xs bg-gray-600 hover:bg-gray-500 disabled:opacity-40 disabled:cursor-not-allowed"
      >
        Undo HP
      </button>
    </>
  );
}

/** The HP / temp-HP progress bar rendered directly under the header row. */
export function HealthBar({ combatant }: { combatant: CombatantState }) {
  const tempHp = combatant.tempHp ?? 0;
  const hpTotal = combatant.maxHp + tempHp;
  const hpPercent = hpTotal > 0 ? (combatant.hp / hpTotal) * 100 : 0;
  const tempHpPercent = hpTotal > 0 ? (tempHp / hpTotal) * 100 : 0;
  const hpColor = healthBarColor(combatant.hp, combatant.maxHp);

  return (
    <div className="w-4/5 bg-gray-700 rounded-full h-2 flex overflow-hidden">
      <div className={`${hpColor} h-2 transition-all`} data-testid="health-bar" style={{ width: `${hpPercent}%` }} />
      {tempHp > 0 && (
        <div className="bg-blue-400 h-2 transition-all" data-testid="temp-hp-bar" style={{ width: `${tempHpPercent}%` }} />
      )}
    </div>
  );
}
