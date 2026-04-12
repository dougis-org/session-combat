import {
  ImportedCharacterDraft,
  NormalizedDndBeyondCharacter,
} from "@/lib/dndBeyondCharacterImport";
import { Character } from "@/lib/types";
import { sampleDndBeyondCharacterResponse } from "@/tests/fixtures/dndBeyondCharacter";

export const DND_BEYOND_CHARACTER_URL =
  "https://www.dndbeyond.com/characters/91913267/BRdgB3";
export const DND_BEYOND_CHARACTER_NAME = "Dolor Vagarpie";
export const EXISTING_IMPORTED_CHARACTER_ID = "existing-character-id";
export const IMPORT_WARNING = "Alignment was not supported and was omitted.";
export const CONFLICT_WARNING = "Race was not supported and was omitted.";

export function createImportedCharacterDraft(
  overrides: Partial<ImportedCharacterDraft> = {},
): ImportedCharacterDraft {
  return {
    name: DND_BEYOND_CHARACTER_NAME,
    ac: 17,
    hp: 92,
    maxHp: 92,
    abilityScores: {
      strength: 10,
      dexterity: 17,
      constitution: 14,
      intelligence: 16,
      wisdom: 10,
      charisma: 21,
    },
    classes: [
      { class: "Rogue", level: 5 },
      { class: "Warlock", level: 7 },
    ],
    savingThrows: {},
    skills: {},
    damageResistances: [],
    damageImmunities: [],
    damageVulnerabilities: [],
    conditionImmunities: [],
    senses: {},
    languages: ["Common", "Infernal"],
    traits: [],
    actions: [],
    bonusActions: [],
    reactions: [],
    race: "Tiefling",
    alignment: "Chaotic Good",
    ...overrides,
  };
}

export function createNormalizedImportResult(
  overrides: Partial<NormalizedDndBeyondCharacter> = {},
): NormalizedDndBeyondCharacter {
  return {
    character: createImportedCharacterDraft(),
    warnings: [IMPORT_WARNING],
    sourceCharacterId: String(sampleDndBeyondCharacterResponse.data.id),
    sourceUrl: sampleDndBeyondCharacterResponse.data.readonlyUrl ?? undefined,
    ...overrides,
  };
}

export function createPersistedImportedCharacter(
  overrides: Partial<Character> = {},
): Character {
  return {
    ...createImportedCharacterDraft(),
    id: EXISTING_IMPORTED_CHARACTER_ID,
    userId: "test-user-id",
    ...overrides,
  };
}

export function createDuplicateNameConflictPayload(
  overrides: Partial<{
    error: string;
    warnings: string[];
    existingCharacter: { id: string; name: string };
  }> = {},
) {
  return {
    conflict: "duplicate-name",
    error: "Character already exists",
    warnings: [CONFLICT_WARNING],
    existingCharacter: {
      id: EXISTING_IMPORTED_CHARACTER_ID,
      name: DND_BEYOND_CHARACTER_NAME,
    },
    ...overrides,
  };
}

export function createImportedCharacterApiPayload(
  overrides: Partial<{
    character: Character;
    warnings: string[];
  }> = {},
) {
  return {
    character: createPersistedImportedCharacter({ userId: "user-1" }),
    warnings: [IMPORT_WARNING],
    ...overrides,
  };
}
