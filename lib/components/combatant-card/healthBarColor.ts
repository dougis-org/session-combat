/**
 * Tailwind background class for a combatant's health bar / HP readout, keyed to
 * the fraction of max HP remaining: > 50% green, > 25% yellow, else red.
 * Shared by `CombatantCardHeader` (HP readout tint) and `HealthBar`.
 */
export function healthBarColor(
  hp: number,
  maxHp: number
): 'bg-green-500' | 'bg-yellow-500' | 'bg-red-500' {
  if (maxHp <= 0) return 'bg-red-500';
  const fraction = hp / maxHp;
  if (fraction > 0.5) return 'bg-green-500';
  if (fraction > 0.25) return 'bg-yellow-500';
  return 'bg-red-500';
}
