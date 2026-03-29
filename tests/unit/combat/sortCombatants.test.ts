import { describe, test, expect } from '@jest/globals';
import { sortCombatants } from '@/lib/utils/combat';
import { CombatantState } from '@/lib/types';

const base: Omit<CombatantState, 'id' | 'name' | 'type' | 'initiative'> = {
  conditions: [],
  hp: 10,
  maxHp: 10,
  ac: 10,
  abilityScores: { strength: 10, dexterity: 10, constitution: 10, intelligence: 10, wisdom: 10, charisma: 10 },
};

function make(
  id: string,
  name: string,
  type: CombatantState['type'],
  initiative: number,
  dex = 10,
): CombatantState {
  return {
    ...base,
    id,
    name,
    type,
    initiative,
    abilityScores: { ...base.abilityScores, dexterity: dex },
  };
}

describe('sortCombatants', () => {
  test('lair slot sorts before player at same initiative 20', () => {
    const player = make('p', 'Alice', 'player', 20);
    const lair = make('l', 'Dragon Lair', 'lair', 20);
    const sorted = sortCombatants([player, lair]);
    expect(sorted[0].type).toBe('lair');
    expect(sorted[1].type).toBe('player');
  });

  test('lair slot sorts before monster at same initiative 20', () => {
    const monster = make('m', 'Dragon', 'monster', 20);
    const lair = make('l', 'Dragon Lair', 'lair', 20);
    const sorted = sortCombatants([monster, lair]);
    expect(sorted[0].type).toBe('lair');
    expect(sorted[1].type).toBe('monster');
  });

  test('multiple lair slots at same initiative are sorted alphabetically by name', () => {
    const lairB = make('b', 'Lair B', 'lair', 20);
    const lairA = make('a', 'Lair A', 'lair', 20);
    const lairC = make('c', 'Lair C', 'lair', 20);
    const sorted = sortCombatants([lairB, lairA, lairC]);
    expect(sorted.map(c => c.name)).toEqual(['Lair A', 'Lair B', 'Lair C']);
  });

  test('existing player-before-monster tiebreaker preserved at same initiative', () => {
    const player = make('p', 'Alice', 'player', 15);
    const monster = make('m', 'Goblin', 'monster', 15);
    const sorted = sortCombatants([monster, player]);
    expect(sorted[0].type).toBe('player');
    expect(sorted[1].type).toBe('monster');
  });

  test('higher initiative wins over type', () => {
    const lair = make('l', 'Lair', 'lair', 20);
    const player = make('p', 'Alice', 'player', 25);
    const sorted = sortCombatants([lair, player]);
    expect(sorted[0].type).toBe('player');
    expect(sorted[1].type).toBe('lair');
  });

  test('dexterity tiebreaker applies between same type at same initiative', () => {
    const a = make('a', 'A', 'monster', 15, 18);
    const b = make('b', 'B', 'monster', 15, 10);
    const sorted = sortCombatants([b, a]);
    expect(sorted[0].id).toBe('a');
  });

  test('lair sorts before high-DEX player at initiative 20', () => {
    const player = make('p', 'Alice', 'player', 20, 20);
    const lair = make('l', 'Dragon Lair', 'lair', 20, 10);
    const sorted = sortCombatants([player, lair]);
    expect(sorted[0].type).toBe('lair');
    expect(sorted[1].type).toBe('player');
  });
});
