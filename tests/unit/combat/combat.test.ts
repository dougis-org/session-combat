import { describe, test, expect } from '@jest/globals';
import { applyDamage, applyHealing, setTempHp, useLegendaryAction, resetLegendaryActions } from '@/lib/utils/combat';

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
});

describe('resetLegendaryActions', () => {
  test('returns full count', () => {
    expect(resetLegendaryActions(3)).toEqual({ legendaryActionsRemaining: 3 });
  });

  test('count of 0 returns 0', () => {
    expect(resetLegendaryActions(0)).toEqual({ legendaryActionsRemaining: 0 });
  });
});
