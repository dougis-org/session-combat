// Data types for the combat tracker

// D&D 5e Classes - includes official classes and common additions (e.g., Blood Hunter)
export type DnDClass =
  | "Artificer"
  | "Barbarian"
  | "Bard"
  | "Blood Hunter"
  | "Cleric"
  | "Druid"
  | "Fighter"
  | "Monk"
  | "Paladin"
  | "Ranger"
  | "Rogue"
  | "Sorcerer"
  | "Warlock"
  | "Wizard";

export const VALID_CLASSES: DnDClass[] = [
  "Artificer",
  "Barbarian",
  "Bard",
  "Blood Hunter",
  "Cleric",
  "Druid",
  "Fighter",
  "Monk",
  "Paladin",
  "Ranger",
  "Rogue",
  "Sorcerer",
  "Warlock",
  "Wizard",
];

export function isValidClass(className: unknown): className is DnDClass {
  return (
    typeof className === "string" &&
    VALID_CLASSES.includes(className as DnDClass)
  );
}

// D&D 5e Races - includes official core races, common subraces, and non-SRD races
export type DnDRace =
  | "Aasimar"
  | "Dragonborn"
  | "Drow"
  | "Dwarf"
  | "Elf"
  | "Forest Gnome"
  | "Gnome"
  | "Goliath"
  | "Half-Elf"
  | "Half-Orc"
  | "Halfling"
  | "High Elf"
  | "Hill Dwarf"
  | "Human"
  | "Lightfoot Halfling"
  | "Mountain Dwarf"
  | "Orc"
  | "Rock Gnome"
  | "Stout Halfling"
  | "Tiefling"
  | "Wood Elf";

export const VALID_RACES: DnDRace[] = [
  "Aasimar",
  "Dragonborn",
  "Drow",
  "Dwarf",
  "Elf",
  "Forest Gnome",
  "Gnome",
  "Goliath",
  "Half-Elf",
  "Half-Orc",
  "Halfling",
  "High Elf",
  "Hill Dwarf",
  "Human",
  "Lightfoot Halfling",
  "Mountain Dwarf",
  "Orc",
  "Rock Gnome",
  "Stout Halfling",
  "Tiefling",
  "Wood Elf",
];

export function isValidRace(raceName: unknown): raceName is DnDRace {
  return (
    typeof raceName === "string" && VALID_RACES.includes(raceName as DnDRace)
  );
}

// D&D 5e Alignments - the 9-alignment grid plus official stat block values
export const VALID_ALIGNMENTS = [
  "Lawful Good",
  "Neutral Good",
  "Chaotic Good",
  "Lawful Neutral",
  "Neutral",
  "Chaotic Neutral",
  "Lawful Evil",
  "Neutral Evil",
  "Chaotic Evil",
  // Official 5e stat block values for creatures outside the 9-alignment grid
  "Unaligned",
  "Any Alignment",
  "Any Good Alignment",
  "Any Evil Alignment",
  "Any Chaotic Alignment",
  "Any Lawful Alignment",
  "Any Non-Good Alignment",
  "Any Non-Lawful Alignment",
  "Neutral Good (50%) or Neutral Evil (50%)",
] as const;

export type DnDAlignment = (typeof VALID_ALIGNMENTS)[number];

export function isValidAlignment(
  alignment: unknown,
): alignment is DnDAlignment {
  return (
    typeof alignment === "string" &&
    VALID_ALIGNMENTS.includes(alignment as DnDAlignment)
  );
}

// Character Class Level - for multiclass support
export interface CharacterClass {
  class: DnDClass;
  level: number;
}

// Validation helper for character classes array
export interface ClassValidationError {
  valid: false;
  error: string;
}

export interface ClassValidationSuccess {
  valid: true;
}

export type ClassValidationResult =
  | ClassValidationSuccess
  | ClassValidationError;

export function validateCharacterClasses(
  classes: unknown,
  options: { allowEmpty?: boolean } = {},
): ClassValidationResult {
  const { allowEmpty = false } = options;

  // Check if classes is an array
  if (!Array.isArray(classes)) {
    return {
      valid: false,
      error: "Classes must be an array of {class, level} objects",
    };
  }

  // Check for empty array (usually not allowed, especially on updates)
  if (classes.length === 0 && !allowEmpty) {
    return {
      valid: false,
      error: "At least one class is required",
    };
  }

  // Track classes to detect duplicates
  const seenClasses = new Set<DnDClass>();

  // Validate each class entry
  for (const classEntry of classes) {
    // Validate class property exists and is valid
    if (!classEntry || typeof classEntry !== "object" || !classEntry.class) {
      return {
        valid: false,
        error: 'Each class entry must have a "class" property',
      };
    }

    if (!isValidClass(classEntry.class)) {
      return {
        valid: false,
        error: `Invalid class "${classEntry.class}". Must be one of: ${VALID_CLASSES.join(", ")}`,
      };
    }

    // Check for duplicate classes
    if (seenClasses.has(classEntry.class)) {
      return {
        valid: false,
        error: `Duplicate class: "${classEntry.class}". Each character can have each class only once.`,
      };
    }
    seenClasses.add(classEntry.class);

    // Validate level property
    if (
      typeof classEntry.level !== "number" ||
      classEntry.level < 1 ||
      classEntry.level > 20
    ) {
      return {
        valid: false,
        error: `Class level must be a number between 1 and 20 (got ${classEntry.level})`,
      };
    }
  }

  return { valid: true };
}

// User and authentication
export interface User {
  _id?: string;
  id?: string;
  email: string;
  passwordHash: string;
  isAdmin?: boolean; // Admin users can manage global monster templates
  createdAt: Date;
  updatedAt: Date;
}

export interface AuthPayload {
  userId: string;
  email: string;
}

// Ability scores interface
export interface AbilityScores {
  strength: number;
  dexterity: number;
  constitution: number;
  intelligence: number;
  wisdom: number;
  charisma: number;
}

// Creature ability (trait, action, etc.) - shared between monsters and characters
export interface CreatureAbility {
  name: string;
  description: string;
  attackBonus?: number;
  damageDescription?: string; // e.g., "2d6 + 3 piercing"
  saveDC?: number;
  saveType?: string; // e.g., "Dexterity", "Strength"
  recharge?: string; // e.g., "Recharge 5-6"
  cost?: number; // Action point cost (legendary actions only); defaults to 1
  usesRemaining?: number; // Remaining uses for limited-use abilities (lair actions); absent = unlimited
}

// Shared base statistics for any creature (monster, character, NPC)
export interface CreatureStats {
  // Ability Scores
  abilityScores: AbilityScores;
  // Combat Stats
  ac: number;
  acNote?: string; // e.g., "natural armor", "leather armor + DEX"
  hp: number;
  maxHp: number;
  // Saving Throws (bonus to saves, if different from ability modifiers)
  savingThrows?: Partial<Record<keyof AbilityScores, number>>;
  // Skills
  skills?: Record<string, number>; // e.g., { "acrobatics": 2, "arcana": 4 }
  // Resistances and Immunities
  damageResistances?: import('@/lib/constants').DamageType[];
  damageImmunities?: import('@/lib/constants').DamageType[];
  damageVulnerabilities?: import('@/lib/constants').DamageType[];
  conditionImmunities?: string[];
  // Senses
  senses?: Record<string, string>; // e.g., { "darkvision": "60 ft.", "passive Perception": "14" }
  // Languages and Communication
  languages?: string[];
  communication?: string;
  // Special Abilities
  traits?: CreatureAbility[];
  actions?: CreatureAbility[];
  bonusActions?: CreatureAbility[];
  reactions?: CreatureAbility[];
}

// Monster ability (trait, action, etc.) - legacy alias for backward compatibility
export interface MonsterAbility extends CreatureAbility {}

// Monster template in the library (reusable)
export interface MonsterTemplate extends CreatureStats {
  _id?: string;
  id: string;
  userId: string; // userId: 'GLOBAL' for admin-controlled global templates, otherwise user's userId
  // Basic Info
  name: string;
  size: "tiny" | "small" | "medium" | "large" | "huge" | "gargantuan";
  type: string; // e.g., 'humanoid', 'beast', 'dragon', 'undead', etc.
  alignment?: DnDAlignment; // e.g., 'chaotic evil', 'neutral', etc.
  // Speed
  speed: string; // e.g., "30 ft.", "30 ft., fly 60 ft."
  // Challenge Rating
  challengeRating: number;
  experiencePoints?: number; // Calculated based on CR
  // Lair & Legendary Actions (monster-specific)
  lairActions?: CreatureAbility[];
  legendaryActions?: CreatureAbility[];
  legendaryActionCount?: number; // Pool size (e.g. 3 for most bosses)
  // Metadata
  isGlobal?: boolean; // True if this is a global template (userId === 'GLOBAL')
  source?: string; // e.g., "Monster Manual", "Xanathar's Guide"
  description?: string; // Additional notes or lore
  createdAt: Date;
  updatedAt: Date;
}

// Monster instance in an encounter (unique copy with instance-specific state)
export interface Monster extends CreatureStats {
  _id?: string;
  id: string;
  userId?: string; // Optional for encounter instances
  templateId?: string; // Reference to MonsterTemplate if created from library
  // Basic Info
  name: string;
  size: "tiny" | "small" | "medium" | "large" | "huge" | "gargantuan";
  type: string;
  alignment?: DnDAlignment;
  // Speed
  speed: string;
  // Challenge
  challengeRating: number;
  experiencePoints?: number;
  // Lair & Legendary Actions (monster-specific)
  lairActions?: CreatureAbility[];
  legendaryActions?: CreatureAbility[];
  legendaryActionCount?: number; // Pool size (e.g. 3 for most bosses)
  // Metadata
  source?: string;
  description?: string;
  // Optional initiative override (used when manually creating a combatant with a specific initiative value)
  initiative?: number;
}

// Character - player character with shared creature stats
/**
 * Represents a player character with D&D 5e statistics and metadata.
 *
 * Includes combat stats, abilities, class information, and soft delete tracking.
 * Soft-deleted characters (deletedAt != null) should be filtered from queries using
 * the characters_active MongoDB view.
 */
export interface Character extends CreatureStats {
  _id?: string;
  id: string;
  userId: string;
  name: string;
  // Character-specific metadata
  classes: CharacterClass[]; // Array of classes for multiclass support
  race?: DnDRace; // Must be one of the valid D&D 5e races
  gender?: string;
  background?: string;
  alignment?: DnDAlignment;
  createdAt?: Date;
  updatedAt?: Date;
  /**
   * Timestamp when the character was soft-deleted.
   * When null/undefined, the character is active.
   * When set to a date, the character is considered deleted but data is preserved for audit trail.
   * Characters with deletedAt != null should be excluded from queries using the characters_active view.
   */
  deletedAt?: Date;
}

// Helper function to calculate total character level from classes array
// Pure calculation - does not handle edge cases or defaults (validation belongs in API layer)
export function calculateTotalLevel(classes: CharacterClass[]): number {
  return classes.reduce((total, classLevel) => total + classLevel.level, 0);
}

export interface Encounter {
  _id?: string;
  id: string;
  userId: string;
  name: string;
  description: string;
  monsters: Monster[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ActiveDamageEffect {
  type: import('@/lib/constants').DamageType;
  kind: 'resistance' | 'immunity' | 'vulnerability';
  label: string;
}

export interface DamageEffectPreset {
  id: string;
  label: string;
  description: string;
  effects: Array<{
    type: import('@/lib/constants').DamageType | null;
    kind: 'resistance' | 'immunity' | 'vulnerability';
    choicesLimited?: import('@/lib/constants').DamageType[];
  }>;
}

export interface StatusCondition {
  id: string;
  name: string;
  description: string;
  duration?: number; // in rounds
}

export interface CombatantStatus {
  combatantId: string;
  conditions: StatusCondition[];
}

export interface InitiativeRoll {
  roll: number;
  bonus: number;
  total: number;
  method: "rolled" | "manual"; // 'rolled' = automatic roll, 'manual' = user entered
  advantage?: boolean;
  altRoll?: number;
  flatBonus?: number;
}

export interface CombatantState extends CreatureStats {
  id: string;
  name: string;
  type: "player" | "monster" | "lair";
  initiative: number;
  initiativeRoll?: InitiativeRoll;
  conditions: StatusCondition[];
  tempHp?: number;
  notes?: string;
  targetIds?: string[]; // IDs of combatants being attacked
  // Additional metadata for combat display
  size?: "tiny" | "small" | "medium" | "large" | "huge" | "gargantuan";
  monsterType?: string;
  challengeRating?: number;
  // Lair & Legendary Actions (monster-specific, optional for compatibility)
  lairActions?: CreatureAbility[];
  legendaryActions?: CreatureAbility[];
  legendaryActionCount?: number; // DM-adjustable pool size (copied from template)
  legendaryActionsRemaining?: number; // Runtime counter; resets on turn start
  activeDamageEffects?: ActiveDamageEffect[];
  initiativeAdvantage?: boolean;
  initiativeFlatBonus?: number;
}

export interface HpHistoryEntry {
  hp: number;
  tempHp: number;
  type: 'damage' | 'healing' | 'tempHp';
  amount: number;
  timestamp: number;
}

export interface CombatState {
  _id?: string;
  id: string;
  userId: string;
  encounterId?: string;
  encounterDescription?: string;
  combatants: CombatantState[];
  currentRound: number;
  currentTurnIndex: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Party {
  _id?: string;
  id: string;
  userId: string;
  name: string;
  description?: string;
  characterIds: string[]; // ObjectId references to characters
  createdAt: Date;
  updatedAt: Date;
}

export interface SessionData {
  encounters: Encounter[];
  characters: Character[];
  parties: Party[];
  combatState?: CombatState;
}
