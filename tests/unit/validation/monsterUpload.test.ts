import { describe, test, expect } from '@jest/globals';
import { transformMonsterData, RawMonsterData } from '@/lib/validation/monsterUpload';

const MINIMAL_RAW: RawMonsterData = {
  name: 'Test Monster',
  hp: 20,
  maxHp: 20,
  ac: 13,
  challengeRating: 1,
};

describe('transformMonsterData – damage type filtering', () => {
  test('passes through valid lowercase DamageType values unchanged', () => {
    const result = transformMonsterData(
      { ...MINIMAL_RAW, damageResistances: ['fire', 'cold'] },
      'user1',
    );
    expect(result.damageResistances).toEqual(['fire', 'cold']);
  });

  test('normalizes mixed-case values to lowercase canonical types', () => {
    const result = transformMonsterData(
      { ...MINIMAL_RAW, damageImmunities: ['Fire', 'COLD', 'Poison'] },
      'user1',
    );
    expect(result.damageImmunities).toEqual(['fire', 'cold', 'poison']);
  });

  test('trims whitespace from values', () => {
    const result = transformMonsterData(
      { ...MINIMAL_RAW, damageVulnerabilities: [' fire ', 'cold '] },
      'user1',
    );
    expect(result.damageVulnerabilities).toEqual(['fire', 'cold']);
  });

  test('filters out freeform non-DamageType strings', () => {
    const result = transformMonsterData(
      { ...MINIMAL_RAW, damageResistances: ['fire', 'from nonmagical weapons', 'bludgeoning, piercing'] },
      'user1',
    );
    expect(result.damageResistances).toEqual(['fire']);
  });

  test('produces empty array when all values are invalid', () => {
    const result = transformMonsterData(
      { ...MINIMAL_RAW, damageResistances: ['damage from spells', 'nonmagical bludgeoning'] },
      'user1',
    );
    expect(result.damageResistances).toEqual([]);
  });

  test('handles undefined resistance arrays (absent key) → empty array', () => {
    const result = transformMonsterData(MINIMAL_RAW, 'user1');
    expect(result.damageResistances).toEqual([]);
    expect(result.damageImmunities).toEqual([]);
    expect(result.damageVulnerabilities).toEqual([]);
  });

  test('handles empty resistance arrays', () => {
    const result = transformMonsterData(
      { ...MINIMAL_RAW, damageResistances: [], damageImmunities: [], damageVulnerabilities: [] },
      'user1',
    );
    expect(result.damageResistances).toEqual([]);
    expect(result.damageImmunities).toEqual([]);
    expect(result.damageVulnerabilities).toEqual([]);
  });

  test('all 13 canonical types pass through', () => {
    const all13 = ['acid', 'bludgeoning', 'cold', 'fire', 'force', 'lightning', 'necrotic', 'piercing', 'poison', 'psychic', 'radiant', 'slashing', 'thunder'];
    const result = transformMonsterData(
      { ...MINIMAL_RAW, damageImmunities: all13 },
      'user1',
    );
    expect(result.damageImmunities).toEqual(all13);
  });

  test('mixed valid and invalid values: keeps only valid', () => {
    const result = transformMonsterData(
      {
        ...MINIMAL_RAW,
        damageResistances: ['fire', 'cold'],
        damageImmunities: ['poison', 'invalid-type'],
        damageVulnerabilities: ['lightning', ''],
      },
      'user1',
    );
    expect(result.damageResistances).toEqual(['fire', 'cold']);
    expect(result.damageImmunities).toEqual(['poison']);
    expect(result.damageVulnerabilities).toEqual(['lightning']);
  });

  test('normalizes alignment casing and whitespace to canonical values', () => {
    const result = transformMonsterData(
      { ...MINIMAL_RAW, alignment: ' chaotic evil ' },
      'user1',
    );
    expect(result.alignment).toBe('Chaotic Evil');
  });
});
