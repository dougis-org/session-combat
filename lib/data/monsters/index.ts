/**
 * D&D 5e SRD Monster Library
 * Combines all public domain monsters from the System Reference Document
 * These can be seeded into the database as global templates for all users
 */

import { MonsterTemplate } from '@/lib/types';
import { ABERRATIONS } from './aberrations';
import { BEASTS } from './beasts';
import { DRAGONS } from './dragons';
import { ELEMENTALS } from './elementals';
import { FIENDS } from './fiends';
import { GIANTS } from './giants';
import { HUMANOIDS } from './humanoids';
import { MONSTROSITIES } from './monstrosities';
import { UNDEAD } from './undead';

export const ALL_SRD_MONSTERS: Omit<MonsterTemplate, 'id' | 'userId' | 'createdAt' | 'updatedAt' | '_id'>[] = [
  ...ABERRATIONS,
  ...BEASTS,
  ...DRAGONS,
  ...ELEMENTALS,
  ...FIENDS,
  ...GIANTS,
  ...HUMANOIDS,
  ...MONSTROSITIES,
  ...UNDEAD,
];

export { ABERRATIONS } from './aberrations';
export { BEASTS } from './beasts';
export { DRAGONS } from './dragons';
export { ELEMENTALS } from './elementals';
export { FIENDS } from './fiends';
export { GIANTS } from './giants';
export { HUMANOIDS } from './humanoids';
export { MONSTROSITIES } from './monstrosities';
export { UNDEAD } from './undead';
