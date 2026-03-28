// Pure combat math utilities for D&D 5e combat mechanics
import { CreatureAbility, CombatantState } from '@/lib/types';

/**
 * Apply damage to a combatant, draining temp HP first.
 * Overflow damage carries through to regular HP, which floors at 0.
 */
export function applyDamage(
  hp: number,
  tempHp: number,
  damage: number,
): { hp: number; tempHp: number } {
  const absorbed = Math.min(tempHp, damage);
  const overflow = damage - absorbed;
  return {
    hp: Math.max(0, hp - overflow),
    tempHp: tempHp - absorbed,
  };
}

/**
 * Apply healing to a combatant, capped at maxHp.
 * Temp HP is not affected by healing.
 */
export function applyHealing(
  hp: number,
  maxHp: number,
  amount: number,
): { hp: number } {
  return { hp: Math.min(maxHp, hp + amount) };
}

/**
 * Set temp HP, enforcing the 5e no-stacking rule:
 * a lower value is silently ignored; the higher value always wins.
 */
export function setTempHp(
  currentTempHp: number,
  newValue: number,
): { tempHp: number } {
  return { tempHp: Math.max(currentTempHp, newValue) };
}

/**
 * Spend legendary actions. Remaining cannot go below 0.
 * Non-finite or negative cost is treated as 0; non-finite remaining is treated as 0.
 */
export function useLegendaryAction(
  remaining: number,
  cost: number,
): { legendaryActionsRemaining: number } {
  const safeCost = Number.isFinite(cost) ? Math.max(0, Math.floor(cost)) : 0;
  const safeRemaining = Number.isFinite(remaining) ? remaining : 0;
  return { legendaryActionsRemaining: Math.max(0, safeRemaining - safeCost) };
}

/**
 * Reset legendary action pool to full at the start of the creature's turn.
 * Non-finite or negative count is clamped to 0.
 */
export function resetLegendaryActions(
  count: number,
): { legendaryActionsRemaining: number } {
  const safeCount = Number.isFinite(count) ? Math.max(0, count) : 0;
  return { legendaryActionsRemaining: safeCount };
}

/**
 * Apply legendary pool reset to the combatant at nextIndex when advancing turns.
 * Only resets if the combatant has a non-zero legendaryActionCount; all others pass through unchanged.
 */
export function resetIncomingLegendaryPool<T extends { legendaryActionCount?: number }>(
  combatants: T[],
  nextIndex: number,
): T[] {
  return combatants.map((c, i) => {
    if (i === nextIndex && (c.legendaryActionCount ?? 0) > 0) {
      return { ...c, ...resetLegendaryActions(c.legendaryActionCount!) };
    }
    return c;
  });
}

/**
 * Decrement the legendary action pool by 1 (min 0), clamping remaining to the new pool size.
 * Non-finite or negative inputs are clamped to finite non-negative values.
 */
export function decrementLegendaryPool(
  count: number,
  remaining: number,
): { legendaryActionCount: number; legendaryActionsRemaining: number } {
  const safeCount = Number.isFinite(count) ? Math.max(0, count) : 0;
  const safeRemaining = Number.isFinite(remaining) ? Math.max(0, remaining) : 0;
  const newCount = Math.max(0, safeCount - 1);
  return {
    legendaryActionCount: newCount,
    legendaryActionsRemaining: Math.min(safeRemaining, newCount),
  };
}

/**
 * Increment the legendary action pool by 1, preserving current remaining actions.
 * Non-finite or negative inputs are clamped to finite non-negative values.
 */
export function incrementLegendaryPool(
  count: number,
  remaining: number,
): { legendaryActionCount: number; legendaryActionsRemaining: number } {
  const safeCount = Number.isFinite(count) ? Math.max(0, count) : 0;
  const safeRemaining = Number.isFinite(remaining) ? Math.max(0, remaining) : 0;
  const newCount = safeCount + 1;
  return {
    legendaryActionCount: newCount,
    legendaryActionsRemaining: Math.min(safeRemaining, newCount),
  };
}

/**
 * Sort combatants by initiative order for display.
 * Primary: initiative descending.
 * Secondary: dexterity descending.
 * Tertiary: lair before player before monster (lair fires before others at init 20).
 * Within multiple lairs at the same initiative: alphabetically by name.
 */
export function sortCombatants(combatants: CombatantState[]): CombatantState[] {
  const typeOrder = (type: CombatantState['type']): number => {
    if (type === 'lair') return 0;
    if (type === 'player') return 1;
    return 2; // monster
  };

  return [...combatants].sort((a, b) => {
    if (a.initiative !== b.initiative) return b.initiative - a.initiative;
    const aDex = a.abilityScores?.dexterity ?? 10;
    const bDex = b.abilityScores?.dexterity ?? 10;
    if (aDex !== bDex) return bDex - aDex;
    if (a.type !== b.type) return typeOrder(a.type) - typeOrder(b.type);
    return a.name.localeCompare(b.name);
  });
}

/**
 * Decrement usesRemaining by 1, clamped at 0. Returns new object.
 * If usesRemaining is absent, returns ability unchanged.
 */
export function useCharge(ability: CreatureAbility): CreatureAbility {
  if (ability.usesRemaining === undefined) return { ...ability };
  return { ...ability, usesRemaining: Math.max(0, ability.usesRemaining - 1) };
}

/**
 * Increment usesRemaining by 1. Returns new object.
 * If usesRemaining is absent, returns ability unchanged.
 */
export function restoreCharge(ability: CreatureAbility): CreatureAbility {
  if (ability.usesRemaining === undefined) return { ...ability };
  return { ...ability, usesRemaining: ability.usesRemaining + 1 };
}

/**
 * Apply restoreCharge to all actions where usesRemaining is a finite number.
 * Unlimited actions (usesRemaining absent) pass through unchanged. Returns new array.
 */
export function restoreAllCharges(actions: CreatureAbility[]): CreatureAbility[] {
  return actions.map(a => (Number.isFinite(a.usesRemaining) ? restoreCharge(a) : { ...a }));
}
