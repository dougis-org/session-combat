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
    const rawDamage = intent.amount;
    const {
      hp: resultHp,
      tempHp: resultTempHp,
      effectiveDamage,
      incomingDamage,
    } = applyTypedDamage(prevHp, prevTempHp, rawDamage, intent.damageType, combatant);

    const changed = resultHp !== prevHp || resultTempHp !== prevTempHp;

    const concentrationUpdates: Partial<CombatantState> = {};
    let conSaveRequired: number | undefined;
    if (resultHp === 0) {
      concentrationUpdates.concentratingOn = undefined;
      concentrationUpdates.pendingConSaveDC = undefined;
    } else if (combatant.concentratingOn && effectiveDamage > 0) {
      const dc = calcConSaveDC(effectiveDamage);
      concentrationUpdates.pendingConSaveDC = dc;
      conSaveRequired = dc;
    }

    let deathSaveUpdates: Partial<CombatantState> = {};
    if (usesDeathSaves(combatant)) {
      if (
        (combatant.lifeState === 'dying' || combatant.lifeState === 'stable') &&
        incomingDamage > 0
      ) {
        // Damage while downed: the damage-entry UI has no critical-hit control,
        // so critical is always false; the `damage >= maxHp` instant-death rule
        // still applies. Use post-resistance/immunity damage so a fully-mitigated
        // "hit" neither adds a failure nor kills.
        deathSaveUpdates = applyDamageWhileDowned(combatant, {
          critical: false,
          damage: incomingDamage,
        });
      } else if (resultHp === 0 && !combatant.lifeState && effectiveDamage > 0) {
        deathSaveUpdates = enterDying();
      }
    }

    return {
      updates: {
        hp: resultHp,
        tempHp: resultTempHp,
        ...concentrationUpdates,
        ...deathSaveUpdates,
      },
      history: changed
        ? { hp: prevHp, tempHp: prevTempHp, type: 'damage', amount: rawDamage }
        : undefined,
      conSaveRequired,
    };
  }

  if (intent.kind === 'heal') {
    const result = calcApplyHealing(prevHp, combatant.maxHp, intent.amount);
    const reviveUpdates: Partial<CombatantState> =
      usesDeathSaves(combatant) && combatant.lifeState && result.hp >= 1
        ? clearDeathState()
        : {};
    return {
      updates: { hp: result.hp, ...reviveUpdates },
      history:
        result.hp !== prevHp
          ? { hp: prevHp, tempHp: prevTempHp, type: 'healing', amount: intent.amount }
          : undefined,
    };
  }

  // kind === 'setTemp'
  const result = calcSetTempHp(prevTempHp, intent.amount);
  if (result.tempHp === prevTempHp) {
    return { updates: {} };
  }
  return {
    updates: { tempHp: result.tempHp },
    history: { hp: prevHp, tempHp: prevTempHp, type: 'tempHp', amount: intent.amount },
  };
}
