import type { CombatantState } from '@/lib/types';
import { applyTypedDamage, type TypedDamageResult } from '@/lib/combat/applyTypedDamage';

type DamageMods = Pick<
  CombatantState,
  'damageResistances' | 'damageImmunities' | 'damageVulnerabilities' | 'activeDamageEffects'
>;

const mods = (overrides: Partial<DamageMods> = {}): DamageMods => ({
  damageResistances: [],
  damageImmunities: [],
  damageVulnerabilities: [],
  activeDamageEffects: [],
  ...overrides,
});

describe('applyTypedDamage', () => {
  test('typed damage against immunity leaves the pool untouched', () => {
    const result = applyTypedDamage(10, 0, 8, 'fire', mods({ damageImmunities: ['fire'] }));
    expect(result).toEqual<TypedDamageResult>({
      hp: 10,
      tempHp: 0,
      effectiveDamage: 0,
      incomingDamage: 0,
    });
  });

  test('untyped damage lands in full and drains temp HP first', () => {
    const result = applyTypedDamage(6, 2, 10, '', mods());
    expect(result).toEqual<TypedDamageResult>({
      hp: 0,
      tempHp: 0,
      effectiveDamage: 8,
      incomingDamage: 10,
    });
  });

  test('resistance halves the incoming amount', () => {
    const result = applyTypedDamage(10, 0, 10, 'fire', mods({ damageResistances: ['fire'] }));
    expect(result).toEqual<TypedDamageResult>({
      hp: 5,
      tempHp: 0,
      effectiveDamage: 5,
      incomingDamage: 5,
    });
  });

  test('vulnerability doubles the incoming amount', () => {
    const result = applyTypedDamage(10, 0, 4, 'fire', mods({ damageVulnerabilities: ['fire'] }));
    expect(result).toEqual<TypedDamageResult>({
      hp: 2,
      tempHp: 0,
      effectiveDamage: 8,
      incomingDamage: 8,
    });
  });

  test('untyped damage never exceeds the pool for effectiveDamage but incomingDamage is raw', () => {
    const result = applyTypedDamage(3, 0, 20, '', mods());
    expect(result.hp).toBe(0);
    expect(result.effectiveDamage).toBe(3);
    expect(result.incomingDamage).toBe(20);
  });
});
