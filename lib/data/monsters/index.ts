/**
 * Central export point for all D&D 5e SRD monsters
 * Combines all monster type categories into a single collection
 */

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

/**
 * Combined array of all 334 D&D 5e SRD monsters
 * Organized by creature type for easy access
 */
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

// Monster count summary
export const MONSTER_COUNTS = {
  aberrations: ABERRATIONS.length,
  beasts: BEASTS.length,
  celestials: CELESTIALS.length,
  constructs: CONSTRUCTS.length,
  dragons: DRAGONS.length,
  elementals: ELEMENTALS.length,
  fey: FEY.length,
  fiends: FIENDS.length,
  giants: GIANTS.length,
  humanoids: HUMANOIDS.length,
  monstrosities: MONSTROSITIES.length,
  oozes: OOZES.length,
  plants: PLANTS.length,
  undead: UNDEAD.length,
  total: ALL_SRD_MONSTERS.length,
};
