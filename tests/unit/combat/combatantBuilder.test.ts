import { describe, test, expect } from '@jest/globals';
import { buildCombatantFromSource } from '@/lib/utils/combat';
import type { Monster, Character } from '@/lib/types';

const baseMonster: Monster = {
  id: 'm1',
  name: 'Fire Elemental',
  type: 'elemental',
  size: 'large',
  alignment: 'Neutral',
  speed: '50 ft.',
  challengeRating: 5,
  hp: 102,
  maxHp: 102,
  ac: 13,
  abilityScores: { strength: 10, dexterity: 14, constitution: 16, intelligence: 6, wisdom: 10, charisma: 7 },
  damageResistances: ['bludgeoning', 'piercing', 'slashing'],
  damageImmunities: ['fire', 'poison'],
  damageVulnerabilities: ['cold'],
  conditionImmunities: ['exhaustion', 'grappled'],
};

const baseCharacter: Character = {
  id: 'c1',
  userId: 'u1',
  name: 'Paladin',
  hp: 45,
  maxHp: 45,
  ac: 18,
  abilityScores: { strength: 16, dexterity: 10, constitution: 14, intelligence: 10, wisdom: 12, charisma: 16 },
  damageResistances: ['necrotic'],
  damageImmunities: ['poison'],
  conditionImmunities: ['frightened'],
  classes: [{ class: 'Paladin', level: 5 }],
};

describe('buildCombatantFromSource – resistance fields', () => {
  test('copies damageResistances from monster', () => {
    const c = buildCombatantFromSource(baseMonster, 'monster', 'monster');
    expect(c.damageResistances).toEqual(['bludgeoning', 'piercing', 'slashing']);
  });

  test('copies damageImmunities from monster', () => {
    const c = buildCombatantFromSource(baseMonster, 'monster', 'monster');
    expect(c.damageImmunities).toEqual(['fire', 'poison']);
  });

  test('copies damageVulnerabilities from monster', () => {
    const c = buildCombatantFromSource(baseMonster, 'monster', 'monster');
    expect(c.damageVulnerabilities).toEqual(['cold']);
  });

  test('copies conditionImmunities from monster', () => {
    const c = buildCombatantFromSource(baseMonster, 'monster', 'monster');
    expect(c.conditionImmunities).toEqual(['exhaustion', 'grappled']);
  });

  test('copies resistance fields from character', () => {
    const c = buildCombatantFromSource(baseCharacter, 'player', 'character');
    expect(c.damageResistances).toEqual(['necrotic']);
    expect(c.conditionImmunities).toEqual(['frightened']);
  });

  test('handles absent resistance fields gracefully (no crash, fields undefined or absent)', () => {
    const bare: Monster = { ...baseMonster, damageResistances: undefined, damageImmunities: undefined, damageVulnerabilities: undefined, conditionImmunities: undefined };
    const c = buildCombatantFromSource(bare, 'monster', 'monster');
    // Should not throw; fields either undefined or absent
    expect(c.damageResistances).toBeUndefined();
    expect(c.damageImmunities).toBeUndefined();
    expect(c.damageVulnerabilities).toBeUndefined();
    expect(c.conditionImmunities).toBeUndefined();
  });
});

describe('buildCombatantFromSource – core fields', () => {
  test('sets type from argument', () => {
    expect(buildCombatantFromSource(baseMonster, 'monster', 'monster').type).toBe('monster');
    expect(buildCombatantFromSource(baseCharacter, 'player', 'character').type).toBe('player');
  });

  test('copies hp, maxHp, ac, name, abilityScores', () => {
    const c = buildCombatantFromSource(baseMonster, 'monster', 'monster');
    expect(c.hp).toBe(102);
    expect(c.maxHp).toBe(102);
    expect(c.ac).toBe(13);
    expect(c.name).toBe('Fire Elemental');
    expect(c.abilityScores).toEqual(baseMonster.abilityScores);
  });

  test('initializes with empty conditions array', () => {
    expect(buildCombatantFromSource(baseMonster, 'monster', 'monster').conditions).toEqual([]);
  });

  test('id starts with idPrefix', () => {
    const c = buildCombatantFromSource(baseMonster, 'monster', 'monster');
    expect(c.id).toMatch(/^monster-/);
  });

  test('copies legendaryActionCount from monster', () => {
    const m = { ...baseMonster, legendaryActionCount: 3 };
    const c = buildCombatantFromSource(m, 'monster', 'monster');
    expect(c.legendaryActionCount).toBe(3);
    expect(c.legendaryActionsRemaining).toBe(3);
  });

  test('legendaryActionCount absent on character → undefined on combatant', () => {
    const c = buildCombatantFromSource(baseCharacter, 'player', 'character');
    expect(c.legendaryActionCount).toBeUndefined();
    expect(c.legendaryActionsRemaining).toBeUndefined();
  });

  test('legendaryActions absent on character → undefined on combatant', () => {
    const c = buildCombatantFromSource(baseCharacter, 'player', 'character');
    expect(c.legendaryActions).toBeUndefined();
  });

  test('lairActions absent on character → undefined on combatant', () => {
    const c = buildCombatantFromSource(baseCharacter, 'player', 'character');
    expect(c.lairActions).toBeUndefined();
  });

  test('legendaryActions present on monster are copied', () => {
    const m = { ...baseMonster, legendaryActions: [{ name: 'Claw', description: 'Attack with claw', cost: 1 }] };
    const c = buildCombatantFromSource(m, 'monster', 'monster');
    expect(c.legendaryActions).toHaveLength(1);
    expect(c.legendaryActions![0].name).toBe('Claw');
  });

  test('lairActions present on monster are copied', () => {
    const m = { ...baseMonster, lairActions: [{ name: 'Eruption', description: 'Lava erupts', cost: 1 }] };
    const c = buildCombatantFromSource(m, 'monster', 'monster');
    expect(c.lairActions).toHaveLength(1);
  });

  test('source with numeric initiative copies it', () => {
    // Monster with initiative set (e.g. from a template that pre-sets it)
    const m = { ...baseMonster, initiative: 15 };
    const c = buildCombatantFromSource(m, 'monster', 'monster');
    expect(c.initiative).toBe(15);
  });

  test('source without initiative defaults to 0', () => {
    const c = buildCombatantFromSource(baseCharacter, 'player', 'character');
    expect(c.initiative).toBe(0);
  });

  test('source without abilityScores uses default 10s', () => {
    const bare: Character = { ...baseCharacter, abilityScores: undefined as any };
    const c = buildCombatantFromSource(bare, 'player', 'character');
    expect(c.abilityScores).toEqual({ strength: 10, dexterity: 10, constitution: 10, intelligence: 10, wisdom: 10, charisma: 10 });
  });
});
