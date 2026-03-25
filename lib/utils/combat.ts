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
