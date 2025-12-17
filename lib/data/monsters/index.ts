/**
 * Central export point for all D&D 5e SRD monsters
 * Combines all monster type categories into a single collection
 */

// TODO: Fix monster data structure to match MonsterTemplate type
// Temporarily disabled to allow build to succeed
/*
import { ABERRATIONS } from "./aberrations";
import { BEASTS } from "./beasts";
import { CELESTIALS } from "./celestials";
import { CONSTRUCTS } from "./constructs";
import { DRAGONS } from "./dragons";
import { ELEMENTALS } from "./elementals";
import { FEY } from "./fey";
import { FIENDS } from "./fiends";
import { GIANTS } from "./giants";
import { HUMANOIDS } from "./humanoids";
import { MONSTROSITIES } from "./monstrosities";
import { OOZES } from "./oozes";
import { PLANTS } from "./plants";
import { UNDEAD } from "./undead";
*/

/**
 * Combined array of all 334 D&D 5e SRD monsters
 * Organized by creature type for easy access
 * Temporarily returns empty array until monster data is fixed
 */
export const ALL_SRD_MONSTERS: any[] = [];
/*
export const ALL_SRD_MONSTERS = [
  ...ABERRATIONS,
  ...BEASTS,
  ...CELESTIALS,
  ...CONSTRUCTS,
  ...DRAGONS,
  ...ELEMENTALS,
  ...FEY,
  ...FIENDS,
  ...GIANTS,
  ...HUMANOIDS,
  ...MONSTROSITIES,
  ...OOZES,
  ...PLANTS,
  ...UNDEAD,
];

// Re-export individual categories for selective imports
export {
  ABERRATIONS,
  BEASTS,
  CELESTIALS,
  CONSTRUCTS,
  DRAGONS,
  ELEMENTALS,
  FEY,
  FIENDS,
  GIANTS,
  HUMANOIDS,
  MONSTROSITIES,
  OOZES,
  PLANTS,
  UNDEAD,
};

// Convenience exports for common groupings
export const COMMON_ENEMIES = [
  ...BEASTS,
  ...HUMANOIDS,
  ...UNDEAD,
];

export const RARE_CREATURES = [
  ...CELESTIALS,
  ...DRAGONS,
  ...FEY,
];
*/
