import type { CombatantState, HpHistoryEntry } from '@/lib/types';
import type { DamageType } from '@/lib/constants';
import {
  applyHealing as calcApplyHealing,
  setTempHp as calcSetTempHp,
  calcConSaveDC,
} from '@/lib/utils/combat';
import { applyTypedDamage } from '@/lib/combat/applyTypedDamage';
import {
  usesDeathSaves,
  enterDying,
  clearDeathState,
  applyDamageWhileDowned,
} from '@/lib/combat/deathSaves';

/** A single HP-adjustment action the player requested against one combatant. */
export interface HpChangeIntent {
  kind: 'damage' | 'heal' | 'setTemp';
  /** Positive integer amount; the caller validates the free-text field first. */
  amount: number;
  /** Damage type; only meaningful for `kind === 'damage'`. */
  damageType: DamageType | '';
}

/** HP-history entry to persist, without the impure `timestamp` field. */
export type HpHistoryDescriptor = Omit<HpHistoryEntry, 'timestamp'>;

/**
 * Result of a pure HP-change computation. The caller is responsible for acting
 * on `history` (via `pushHpHistory`) and `conSaveRequired` (via its callback);
 * this function performs no I/O.
 */
export interface HpChangeResult {
  /** Merged combatant-state patch to hand to `onUpdate` / `onUpdateCombatant`. */
  updates: Partial<CombatantState>;
  /** Present only when `hp`/`tempHp` actually changed. */
  history?: HpHistoryDescriptor;
  /** CON-save DC the caller should surface; only for the self path. */
  conSaveRequired?: number;
  /** True when this action transitioned the combatant fresh into `dying`. */
  enteredDying?: boolean;
}

/** Concentration-badge updates plus the DC to surface, for a damage action. */
function resolveConcentration(
  combatant: CombatantState,
  resultHp: number,
  effectiveDamage: number
): { updates: Partial<CombatantState>; conSaveRequired?: number } {
  if (resultHp === 0) {
    return { updates: { concentratingOn: undefined, pendingConSaveDC: undefined } };
  }
  if (combatant.concentratingOn && effectiveDamage > 0) {
    const dc = calcConSaveDC(effectiveDamage);
    return { updates: { pendingConSaveDC: dc }, conSaveRequired: dc };
  }
  return { updates: {} };
}

/** Death-save-tracker updates for a damage action, and whether it started dying fresh. */
function resolveDeathSaves(
  combatant: CombatantState,
  resultHp: number,
  effectiveDamage: number,
  incomingDamage: number
): { updates: Partial<CombatantState>; enteredDying: boolean } {
  if (!usesDeathSaves(combatant)) {
    return { updates: {}, enteredDying: false };
  }
  if (
    (combatant.lifeState === 'dying' || combatant.lifeState === 'stable') &&
    incomingDamage > 0
  ) {
    // Damage while downed: the damage-entry UI has no critical-hit control,
    // so critical is always false; the `damage >= maxHp` instant-death rule
    // still applies. Use post-resistance/immunity damage so a fully-mitigated
    // "hit" neither adds a failure nor kills.
    return {
      updates: applyDamageWhileDowned(combatant, { critical: false, damage: incomingDamage }),
      enteredDying: false,
    };
  }
  if (resultHp === 0 && !combatant.lifeState && effectiveDamage > 0) {
    return { updates: enterDying(), enteredDying: true };
  }
  return { updates: {}, enteredDying: false };
}

function applyDamageIntent(
  combatant: CombatantState,
  prevHp: number,
  prevTempHp: number,
  rawDamage: number,
  damageType: HpChangeIntent['damageType']
): HpChangeResult {
  const {
    hp: resultHp,
    tempHp: resultTempHp,
    effectiveDamage,
    incomingDamage,
  } = applyTypedDamage(prevHp, prevTempHp, rawDamage, damageType, combatant);

  const changed = resultHp !== prevHp || resultTempHp !== prevTempHp;
  const concentration = resolveConcentration(combatant, resultHp, effectiveDamage);
  const deathSaves = resolveDeathSaves(combatant, resultHp, effectiveDamage, incomingDamage);

  return {
    updates: {
      hp: resultHp,
      tempHp: resultTempHp,
      ...concentration.updates,
      ...deathSaves.updates,
    },
    history: changed
      ? { hp: prevHp, tempHp: prevTempHp, type: 'damage', amount: rawDamage }
      : undefined,
    conSaveRequired: concentration.conSaveRequired,
    enteredDying: deathSaves.enteredDying,
  };
}

function applyHealIntent(
  combatant: CombatantState,
  prevHp: number,
  prevTempHp: number,
  amount: number
): HpChangeResult {
  const result = calcApplyHealing(prevHp, combatant.maxHp, amount);
  const reviveUpdates: Partial<CombatantState> =
    usesDeathSaves(combatant) && combatant.lifeState && result.hp >= 1
      ? clearDeathState()
      : {};
  return {
    updates: { hp: result.hp, ...reviveUpdates },
    history:
      result.hp !== prevHp
        ? { hp: prevHp, tempHp: prevTempHp, type: 'healing', amount }
        : undefined,
  };
}

function applySetTempIntent(prevHp: number, prevTempHp: number, amount: number): HpChangeResult {
  const result = calcSetTempHp(prevTempHp, amount);
  if (result.tempHp === prevTempHp) {
    return { updates: {} };
  }
  return {
    updates: { tempHp: result.tempHp },
    history: { hp: prevHp, tempHp: prevTempHp, type: 'tempHp', amount },
  };
}

/**
 * Compute every HP, temp-HP, concentration, and life-state transition for one
 * damage / heal / set-temp action. Pure: no React, no storage, no callbacks.
 *
 * Behaviour is preserved verbatim from the pre-refactor `CombatantCard.adjustHp`
 * / `applySetTemp` closures; only the location and the return shape are new.
 */
export function applyHpChange(
  combatant: CombatantState,
  intent: HpChangeIntent
): HpChangeResult {
  const prevHp = combatant.hp;
  const prevTempHp = combatant.tempHp ?? 0;

  if (intent.kind === 'damage') {
    return applyDamageIntent(combatant, prevHp, prevTempHp, intent.amount, intent.damageType);
  }
  if (intent.kind === 'heal') {
    return applyHealIntent(combatant, prevHp, prevTempHp, intent.amount);
  }
  return applySetTempIntent(prevHp, prevTempHp, intent.amount);
}
