// Generic D&D 5e character shape factories.
// Use this file for normalized output shapes shared across all import sources
// (DnD Beyond, Roll20, Pathbuilder, etc.).
// Raw source-specific API shapes belong in the source's own helper file.

import type { AbilityScores, CharacterClass } from "@/lib/types";
import type { ImportedCharacterDraft } from "@/lib/dndBeyondCharacterImport";

// Default name for the sample imported character fixture used across importer tests.
export const DND_BEYOND_CHARACTER_NAME = "Dolor Vagarpie";

export function createAbilityScores(partial: Partial<AbilityScores> = {}): AbilityScores {
  return {
    strength: 10,
    dexterity: 10,
    constitution: 10,
    intelligence: 10,
    wisdom: 10,
    charisma: 10,
    ...partial,
  };
}

export function createClassEntry(className: CharacterClass["class"], level: number): CharacterClass {
  return { class: className, level };
}

export function createCharacterData(
  overrides: Partial<ImportedCharacterDraft> = {},
): ImportedCharacterDraft {
  return {
    name: DND_BEYOND_CHARACTER_NAME,
    ac: 17,
    hp: 92,
    maxHp: 92,
    abilityScores: createAbilityScores({ dexterity: 17, constitution: 14, intelligence: 16, charisma: 21 }),
    classes: [
      createClassEntry("Rogue", 5),
      createClassEntry("Warlock", 7),
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
