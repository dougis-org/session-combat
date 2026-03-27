// Pure combat math utilities for D&D 5e combat mechanics

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
 */
export function decrementLegendaryPool(
  count: number,
  remaining: number,
): { legendaryActionCount: number; legendaryActionsRemaining: number } {
  const newCount = Math.max(0, count - 1);
  return {
    legendaryActionCount: newCount,
    legendaryActionsRemaining: Math.min(remaining, newCount),
  };
}

/**
 * Increment the legendary action pool by 1, preserving current remaining actions.
 */
export function incrementLegendaryPool(
  count: number,
  remaining: number,
): { legendaryActionCount: number; legendaryActionsRemaining: number } {
  return {
    legendaryActionCount: count + 1,
    legendaryActionsRemaining: remaining,
  };
}
