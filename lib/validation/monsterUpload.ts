/**
 * Validation utilities for monster JSON document format
 * Validates and transforms user-uploaded monster data
 */

import { MonsterTemplate, AbilityScores, CreatureAbility } from '@/lib/types';
import { generateUUID } from '@/lib/utils/uuid';

/**
 * Valid monster sizes in D&D 5e
 */
export const VALID_SIZES = [
  'tiny',
  'small',
  'medium',
  'large',
  'huge',
  'gargantuan',
] as const;

export type ValidSize = (typeof VALID_SIZES)[number];

/**
 * Validation error with field context
 */
export interface ValidationError {
  field?: string;
  message: string;
  index?: number; // For array items
}

/**
 * Validation result
 */
export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
}

/**
 * Raw monster data from JSON upload
 */
export interface RawMonsterData {
  name?: unknown;
  size?: unknown;
  type?: unknown;
  alignment?: unknown;
  ac?: unknown;
  acNote?: unknown;
  hp?: unknown;
  maxHp?: unknown;
  speed?: unknown;
  abilityScores?: unknown;
  savingThrows?: unknown;
  skills?: unknown;
  damageResistances?: unknown;
  damageImmunities?: unknown;
  damageVulnerabilities?: unknown;
  conditionImmunities?: unknown;
  senses?: unknown;
  languages?: unknown;
  challengeRating?: unknown;
  experiencePoints?: unknown;
  description?: unknown;
  source?: unknown;
  traits?: unknown;
  actions?: unknown;
  bonusActions?: unknown;
  reactions?: unknown;
  lairActions?: unknown;
  legendaryActions?: unknown;
}

/**
 * Uploaded monster document format
 */
export interface MonsterUploadDocument {
  monsters?: unknown;
}

/**
 * Validates a string value
 */
function validateString(
  value: unknown,
  fieldName: string,
  options: { required?: boolean; minLength?: number } = {}
): { valid: true; value: string } | { valid: false; error: ValidationError } {
  const { required = false, minLength = 0 } = options;

  if (value === undefined || value === null) {
    if (required) {
      return {
        valid: false,
        error: { field: fieldName, message: `${fieldName} is required` },
      };
    }
    return { valid: true, value: '' };
  }

  if (typeof value !== 'string') {
    return {
      valid: false,
      error: {
        field: fieldName,
        message: `${fieldName} must be a string, got ${typeof value}`,
      },
    };
  }

  if (value.length < minLength) {
    return {
      valid: false,
      error: {
        field: fieldName,
        message: `${fieldName} must be at least ${minLength} characters`,
      },
    };
  }

  return { valid: true, value };
}

/**
 * Validates a number value
 */
function validateNumber(
  value: unknown,
  fieldName: string,
  options: { required?: boolean; min?: number; max?: number } = {}
): { valid: true; value: number } | { valid: false; error: ValidationError } {
  const { required = false, min, max } = options;

  if (value === undefined || value === null) {
    if (required) {
      return {
        valid: false,
        error: { field: fieldName, message: `${fieldName} is required` },
      };
    }
    return { valid: true, value: 0 };
  }

  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return {
      valid: false,
      error: {
        field: fieldName,
        message: `${fieldName} must be a valid number, got ${typeof value}`,
      },
    };
  }

  if (min !== undefined && value < min) {
    return {
      valid: false,
      error: {
        field: fieldName,
        message: `${fieldName} must be at least ${min}`,
      },
    };
  }

  if (max !== undefined && value > max) {
    return {
      valid: false,
      error: {
        field: fieldName,
        message: `${fieldName} must be at most ${max}`,
      },
    };
  }

  return { valid: true, value };
}

/**
 * Validates ability scores object
 */
function validateAbilityScores(
  value: unknown,
  fieldName: string = 'abilityScores'
): { valid: true; value: AbilityScores } | { valid: false; error: ValidationError } {
  if (!value || typeof value !== 'object') {
    return {
      valid: false,
      error: {
        field: fieldName,
        message: `${fieldName} must be an object`,
      },
    };
  }

  const obj = value as Record<string, unknown>;
  const abilityNames = [
    'strength',
    'dexterity',
    'constitution',
    'intelligence',
    'wisdom',
    'charisma',
  ];
  const scores: Partial<AbilityScores> = {};

  for (const ability of abilityNames) {
    const scoreResult = validateNumber(obj[ability], `${fieldName}.${ability}`, {
      required: true,
      min: 1,
      max: 30,
    });
    if (!scoreResult.valid) {
      return { valid: false, error: scoreResult.error };
    }
    (scores as any)[ability as string] = scoreResult.value;
  }

  return {
    valid: true,
    value: scores as AbilityScores,
  };
}

/**
 * Validates an array of strings
 */
function validateStringArray(
  value: unknown,
  fieldName: string = 'array'
): { valid: true; value: string[] } | { valid: false; error: ValidationError } {
  if (value === undefined || value === null) {
    return { valid: true, value: [] };
  }

  if (!Array.isArray(value)) {
    return {
      valid: false,
      error: {
        field: fieldName,
        message: `${fieldName} must be an array of strings`,
      },
    };
  }

  for (let i = 0; i < value.length; i++) {
    if (typeof value[i] !== 'string') {
      return {
        valid: false,
        error: {
          field: fieldName,
          index: i,
          message: `${fieldName}[${i}] must be a string, got ${typeof value[i]}`,
        },
      };
    }
  }

  return { valid: true, value: value as string[] };
}

/**
 * Generic record validator
 */
function validateRecord<T extends string | number | (string | number)>(
  value: unknown,
  fieldName: string,
  isValid: (val: unknown) => boolean
): { valid: true; value: Record<string, T> } | { valid: false; error: ValidationError } {
  if (value === undefined || value === null) {
    return { valid: true, value: {} as Record<string, T> };
  }

  if (typeof value !== 'object' || Array.isArray(value)) {
    return {
      valid: false,
      error: {
        field: fieldName,
        message: `${fieldName} must be an object`,
      },
    };
  }

  const result: Record<string, T> = {};
  const obj = value as Record<string, unknown>;

  for (const [key, val] of Object.entries(obj)) {
    if (!isValid(val)) {
      return {
        valid: false,
        error: {
          field: `${fieldName}.${key}`,
          message: `${fieldName}.${key} has invalid type`,
        },
      };
    }
    result[key] = val as T;
  }

  return { valid: true, value: result };
}

/**
 * Validates a string-only record (key-value pairs with string values)
 */
function validateStringRecord(
  value: unknown,
  fieldName: string = 'record'
): { valid: true; value: Record<string, string> } | { valid: false; error: ValidationError } {
  return validateRecord<string>(value, fieldName, (val) => typeof val === 'string') as
    | { valid: true; value: Record<string, string> }
    | { valid: false; error: ValidationError };
}

/**
 * Validates a numeric record (key-value pairs with number values)
 */
function validateNumberRecord(
  value: unknown,
  fieldName: string = 'record'
): { valid: true; value: Record<string, number> } | { valid: false; error: ValidationError } {
  return validateRecord<number>(value, fieldName, (val) => typeof val === 'number' && Number.isFinite(val as number)) as
    | { valid: true; value: Record<string, number> }
    | { valid: false; error: ValidationError };
}

/**
 * Validates a record of strings or numbers
 */
function validateStringNumberRecord(
  value: unknown,
  fieldName: string = 'record'
): {
  valid: true;
  value: Record<string, string | number>;
} | { valid: false; error: ValidationError } {
  return validateRecord<string | number>(value, fieldName, (val) => typeof val === 'string' || typeof val === 'number') as
    | { valid: true; value: Record<string, string | number> }
    | { valid: false; error: ValidationError };
}

/**
 * Validates a creature ability (trait, action, etc)
 */
function validateAbility(ability: unknown, fieldName: string = 'ability') {
  if (!ability || typeof ability !== 'object') {
    return {
      valid: false,
      error: {
        field: fieldName,
        message: `${fieldName} must be an object`,
      },
    };
  }

  const obj = ability as Record<string, unknown>;

  const nameResult = validateString(obj.name, `${fieldName}.name`, { required: true });
  if (!nameResult.valid) {
    return { valid: false, error: nameResult.error };
  }

  const descResult = validateString(obj.description, `${fieldName}.description`, {
    required: true,
  });
  if (!descResult.valid) {
    return { valid: false, error: descResult.error };
  }

  return {
    valid: true,
    value: {
      name: nameResult.value,
      description: descResult.value,
      attackBonus: typeof obj.attackBonus === 'number' ? obj.attackBonus : undefined,
      damageDescription:
        typeof obj.damageDescription === 'string' ? obj.damageDescription : undefined,
      saveDC: typeof obj.saveDC === 'number' ? obj.saveDC : undefined,
      saveType: typeof obj.saveType === 'string' ? obj.saveType : undefined,
      recharge: typeof obj.recharge === 'string' ? obj.recharge : undefined,
    },
  };
}

/**
 * Validates an array of abilities
 */
function validateAbilityArray(
  value: unknown,
  fieldName: string = 'abilities'
): { valid: true; value: any[] } | { valid: false; error: ValidationError } {
  if (value === undefined || value === null) {
    return { valid: true, value: [] };
  }

  if (!Array.isArray(value)) {
    return {
      valid: false,
      error: {
        field: fieldName,
        message: `${fieldName} must be an array`,
      },
    };
  }

  const result = [];
  for (let i = 0; i < value.length; i++) {
    const abilityResult = validateAbility(value[i], `${fieldName}[${i}]`);
    if (!abilityResult.valid) {
      return { valid: false, error: abilityResult.error as ValidationError };
    }
    result.push(abilityResult.value);
  }

  return { valid: true, value: result };
}

/**
 * Validates a single monster from raw JSON data
 */
export function validateMonsterData(
  data: RawMonsterData,
  index: number = 0
): ValidationResult {
  const errors: ValidationError[] = [];
  const prefix = `monsters[${index}]`;

  // Required: name
  if (typeof data.name !== 'string' || data.name.trim() === '') {
    errors.push({
      field: `${prefix}.name`,
      message: 'Monster name is required and must be a non-empty string',
      index,
    });
  }

  // Required: maxHp
  if (typeof data.maxHp !== 'number' || data.maxHp <= 0) {
    errors.push({
      field: `${prefix}.maxHp`,
      message: 'maxHp is required and must be greater than 0',
      index,
    });
  }

  // Optional but with defaults: hp (must be <= maxHp)
  if (data.hp !== undefined && data.hp !== null) {
    if (typeof data.hp !== 'number') {
      errors.push({
        field: `${prefix}.hp`,
        message: 'hp must be a number',
        index,
      });
    } else if (data.maxHp && typeof data.maxHp === 'number' && data.hp > data.maxHp) {
      errors.push({
        field: `${prefix}.hp`,
        message: 'hp must be less than or equal to maxHp',
        index,
      });
    }
  }

  // Optional: ac (valid range 0-30)
  if (data.ac !== undefined && data.ac !== null) {
    if (typeof data.ac !== 'number' || data.ac < 0 || data.ac > 30) {
      errors.push({
        field: `${prefix}.ac`,
        message: 'ac must be a number between 0 and 30',
        index,
      });
    }
  }

  // Optional: size
  if (data.size !== undefined && data.size !== null) {
    if (typeof data.size !== 'string' || !VALID_SIZES.includes(data.size as any)) {
      errors.push({
        field: `${prefix}.size`,
        message: `size must be one of: ${VALID_SIZES.join(', ')}`,
        index,
      });
    }
  }

  // Optional: type
  if (data.type !== undefined && data.type !== null) {
    if (typeof data.type !== 'string' || data.type.trim() === '') {
      errors.push({
        field: `${prefix}.type`,
        message: 'type must be a non-empty string',
        index,
      });
    }
  }

  // Optional: challengeRating
  if (data.challengeRating !== undefined && data.challengeRating !== null) {
    if (typeof data.challengeRating !== 'number' || data.challengeRating < 0) {
      errors.push({
        field: `${prefix}.challengeRating`,
        message: 'challengeRating must be a non-negative number',
        index,
      });
    }
  }

  // Optional: abilityScores
  if (data.abilityScores !== undefined && data.abilityScores !== null) {
    const abilityResult = validateAbilityScores(data.abilityScores, `${prefix}.abilityScores`);
    if (!abilityResult.valid) {
      errors.push(abilityResult.error);
    }
  }

  // Optional: traits, actions, etc.
  const abilityFields = ['traits', 'actions', 'bonusActions', 'reactions', 'lairActions', 'legendaryActions'];
  for (const field of abilityFields) {
    if (data[field as keyof RawMonsterData] !== undefined && data[field as keyof RawMonsterData] !== null) {
      const arrayResult = validateAbilityArray(
        data[field as keyof RawMonsterData],
        `${prefix}.${field}`
      );
      if (!arrayResult.valid) {
        errors.push(arrayResult.error);
      }
    }
  }

  // Optional: damageResistances, etc. (string arrays)
  const stringArrayFields = [
    'damageResistances',
    'damageImmunities',
    'damageVulnerabilities',
    'conditionImmunities',
    'languages',
  ];
  for (const field of stringArrayFields) {
    if (data[field as keyof RawMonsterData] !== undefined && data[field as keyof RawMonsterData] !== null) {
      const arrayResult = validateStringArray(
        data[field as keyof RawMonsterData],
        `${prefix}.${field}`
      );
      if (!arrayResult.valid) {
        errors.push(arrayResult.error);
      }
    }
  }

  // Optional: savingThrows (number record)
  if (data.savingThrows !== undefined && data.savingThrows !== null) {
    const result = validateNumberRecord(data.savingThrows, `${prefix}.savingThrows`);
    if (!result.valid) {
      errors.push(result.error);
    }
  }

  // Optional: skills (number record)
  if (data.skills !== undefined && data.skills !== null) {
    const result = validateNumberRecord(data.skills, `${prefix}.skills`);
    if (!result.valid) {
      errors.push(result.error);
    }
  }

  // Optional: senses (string record)
  if (data.senses !== undefined && data.senses !== null) {
    const result = validateStringRecord(data.senses, `${prefix}.senses`);
    if (!result.valid) {
      errors.push(result.error);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validates an entire monster upload document
 */
export function validateMonsterUploadDocument(
  document: MonsterUploadDocument
): ValidationResult {
  const errors: ValidationError[] = [];

  if (!document.monsters || !Array.isArray(document.monsters)) {
    return {
      valid: false,
      errors: [
        {
          message:
            'Upload document must contain a "monsters" array',
        },
      ],
    };
  }

  if (document.monsters.length === 0) {
    return {
      valid: false,
      errors: [
        {
          message: 'The monsters array must contain at least one monster',
        },
      ],
    };
  }

  // Validate each monster
  for (let i = 0; i < document.monsters.length; i++) {
    const monsterResult = validateMonsterData(
      document.monsters[i] as RawMonsterData,
      i
    );
    if (!monsterResult.valid) {
      errors.push(...monsterResult.errors);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Transforms validated raw monster data into MonsterTemplate objects
 */
export function transformMonsterData(
  raw: RawMonsterData,
  userId: string
): MonsterTemplate {
  const now = new Date();

  return {
    id: generateUUID(),
    userId,
    name: (raw.name as string).trim(),
    size: (raw.size || 'medium') as ValidSize,
    type: (raw.type || 'humanoid') as string,
    alignment: raw.alignment ? (raw.alignment as string) : undefined,
    ac: (raw.ac || 10) as number,
    acNote: raw.acNote ? (raw.acNote as string) : undefined,
    hp: Math.min(
      (raw.hp || raw.maxHp || 1) as number,
      (raw.maxHp || 1) as number
    ),
    maxHp: (raw.maxHp || 1) as number,
    speed: (raw.speed || '') as string,
    abilityScores: raw.abilityScores
      ? (raw.abilityScores as AbilityScores)
      : {
          strength: 10,
          dexterity: 10,
          constitution: 10,
          intelligence: 10,
          wisdom: 10,
          charisma: 10,
        },
    savingThrows: (raw.savingThrows || {}) as Record<string, number>,
    skills: (raw.skills || {}) as Record<string, number>,
    damageResistances: (raw.damageResistances || []) as string[],
    damageImmunities: (raw.damageImmunities || []) as string[],
    damageVulnerabilities: (raw.damageVulnerabilities || []) as string[],
    conditionImmunities: (raw.conditionImmunities || []) as string[],
    senses: (raw.senses || {}) as Record<string, string>,
    languages: (raw.languages || []) as string[],
    traits: (raw.traits || []) as CreatureAbility[],
    actions: (raw.actions || []) as CreatureAbility[],
    bonusActions: (raw.bonusActions || []) as CreatureAbility[],
    reactions: (raw.reactions || []) as CreatureAbility[],
    lairActions: (raw.lairActions || []) as CreatureAbility[],
    legendaryActions: (raw.legendaryActions || []) as CreatureAbility[],
    challengeRating: (raw.challengeRating || 0) as number,
    experiencePoints: (raw.experiencePoints || 0) as number,
    description: raw.description ? (raw.description as string) : undefined,
    source: raw.source ? (raw.source as string) : undefined,
    isGlobal: false,
    createdAt: now,
    updatedAt: now,
  };
}
