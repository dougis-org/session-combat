import { describe, test, expect } from '@jest/globals';
import { getExpiringConditions, tickConditions, processRoundEnd } from '@/lib/combat/conditionExpiry';
import { CombatantState } from '@/lib/types';

function makeCombatant(overrides: Partial<CombatantState> & { name: string }): CombatantState {
  return {
    id: overrides.name,
    name: overrides.name,
    type: 'player',
    initiative: 10,
    initiativeRoll: { roll: 10, bonus: 0, total: 10, method: 'manual' },
    maxHp: 10,
    currentHp: 10,
    armorClass: 10,
    conditions: [],
    ...overrides,
  };
}

function makeCondition(name: string, duration?: number) {
  return { id: name, name, description: '', duration };
}

// ─── getExpiringConditions ────────────────────────────────────────────────────

describe('getExpiringConditions', () => {
  test('returns empty array when no combatants have conditions', () => {
    const combatants = [makeCombatant({ name: 'Goblin' })];
    expect(getExpiringConditions(combatants)).toEqual([]);
  });

  test('returns empty array when all conditions have no duration (permanent)', () => {
    const combatants = [
      makeCombatant({ name: 'Goblin', conditions: [makeCondition('Poisoned')] }),
    ];
    expect(getExpiringConditions(combatants)).toEqual([]);
  });

  test('returns empty array when conditions have duration > 1 (will not expire this tick)', () => {
    const combatants = [
      makeCombatant({ name: 'Goblin', conditions: [makeCondition('Poisoned', 2)] }),
    ];
    expect(getExpiringConditions(combatants)).toEqual([]);
  });

  test('detects a condition with duration = 1 as expiring', () => {
    const combatants = [
      makeCombatant({ name: 'Goblin', conditions: [makeCondition('Poisoned', 1)] }),
    ];
    expect(getExpiringConditions(combatants)).toEqual([
      { combatantName: 'Goblin', conditionName: 'Poisoned' },
    ]);
  });

  test('detects a condition with duration = 0 as expiring (already at zero)', () => {
    // regression guard: duration=0 must be treated as expired, not as "no expiry"
    const combatants = [
      makeCombatant({ name: 'Fighter', conditions: [makeCondition('Frightened', 0)] }),
    ];
    expect(getExpiringConditions(combatants)).toEqual([
      { combatantName: 'Fighter', conditionName: 'Frightened' },
    ]);
  });

  test('returns multiple entries when multiple conditions expire across combatants', () => {
    const combatants = [
      makeCombatant({ name: 'Goblin', conditions: [makeCondition('Poisoned', 1), makeCondition('Blinded', 2)] }),
      makeCombatant({ name: 'Fighter', conditions: [makeCondition('Frightened', 1)] }),
    ];
    const result = getExpiringConditions(combatants);
    expect(result).toHaveLength(2);
    expect(result).toContainEqual({ combatantName: 'Goblin', conditionName: 'Poisoned' });
    expect(result).toContainEqual({ combatantName: 'Fighter', conditionName: 'Frightened' });
  });
});

// ─── tickConditions ───────────────────────────────────────────────────────────

describe('tickConditions', () => {
  test('leaves permanent conditions (no duration) unchanged', () => {
    const combatants = [
      makeCombatant({ name: 'Goblin', conditions: [makeCondition('Poisoned')] }),
    ];
    const result = tickConditions(combatants);
    expect(result[0].conditions).toHaveLength(1);
    expect(result[0].conditions[0].duration).toBeUndefined();
  });

  test('decrements duration = 2 to 1, condition retained', () => {
    const combatants = [
      makeCombatant({ name: 'Goblin', conditions: [makeCondition('Poisoned', 2)] }),
    ];
    const result = tickConditions(combatants);
    expect(result[0].conditions).toHaveLength(1);
    expect(result[0].conditions[0].duration).toBe(1);
  });

  test('removes condition when duration = 1 (ticks to 0)', () => {
    const combatants = [
      makeCombatant({ name: 'Goblin', conditions: [makeCondition('Poisoned', 1)] }),
    ];
    const result = tickConditions(combatants);
    expect(result[0].conditions).toHaveLength(0);
  });

  test('removes condition when duration = 0 (regression: falsy bug)', () => {
    // The old filter `!cond.duration || cond.duration > 0` kept duration=0 due to !0===true.
    // This test guards against that regression.
    const combatants = [
      makeCombatant({ name: 'Fighter', conditions: [makeCondition('Frightened', 0)] }),
    ];
    const result = tickConditions(combatants);
    expect(result[0].conditions).toHaveLength(0);
  });

  test('keeps permanent condition while removing expired one in the same combatant', () => {
    const combatants = [
      makeCombatant({
        name: 'Wizard',
        conditions: [makeCondition('Concentrating'), makeCondition('Blinded', 1)],
      }),
    ];
    const result = tickConditions(combatants);
    expect(result[0].conditions).toHaveLength(1);
    expect(result[0].conditions[0].name).toBe('Concentrating');
  });

  test('does not mutate the original combatants array', () => {
    const original = makeCombatant({ name: 'Rogue', conditions: [makeCondition('Hidden', 1)] });
    const combatants = [original];
    tickConditions(combatants);
    expect(combatants[0].conditions).toHaveLength(1);
    expect(combatants[0].conditions[0].duration).toBe(1);
  });

  test('handles multiple combatants independently', () => {
    const combatants = [
      makeCombatant({ name: 'A', conditions: [makeCondition('X', 1), makeCondition('Y', 3)] }),
      makeCombatant({ name: 'B', conditions: [makeCondition('Z', 2)] }),
    ];
    const result = tickConditions(combatants);
    // A: X removed (1→0), Y decremented (3→2)
    expect(result[0].conditions).toHaveLength(1);
    expect(result[0].conditions[0].name).toBe('Y');
    expect(result[0].conditions[0].duration).toBe(2);
    // B: Z decremented (2→1)
    expect(result[1].conditions).toHaveLength(1);
    expect(result[1].conditions[0].duration).toBe(1);
  });
});

// ─── processRoundEnd ──────────────────────────────────────────────────────────

describe('processRoundEnd', () => {
  test('returns empty expiring list and unchanged combatants when no conditions exist', () => {
    const combatants = [makeCombatant({ name: 'Goblin' })];
    const { updatedCombatants, expiring } = processRoundEnd(combatants);
    expect(expiring).toHaveLength(0);
    expect(updatedCombatants[0].conditions).toHaveLength(0);
  });

  test('decrements duration and returns no expiring entries when duration > 1', () => {
    const combatants = [
      makeCombatant({ name: 'Goblin', conditions: [makeCondition('Poisoned', 3)] }),
    ];
    const { updatedCombatants, expiring } = processRoundEnd(combatants);
    expect(expiring).toHaveLength(0);
    expect(updatedCombatants[0].conditions[0].duration).toBe(2);
  });

  test('removes condition and adds expiring entry when duration = 1', () => {
    const combatants = [
      makeCombatant({ name: 'Goblin', conditions: [makeCondition('Poisoned', 1)] }),
    ];
    const { updatedCombatants, expiring } = processRoundEnd(combatants);
    expect(updatedCombatants[0].conditions).toHaveLength(0);
    expect(expiring).toEqual([{ combatantName: 'Goblin', conditionName: 'Poisoned' }]);
  });

  test('collects expiring entries across multiple combatants in a single pass', () => {
    const combatants = [
      makeCombatant({ name: 'A', conditions: [makeCondition('X', 1), makeCondition('Y', 2)] }),
      makeCombatant({ name: 'B', conditions: [makeCondition('Z', 1)] }),
    ];
    const { updatedCombatants, expiring } = processRoundEnd(combatants);
    expect(expiring).toHaveLength(2);
    expect(expiring).toContainEqual({ combatantName: 'A', conditionName: 'X' });
    expect(expiring).toContainEqual({ combatantName: 'B', conditionName: 'Z' });
    // Y was not expiring — retained with decremented duration
    expect(updatedCombatants[0].conditions).toHaveLength(1);
    expect(updatedCombatants[0].conditions[0].name).toBe('Y');
    expect(updatedCombatants[0].conditions[0].duration).toBe(1);
  });

  test('does not mutate the original combatants array', () => {
    const original = makeCombatant({ name: 'Rogue', conditions: [makeCondition('Hiding', 1)] });
    processRoundEnd([original]);
    expect(original.conditions).toHaveLength(1);
    expect(original.conditions[0].duration).toBe(1);
  });

  test('leaves permanent (no-duration) conditions untouched and never adds them to expiring', () => {
    const combatants = [
      makeCombatant({ name: 'Fighter', conditions: [makeCondition('Blessed')] }),
    ];
    const { updatedCombatants, expiring } = processRoundEnd(combatants);
    expect(expiring).toHaveLength(0);
    expect(updatedCombatants[0].conditions[0].duration).toBeUndefined();
  });
});
