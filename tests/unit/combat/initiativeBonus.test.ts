import { describe, test, expect, jest, beforeEach } from '@jest/globals';
import { getDexInitiativeBonus, buildInitiativeRoll } from '@/lib/utils/combat';
import type { CombatantState } from '@/lib/types';
import * as diceModule from '@/lib/utils/dice';

jest.mock('@/lib/utils/dice');

const mockRollDie = jest.mocked(diceModule.rollDie);

const makeCombatant = (dexterity: number = 10): CombatantState => ({
  id: 'c1',
  name: 'Test',
  type: 'player',
  initiative: 0,
  conditions: [],
  hp: 10,
  maxHp: 10,
  ac: 10,
  abilityScores: { strength: 10, dexterity, constitution: 10, intelligence: 10, wisdom: 10, charisma: 10 },
});

beforeEach(() => { mockRollDie.mockReset(); });

describe('getDexInitiativeBonus', () => {
  test('DEX 16 → +3', () => {
    expect(getDexInitiativeBonus(makeCombatant(16))).toBe(3);
  });

  test('DEX 10 → 0', () => {
    expect(getDexInitiativeBonus(makeCombatant(10))).toBe(0);
  });

  test('DEX 8 → -1', () => {
    expect(getDexInitiativeBonus(makeCombatant(8))).toBe(-1);
  });

  test('missing abilityScores defaults to DEX 10 → 0', () => {
    const c = { ...makeCombatant(), abilityScores: undefined } as unknown as CombatantState;
    expect(getDexInitiativeBonus(c)).toBe(0);
  });

  test('DEX 20 → +5', () => {
    expect(getDexInitiativeBonus(makeCombatant(20))).toBe(5);
  });

  test('DEX 1 → -5', () => {
    expect(getDexInitiativeBonus(makeCombatant(1))).toBe(-5);
  });
});

// ---------------------------------------------------------------------------
// Section 6: buildInitiativeRoll — bulk roll utility
// ---------------------------------------------------------------------------

describe('buildInitiativeRoll — advantage', () => {
  test('with advantage: two dice rolled, higher taken as roll, lower as altRoll, advantage: true', () => {
    mockRollDie.mockReturnValue([15, 7]);
    const combatant = { ...makeCombatant(16), initiativeAdvantage: true };
    const result = buildInitiativeRoll(combatant);

    expect(mockRollDie).toHaveBeenCalledWith(20, 2);
    expect(result.roll).toBe(15);
    expect(result.altRoll).toBe(7);
    expect(result.advantage).toBe(true);
    expect(result.total).toBe(18); // 15 + 3 (DEX 16)
  });

  test('without advantage: single die, no altRoll, no advantage flag', () => {
    mockRollDie.mockReturnValue([12]);
    const combatant = makeCombatant(16);
    const result = buildInitiativeRoll(combatant);

    expect(mockRollDie).toHaveBeenCalledWith(20);
    expect(result.roll).toBe(12);
    expect(result.altRoll).toBeUndefined();
    expect(result.advantage).toBeFalsy();
  });
});

describe('buildInitiativeRoll — flat bonus', () => {
  test('flat bonus applied to total and recorded on roll', () => {
    mockRollDie.mockReturnValue([10]);
    const combatant = { ...makeCombatant(10), initiativeFlatBonus: 5 };
    const result = buildInitiativeRoll(combatant);

    expect(result.flatBonus).toBe(5);
    expect(result.total).toBe(15); // 10 + 0 + 5
  });

  test('zero flat bonus has no effect and flatBonus field absent', () => {
    mockRollDie.mockReturnValue([10]);
    const combatant = { ...makeCombatant(10), initiativeFlatBonus: 0 };
    const result = buildInitiativeRoll(combatant);

    expect(result.total).toBe(10);
    expect(result.flatBonus).toBeUndefined();
  });
});
