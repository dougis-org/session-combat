import { renderHook, act } from '@testing-library/react';
import type { CombatantState } from '@/lib/types';
import { useCombatantHp } from '@/lib/hooks/useCombatantHp';
import { calcConSaveDC } from '@/lib/utils/combat';

let historyStack: Array<{ hp: number; tempHp: number; type: string; amount: number; timestamp: number }>;

jest.mock('@/lib/utils/hpHistory', () => ({
  pushHpHistory: jest.fn((_c: string, _id: string, entry: never) => {
    historyStack.push(entry);
  }),
  popHpHistory: jest.fn(() => historyStack.pop()),
  getHpHistoryStack: jest.fn(() => historyStack),
}));

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

function setup(args: Partial<Parameters<typeof useCombatantHp>[0]> = {}) {
  const onUpdate = jest.fn();
  const onConSaveRequired = jest.fn();
  const combatant = args.combatant ?? makeCombatant();
  const view = renderHook((props: { combatant: CombatantState }) =>
    useCombatantHp({
      combatId: 'combat-1',
      combatant: props.combatant,
      onUpdate,
      onConSaveRequired,
      ...args,
    }),
    { initialProps: { combatant } }
  );
  return { ...view, onUpdate, onConSaveRequired };
}

beforeEach(() => {
  historyStack = [];
  jest.clearAllMocks();
});

describe('useCombatantHp — input validation', () => {
  test('non-integer input is rejected', () => {
    const { result, onUpdate } = setup();
    act(() => result.current.setHpAdjustment('3.5'));
    act(() => result.current.applyDamage());
    expect(onUpdate).not.toHaveBeenCalled();
    expect(result.current.hpAdjustment).toBe('3.5');
  });

  test('out-of-range input is rejected', () => {
    const { result, onUpdate } = setup();
    act(() => result.current.setHpAdjustment('9999999'));
    act(() => result.current.applyHeal());
    expect(onUpdate).not.toHaveBeenCalled();
  });

  test('valid input applies and clears the field', () => {
    const { result, onUpdate } = setup({ combatant: makeCombatant({ hp: 20 }) });
    act(() => result.current.setHpAdjustment('6'));
    act(() => result.current.applyDamage());
    expect(onUpdate).toHaveBeenCalledTimes(1);
    expect(onUpdate).toHaveBeenCalledWith(expect.objectContaining({ hp: 14 }));
    expect(result.current.hpAdjustment).toBe('');
  });
});

describe('useCombatantHp — action paths', () => {
  test('applyHeal routes through the heal path', () => {
    const { result, onUpdate } = setup({ combatant: makeCombatant({ hp: 5, maxHp: 20 }) });
    act(() => result.current.setHpAdjustment('4'));
    act(() => result.current.applyHeal());
    expect(onUpdate).toHaveBeenCalledWith(expect.objectContaining({ hp: 9 }));
  });

  test('applySetTemp with a lower-than-current value does not call onUpdate but clears the field', () => {
    const { result, onUpdate } = setup({ combatant: makeCombatant({ tempHp: 10 }) });
    act(() => result.current.setHpAdjustment('3'));
    act(() => result.current.applySetTemp());
    expect(onUpdate).not.toHaveBeenCalled();
    expect(result.current.hpAdjustment).toBe('');
  });

  test('selected damage type is forwarded into applyHpChange', () => {
    const { result, onUpdate } = setup({
      combatant: makeCombatant({ hp: 20, maxHp: 20, damageImmunities: ['cold'] }),
    });
    act(() => result.current.setSelectedDamageType('cold'));
    act(() => result.current.setHpAdjustment('8'));
    act(() => result.current.applyDamage());
    // immune to cold → hp unchanged
    expect(onUpdate).toHaveBeenCalledWith(expect.objectContaining({ hp: 20 }));
  });

  test('conSaveRequired triggers onConSaveRequired with the DC', () => {
    const { result, onConSaveRequired } = setup({
      combatant: makeCombatant({ hp: 30, maxHp: 30, concentratingOn: 'Bless' }),
    });
    act(() => result.current.setHpAdjustment('12'));
    act(() => result.current.applyDamage());
    expect(onConSaveRequired).toHaveBeenCalledWith(calcConSaveDC(12));
  });
});

describe('useCombatantHp — undo', () => {
  test('canUndo reflects history length and undo restores hp/tempHp only', () => {
    const { result, onUpdate } = setup({ combatant: makeCombatant({ hp: 20, tempHp: 0 }) });
    act(() => result.current.setHpAdjustment('5'));
    act(() => result.current.applyDamage());
    expect(result.current.canUndo).toBe(true);
    onUpdate.mockClear();
    act(() => result.current.undoHpChange());
    expect(onUpdate).toHaveBeenCalledWith({ hp: 20, tempHp: 0 });
    expect(result.current.canUndo).toBe(false);
  });
});
