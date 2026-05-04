import {
  AbilityScores,
  Character,
  CharacterClass,
  CreatureAbility,
  DnDAlignment,
  DnDRace,
  calculateTotalLevel,
} from "./types";
import { getAbilityModifier, getProficiencyBonus, dedupeStrings, titleize, DAMAGE_TYPE_NAMES, isDamageTypeModifier, normalizeModifierCategory, isPresent, escapeRegExp, ABILITY_KEYS } from "./import/utils";
import {
  ABILITY_ID_MAP,
  createValidationError,
  DndBeyondImportError,
  flattenModifiers,
  getModifierNumericValue,
  indexStatValues,
  isBonusLikeModifier,
  resolveAbilityScore,
  sumModifierBonusesBySubtype,
} from "./import/dndBeyond-utils";
export { DndBeyondImportError };
import {
  normalizeAbilityScores,
  normalizeCurrentHp,
  normalizeMaxHp,
} from "./import/dndBeyond-ability-scores";
import { normalizeClasses, normalizeRace } from "./import/dndBeyond-classes";
import { normalizeImmunities, normalizeByModifierType, normalizeLanguages } from "./import/dndBeyond-defenses";
import { PASSIVE_SENSE_SKILLS, SKILL_ABILITY_MAP } from "./characterReference";
import { filterToDamageTypes } from "./constants";

const CANONICAL_HOST = "www.dndbeyond.com";
const CHARACTER_PATH_PATTERN = /^\/characters\/(\d+)(?:\/([A-Za-z0-9_-]+))?\/?$/;

const ALIGNMENT_ID_MAP: Record<number, DnDAlignment> = {
  1: "Lawful Good",
  2: "Neutral Good",
  3: "Chaotic Good",
  4: "Lawful Neutral",
  5: "Neutral",
  6: "Chaotic Neutral",
  7: "Lawful Evil",
  8: "Neutral Evil",
  9: "Chaotic Evil",
};

const ARMOR_TYPE_MAX_DEX_MODIFIER: Partial<Record<number, number>> = {
  2: 2,
  3: 0,
};
const ACTIONS_BY_ACTIVATION_TYPE: Partial<
  Record<number, "actions" | "bonusActions" | "reactions">
> = {
  3: "bonusActions",
  4: "reactions",
};
const TRAIT_TITLE_MAP = {
  personalityTraits: "Personality Traits",
  ideals: "Ideals",
  bonds: "Bonds",
  flaws: "Flaws",
  appearance: "Appearance",
};
const NOTE_TITLE_MAP = {
  backstory: "Backstory",
  allies: "Allies",
  enemies: "Enemies",
  organizations: "Organizations",
  otherNotes: "Other Notes",
};
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

export interface ParsedDndBeyondCharacterUrl {
  characterId: string;
  shareCode?: string;
  normalizedUrl: string;
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

interface CharacterIdentity {
  name: string;
  sourceCharacterId: string;
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

export function parseDndBeyondCharacterUrl(
  url: string,
): ParsedDndBeyondCharacterUrl {
  const parsed = parseUrlOrThrow(url);

  if (!isSupportedDndBeyondHostname(parsed.hostname)) {
    throw createValidationError(
      "Only canonical public D&D Beyond character URLs are supported.",
    );
  }

  const match = parsed.pathname.match(CHARACTER_PATH_PATTERN);
  if (!match) {
    throw createValidationError(
      "Use a publicly available D&D Beyond character URL.",
    );
  }

  const [, characterId, shareCode] = match;
  return {
    characterId,
    shareCode,
    normalizedUrl: shareCode
      ? `https://${CANONICAL_HOST}/characters/${characterId}/${shareCode}`
      : `https://${CANONICAL_HOST}/characters/${characterId}`,
  };
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

function parseUrlOrThrow(url: string): URL {
  try {
    return new URL(url.trim());
  } catch {
    throw createValidationError("Enter a valid D&D Beyond character URL.");
  }
}

function isSupportedDndBeyondHostname(hostname: string): boolean {
  const normalized = hostname.toLowerCase();
  return normalized === CANONICAL_HOST || normalized === "dndbeyond.com";
}

function requireCharacterIdentity(
  data: DndBeyondCharacterData,
): CharacterIdentity {
  const sourceCharacterId = String(data.id || "");
  const name = data.name?.trim();

  if (!sourceCharacterId) {
    throw createValidationError(
      "The imported D&D Beyond character is missing an ID.",
    );
  }

  if (!name) {
    throw createValidationError(
      "The imported D&D Beyond character is missing a name.",
    );
  }

  return { name, sourceCharacterId };
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
    alignment: normalizeAlignment(data.alignmentId),
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

function buildNormalizationWarnings(
  data: DndBeyondCharacterData,
  details: NormalizedCharacterDetails,
): string[] {
  const warnings: string[] = [];

  if (!details.race && data.race?.fullName) {
    warnings.push(
      `Race "${data.race.fullName}" is not supported and was omitted.`,
    );
  }

  if (!details.alignment && typeof data.alignmentId === "number") {
    warnings.push("Alignment was not supported and was omitted.");
  }

  return warnings;
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

function normalizeAlignment(
  alignmentId: number | null | undefined,
): DnDAlignment | undefined {
  if (typeof alignmentId !== "number") {
    return undefined;
  }

  return ALIGNMENT_ID_MAP[alignmentId];
}

function normalizeArmorClass(
  inventory: DndBeyondInventoryEntry[] | null | undefined,
  abilityScores: AbilityScores,
  modifiers: DndBeyondModifier[],
): number {
  const dexterityModifier = getAbilityModifier(abilityScores.dexterity);
  const armorBonuses = getArmorBonuses(modifiers);

  const equippedArmor = (inventory || []).find(
    (item) => item.equipped && typeof item.definition?.armorClass === "number",
  );

  if (
    !equippedArmor?.definition ||
    typeof equippedArmor.definition.armorClass !== "number"
  ) {
    const unarmoredBonus = getUnarmoredAcBonus(modifiers);
    return 10 + dexterityModifier + unarmoredBonus + armorBonuses;
  }

  return (
    equippedArmor.definition.armorClass +
    getArmorDexterityContribution(
      dexterityModifier,
      equippedArmor.definition.armorTypeId,
    ) +
    armorBonuses
  );
}

function getArmorBonuses(modifiers: DndBeyondModifier[]): number {
  return modifiers
    .filter((modifier) => modifier.subType === "armor-class")
    .reduce(
      (total, modifier) => total + (getModifierNumericValue(modifier) || 0),
      0,
    );
}

function getUnarmoredAcBonus(modifiers: DndBeyondModifier[]): number {
  const { maxSet, sumBonus } = modifiers.reduce(
    (acc, modifier) => {
      if (modifier.subType !== "unarmored-armor-class") return acc;
      const value = getModifierNumericValue(modifier) || 0;
      if (modifier.type === "set") {
        acc.maxSet = Math.max(acc.maxSet, value);
      } else if (modifier.type === "bonus") {
        acc.sumBonus += value;
      }
      return acc;
    },
    { maxSet: 0, sumBonus: 0 },
  );
  return maxSet + sumBonus;
}

function getArmorDexterityContribution(
  dexterityModifier: number,
  armorTypeId?: number | null,
): number {
  const maxModifier =
    typeof armorTypeId === "number"
      ? ARMOR_TYPE_MAX_DEX_MODIFIER[armorTypeId]
      : undefined;

  return typeof maxModifier === "number"
    ? Math.min(dexterityModifier, maxModifier)
    : dexterityModifier;
}

function normalizeSavingThrows(
  abilityScores: AbilityScores,
  modifiers: DndBeyondModifier[],
  proficiencyBonus: number,
): Partial<Record<keyof AbilityScores, number>> {
  const bonusesBySubtype = sumModifierBonusesBySubtype(modifiers);
  const proficientSaves = collectModifierSubtypeSet(
    modifiers,
    (modifier) =>
      modifier.type === "proficiency" &&
      Boolean(modifier.subType?.endsWith("-saving-throws")),
    (modifier) => (modifier.subType || "").replace("-saving-throws", ""),
  );

  return Object.fromEntries(
    ABILITY_KEYS.map((ability) => [
      ability,
      getAbilityModifier(abilityScores[ability]) +
        (proficientSaves.has(ability) ? proficiencyBonus : 0) +
        (bonusesBySubtype[`${ability}-saving-throws`] || 0),
    ]),
  );
}

function normalizeSkills(
  abilityScores: AbilityScores,
  modifiers: DndBeyondModifier[],
  proficiencyBonus: number,
): Record<string, number> {
  const expertise = collectModifierSubtypeSet(
    modifiers,
    (modifier) => modifier.type === "expertise",
    (modifier) => normalizeSkillName(modifier.subType || ""),
  );
  const proficiency = collectModifierSubtypeSet(
    modifiers,
    (modifier) => modifier.type === "proficiency",
    (modifier) => normalizeSkillName(modifier.subType || ""),
  );
  const bonusesBySubtype = sumModifierBonusesBySubtype(modifiers);

  return Object.fromEntries(
    Object.entries(SKILL_ABILITY_MAP).map(([skill, ability]) => {
      const base = getAbilityModifier(abilityScores[ability]);
      const multiplier = expertise.has(skill)
        ? 2
        : proficiency.has(skill)
          ? 1
          : 0;
      const bonus = bonusesBySubtype[denormalizeSkillSubtype(skill)] || 0;
      return [skill, base + proficiencyBonus * multiplier + bonus];
    }),
  );
}

function normalizeSenses(
  data: DndBeyondCharacterData,
  modifiers: DndBeyondModifier[],
  skills: Record<string, number>,
  abilityScores: AbilityScores,
): Record<string, string> {
  const senses = collectSenseModifiers(modifiers);

  const walkSpeed = data.race?.weightSpeeds?.normal?.walk;
  if (typeof walkSpeed === "number" && walkSpeed > 0) {
    senses.speed = `${walkSpeed} ft.`;
  }

  Object.assign(
    senses,
    Object.fromEntries(
      PASSIVE_SENSE_SKILLS.map(([label, skill, ability]) => [
        label,
        String(
          10 + (skills[skill] ?? getAbilityModifier(abilityScores[ability])),
        ),
      ]),
    ),
  );

  return senses;
}

function normalizeAbilities(
  actions: Record<string, DndBeyondActionEntry[] | null> | null | undefined,
  traits: Record<string, string | null> | null | undefined,
  notes: Record<string, string | null> | null | undefined,
): {
  traits: CreatureAbility[];
  actions: CreatureAbility[];
  bonusActions: CreatureAbility[];
  reactions: CreatureAbility[];
} {
  const categorizedAbilities = {
    actions: [] as CreatureAbility[],
    bonusActions: [] as CreatureAbility[],
    reactions: [] as CreatureAbility[],
  };

  Object.values(actions || {})
    .flatMap((entries) => entries || [])
    .map((entry) => ({ entry, ability: normalizeActionEntry(entry) }))
    .filter(
      (
        item,
      ): item is { entry: DndBeyondActionEntry; ability: CreatureAbility } =>
        isPresent(item.ability),
    )
    .forEach(({ entry, ability }) => {
      pushAbilityByActivation(categorizedAbilities, entry, ability);
    });

  const mappedTraits = [
    ...mapNarrativeEntries(traits, TRAIT_TITLE_MAP),
    ...mapNarrativeEntries(notes, NOTE_TITLE_MAP),
  ];

  return {
    traits: mappedTraits,
    actions: categorizedAbilities.actions,
    bonusActions: categorizedAbilities.bonusActions,
    reactions: categorizedAbilities.reactions,
  };
}

function normalizeActionEntry(
  entry: DndBeyondActionEntry,
): CreatureAbility | null {
  if (!entry.name || !(entry.snippet || entry.description)) {
    return null;
  }

  const description = sanitizeHtmlSnippet(
    entry.snippet || entry.description || "",
  );

  if (!description) {
    return null;
  }

  return {
    name: entry.name,
    description,
  };
}

function pushAbilityByActivation(
  categorizedAbilities: {
    actions: CreatureAbility[];
    bonusActions: CreatureAbility[];
    reactions: CreatureAbility[];
  },
  entry: DndBeyondActionEntry,
  ability: CreatureAbility,
): void {
  const targetKey =
    ACTIONS_BY_ACTIVATION_TYPE[entry.activation?.activationType || 0] ||
    "actions";
  categorizedAbilities[targetKey].push(ability);
}

function mapNarrativeEntries(
  entries: Record<string, string | null> | null | undefined,
  titleMap: Record<string, string>,
): CreatureAbility[] {
  return Object.entries(entries || {})
    .filter(([, value]) => typeof value === "string" && value.trim().length > 0)
    .map(([key, value]) => ({
      name: titleMap[key] || titleize(key),
      description: value!.trim(),
    }));
}

function collectModifierSubtypeSet(
  modifiers: DndBeyondModifier[],
  predicate: (modifier: DndBeyondModifier) => boolean,
  mapSubtype: (modifier: DndBeyondModifier) => string,
): Set<string> {
  return new Set(
    modifiers
      .filter(predicate)
      .map(mapSubtype)
      .filter((value) => value.length > 0),
  );
}

function collectSenseModifiers(
  modifiers: DndBeyondModifier[],
): Record<string, string> {
  return modifiers.reduce<Record<string, string>>((senses, modifier) => {
    if (
      modifier.type !== "set-base" ||
      !modifier.subType ||
      typeof getModifierNumericValue(modifier) !== "number"
    ) {
      return senses;
    }

    senses[normalizeSenseKey(modifier.subType)] =
      `${getModifierNumericValue(modifier)} ft.`;
    return senses;
  }, {});
}

function normalizeSkillName(subType: string): string {
  return subType.replace(/-/g, " ").trim().toLowerCase();
}

function denormalizeSkillSubtype(skill: string): string {
  return skill.replace(/ /g, "-");
}

function normalizeSenseKey(subType: string): string {
  return subType.replace(/-/g, " ").toLowerCase();
}

function sanitizeHtmlSnippet(snippet: string): string {
  return snippet
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}
