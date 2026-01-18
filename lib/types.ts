/**
 * Shared type definitions
 */

export interface Encounter {
  _id?: any;
  id: string;
  userId: string;
  name: string;
  description?: string;
  difficulty?: string;
  monsters: Monster[];
  creatures?: string[];
  createdAt?: Date;
  updatedAt?: Date;
  _version?: number;
  _lastModified?: number;
  _deleted?: boolean;
}

export interface Party {
  id: string;
  userId: string;
  name: string;
  description?: string;
  characters?: string[];
  characterIds?: string[];
  updatedAt?: Date;
  _version?: number;
  _lastModified?: number;
  _deleted?: boolean;
}

export interface Character {
  id: string;
  userId: string;
  name: string;
  class?: string;
  level?: number;
  _version?: number;
  _lastModified?: number;
  _deleted?: boolean;
}

export interface CombatState {
  id?: string;
  userId: string;
  encounterId?: string;
  round?: number;
  turn?: number;
  participants?: any[];
  activeParticipantId?: string;
  combatants?: any[];
  currentRound?: number;
  currentTurnIndex?: number;
  isActive?: boolean;
  updatedAt?: Date;
  _version?: number;
  _lastModified?: number;
  _deleted?: boolean;
}

// Additional shared types and constants used across the app
export interface AbilityScores {
  strength: number;
  dexterity: number;
  constitution: number;
  intelligence: number;
  wisdom: number;
  charisma: number;
}

export interface CreatureStats {
  ac?: number;
  acNote?: string;
  hp: number;
  maxHp: number;
  abilityScores: AbilityScores;
  skills?: Record<string, number>;
  savingThrows?: Record<string, number>;
  damageResistances?: string[];
  damageImmunities?: string[];
  damageVulnerabilities?: string[];
  conditionImmunities?: string[];
  senses?: Record<string, string>;
  languages?: string[];
  traits?: any[];
  actions?: any[];
  bonusActions?: any[];
  reactions?: any[];
}

export type CharacterClass = { class: string; level: number };

export interface Character extends CreatureStats {
  id: string;
  userId: string;
  name: string;
  classes: CharacterClass[];
  race?: string;
  background?: string;
  alignment?: string;
  updatedAt?: Date;
  _version?: number;
  _lastModified?: number;
  _deleted?: boolean;
}

export type MonsterTemplate = any; // kept generic for now

export type Monster = {
  id: string;
  name: string;
  size?: string;
  ac?: number;
  hp?: number;
  maxHp?: number;
  abilityScores: AbilityScores;
  languages?: string[];
  traits?: any[];
  templateId?: string;
};

export type DnDRace = (typeof VALID_RACES)[number];

export const VALID_CLASSES = [
  'Fighter',
  'Rogue',
  'Wizard',
  'Cleric',
  'Paladin',
  'Ranger',
  'Bard',
  'Druid',
  'Monk',
  'Warlock',
  'Sorcerer',
  'Barbarian',
];

export const VALID_RACES = [
  'Human',
  'Elf',
  'Dwarf',
  'Halfling',
  'Gnome',
  'Half-Elf',
  'Half-Orc',
  'Tiefling',
  'Dragonborn',
];

export const VALID_ALIGNMENTS = [
  'Lawful Good',
  'Neutral Good',
  'Chaotic Good',
  'Lawful Neutral',
  'True Neutral',
  'Chaotic Neutral',
  'Lawful Evil',
  'Neutral Evil',
  'Chaotic Evil',
];

export function calculateTotalLevel(classes: CharacterClass[] | undefined) {
  if (!classes || classes.length === 0) return 0;
  return classes.reduce((sum, c) => sum + (typeof c.level === 'number' ? c.level : 0), 0);
}

export function isValidClass(name: string) {
  return VALID_CLASSES.includes(name);
}

export function isValidRace(name: string) {
  return VALID_RACES.includes(name);
}

export function validateCharacterClasses(
  classes: any,
  options: { allowEmpty?: boolean } = {}
): { valid: boolean; error?: string } {
  if (!Array.isArray(classes)) return { valid: false, error: 'Classes must be an array' };
  if (classes.length === 0) {
    return options.allowEmpty ? { valid: true } : { valid: false, error: 'At least one class must be provided' };
  }

  let total = 0;
  for (const c of classes) {
    if (!c || typeof c.class !== 'string' || !Number.isInteger(c.level)) {
      return { valid: false, error: 'Each class must have a string `class` and integer `level`' };
    }
    if (!isValidClass(c.class)) return { valid: false, error: `Invalid class: ${c.class}` };
    if (c.level <= 0) return { valid: false, error: 'Class level must be greater than 0' };
    total += c.level;
  }

  if (total > 30) return { valid: false, error: 'Total character level exceeds allowed maximum (30)' };

  return { valid: true };
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
  method: 'rolled' | 'manual';
}

export interface CombatantState extends CreatureStats {
  id: string;
  name: string;
  type: 'player' | 'monster';
  initiative: number;
  initiativeRoll?: InitiativeRoll;
  conditions: StatusCondition[];
  notes?: string;
  targetIds?: string[];
  size?: 'tiny' | 'small' | 'medium' | 'large' | 'huge' | 'gargantuan';
  monsterType?: string;
  challengeRating?: number;
}

// Auth / User related types
export interface User {
  _id?: any;
  email: string;
  passwordHash: string;
  createdAt: Date;
  updatedAt: Date;
  cacheMonsterCatalog?: boolean;
}

export type AuthPayload = {
  userId: string;
  email: string;
};
