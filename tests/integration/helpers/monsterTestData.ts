/**
 * Test data factories for monster upload tests
 * Reduces duplication in test data setup
 */

import { RawMonsterData, MonsterUploadDocument } from '../../../lib/validation/monsterUpload';

export const createRawMonster = (overrides?: Partial<RawMonsterData>): RawMonsterData => ({
  name: 'Test Monster',
  maxHp: 10,
  ...overrides,
});

export const createMonsterDocument = (count: number = 1, overrides?: Partial<RawMonsterData>): MonsterUploadDocument => ({
  monsters: Array.from({ length: count }, (_, i) => createRawMonster({ name: `Monster ${i + 1}`, ...overrides })),
});

export const VALID_ABILITY_SCORES = {
  strength: 10,
  dexterity: 11,
  constitution: 12,
  intelligence: 13,
  wisdom: 14,
  charisma: 15,
};

export const VALID_SIZES = ['tiny', 'small', 'medium', 'large', 'huge', 'gargantuan'];
export const INVALID_SIZE = 'enormous';

export const VALID_AC_VALUES = [0, 10, 20, 30];
export const INVALID_AC = 40;

export const VALID_SKILLS = {
  acrobatics: 1,
  animalHandling: 2,
  arcana: 3,
};

export const VALID_LANGUAGES = ['Common', 'Draconic', 'Infernal'];

export const VALID_TRAIT = {
  name: 'Legendary Action',
  description: 'The creature can take a legendary action',
};
