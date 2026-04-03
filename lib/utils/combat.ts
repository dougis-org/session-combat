// Pure combat math utilities for D&D 5e combat mechanics
import type { ActiveDamageEffect, CreatureAbility, CombatantState, InitiativeRoll, Monster, Character } from '@/lib/types';
import type { DamageType } from '@/lib/constants';
import { rollDie } from '@/lib/utils/dice';

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
  return { legendaryActionsRemaining: Math.max(0, safeNonNeg(remaining) - safeCost) };
}

/**
 * Reset legendary action pool to full at the start of the creature's turn.
 * Non-finite or negative count is clamped to 0.
 */
export function resetLegendaryActions(
  count: number,
): { legendaryActionsRemaining: number } {
  return { legendaryActionsRemaining: safeNonNeg(count) };
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
  const newCount = Math.max(0, safeNonNeg(count) - 1);
  return {
    legendaryActionCount: newCount,
    legendaryActionsRemaining: Math.min(safeNonNeg(remaining), newCount),
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
  const newCount = safeNonNeg(count) + 1;
  return {
    legendaryActionCount: newCount,
    legendaryActionsRemaining: Math.min(safeNonNeg(remaining), newCount),
  };
}

/** Clamp a potentially non-finite number to a non-negative finite value. */
function safeNonNeg(n: number): number {
  return Number.isFinite(n) ? Math.max(0, n) : 0;
}

type DamageModifierKind = ActiveDamageEffect['kind'];

interface DamageModifierSources {
  damageResistances?: DamageType[];
  damageImmunities?: DamageType[];
  damageVulnerabilities?: DamageType[];
  activeDamageEffects?: ActiveDamageEffect[];
}

/**
 * Apply damage with D&D 5e resistance/immunity/vulnerability logic.
 * Priority: immunity (0 damage) > resistance+vulnerability cancel > resistance (½) > vulnerability (×2).
 * Sources: creatureStats arrays AND activeDamageEffects, combined.
 * Returns { hp, tempHp, effectiveDamage }.
 */
export function applyDamageWithType(
  hp: number,
  tempHp: number,
  rawDamage: number,
  damageType: DamageType,
  sources: DamageModifierSources,
): { hp: number; tempHp: number; effectiveDamage: number } {
  const { damageResistances = [], damageImmunities = [], damageVulnerabilities = [], activeDamageEffects = [] } = sources;

  const activeForType = activeDamageEffects.filter(e => e.type === damageType);

  const isImmune =
    damageImmunities.includes(damageType) ||
    activeForType.some(e => e.kind === 'immunity');

  if (isImmune) {
    return { hp, tempHp, effectiveDamage: 0 };
  }

  const isResistant =
    damageResistances.includes(damageType) ||
    activeForType.some(e => e.kind === 'resistance');

  const isVulnerable =
    damageVulnerabilities.includes(damageType) ||
    activeForType.some(e => e.kind === 'vulnerability');

  let effectiveDamage: number;
  if (isResistant && isVulnerable) {
    effectiveDamage = rawDamage; // cancel out per 5e rules
  } else if (isResistant) {
    effectiveDamage = Math.floor(rawDamage / 2);
  } else if (isVulnerable) {
    effectiveDamage = rawDamage * 2;
  } else {
    effectiveDamage = rawDamage;
  }

  const { hp: newHp, tempHp: newTempHp } = applyDamage(hp, tempHp, effectiveDamage);
  return { hp: newHp, tempHp: newTempHp, effectiveDamage };
}

/**
 * Merge new ActiveDamageEffects into an existing array.
 * Rules per incoming effect:
 *   - Immunity: removes all existing effects for that damage type, then adds itself.
 *   - Resistance/vulnerability: no-op if the type is already immune; otherwise
 *     replaces any existing effect with the same (type, kind), or adds new.
 *     Resistance and vulnerability for the same type can coexist (they cancel at
 *     application time per 5e rules).
 * Returns a new array; does not mutate existing.
 */
export function mergeActiveDamageEffects(
  existing: ActiveDamageEffect[],
  incoming: ActiveDamageEffect[],
): ActiveDamageEffect[] {
  let result = [...existing];
  for (const effect of incoming) {
    if (effect.kind === 'immunity') {
      // Immunity supersedes all other effects for this type
      result = result.filter(e => e.type !== effect.type);
      result.push(effect);
    } else {
      // Don't add resistance/vulnerability if already immune for this type
      if (result.some(e => e.type === effect.type && e.kind === 'immunity')) continue;
      // Key by (type, kind): replace same type+kind, or add new
      const idx = result.findIndex(e => e.type === effect.type && e.kind === effect.kind);
      if (idx === -1) {
        result.push(effect);
      } else {
        result[idx] = effect;
      }
    }
  }
  return result;
}

/**
 * Remove ActiveDamageEffects matching the given kind.
 * If type is null, removes all effects matching the kind regardless of type.
 * If type is specified, only removes effects matching both type and kind.
 * Returns a new array; does not mutate existing.
 */
export function removeActiveDamageEffects(
  effects: ActiveDamageEffect[],
  type: DamageType | null,
  kind: DamageModifierKind,
): ActiveDamageEffect[] {
  return effects.filter(e =>
    !(e.kind === kind && (type === null || e.type === type))
  );
}

const TYPE_ORDER: Record<CombatantState['type'], number> = { lair: 0, player: 1, monster: 2 };

/**
 * Sort combatants by initiative order for display.
 * Primary: initiative descending.
 * Secondary: dexterity descending.
 * Tertiary: lair before player before monster (lair fires before others at init 20).
 * Within multiple lairs at the same initiative: alphabetically by name.
 */
export function getDexInitiativeBonus(combatant: CombatantState): number {
  return Math.floor(((combatant.abilityScores?.dexterity ?? 10) - 10) / 2);
}

export function buildInitiativeRoll(combatant: CombatantState): InitiativeRoll {
  const bonus = getDexInitiativeBonus(combatant);
  const fb = combatant.initiativeFlatBonus ?? 0;

  let roll: number;
  let altRoll: number | undefined;
  let advantage: true | undefined;

  if (combatant.initiativeAdvantage) {
    const [a, b] = rollDie(20, 2);
    roll = Math.max(a, b);
    altRoll = Math.min(a, b);
    advantage = true;
  } else {
    roll = rollDie(20)[0];
  }

  return {
    roll,
    bonus,
    total: roll + bonus + fb,
    method: 'rolled',
    ...(advantage && { advantage, altRoll }),
    ...(fb !== 0 && { flatBonus: fb }),
  };
}

export function sortCombatants(combatants: CombatantState[]): CombatantState[] {
  return [...combatants].sort((a, b) => {
    if (a.initiative !== b.initiative) return b.initiative - a.initiative;
    if (a.type !== b.type) return TYPE_ORDER[a.type] - TYPE_ORDER[b.type];
    const aDex = a.abilityScores?.dexterity ?? 10;
    const bDex = b.abilityScores?.dexterity ?? 10;
    if (aDex !== bDex) return bDex - aDex;
    return a.name.localeCompare(b.name);
  });
}

/**
 * Decrement usesRemaining by 1, clamped at 0. Returns new object.
 * If usesRemaining is absent, returns a copy of the ability unchanged.
 */
export function useCharge(ability: CreatureAbility): CreatureAbility {
  return ability.usesRemaining === undefined
    ? { ...ability }
    : { ...ability, usesRemaining: Math.max(0, ability.usesRemaining - 1) };
}

/**
 * Increment usesRemaining by 1. Returns new object.
 * If usesRemaining is absent, returns ability unchanged.
 */
export function restoreCharge(ability: CreatureAbility): CreatureAbility {
  return ability.usesRemaining === undefined
    ? { ...ability }
    : { ...ability, usesRemaining: ability.usesRemaining + 1 };
}

/**
 * Apply restoreCharge to all actions where usesRemaining is a finite number.
 * Unlimited actions (usesRemaining absent) pass through unchanged. Returns new array.
 */
export function restoreAllCharges(actions: CreatureAbility[]): CreatureAbility[] {
  return actions.map(a => (Number.isFinite(a.usesRemaining) ? restoreCharge(a) : { ...a }));
}

/**
 * Build a CombatantState from a Monster or Character source.
 * Copies all combat-relevant fields including resistance/immunity/vulnerability arrays.
 */
export function buildCombatantFromSource(
  source: Monster | Character,
  type: 'monster' | 'player',
  idPrefix: string,
): CombatantState {
  const lacCount = 'legendaryActionCount' in source ? source.legendaryActionCount : undefined;
  return {
    id: `${idPrefix}-${source.id}-${crypto.randomUUID()}`,
    name: source.name,
    type,
    initiative: ('initiative' in source && typeof source.initiative === 'number') ? source.initiative : 0,
    abilityScores: source.abilityScores ?? { strength: 10, dexterity: 10, constitution: 10, intelligence: 10, wisdom: 10, charisma: 10 },
    hp: source.hp,
    maxHp: source.maxHp,
    ac: source.ac,
    conditions: [],
    traits: source.traits,
    actions: source.actions,
    bonusActions: source.bonusActions,
    reactions: source.reactions,
    damageResistances: source.damageResistances,
    damageImmunities: source.damageImmunities,
    damageVulnerabilities: source.damageVulnerabilities,
    conditionImmunities: source.conditionImmunities,
    legendaryActions: 'legendaryActions' in source ? source.legendaryActions : undefined,
    lairActions: 'lairActions' in source ? source.lairActions : undefined,
    legendaryActionCount: lacCount,
    legendaryActionsRemaining: lacCount,
  };
}

/**
 * Build a lair pseudo-combatant.
 * Sets initiative to 20 and includes an initiativeRoll so the initiative-order
 * view activates even when lairs are the only rolled combatants.
 * Copies lairActions from seedMonsterName if found in sourceList.
 */
export function buildLairCombatant(
  name: string,
  seedMonsterName: string,
  sourceList: CombatantState[] | null,
): CombatantState {
  const lairActions = seedMonsterName
    ? (sourceList?.find(c => c.name === seedMonsterName)?.lairActions ?? []).map(a => ({ ...a }))
    : [];
  return {
    id: `lair-${crypto.randomUUID()}`,
    name,
    type: 'lair',
    initiative: 20,
    initiativeRoll: { roll: 20, bonus: 0, total: 20, method: 'manual' },
    conditions: [],
    hp: 0,
    maxHp: 0,
    ac: 0,
    abilityScores: { strength: 10, dexterity: 10, constitution: 10, intelligence: 10, wisdom: 10, charisma: 10 },
    lairActions,
  };
}
