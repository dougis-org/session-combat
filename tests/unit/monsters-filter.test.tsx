import { describe, test, expect } from '@jest/globals';
import { filterMonsters, getAvailableTypes } from '@/app/monsters/filterUtils';
import type { MonsterTemplate } from '@/lib/types';

function makeMonster(overrides: Partial<MonsterTemplate>): MonsterTemplate {
  return {
    id: 'test-id',
    userId: 'user-1',
    name: 'Test Monster',
    size: 'medium',
    type: 'humanoid',
    ac: 10,
    hp: 10,
    maxHp: 10,
    speed: '30 ft.',
    challengeRating: 1,
    abilityScores: {
      strength: 10,
      dexterity: 10,
      constitution: 10,
      intelligence: 10,
      wisdom: 10,
      charisma: 10,
    },
    isGlobal: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

const DRAGON = makeMonster({ id: '1', name: 'Adult Red Dragon', type: 'dragon' });
const ZOMBIE = makeMonster({ id: '2', name: 'Zombie', type: 'undead' });
const SKELETON = makeMonster({ id: '3', name: 'Skeleton', type: 'undead' });
const GOBLIN = makeMonster({ id: '4', name: 'Goblin', type: 'humanoid' });

describe('filterMonsters', () => {
  describe('name filter', () => {
    test('empty filterText returns all monsters', () => {
      const result = filterMonsters([DRAGON, ZOMBIE, GOBLIN], '', '');
      expect(result).toHaveLength(3);
    });

    test('matches substring case-insensitively', () => {
      const result = filterMonsters([DRAGON, ZOMBIE, GOBLIN], 'dragon', '');
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Adult Red Dragon');
    });

    test('case-insensitive: uppercase query matches mixed-case name', () => {
      const result = filterMonsters([DRAGON, ZOMBIE, GOBLIN], 'DRAGON', '');
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Adult Red Dragon');
    });

    test('partial name substring matches', () => {
      const result = filterMonsters([DRAGON, ZOMBIE, GOBLIN], 'red', '');
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Adult Red Dragon');
    });

    test('no match returns empty array', () => {
      const result = filterMonsters([DRAGON, ZOMBIE, GOBLIN], 'beholder', '');
      expect(result).toHaveLength(0);
    });
  });

  describe('type filter', () => {
    test('empty filterType returns all monsters', () => {
      const result = filterMonsters([DRAGON, ZOMBIE, GOBLIN], '', '');
      expect(result).toHaveLength(3);
    });

    test('exact type match filters correctly', () => {
      const result = filterMonsters([DRAGON, ZOMBIE, SKELETON, GOBLIN], '', 'undead');
      expect(result).toHaveLength(2);
      expect(result.map(m => m.name)).toEqual(['Zombie', 'Skeleton']);
    });

    test('type filter is exact (not substring)', () => {
      // 'dead' should NOT match 'undead'
      const result = filterMonsters([DRAGON, ZOMBIE, GOBLIN], '', 'dead');
      expect(result).toHaveLength(0);
    });
  });

  describe('combined name + type filter', () => {
    test('both filters compose with AND logic', () => {
      const result = filterMonsters([DRAGON, ZOMBIE, SKELETON, GOBLIN], 'sk', 'undead');
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Skeleton');
    });

    test('name match but wrong type returns empty', () => {
      const result = filterMonsters([DRAGON, ZOMBIE, GOBLIN], 'zombie', 'humanoid');
      expect(result).toHaveLength(0);
    });
  });
});

describe('getAvailableTypes', () => {
  test('returns sorted distinct types from both arrays', () => {
    const userTemplates = [GOBLIN, ZOMBIE];
    const globalTemplates = [DRAGON, SKELETON];
    const types = getAvailableTypes(userTemplates, globalTemplates);
    expect(types).toEqual(['dragon', 'humanoid', 'undead']);
  });

  test('deduplicates types across both arrays', () => {
    const userTemplates = [ZOMBIE];
    const globalTemplates = [SKELETON]; // also undead
    const types = getAvailableTypes(userTemplates, globalTemplates);
    expect(types).toEqual(['undead']);
  });

  test('returns empty array when no templates loaded', () => {
    const types = getAvailableTypes([], []);
    expect(types).toEqual([]);
  });

  test('sorts alphabetically', () => {
    const userTemplates = [ZOMBIE, DRAGON]; // undead, dragon
    const globalTemplates = [GOBLIN]; // humanoid
    const types = getAvailableTypes(userTemplates, globalTemplates);
    expect(types).toEqual(['dragon', 'humanoid', 'undead']);
  });
});
