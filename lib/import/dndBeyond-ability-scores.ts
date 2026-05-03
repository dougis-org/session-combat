import { AbilityScores } from "../types";
import { getAbilityModifier } from "./utils";
import {
  ABILITY_ID_MAP,
  getModifierNumericValue,
  indexStatValues,
  resolveAbilityScore,
  sumModifierBonusesBySubtype,
} from "./dndBeyond-utils";

export interface DndBeyondCharacterData {
  id?: number | string;
  readonlyUrl?: string | null;
  name?: string | null;
  alignmentId?: number | null;
  baseHitPoints?: number | null;
  bonusHitPoints?: number | null;
  overrideHitPoints?: number | null;
  currentHitPoints?: number | null;
  removedHitPoints?: number | null;
  temporaryHitPoints?: number | null;
  stats?: DndBeyondStatValue[] | null;
  bonusStats?: DndBeyondStatValue[] | null;
  overrideStats?: DndBeyondStatValue[] | null;
  race?: DndBeyondRaceData | null;
  classes?: DndBeyondClassEntry[] | null;
  modifiers?: Record<string, DndBeyondModifier[] | null> | null;
  actions?: Record<string, DndBeyondActionEntry[] | null> | null;
  inventory?: DndBeyondInventoryEntry[] | null;
  traits?: Record<string, string | null> | null;
  notes?: Record<string, string | null> | null;
}

interface DndBeyondStatValue {
  id: number;
  value: number | null;
}

interface DndBeyondModifier {
  type?: "bonus" | "set" | "set-base" | "proficiency" | "expertise" | "language" | "resistance" | "immunity" | "vulnerability" | null;
  subType?: string | null;
  fixedValue?: number | null;
  value?: number | null;
  friendlySubtypeName?: string | null;
}

interface DndBeyondClassEntry {
  level?: number | null;
  definition?: {
    name?: string | null;
  } | null;
}

interface DndBeyondActionEntry {
  name?: string | null;
  snippet?: string | null;
  description?: string | null;
  activation?: {
    activationType?: number | null;
  } | null;
}

interface DndBeyondInventoryEntry {
  equipped?: boolean | null;
  definition?: {
    armorClass?: number | null;
    armorTypeId?: number | null;
    baseArmorName?: string | null;
  } | null;
}

interface DndBeyondRaceData {
  fullName?: string | null;
  weightSpeeds?: {
    normal?: {
      walk?: number | null;
    } | null;
  } | null;
}

export function normalizeCurrentHp(
  data: DndBeyondCharacterData,
  maxHp: number,
): number {
  return typeof data.currentHitPoints === "number"
    ? Math.min(Math.max(0, data.currentHitPoints), maxHp)
    : Math.max(0, maxHp - (data.removedHitPoints || 0));
}

export function normalizeAbilityScores(
  data: DndBeyondCharacterData,
  modifiers: DndBeyondModifier[],
): AbilityScores {
  const baseScores = indexStatValues(data.stats);
  const bonusScores = indexStatValues(data.bonusStats);
  const overrideScores = indexStatValues(data.overrideStats);

  const scoreBonuses = sumModifierBonusesBySubtype(modifiers);
  const abilityScores = {} as AbilityScores;

  for (const [id, ability] of Object.entries(ABILITY_ID_MAP) as Array<
    [string, keyof AbilityScores]
  >) {
    abilityScores[ability] = resolveAbilityScore(
      Number(id),
      ability,
      baseScores,
      bonusScores,
      overrideScores,
      scoreBonuses,
    );
  }

  return abilityScores;
}

export function normalizeMaxHp(
  data: DndBeyondCharacterData,
  abilityScores: AbilityScores,
  totalLevel: number,
  modifiers: DndBeyondModifier[],
): number {
  if (typeof data.overrideHitPoints === "number") {
    return data.overrideHitPoints;
  }

  const baseHitPoints = data.baseHitPoints || 0;
  const bonusHitPoints = data.bonusHitPoints || 0;
  const constitutionModifier = getAbilityModifier(abilityScores.constitution);

  const { perLevel, flat } = modifiers.reduce(
    (acc, modifier) => {
      const value = getModifierNumericValue(modifier) || 0;
      if (modifier.subType === "hit-points-per-level") {
        acc.perLevel += value;
      } else if (modifier.subType === "hit-points") {
        acc.flat += value;
      }
      return acc;
    },
    { perLevel: 0, flat: 0 },
  );

  return (
    baseHitPoints +
    bonusHitPoints +
    constitutionModifier * totalLevel +
    perLevel * totalLevel +
    flat
  );
}