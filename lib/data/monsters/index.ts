/**
 * D&D 5e SRD Monster Library
 * Combines all public domain monsters from category files
 * These can be seeded into the database as global templates for all users
 *
 * Category files export const arrays of monsters:
 * export const CATEGORY_NAME: MonsterTemplate[] = [...]
 */

import { MonsterTemplate } from "@/lib/types";

// Import all monster categories
import { ABERRATIONS } from "./aberrations";
import { BEASTS } from "./beasts";
import { CELESTIALS } from "./celestials";
import { CONSTRUCTS } from "./constructs";
import { DRAGONS } from "./dragons";
import { ELEMENTALS } from "./elementals";
import { FEYS } from "./feys";
import { FIENDS } from "./fiends";
import { GIANTS } from "./giants";
import { HUMANOIDS } from "./humanoids";
import { MONSTROSITIES } from "./monstrosities";
import { OOZES } from "./oozes";
import { PLANTS } from "./plants";
import { UNDEAD } from "./undead";

// Build the combined monster array from all categories
export const ALL_SRD_MONSTERS: Omit<
  MonsterTemplate,
  "id" | "userId" | "createdAt" | "updatedAt" | "_id"
>[] = [
  ...ABERRATIONS,
  ...BEASTS,
  ...CELESTIALS,
  ...CONSTRUCTS,
  ...DRAGONS,
  ...ELEMENTALS,
  ...FEYS,
  ...FIENDS,
  ...GIANTS,
  ...HUMANOIDS,
  ...MONSTROSITIES,
  ...OOZES,
  ...PLANTS,
  ...UNDEAD,
];

// Re-export individual categories for backward compatibility
export {
  ABERRATIONS,
  BEASTS,
  CELESTIALS,
  CONSTRUCTS,
  DRAGONS,
  ELEMENTALS,
  FEYS,
  FIENDS,
  GIANTS,
  HUMANOIDS,
  MONSTROSITIES,
  OOZES,
  PLANTS,
  UNDEAD,
};
