import {
  AbilityScores,
  Character,
  CharacterClass,
  CreatureAbility,
  DnDAlignment,
  DnDRace,
  calculateTotalLevel,
} from "./types";
import { getAbilityModifier, getProficiencyBonus, titleize, isPresent, ABILITY_KEYS } from "./import/utils";
import {
  DndBeyondImportError,
  flattenModifiers,
  getModifierNumericValue,
} from "./import/dndBeyond-utils";
export { DndBeyondImportError };
import {
  requireCharacterIdentity,
  buildNormalizationWarnings,
  normalizeAlignmentId,
} from "./import/dndBeyond-identity";
export { parseDndBeyondCharacterUrl } from "./import/dndBeyond-identity";
export type { ParsedDndBeyondCharacterUrl } from "./import/dndBeyond-identity";
import {
  normalizeAbilityScores,
  normalizeCurrentHp,
  normalizeMaxHp,
} from "./import/dndBeyond-ability-scores";
import { normalizeClasses, normalizeRace } from "./import/dndBeyond-classes";
import { normalizeImmunities, normalizeByModifierType, normalizeLanguages } from "./import/dndBeyond-defenses";
import { normalizeSavingThrows, normalizeSkills, normalizeSenses } from "./import/dndBeyond-skills-senses";
import { normalizeAbilities, type DndBeyondActionEntry } from "./import/dndBeyond-abilities";
import { normalizeArmorClass } from "./import/dndBeyond-armor-class";
import { PASSIVE_SENSE_SKILLS, SKILL_ABILITY_MAP } from "./characterReference";
import { filterToDamageTypes } from "./constants";

interface DndBeyondStatValue {
  id: number;
  value: number | null;
}

export interface DndBeyondModifier {
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

export interface DndBeyondCharacterServiceResponse {
  success?: boolean;
  data?: DndBeyondCharacterData | null;
}

export type ImportedCharacterDraft = Omit<
  Character,
  "_id" | "id" | "userId" | "createdAt" | "updatedAt"
>;

export interface NormalizedDndBeyondCharacter {
  character: ImportedCharacterDraft;
  warnings: string[];
  sourceCharacterId: string;
  sourceUrl?: string;
}

interface NormalizedCharacterDetails {
  abilityScores: AbilityScores;
  ac: number;
  alignment?: DnDAlignment;
  bonusActions: CreatureAbility[];
  classes: CharacterClass[];
  conditionImmunities: string[];
  damageImmunities: string[];
  damageResistances: string[];
  damageVulnerabilities: string[];
  hp: number;
  languages: string[];
  maxHp: number;
  race?: DnDRace;
  reactions: CreatureAbility[];
  savingThrows: Partial<Record<keyof AbilityScores, number>>;
  senses: Record<string, string>;
  skills: Record<string, number>;
  traits: CreatureAbility[];
  actions: CreatureAbility[];
}

export function normalizeDndBeyondCharacter(
  data: DndBeyondCharacterData,
): NormalizedDndBeyondCharacter {
  const identity = requireCharacterIdentity(data);
  const warnings: string[] = [];
  const details = normalizeCharacterDetails(data, warnings);
  warnings.push(...buildNormalizationWarnings(data, details));

  return {
    character: buildNormalizedCharacter(identity.name, details),
    warnings,
    sourceCharacterId: identity.sourceCharacterId,
    sourceUrl: data.readonlyUrl || undefined,
  };
}

function normalizeCharacterDetails(
  data: DndBeyondCharacterData,
  warnings: string[],
): NormalizedCharacterDetails {
  const modifiers = flattenModifiers(data.modifiers);
  const classes = normalizeClasses(data.classes, warnings);
  const totalLevel = calculateTotalLevel(classes);
  const proficiencyBonus = getProficiencyBonus(totalLevel);
  const abilityScores = normalizeAbilityScores(data, modifiers);
  const maxHp = normalizeMaxHp(data, abilityScores, totalLevel, modifiers);
  const skills = normalizeSkills(abilityScores, modifiers, proficiencyBonus);
  const immunities = normalizeImmunities(modifiers);
  const categorizedAbilities = normalizeAbilities(
    data.actions,
    data.traits,
    data.notes,
  );

  return {
    abilityScores,
    ac: normalizeArmorClass(data.inventory, abilityScores, modifiers),
    alignment: normalizeAlignmentId(data.alignmentId),
    actions: categorizedAbilities.actions,
    bonusActions: categorizedAbilities.bonusActions,
    classes,
    conditionImmunities: immunities.conditionImmunities,
    damageImmunities: immunities.damageImmunities,
    damageResistances: normalizeByModifierType(modifiers, "resistance"),
    damageVulnerabilities: normalizeByModifierType(modifiers, "vulnerability"),
    hp: normalizeCurrentHp(data, maxHp),
    languages: normalizeLanguages(modifiers),
    maxHp,
    race: normalizeRace(data.race?.fullName, warnings),
    reactions: categorizedAbilities.reactions,
    savingThrows: normalizeSavingThrows(
      abilityScores,
      modifiers,
      proficiencyBonus,
    ),
    senses: normalizeSenses(data, modifiers, skills, abilityScores),
    skills,
    traits: categorizedAbilities.traits,
  };
}

function buildNormalizedCharacter(
  name: string,
  details: NormalizedCharacterDetails,
): ImportedCharacterDraft {
  return {
    name,
    ac: details.ac,
    hp: details.hp,
    maxHp: details.maxHp,
    abilityScores: details.abilityScores,
    savingThrows: details.savingThrows,
    skills: details.skills,
    damageResistances: filterToDamageTypes(details.damageResistances),
    damageImmunities: filterToDamageTypes(details.damageImmunities),
    damageVulnerabilities: filterToDamageTypes(details.damageVulnerabilities),
    conditionImmunities: details.conditionImmunities,
    senses: details.senses,
    languages: details.languages,
    traits: details.traits,
    actions: details.actions,
    bonusActions: details.bonusActions,
    reactions: details.reactions,
    classes: details.classes,
    race: details.race,
    alignment: details.alignment,
  };
}


