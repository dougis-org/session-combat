import { MonsterTemplate, AbilityScores, CreatureAbility, normalizeAlignment } from '@/lib/types';
import { filterToDamageTypes } from '@/lib/constants';
import {
  ValidationError,
  ValidationResult,
  validateString,
  validateNumber,
  validateStringArray,
  validateNumberRecord,
  validateStringRecord,
} from './core';
import { validateAbilityScores, validateAbilityArray } from './dnd';

export type { ValidationError, ValidationResult } from './core';

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
  legendaryActionCount?: unknown;
}

/**
 * Uploaded monster document format
 */
export interface MonsterUploadDocument {
  monsters?: unknown;
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
  const nameResult = validateString(data.name, `${prefix}.name`, { required: true, minLength: 1 });
  if (!nameResult.valid) errors.push({ ...nameResult.error, index });

  // Required: maxHp
  const maxHpResult = validateNumber(data.maxHp, `${prefix}.maxHp`, { required: true, min: 1 });
  if (!maxHpResult.valid) errors.push({ ...maxHpResult.error, index });

  // Optional: hp (type check only; cross-field check inline)
  if (data.hp !== undefined && data.hp !== null) {
    const hpResult = validateNumber(data.hp, `${prefix}.hp`);
    if (!hpResult.valid) {
      errors.push({ ...hpResult.error, index });
    } else if (typeof data.maxHp === 'number' && hpResult.value > data.maxHp) {
      errors.push({
        field: `${prefix}.hp`,
        message: 'hp must be less than or equal to maxHp',
        index,
      });
    }
  }

  // Optional: ac (valid range 0-30)
  const acResult = validateNumber(data.ac, `${prefix}.ac`, { min: 0, max: 30 });
  if (!acResult.valid) errors.push({ ...acResult.error, index });

  // Optional: size (enum check inline — no helper for enum validation)
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
  const typeResult = validateString(data.type, `${prefix}.type`, { minLength: 1 });
  if (!typeResult.valid) errors.push({ ...typeResult.error, index });

  // Optional: challengeRating
  const crResult = validateNumber(data.challengeRating, `${prefix}.challengeRating`, { min: 0 });
  if (!crResult.valid) errors.push({ ...crResult.error, index });

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

  // Optional: legendaryActionCount (non-negative integer)
  if (data.legendaryActionCount !== undefined) {
    const lac = data.legendaryActionCount;
    if (typeof lac !== 'number' || !Number.isFinite(lac) || lac < 0 || !Number.isInteger(lac)) {
      errors.push({
        field: `${prefix}.legendaryActionCount`,
        message: `legendaryActionCount must be a non-negative integer, got: ${String(lac)}`,
        index,
      });
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
    id: crypto.randomUUID(),
    userId,
    name: (raw.name as string).trim(),
    size: (raw.size || 'medium') as ValidSize,
    type: (raw.type || 'humanoid') as string,
    alignment: (() => {
      if (
        raw.alignment === undefined ||
        raw.alignment === null ||
        raw.alignment === ''
      ) {
        return undefined;
      }

      const normalizedAlignment = normalizeAlignment(raw.alignment);
      if (normalizedAlignment) {
        return normalizedAlignment;
      }

      console.warn(
        `transformMonsterData: unrecognised alignment "${raw.alignment}" dropped`,
      );
      return undefined;
    })(),
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
    damageResistances: filterToDamageTypes((raw.damageResistances || []) as unknown[]),
    damageImmunities: filterToDamageTypes((raw.damageImmunities || []) as unknown[]),
    damageVulnerabilities: filterToDamageTypes((raw.damageVulnerabilities || []) as unknown[]),
    conditionImmunities: (raw.conditionImmunities || []) as string[],
    senses: (raw.senses || {}) as Record<string, string>,
    languages: (raw.languages || []) as string[],
    traits: (raw.traits || []) as CreatureAbility[],
    actions: (raw.actions || []) as CreatureAbility[],
    bonusActions: (raw.bonusActions || []) as CreatureAbility[],
    reactions: (raw.reactions || []) as CreatureAbility[],
    lairActions: (raw.lairActions || []) as CreatureAbility[],
    legendaryActions: (raw.legendaryActions || []) as CreatureAbility[],
    legendaryActionCount:
      typeof raw.legendaryActionCount === 'number' &&
      Number.isFinite(raw.legendaryActionCount) &&
      Number.isInteger(raw.legendaryActionCount)
        ? (raw.legendaryActionCount as number)
        : undefined,
    challengeRating: (raw.challengeRating || 0) as number,
    experiencePoints: (raw.experiencePoints || 0) as number,
    description: raw.description ? (raw.description as string) : undefined,
    source: raw.source ? (raw.source as string) : undefined,
    isGlobal: false,
    createdAt: now,
    updatedAt: now,
  };
}
