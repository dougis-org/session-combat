import type { CombatantState } from '@/lib/types';
import {
  applyDamage as calcApplyDamage,
  applyDamageWithType as calcApplyDamageWithType,
} from '@/lib/utils/combat';
import type { DamageType } from '@/lib/constants';

/**
 * Outcome of applying a single damage instance to an HP pool, carrying two
 * distinct "how much damage" numbers that downstream combat rules consume
 * differently.
 */
export interface TypedDamageResult {
  /** Resulting current HP after temp-HP absorption and overflow, floored at 0. */
  hp: number;
  /** Resulting temporary HP after absorption. */
  tempHp: number;
  /**
   * Damage that actually reduced the HP + temp-HP pool, clamped to what the pool
   * held (0..pool) for untyped damage. Drives the concentration CON-save DC.
   */
  effectiveDamage: number;
  /**
   * Post-resistance/immunity incoming amount, independent of current HP (0 if
   * immune). Drives the death-save-while-downed rules, where a fully mitigated
   * hit must neither add a failure nor trigger massive-damage death.
   */
  incomingDamage: number;
}

/**
 * Apply a damage instance to a combatant's HP pool, resolving damage-type
 * resistance / immunity / vulnerability when a type is supplied.
 *
 * Body is preserved verbatim from the pre-refactor `CombatantCard` helper; only
 * its home and the named return type are new.
 */
export function applyTypedDamage(
  hp: number,
  tempHp: number,
  damage: number,
  damageType: DamageType | '',
  combatant: Pick<
    CombatantState,
    'damageResistances' | 'damageImmunities' | 'damageVulnerabilities' | 'activeDamageEffects'
  >
): TypedDamageResult {
  if (damageType) {
    const typed = calcApplyDamageWithType(hp, tempHp, damage, damageType, {
      damageResistances: combatant.damageResistances,
      damageImmunities: combatant.damageImmunities,
      damageVulnerabilities: combatant.damageVulnerabilities,
      activeDamageEffects: combatant.activeDamageEffects,
    });
    // `effectiveDamage` here is the post-resistance incoming amount (0 if immune),
    // independent of current HP — exactly what the death-save rules need.
    return { ...typed, incomingDamage: typed.effectiveDamage };
  }
  const result = calcApplyDamage(hp, tempHp, damage);
  const effectiveDamage = hp + tempHp - (result.hp + result.tempHp);
  // Untyped damage has no resistance/immunity, so the full amount lands.
  return { ...result, effectiveDamage, incomingDamage: damage };
}
