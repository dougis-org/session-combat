import type { CombatantState } from '@/lib/types';
import { applyHpChange } from '@/lib/combat/applyHpChange';
import { applyDamageWhileDowned } from '@/lib/combat/deathSaves';
import { calcConSaveDC } from '@/lib/utils/combat';

const makeCombatant = (overrides: Partial<CombatantState> = {}): CombatantState => ({
  id: 'c1',
  name: 'Aria',
  type: 'player',
  initiative: 10,
  conditions: [],
  hp: 20,
  maxHp: 20,
  ac: 15,
  abilityScores: { strength: 10, dexterity: 10, constitution: 10, intelligence: 10, wisdom: 10, charisma: 10 },
  ...overrides,
});

describe('applyHpChange — damage', () => {
  test('damage on an active combatant reduces hp and records history, no life-state keys', () => {
    const result = applyHpChange(makeCombatant({ hp: 20, maxHp: 20 }), {
      kind: 'damage',
      amount: 7,
      damageType: '',
    });
    expect(result.updates.hp).toBe(13);
    expect(result.updates).not.toHaveProperty('lifeState');
    expect(result.updates).not.toHaveProperty('deathSaves');
    expect(result.updates).not.toHaveProperty('concentratingOn');
    expect(result.updates).not.toHaveProperty('pendingConSaveDC');
    expect(result.history).toEqual({ type: 'damage', amount: 7, hp: 20, tempHp: 0 });
    expect(result.conSaveRequired).toBeUndefined();
  });

  test('damage to 0 HP enters dying for a death-save user', () => {
    const result = applyHpChange(makeCombatant({ hp: 4, maxHp: 20 }), {
      kind: 'damage',
      amount: 9,
      damageType: '',
    });
    expect(result.updates.hp).toBe(0);
    expect(result.updates.lifeState).toBe('dying');
    expect(result.updates.deathSaves).toEqual({ successes: 0, failures: 0 });
  });

  test('damage while downed applies the death-save-while-downed rules', () => {
    const combatant = makeCombatant({
      hp: 0,
      maxHp: 20,
      lifeState: 'dying',
      deathSaves: { successes: 0, failures: 1 },
    });
    const result = applyHpChange(combatant, { kind: 'damage', amount: 3, damageType: '' });
    const expected = applyDamageWhileDowned(combatant, { critical: false, damage: 3 });
    expect(result.updates).toMatchObject(expected);
    expect(result.updates.deathSaves).toEqual({ successes: 0, failures: 2 });
  });

  test('massive damage to a downed combatant is instant death', () => {
    const combatant = makeCombatant({
      hp: 0,
      maxHp: 20,
      lifeState: 'dying',
      deathSaves: { successes: 0, failures: 1 },
    });
    const result = applyHpChange(combatant, { kind: 'damage', amount: 25, damageType: '' });
    expect(result.updates.lifeState).toBe('dead');
    expect(result.updates.deathSaves).toBeUndefined();
  });

  test('a monster taken to 0 HP gets no life-state keys but still clears concentration', () => {
    const result = applyHpChange(
      makeCombatant({ type: 'monster', hp: 6, maxHp: 6, concentratingOn: 'Web' }),
      { kind: 'damage', amount: 9, damageType: '' }
    );
    expect(result.updates.hp).toBe(0);
    expect(result.updates).not.toHaveProperty('lifeState');
    expect(result.updates).not.toHaveProperty('deathSaves');
    expect(result.updates.concentratingOn).toBeUndefined();
  });

  test('a concentrating combatant hit for fully-mitigated damage raises no CON save', () => {
    const result = applyHpChange(
      makeCombatant({ hp: 20, maxHp: 20, concentratingOn: 'Bless', damageImmunities: ['fire'] }),
      { kind: 'damage', amount: 12, damageType: 'fire' }
    );
    expect(result.updates).not.toHaveProperty('pendingConSaveDC');
    expect(result.updates).not.toHaveProperty('concentratingOn');
    expect(result.conSaveRequired).toBeUndefined();
  });

  test('damage on an already-dead combatant adds no death-save failure', () => {
    const result = applyHpChange(
      makeCombatant({ hp: 0, maxHp: 20, lifeState: 'dead' }),
      { kind: 'damage', amount: 5, damageType: '' }
    );
    expect(result.updates.lifeState).not.toBe('dead');
    expect(result.updates).not.toHaveProperty('deathSaves');
  });

  test('fully-mitigated damage while downed is inert', () => {
    const combatant = makeCombatant({
      hp: 0,
      maxHp: 20,
      lifeState: 'dying',
      deathSaves: { successes: 0, failures: 0 },
      damageImmunities: ['fire'],
    });
    const result = applyHpChange(combatant, { kind: 'damage', amount: 10, damageType: 'fire' });
    expect(result.updates.lifeState).not.toBe('dead');
    expect(result.updates).not.toHaveProperty('deathSaves');
  });

  test('damage on a concentrating combatant above 0 surfaces a CON save', () => {
    const result = applyHpChange(
      makeCombatant({ hp: 20, maxHp: 30, concentratingOn: 'Bless' }),
      { kind: 'damage', amount: 12, damageType: '' }
    );
    expect(result.updates.pendingConSaveDC).toBe(calcConSaveDC(12));
    expect(result.conSaveRequired).toBe(calcConSaveDC(12));
  });

  test('dropping a concentrating combatant to 0 clears concentration', () => {
    const result = applyHpChange(
      makeCombatant({ hp: 5, maxHp: 20, concentratingOn: 'Bless', pendingConSaveDC: 13 }),
      { kind: 'damage', amount: 9, damageType: '' }
    );
    expect(result.updates.hp).toBe(0);
    expect(result.updates.concentratingOn).toBeUndefined();
    expect(result.updates.pendingConSaveDC).toBeUndefined();
    expect(result.conSaveRequired).toBeUndefined();
  });

  test('no HP-history entry when the value does not change', () => {
    const result = applyHpChange(makeCombatant({ hp: 0, maxHp: 20, tempHp: 0, type: 'monster' }), {
      kind: 'damage',
      amount: 4,
      damageType: '',
    });
    expect(result.history).toBeUndefined();
  });
});

describe('applyHpChange — heal', () => {
  test('healing a downed combatant clears life-state', () => {
    const result = applyHpChange(
      makeCombatant({ hp: 0, maxHp: 20, lifeState: 'stable', deathSaves: { successes: 1, failures: 2 } }),
      { kind: 'heal', amount: 5, damageType: '' }
    );
    expect(result.updates.hp).toBe(5);
    expect(result.updates.lifeState).toBeUndefined();
    expect(result.updates.deathSaves).toBeUndefined();
    expect(result.history).toEqual({ type: 'healing', amount: 5, hp: 0, tempHp: 0 });
  });
});

describe('applyHpChange — setTemp', () => {
  test('a higher value wins and records tempHp history', () => {
    const result = applyHpChange(makeCombatant({ tempHp: 3 }), {
      kind: 'setTemp',
      amount: 8,
      damageType: '',
    });
    expect(result.updates.tempHp).toBe(8);
    expect(result.history?.type).toBe('tempHp');
  });

  test('a lower value is ignored — empty updates, no history', () => {
    const result = applyHpChange(makeCombatant({ tempHp: 3 }), {
      kind: 'setTemp',
      amount: 2,
      damageType: '',
    });
    expect(result.updates).toEqual({});
    expect(result.history).toBeUndefined();
  });

  test('a value equal to the current tempHp is a no-op', () => {
    const result = applyHpChange(makeCombatant({ tempHp: 5 }), {
      kind: 'setTemp',
      amount: 5,
      damageType: '',
    });
    expect(result.updates).toEqual({});
    expect(result.history).toBeUndefined();
  });
});
