import {
  AbilityScores,
  Character,
  CharacterClass,
  CreatureAbility,
  DnDAlignment,
  DnDClass,
  DnDRace,
  VALID_CLASSES,
  VALID_RACES,
  calculateTotalLevel,
} from "./types";

const CANONICAL_HOST = "www.dndbeyond.com";
const CHARACTER_PATH_PATTERN = /^\/characters\/(\d+)\/([A-Za-z0-9_-]+)\/?$/;
const DEFAULT_CHARACTER_SERVICE_BASE_URL =
  "https://character-service.dndbeyond.com/character/v5";
const FETCH_TIMEOUT_MS = 15000;

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

const ABILITY_ID_MAP: Record<number, keyof AbilityScores> = {
  1: "strength",
  2: "dexterity",
  3: "constitution",
  4: "intelligence",
  5: "wisdom",
  6: "charisma",
};

const SKILL_ABILITY_MAP: Record<string, keyof AbilityScores> = {
  acrobatics: "dexterity",
  "animal handling": "wisdom",
  arcana: "intelligence",
  athletics: "strength",
  deception: "charisma",
  history: "intelligence",
  insight: "wisdom",
  intimidation: "charisma",
  investigation: "intelligence",
  medicine: "wisdom",
  nature: "intelligence",
  perception: "wisdom",
  performance: "charisma",
  persuasion: "charisma",
  religion: "intelligence",
  "sleight of hand": "dexterity",
  stealth: "dexterity",
  survival: "wisdom",
};

interface DndBeyondStatValue {
  id: number;
  value: number | null;
}

interface DndBeyondModifier {
  type?: string | null;
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

interface DndBeyondCharacterData {
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

interface DndBeyondCharacterServiceResponse {
  success?: boolean;
  data?: DndBeyondCharacterData | null;
}

export interface ParsedDndBeyondCharacterUrl {
  characterId: string;
  shareCode: string;
  normalizedUrl: string;
}

export interface NormalizedDndBeyondCharacter {
  character: Character;
  warnings: string[];
  sourceCharacterId: string;
  sourceUrl?: string;
}

export function parseDndBeyondCharacterUrl(
  url: string,
): ParsedDndBeyondCharacterUrl {
  let parsed: URL;

  try {
    parsed = new URL(url);
  } catch {
    throw new Error("Enter a valid D&D Beyond character URL.");
  }

  const hostname = parsed.hostname.toLowerCase();
  if (hostname !== CANONICAL_HOST && hostname !== "dndbeyond.com") {
    throw new Error(
      "Only canonical public D&D Beyond character URLs are supported.",
    );
  }

  const match = parsed.pathname.match(CHARACTER_PATH_PATTERN);
  if (!match) {
    throw new Error(
      "Use a public D&D Beyond character URL in the format /characters/<id>/<shareCode>.",
    );
  }

  const [, characterId, shareCode] = match;
  return {
    characterId,
    shareCode,
    normalizedUrl: `https://${CANONICAL_HOST}/characters/${characterId}/${shareCode}`,
  };
}

export async function fetchDndBeyondCharacter(
  pageUrl: string,
  fetchImpl: typeof fetch = fetch,
): Promise<DndBeyondCharacterData> {
  const { characterId } = parseDndBeyondCharacterUrl(pageUrl);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  const baseUrl =
    process.env.DND_BEYOND_CHARACTER_SERVICE_BASE_URL ||
    DEFAULT_CHARACTER_SERVICE_BASE_URL;
  const endpoint = `${baseUrl.replace(/\/$/, "")}/character/${characterId}?includeCustomItems=true`;

  try {
    const response = await fetchImpl(endpoint, {
      signal: controller.signal,
      headers: {
        Accept: "application/json",
      },
      cache: "no-store",
    });

    if (!response.ok) {
      if (response.status === 404 || response.status === 403) {
        throw new Error(
          "The D&D Beyond character could not be accessed. Make sure the character is public.",
        );
      }
      throw new Error("Failed to fetch the D&D Beyond character.");
    }

    const body = (await response.json()) as DndBeyondCharacterServiceResponse;
    if (!body.success || !body.data) {
      throw new Error(
        "The D&D Beyond character response was missing character data.",
      );
    }

    return body.data;
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error("The D&D Beyond character request timed out.");
    }

    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

export function normalizeDndBeyondCharacter(
  data: DndBeyondCharacterData,
): NormalizedDndBeyondCharacter {
  const warnings: string[] = [];
  const sourceCharacterId = String(data.id || "");
  const name = data.name?.trim();

  if (!sourceCharacterId) {
    throw new Error("The imported D&D Beyond character is missing an ID.");
  }

  if (!name) {
    throw new Error("The imported D&D Beyond character is missing a name.");
  }

  const modifiers = flattenModifiers(data.modifiers);
  const totalLevel = normalizeClasses(data.classes, warnings);
  const abilityScores = normalizeAbilityScores(data, modifiers);
  const proficiencyBonus = getProficiencyBonus(calculateTotalLevel(totalLevel));
  const race = normalizeRace(data.race?.fullName);
  const alignment = normalizeAlignment(data.alignmentId);
  const maxHp = normalizeMaxHp(
    data,
    abilityScores,
    totalLevel.length ? calculateTotalLevel(totalLevel) : 1,
  );
  const hp =
    typeof data.currentHitPoints === "number"
      ? data.currentHitPoints
      : Math.max(0, maxHp - (data.removedHitPoints || 0));
  const ac = normalizeArmorClass(data.inventory, abilityScores, modifiers);
  const savingThrows = normalizeSavingThrows(
    abilityScores,
    modifiers,
    proficiencyBonus,
  );
  const skills = normalizeSkills(abilityScores, modifiers, proficiencyBonus);
  const senses = normalizeSenses(data, modifiers, skills, abilityScores);
  const languages = dedupeStrings(
    modifiers
      .filter((modifier) => modifier.type === "language")
      .map(
        (modifier) =>
          modifier.friendlySubtypeName || titleize(modifier.subType || ""),
      ),
  );
  const damageResistances = normalizeByModifierType(modifiers, "resistance");
  const damageImmunities = normalizeByModifierType(modifiers, "immunity");
  const damageVulnerabilities = normalizeByModifierType(
    modifiers,
    "vulnerability",
  );
  const conditionImmunities = normalizeConditionImmunities(modifiers);
  const categorizedAbilities = normalizeAbilities(
    data.actions,
    data.traits,
    data.notes,
  );

  if (!race && data.race?.fullName) {
    warnings.push(
      `Race "${data.race.fullName}" is not supported and was omitted.`,
    );
  }

  if (!alignment && typeof data.alignmentId === "number") {
    warnings.push(
      `Alignment value "${data.alignmentId}" was not supported and was omitted.`,
    );
  }

  const character: Character = {
    id: "",
    userId: "",
    name,
    ac,
    hp,
    maxHp,
    abilityScores,
    savingThrows,
    skills,
    damageResistances,
    damageImmunities,
    damageVulnerabilities,
    conditionImmunities,
    senses,
    languages,
    traits: categorizedAbilities.traits,
    actions: categorizedAbilities.actions,
    bonusActions: categorizedAbilities.bonusActions,
    reactions: categorizedAbilities.reactions,
    classes: totalLevel,
    race,
    alignment,
  };

  return {
    character,
    warnings,
    sourceCharacterId,
    sourceUrl: data.readonlyUrl || undefined,
  };
}

export async function importDndBeyondCharacter(
  pageUrl: string,
): Promise<NormalizedDndBeyondCharacter> {
  const data = await fetchDndBeyondCharacter(pageUrl);
  return normalizeDndBeyondCharacter(data);
}

function flattenModifiers(
  modifierGroups?: Record<string, DndBeyondModifier[] | null> | null,
): DndBeyondModifier[] {
  return Object.values(modifierGroups || {}).flatMap((items) => items || []);
}

function normalizeClasses(
  classes: DndBeyondClassEntry[] | null | undefined,
  warnings: string[],
): CharacterClass[] {
  const merged = new Map<DnDClass, number>();

  for (const entry of classes || []) {
    const className = entry.definition?.name?.trim();
    const level = Math.max(1, Math.trunc(entry.level || 0));

    if (!className) {
      continue;
    }

    if (!VALID_CLASSES.includes(className as DnDClass)) {
      warnings.push(`Class "${className}" is not supported and was omitted.`);
      continue;
    }

    const typedClass = className as DnDClass;
    merged.set(typedClass, (merged.get(typedClass) || 0) + level);
  }

  const normalized = Array.from(merged.entries()).map(([className, level]) => ({
    class: className,
    level,
  }));

  if (normalized.length === 0) {
    throw new Error(
      "The imported D&D Beyond character did not include any supported classes.",
    );
  }

  return normalized;
}

function normalizeAbilityScores(
  data: DndBeyondCharacterData,
  modifiers: DndBeyondModifier[],
): AbilityScores {
  const baseScores = new Map<number, number>();
  const bonusScores = new Map<number, number>();
  const overrideScores = new Map<number, number>();

  for (const stat of data.stats || []) {
    if (typeof stat.value === "number") {
      baseScores.set(stat.id, stat.value);
    }
  }

  for (const stat of data.bonusStats || []) {
    if (typeof stat.value === "number") {
      bonusScores.set(stat.id, stat.value);
    }
  }

  for (const stat of data.overrideStats || []) {
    if (typeof stat.value === "number") {
      overrideScores.set(stat.id, stat.value);
    }
  }

  const scoreBonuses = sumModifierBonusesBySubtype(modifiers);
  const abilityScores = {} as AbilityScores;

  for (const [id, ability] of Object.entries(ABILITY_ID_MAP) as Array<
    [string, keyof AbilityScores]
  >) {
    const numericId = Number(id);
    const baseValue = baseScores.get(numericId);
    if (typeof baseValue !== "number") {
      throw new Error(
        `The imported D&D Beyond character is missing ${ability} data.`,
      );
    }

    const overrideValue = overrideScores.get(numericId);
    const bonusValue = bonusScores.get(numericId) || 0;
    const modifierBonus = scoreBonuses[`${ability}-score`] || 0;
    abilityScores[ability] =
      typeof overrideValue === "number"
        ? overrideValue
        : baseValue + bonusValue + modifierBonus;
  }

  return abilityScores;
}

function normalizeRace(
  raceName: string | null | undefined,
): DnDRace | undefined {
  if (!raceName) {
    return undefined;
  }

  if (!VALID_RACES.includes(raceName as DnDRace)) {
    return undefined;
  }

  return raceName as DnDRace;
}

function normalizeAlignment(
  alignmentId: number | null | undefined,
): DnDAlignment | undefined {
  if (typeof alignmentId !== "number") {
    return undefined;
  }

  return ALIGNMENT_ID_MAP[alignmentId];
}

function normalizeMaxHp(
  data: DndBeyondCharacterData,
  abilityScores: AbilityScores,
  totalLevel: number,
): number {
  if (typeof data.overrideHitPoints === "number") {
    return data.overrideHitPoints;
  }

  const baseHitPoints = data.baseHitPoints || 0;
  const bonusHitPoints = data.bonusHitPoints || 0;
  const constitutionModifier = getAbilityModifier(abilityScores.constitution);
  return baseHitPoints + bonusHitPoints + constitutionModifier * totalLevel;
}

function normalizeArmorClass(
  inventory: DndBeyondInventoryEntry[] | null | undefined,
  abilityScores: AbilityScores,
  modifiers: DndBeyondModifier[],
): number {
  const dexterityModifier = getAbilityModifier(abilityScores.dexterity);
  const armorBonuses = modifiers
    .filter((modifier) => modifier.subType === "armor-class")
    .reduce(
      (total, modifier) => total + (modifier.value ?? modifier.fixedValue ?? 0),
      0,
    );

  const equippedArmor = (inventory || []).find(
    (item) => item.equipped && typeof item.definition?.armorClass === "number",
  );

  if (
    !equippedArmor?.definition ||
    typeof equippedArmor.definition.armorClass !== "number"
  ) {
    return 10 + dexterityModifier + armorBonuses;
  }

  const armorTypeId = equippedArmor.definition.armorTypeId;
  let dexterityContribution = dexterityModifier;

  if (armorTypeId === 2) {
    dexterityContribution = Math.min(dexterityModifier, 2);
  }

  if (armorTypeId === 3) {
    dexterityContribution = 0;
  }

  return (
    equippedArmor.definition.armorClass + dexterityContribution + armorBonuses
  );
}

function normalizeSavingThrows(
  abilityScores: AbilityScores,
  modifiers: DndBeyondModifier[],
  proficiencyBonus: number,
): Partial<Record<keyof AbilityScores, number>> {
  const bonusesBySubtype = sumModifierBonusesBySubtype(modifiers);
  const proficientSaves = new Set(
    modifiers
      .filter(
        (modifier) =>
          modifier.type === "proficiency" &&
          modifier.subType?.endsWith("-saving-throws"),
      )
      .map((modifier) =>
        (modifier.subType || "").replace("-saving-throws", ""),
      ),
  );

  const savingThrows: Partial<Record<keyof AbilityScores, number>> = {};

  for (const ability of Object.keys(ABILITY_ID_MAP).map(
    (id) => ABILITY_ID_MAP[Number(id)],
  )) {
    const base = getAbilityModifier(abilityScores[ability]);
    const proficiency = proficientSaves.has(ability) ? proficiencyBonus : 0;
    const bonus = bonusesBySubtype[`${ability}-saving-throws`] || 0;
    savingThrows[ability] = base + proficiency + bonus;
  }

  return savingThrows;
}

function normalizeSkills(
  abilityScores: AbilityScores,
  modifiers: DndBeyondModifier[],
  proficiencyBonus: number,
): Record<string, number> {
  const expertise = new Set(
    modifiers
      .filter((modifier) => modifier.type === "expertise")
      .map((modifier) => normalizeSkillName(modifier.subType || "")),
  );
  const proficiency = new Set(
    modifiers
      .filter((modifier) => modifier.type === "proficiency")
      .map((modifier) => normalizeSkillName(modifier.subType || "")),
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
  const senses: Record<string, string> = {};

  for (const modifier of modifiers) {
    if (
      modifier.type === "set-base" &&
      modifier.subType &&
      typeof (modifier.value ?? modifier.fixedValue) === "number"
    ) {
      senses[normalizeSenseKey(modifier.subType)] =
        `${modifier.value ?? modifier.fixedValue} ft.`;
    }
  }

  const walkSpeed = data.race?.weightSpeeds?.normal?.walk;
  if (typeof walkSpeed === "number" && walkSpeed > 0) {
    senses.speed = `${walkSpeed} ft.`;
  }

  senses["passive perception"] = String(
    10 + (skills.perception ?? getAbilityModifier(abilityScores.wisdom)),
  );
  senses["passive investigation"] = String(
    10 +
      (skills.investigation ?? getAbilityModifier(abilityScores.intelligence)),
  );
  senses["passive insight"] = String(
    10 + (skills.insight ?? getAbilityModifier(abilityScores.wisdom)),
  );

  return senses;
}

function normalizeByModifierType(
  modifiers: DndBeyondModifier[],
  type: string,
): string[] {
  return dedupeStrings(
    modifiers
      .filter((modifier) => modifier.type === type)
      .map(
        (modifier) =>
          modifier.friendlySubtypeName || titleize(modifier.subType || ""),
      ),
  );
}

function normalizeConditionImmunities(
  modifiers: DndBeyondModifier[],
): string[] {
  return dedupeStrings(
    modifiers
      .filter(
        (modifier) =>
          modifier.type === "immunity" &&
          modifier.subType !== "poison" &&
          modifier.subType !== "fire" &&
          modifier.subType !== "cold" &&
          modifier.subType !== "lightning",
      )
      .map(
        (modifier) =>
          modifier.friendlySubtypeName || titleize(modifier.subType || ""),
      ),
  );
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
  const mappedActions: CreatureAbility[] = [];
  const mappedBonusActions: CreatureAbility[] = [];
  const mappedReactions: CreatureAbility[] = [];

  for (const entries of Object.values(actions || {})) {
    for (const entry of entries || []) {
      if (!entry.name || !(entry.snippet || entry.description)) {
        continue;
      }

      const ability: CreatureAbility = {
        name: entry.name,
        description: sanitizeHtmlSnippet(
          entry.snippet || entry.description || "",
        ),
      };

      switch (entry.activation?.activationType) {
        case 3:
          mappedBonusActions.push(ability);
          break;
        case 4:
          mappedReactions.push(ability);
          break;
        default:
          mappedActions.push(ability);
      }
    }
  }

  const mappedTraits = [
    ...mapNarrativeEntries(traits, {
      personalityTraits: "Personality Traits",
      ideals: "Ideals",
      bonds: "Bonds",
      flaws: "Flaws",
      appearance: "Appearance",
    }),
    ...mapNarrativeEntries(notes, {
      backstory: "Backstory",
      allies: "Allies",
      enemies: "Enemies",
      organizations: "Organizations",
      otherNotes: "Other Notes",
    }),
  ];

  return {
    traits: mappedTraits,
    actions: mappedActions,
    bonusActions: mappedBonusActions,
    reactions: mappedReactions,
  };
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

function sumModifierBonusesBySubtype(
  modifiers: DndBeyondModifier[],
): Record<string, number> {
  return modifiers.reduce<Record<string, number>>((accumulator, modifier) => {
    if (modifier.type !== "bonus" && modifier.type !== "set-base") {
      return accumulator;
    }

    if (!modifier.subType) {
      return accumulator;
    }

    const numericValue = modifier.value ?? modifier.fixedValue;
    if (typeof numericValue !== "number") {
      return accumulator;
    }

    accumulator[modifier.subType] =
      (accumulator[modifier.subType] || 0) + numericValue;
    return accumulator;
  }, {});
}

function getProficiencyBonus(totalLevel: number): number {
  return 2 + Math.floor(Math.max(totalLevel - 1, 0) / 4);
}

function getAbilityModifier(score: number): number {
  return Math.floor((score - 10) / 2);
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

function titleize(value: string): string {
  return value
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (character) => character.toUpperCase())
    .trim();
}

function dedupeStrings(values: string[]): string[] {
  return Array.from(new Set(values.filter(Boolean)));
}
