/**
 * D&D 5e SRD Monster Library
 * Dynamically combines all public domain monsters from category files
 * These can be seeded into the database as global templates for all users
 * 
 * Category files should export a const array of monsters:
 * export const CATEGORY_NAME: MonsterTemplate[] = [...]
 */

import { MonsterTemplate } from '@/lib/types';

// Dynamically import all monster category files
// Each file should export a const array (e.g., ABERRATIONS, BEASTS, DRAGONS, etc.)
const requireCategory = (name: string) => {
  try {
    return require(`./${name}`)[name.toUpperCase()] || [];
  } catch {
    return [];
  }
};

const CATEGORY_NAMES = [
  'aberrations',
  'beasts',
  'dragons',
  'elementals',
  'fiends',
  'giants',
  'humanoids',
  'monstrosities',
  'undead',
] as const;

// Build the combined monster array from all categories
export const ALL_SRD_MONSTERS: Omit<MonsterTemplate, 'id' | 'userId' | 'createdAt' | 'updatedAt' | '_id'>[] =
  CATEGORY_NAMES.reduce((all, category) => {
    const monsters = requireCategory(category);
    return [...all, ...monsters];
  }, [] as Omit<MonsterTemplate, 'id' | 'userId' | 'createdAt' | 'updatedAt' | '_id'>[]);

// Re-export individual categories for backward compatibility
export { ABERRATIONS } from './aberrations';
export { BEASTS } from './beasts';
export { DRAGONS } from './dragons';
export { ELEMENTALS } from './elementals';
export { FIENDS } from './fiends';
export { GIANTS } from './giants';
export { HUMANOIDS } from './humanoids';
export { MONSTROSITIES } from './monstrosities';
export { UNDEAD } from './undead';
