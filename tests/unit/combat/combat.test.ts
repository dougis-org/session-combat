import { describe, test, expect } from '@jest/globals';
import { applyDamage, applyHealing, setTempHp, useLegendaryAction, resetLegendaryActions, resetIncomingLegendaryPool, decrementLegendaryPool, incrementLegendaryPool, useCharge, restoreCharge, restoreAllCharges, buildLairCombatant } from '@/lib/utils/combat';
import type { CreatureAbility, CombatantState } from '@/lib/types';

const makeAbility = (overrides: Partial<CreatureAbility> = {}): CreatureAbility => ({
  name: 'Earthquake',
  description: 'The ground shakes.',
  ...overrides,
});

describe('applyDamage', () => {
  test('fully absorbed by temp HP', () => {
    expect(applyDamage(30, 14, 10)).toEqual({ hp: 30, tempHp: 4 });
  });

  test('partially absorbed: overflow drains regular HP', () => {
    expect(applyDamage(30, 4, 10)).toEqual({ hp: 24, tempHp: 0 });
  });

  test('exact match: temp zeroed, regular HP unchanged', () => {
    expect(applyDamage(30, 10, 10)).toEqual({ hp: 30, tempHp: 0 });
  });

  test('overflow reduces HP to 0, not below', () => {
    expect(applyDamage(5, 0, 100)).toEqual({ hp: 0, tempHp: 0 });
  });

  test('no temp HP: all damage goes to regular HP', () => {
    expect(applyDamage(30, 0, 8)).toEqual({ hp: 22, tempHp: 0 });
  });
});

describe('applyHealing', () => {
  test('normal heal', () => {
    expect(applyHealing(20, 40, 10)).toEqual({ hp: 30 });
  });

  test('heal capped at maxHp', () => {
    expect(applyHealing(38, 40, 10)).toEqual({ hp: 40 });
  });

  test('heal from 0', () => {
    expect(applyHealing(0, 40, 15)).toEqual({ hp: 15 });
  });
});

describe('setTempHp', () => {
  test('higher new value replaces current', () => {
    expect(setTempHp(5, 14)).toEqual({ tempHp: 14 });
  });

  test('lower new value is ignored', () => {
    expect(setTempHp(14, 5)).toEqual({ tempHp: 14 });
  });

  test('equal value is ignored (no change)', () => {
    expect(setTempHp(10, 10)).toEqual({ tempHp: 10 });
  });

  test('setting from 0', () => {
    expect(setTempHp(0, 14)).toEqual({ tempHp: 14 });
  });
});

describe('useLegendaryAction', () => {
  test('cost 1 decrements by 1', () => {
    expect(useLegendaryAction(3, 1)).toEqual({ legendaryActionsRemaining: 2 });
  });

  test('cost 2 decrements by 2', () => {
    expect(useLegendaryAction(3, 2)).toEqual({ legendaryActionsRemaining: 1 });
  });

  test('remaining cannot go below 0', () => {
    expect(useLegendaryAction(1, 2)).toEqual({ legendaryActionsRemaining: 0 });
  });

  test('remaining of 0 stays 0', () => {
    expect(useLegendaryAction(0, 1)).toEqual({ legendaryActionsRemaining: 0 });
  });

  test('negative cost is treated as 0 (no change)', () => {
    expect(useLegendaryAction(3, -1)).toEqual({ legendaryActionsRemaining: 3 });
  });

  test('non-finite cost (NaN) is treated as 0', () => {
    expect(useLegendaryAction(3, NaN)).toEqual({ legendaryActionsRemaining: 3 });
  });

  test('non-finite cost (Infinity) is treated as 0', () => {
    expect(useLegendaryAction(3, Infinity)).toEqual({ legendaryActionsRemaining: 3 });
  });

  test('non-finite remaining is treated as 0', () => {
    expect(useLegendaryAction(NaN, 1)).toEqual({ legendaryActionsRemaining: 0 });
  });

  test('fractional cost is floored to integer', () => {
    expect(useLegendaryAction(3, 1.9)).toEqual({ legendaryActionsRemaining: 2 });
  });
});

describe('resetLegendaryActions', () => {
  test('returns full count', () => {
    expect(resetLegendaryActions(3)).toEqual({ legendaryActionsRemaining: 3 });
  });

  test('count of 0 returns 0', () => {
    expect(resetLegendaryActions(0)).toEqual({ legendaryActionsRemaining: 0 });
  });

  test('negative count is clamped to 0', () => {
    expect(resetLegendaryActions(-1)).toEqual({ legendaryActionsRemaining: 0 });
  });

  test('non-finite count (NaN) returns 0', () => {
    expect(resetLegendaryActions(NaN)).toEqual({ legendaryActionsRemaining: 0 });
  });

  test('non-finite count (Infinity) returns 0', () => {
    expect(resetLegendaryActions(Infinity)).toEqual({ legendaryActionsRemaining: 0 });
  });
});

describe('resetIncomingLegendaryPool', () => {
  const makeCombatant = (id: string, lacCount?: number, lacRemaining?: number) => ({
    id,
    legendaryActionCount: lacCount,
    legendaryActionsRemaining: lacRemaining,
  });

  test('resets pool for the combatant at nextIndex', () => {
    const combatants = [makeCombatant('a', 3, 1), makeCombatant('b', 3, 0)];
    const result = resetIncomingLegendaryPool(combatants, 0);
    expect(result[0].legendaryActionsRemaining).toBe(3);
    expect(result[1].legendaryActionsRemaining).toBe(0); // unchanged
  });

  test('does not reset combatant at other indices', () => {
    const combatants = [makeCombatant('a', 3, 1), makeCombatant('b', 3, 0)];
    const result = resetIncomingLegendaryPool(combatants, 1);
    expect(result[0].legendaryActionsRemaining).toBe(1); // unchanged
    expect(result[1].legendaryActionsRemaining).toBe(3);
  });

  test('skips reset when legendaryActionCount is 0', () => {
    const combatants = [makeCombatant('a', 0, 0), makeCombatant('b', 3, 1)];
    const result = resetIncomingLegendaryPool(combatants, 0);
    expect(result[0].legendaryActionsRemaining).toBe(0); // unchanged
  });

  test('skips reset when legendaryActionCount is undefined', () => {
    const combatants = [makeCombatant('a', undefined, undefined), makeCombatant('b', 3, 1)];
    const result = resetIncomingLegendaryPool(combatants, 0);
    expect(result[0].legendaryActionsRemaining).toBeUndefined(); // unchanged
  });

  test('preserves other combatant properties', () => {
    const combatants = [{ id: 'a', legendaryActionCount: 3, legendaryActionsRemaining: 1, hp: 50 }];
    const result = resetIncomingLegendaryPool(combatants, 0);
    expect(result[0].hp).toBe(50);
    expect(result[0].legendaryActionsRemaining).toBe(3);
  });
});

describe('decrementLegendaryPool', () => {
  test('decrements count by 1', () => {
    expect(decrementLegendaryPool(3, 2)).toEqual({ legendaryActionCount: 2, legendaryActionsRemaining: 2 });
  });

  test('clamps count at 0', () => {
    expect(decrementLegendaryPool(0, 0)).toEqual({ legendaryActionCount: 0, legendaryActionsRemaining: 0 });
  });

  test('clamps remaining to new count when remaining exceeds it', () => {
    expect(decrementLegendaryPool(3, 3)).toEqual({ legendaryActionCount: 2, legendaryActionsRemaining: 2 });
  });

  test('preserves remaining when it is already below new count', () => {
    expect(decrementLegendaryPool(3, 1)).toEqual({ legendaryActionCount: 2, legendaryActionsRemaining: 1 });
  });

  test('count 1 decrements to 0, remaining clamped to 0', () => {
    expect(decrementLegendaryPool(1, 1)).toEqual({ legendaryActionCount: 0, legendaryActionsRemaining: 0 });
  });
});

describe('incrementLegendaryPool', () => {
  test('increments count by 1', () => {
    expect(incrementLegendaryPool(3, 2)).toEqual({ legendaryActionCount: 4, legendaryActionsRemaining: 2 });
  });

  test('preserves remaining unchanged', () => {
    expect(incrementLegendaryPool(3, 1)).toEqual({ legendaryActionCount: 4, legendaryActionsRemaining: 1 });
  });

  test('increments from 0', () => {
    expect(incrementLegendaryPool(0, 0)).toEqual({ legendaryActionCount: 1, legendaryActionsRemaining: 0 });
  });
});

describe('useCharge', () => {
  test('decrements usesRemaining by 1', () => {
    const result = useCharge(makeAbility({ usesRemaining: 3 }));
    expect(result.usesRemaining).toBe(2);
  });

  test('clamps at 0, does not go negative', () => {
    const result = useCharge(makeAbility({ usesRemaining: 0 }));
    expect(result.usesRemaining).toBe(0);
  });

  test('returns new object, does not mutate input', () => {
    const ability = makeAbility({ usesRemaining: 2 });
    const result = useCharge(ability);
    expect(result).not.toBe(ability);
    expect(ability.usesRemaining).toBe(2);
  });

  test('passes through ability without usesRemaining unchanged', () => {
    const ability = makeAbility();
    const result = useCharge(ability);
    expect(result.usesRemaining).toBeUndefined();
    expect(result.name).toBe('Earthquake');
  });

  test('preserves all other fields', () => {
    const ability = makeAbility({ usesRemaining: 1, attackBonus: 5 });
    const result = useCharge(ability);
    expect(result.attackBonus).toBe(5);
    expect(result.description).toBe('The ground shakes.');
  });
});

describe('restoreCharge', () => {
  test('increments usesRemaining by 1', () => {
    const result = restoreCharge(makeAbility({ usesRemaining: 2 }));
    expect(result.usesRemaining).toBe(3);
  });

  test('increments from 0', () => {
    const result = restoreCharge(makeAbility({ usesRemaining: 0 }));
    expect(result.usesRemaining).toBe(1);
  });

  test('returns new object, does not mutate input', () => {
    const ability = makeAbility({ usesRemaining: 1 });
    const result = restoreCharge(ability);
    expect(result).not.toBe(ability);
    expect(ability.usesRemaining).toBe(1);
  });

  test('passes through ability without usesRemaining unchanged', () => {
    const ability = makeAbility();
    const result = restoreCharge(ability);
    expect(result.usesRemaining).toBeUndefined();
  });

  test('preserves all other fields', () => {
    const ability = makeAbility({ usesRemaining: 0, saveDC: 15 });
    const result = restoreCharge(ability);
    expect(result.saveDC).toBe(15);
  });
});

describe('restoreAllCharges', () => {
  const limited = (name: string, uses: number): CreatureAbility => ({ name, description: 'd', usesRemaining: uses });
  const unlimited = (name: string): CreatureAbility => ({ name, description: 'd' });

  test('increments usesRemaining on all limited actions', () => {
    const result = restoreAllCharges([limited('A', 0), limited('B', 1)]);
    expect(result[0].usesRemaining).toBe(1);
    expect(result[1].usesRemaining).toBe(2);
  });

  test('leaves unlimited actions (no usesRemaining) unchanged', () => {
    const result = restoreAllCharges([unlimited('X')]);
    expect(result[0].usesRemaining).toBeUndefined();
  });

  test('mixed array: limited incremented, unlimited unchanged', () => {
    const result = restoreAllCharges([limited('A', 0), unlimited('B'), limited('C', 2)]);
    expect(result[0].usesRemaining).toBe(1);
    expect(result[1].usesRemaining).toBeUndefined();
    expect(result[2].usesRemaining).toBe(3);
  });

  test('returns new array, does not mutate input', () => {
    const actions = [limited('A', 1)];
    const result = restoreAllCharges(actions);
    expect(result).not.toBe(actions);
    expect(actions[0].usesRemaining).toBe(1);
  });

  test('empty array returns empty array', () => {
    expect(restoreAllCharges([])).toEqual([]);
  });
});

describe('buildLairCombatant', () => {
  const dragonBase: CombatantState = {
    id: 'm1', name: 'Dragon', type: 'monster', initiative: 15,
    conditions: [], hp: 100, maxHp: 100, ac: 18,
    abilityScores: { strength: 20, dexterity: 10, constitution: 18, intelligence: 12, wisdom: 10, charisma: 16 },
    lairActions: [{ name: 'Eruption', description: 'Lava erupts.' }],
  };
  const dragonSource = [dragonBase];

  test('returns a lair-type combatant with initiative 20', () => {
    const c = buildLairCombatant('Dragon Lair', '', null);
    expect(c.type).toBe('lair');
    expect(c.initiative).toBe(20);
    expect(c.name).toBe('Dragon Lair');
  });

  test('id is unique per call', () => {
    const a = buildLairCombatant('Lair', '', null);
    const b = buildLairCombatant('Lair', '', null);
    expect(a.id).not.toBe(b.id);
    expect(a.id).toMatch(/^lair-/);
  });

  test('includes initiativeRoll so hasInitiativeBeenRolled returns true', () => {
    const c = buildLairCombatant('Test', '', null);
    expect(c.initiativeRoll).toEqual({ roll: 20, bonus: 0, total: 20, method: 'manual' });
  });

  test('lairActions is empty when no seed monster', () => {
    const c = buildLairCombatant('Lair', '', null);
    expect(c.lairActions).toEqual([]);
  });

  test('lairActions is empty when seedMonsterName is empty string', () => {
    const c = buildLairCombatant('Lair', '', dragonSource);
    expect(c.lairActions).toEqual([]);
  });

  test('copies lairActions from matching seed monster', () => {
    const lairAction = { name: 'Eruption', description: 'Lava erupts.', usesRemaining: 1 };
    const source: CombatantState[] = [{ ...dragonBase, lairActions: [lairAction] }];
    const c = buildLairCombatant('Dragon Lair', 'Dragon', source);
    expect(c.lairActions).toEqual([lairAction]);
    expect(c.lairActions![0]).not.toBe(lairAction); // deep copy
  });

  test('empty lairActions when seed monster name not found', () => {
    const c = buildLairCombatant('Lair', 'Unknown', dragonSource);
    expect(c.lairActions).toEqual([]);
  });

  test('empty lairActions when sourceList is null and seedMonsterName given', () => {
    const c = buildLairCombatant('Lair', 'Dragon', null);
    expect(c.lairActions).toEqual([]);
  });

  test('hp, maxHp, and ac are all 0', () => {
    const c = buildLairCombatant('Lair', '', null);
    expect(c.hp).toBe(0);
    expect(c.maxHp).toBe(0);
    expect(c.ac).toBe(0);
  });
});
