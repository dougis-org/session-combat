import type { CombatantState } from '@/lib/types';

/**
 * A combatant is out of play iff one of its current conditions carries
 * `removedFromPlay`. Derived (never stored) so removal and expiry cannot leave
 * a stale flag behind.
 */
export function isRemovedFromPlay(combatant: Pick<CombatantState, 'conditions'>): boolean {
  return combatant.conditions?.some((c) => c.removedFromPlay === true) ?? false;
}
