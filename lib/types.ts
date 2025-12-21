// Data types for the combat tracker

// D&D 5e Classes - valid classes from https://www.dnd5eapi.co/api/2014/classes
export type DnDClass = 
  | 'Barbarian'
  | 'Bard'
  | 'Cleric'
  | 'Druid'
  | 'Fighter'
  | 'Monk'
  | 'Paladin'
  | 'Ranger'
  | 'Rogue'
  | 'Sorcerer'
  | 'Warlock'
  | 'Wizard';

export const VALID_CLASSES: DnDClass[] = [
  'Barbarian',
  'Bard',
  'Cleric',
  'Druid',
  'Fighter',
  'Monk',
  'Paladin',
  'Ranger',
  'Rogue',
  'Sorcerer',
  'Warlock',
  'Wizard',
];

export function isValidClass(className: unknown): className is DnDClass {
  return typeof className === 'string' && VALID_CLASSES.includes(className as DnDClass);
}

// D&D 5e Races - valid races from https://www.dnd5eapi.co/api/2014/races
export type DnDRace = 
  | 'Dragonborn'
  | 'Dwarf'
  | 'Elf'
  | 'Gnome'
  | 'Half-Elf'
  | 'Half-Orc'
  | 'Halfling'
  | 'Human'
  | 'Tiefling';

export const VALID_RACES: DnDRace[] = [
  'Dragonborn',
  'Dwarf',
  'Elf',
  'Gnome',
  'Half-Elf',
  'Half-Orc',
  'Halfling',
  'Human',
  'Tiefling',
];

export function isValidRace(raceName: unknown): raceName is DnDRace {
  return typeof raceName === 'string' && VALID_RACES.includes(raceName as DnDRace);
}

// D&D 5e Alignments - standard 9-alignment system
export const VALID_ALIGNMENTS = [
  'Lawful Good',
  'Neutral Good',
  'Chaotic Good',
  'Lawful Neutral',
  'Neutral',
  'Chaotic Neutral',
  'Lawful Evil',
  'Neutral Evil',
  'Chaotic Evil',
] as const;

export type DnDAlignment = typeof VALID_ALIGNMENTS[number];

export function isValidAlignment(alignment: unknown): alignment is DnDAlignment {
  return typeof alignment === 'string' && VALID_ALIGNMENTS.includes(alignment as DnDAlignment);
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

export type ClassValidationResult = ClassValidationSuccess | ClassValidationError;

export function validateCharacterClasses(
  classes: unknown,
  options: { allowEmpty?: boolean } = {}
): ClassValidationResult {
  const { allowEmpty = false } = options;

  // Check if classes is an array
  if (!Array.isArray(classes)) {
    return {
      valid: false,
      error: 'Classes must be an array of {class, level} objects',
    };
  }

  // Check for empty array (usually not allowed, especially on updates)
  if (classes.length === 0 && !allowEmpty) {
    return {
      valid: false,
      error: 'At least one class is required',
    };
  }

  // Track classes to detect duplicates
  const seenClasses = new Set<DnDClass>();

  // Validate each class entry
  for (const classEntry of classes) {
    // Validate class property exists and is valid
    if (!classEntry || typeof classEntry !== 'object' || !classEntry.class) {
      return {
        valid: false,
        error: 'Each class entry must have a "class" property',
      };
    }

    if (!isValidClass(classEntry.class)) {
      return {
        valid: false,
        error: `Invalid class "${classEntry.class}". Must be one of: ${VALID_CLASSES.join(', ')}`,
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
    if (typeof classEntry.level !== 'number' || classEntry.level < 1 || classEntry.level > 20) {
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
  damageResistances?: string[];
  damageImmunities?: string[];
  damageVulnerabilities?: string[];
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
  size: 'tiny' | 'small' | 'medium' | 'large' | 'huge' | 'gargantuan';
  type: string; // e.g., 'humanoid', 'beast', 'dragon', 'undead', etc.
  alignment?: string; // e.g., 'chaotic evil', 'neutral', etc.
  // Speed
  speed: string; // e.g., "30 ft.", "30 ft., fly 60 ft."
  // Challenge Rating
  challengeRating: number;
  experiencePoints?: number; // Calculated based on CR
  // Lair & Legendary Actions (monster-specific)
  lairActions?: CreatureAbility[];
  legendaryActions?: CreatureAbility[];
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
  size: 'tiny' | 'small' | 'medium' | 'large' | 'huge' | 'gargantuan';
  type: string;
  alignment?: string;
  // Speed
  speed: string;
  // Challenge
  challengeRating: number;
  experiencePoints?: number;
  // Lair & Legendary Actions (monster-specific)
  lairActions?: CreatureAbility[];
  legendaryActions?: CreatureAbility[];
  // Metadata
  source?: string;
  description?: string;
}

// Character - player character with shared creature stats
export interface Character extends CreatureStats {
  _id?: string;
  id: string;
  userId: string;
  name: string;
  // Character-specific metadata
  classes: CharacterClass[]; // Array of classes for multiclass support
  race?: DnDRace; // Must be one of the valid D&D 5e races
  background?: string;
  alignment?: string;
  createdAt?: Date;
  updatedAt?: Date;
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
  method: 'rolled' | 'manual'; // 'rolled' = automatic roll, 'manual' = user entered
}

export interface CombatantState extends CreatureStats {
  id: string;
  name: string;
  type: 'player' | 'monster';
  initiative: number;
  initiativeRoll?: InitiativeRoll;
  conditions: StatusCondition[];
  notes?: string;
  // Additional metadata for combat display
  size?: 'tiny' | 'small' | 'medium' | 'large' | 'huge' | 'gargantuan';
  monsterType?: string;
  challengeRating?: number;
}

export interface CombatState {
  _id?: string;
  id: string;
  userId: string;
  encounterId?: string;
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
