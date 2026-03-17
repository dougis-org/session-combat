import { CombatantState } from '@/lib/types';

export interface ExpiringCondition {
  combatantName: string;
  conditionName: string;
}

export interface RoundEndResult {
  updatedCombatants: CombatantState[];
  expiring: ExpiringCondition[];
}

/**
 * Processes end-of-round condition expiry in a single pass:
 * - Collects conditions that expire this round (duration reaches 0 after decrement)
 * - Returns updated combatants with durations decremented and expired conditions removed
 */
export function processRoundEnd(combatants: CombatantState[]): RoundEndResult {
  const expiring: ExpiringCondition[] = [];

  const updatedCombatants = combatants.map(c => {
    const updatedConditions = c.conditions
      .map(cond => ({
        ...cond,
        duration: cond.duration != null ? Math.max(0, cond.duration - 1) : cond.duration,
      }))
      .filter(cond => {
        if (cond.duration == null || cond.duration > 0) return true;
        expiring.push({ combatantName: c.name, conditionName: cond.name });
        return false;
      });

    return { ...c, conditions: updatedConditions };
  });

  return { updatedCombatants, expiring };
}

/**
 * Returns the list of conditions that will expire this round (duration reaches 0
 * after being decremented by 1). Useful for isolated testing and inspection.
 */
export function getExpiringConditions(combatants: CombatantState[]): ExpiringCondition[] {
  const expiring: ExpiringCondition[] = [];
  combatants.forEach(c => {
    c.conditions.forEach(cond => {
      if (cond.duration != null && cond.duration - 1 <= 0) {
        expiring.push({ combatantName: c.name, conditionName: cond.name });
      }
    });
  });
  return expiring;
}

/**
 * Decrements condition durations by 1 and removes any that have reached 0.
 * Useful for isolated testing.
 */
export function tickConditions(combatants: CombatantState[]): CombatantState[] {
  return combatants.map(c => ({
    ...c,
    conditions: c.conditions
      .map(cond => ({
        ...cond,
        duration: cond.duration != null ? Math.max(0, cond.duration - 1) : cond.duration,
      }))
      .filter(cond => cond.duration == null || cond.duration > 0),
  }));
}
