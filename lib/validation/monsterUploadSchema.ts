import { z } from 'zod';
import type { ValidationError, ValidationResult } from './core';

/**
 * Valid monster sizes in D&D 5e.
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
 * Field-appropriate maximum lengths / cardinalities for user-controlled input.
 * Shared so the generated structure document, validation, and DoS bounds all
 * agree.
 */
export const UPLOAD_LIMITS = {
  name: 200,
  shortText: 200, // type, speed, alignment, acNote, source
  description: 5000,
  abilityName: 200,
  abilityText: 2000,
  abilityShort: 100,
  listItem: 120, // language / condition / damage-type strings
  listLength: 500, // max entries in any collection field (arrays and records)
  recordKey: 100,
  recordValue: 200,
  maxMonsters: 1000, // max monsters accepted in a single upload document
} as const;

const shortString = () => z.string().trim().max(UPLOAD_LIMITS.shortText);
const stringList = () =>
  z.array(z.string().max(UPLOAD_LIMITS.listItem)).max(UPLOAD_LIMITS.listLength);

const boundedRecord = <V extends z.ZodTypeAny>(value: V) =>
  z
    .record(z.string().max(UPLOAD_LIMITS.recordKey), value)
    .refine((v) => Object.keys(v).length <= UPLOAD_LIMITS.listLength, {
      message: `must have at most ${UPLOAD_LIMITS.listLength} entries`,
    });

const abilityScoreSchema = z.number().int().min(1).max(30);

const abilityScoresSchema = z.object({
  strength: abilityScoreSchema,
  dexterity: abilityScoreSchema,
  constitution: abilityScoreSchema,
  intelligence: abilityScoreSchema,
  wisdom: abilityScoreSchema,
  charisma: abilityScoreSchema,
});

const creatureAbilitySchema = z.object({
  name: z.string().trim().min(1).max(UPLOAD_LIMITS.abilityName),
  description: z.string().trim().min(1).max(UPLOAD_LIMITS.abilityText),
  attackBonus: z.number().optional(),
  damageDescription: z.string().max(UPLOAD_LIMITS.abilityShort).optional(),
  saveDC: z.number().optional(),
  saveType: z.string().max(UPLOAD_LIMITS.abilityShort).optional(),
  recharge: z.string().max(UPLOAD_LIMITS.abilityShort).optional(),
  cost: z.number().optional(),
  usesRemaining: z.number().optional(),
});

const abilityArray = () =>
  z.array(creatureAbilitySchema).max(UPLOAD_LIMITS.listLength);

/**
 * Single-source-of-truth schema for one uploadable monster.
 *
 * Unknown keys are stripped (Zod default). Calculated fields such as
 * `experiencePoints` are intentionally absent so the structure document
 * generated from this schema lists exactly what the importer accepts.
 */
export const rawMonsterSchema = z
  .object({
    name: z.string().trim().min(1).max(UPLOAD_LIMITS.name),
    size: z.enum(VALID_SIZES, {
      error: () => `size must be one of: ${VALID_SIZES.join(', ')}`,
    }),
    type: z.string().trim().min(1).max(UPLOAD_LIMITS.shortText),
    alignment: shortString().optional(),
    ac: z.number().int().min(0).max(30),
    acNote: shortString().optional(),
    hp: z.number().int().min(1).optional(),
    maxHp: z.number().int().min(1),
    speed: z.string().trim().min(1).max(UPLOAD_LIMITS.shortText),
    abilityScores: abilityScoresSchema,
    savingThrows: boundedRecord(z.number()).optional(),
    skills: boundedRecord(z.number()).optional(),
    damageResistances: stringList().optional(),
    damageImmunities: stringList().optional(),
    damageVulnerabilities: stringList().optional(),
    conditionImmunities: stringList().optional(),
    senses: boundedRecord(z.string().max(UPLOAD_LIMITS.recordValue)).optional(),
    languages: stringList().optional(),
    challengeRating: z.number().min(0),
    description: z.string().max(UPLOAD_LIMITS.description).optional(),
    source: shortString().optional(),
    traits: abilityArray().optional(),
    actions: abilityArray().optional(),
    bonusActions: abilityArray().optional(),
    reactions: abilityArray().optional(),
    lairActions: abilityArray().optional(),
    legendaryActions: abilityArray().optional(),
    legendaryActionCount: z.number().int().min(0).optional(),
  })
  .superRefine((value, ctx) => {
    if (value.hp !== undefined && value.hp > value.maxHp) {
      ctx.addIssue({
        code: 'custom',
        path: ['hp'],
        message: 'hp must be less than or equal to maxHp',
      });
    }
  });

/** Parsed + defaulted monster shape (Zod output). */
export type ParsedMonster = z.infer<typeof rawMonsterSchema>;

/** Raw monster data from JSON upload (schema input — before defaults). */
export type RawMonsterData = z.input<typeof rawMonsterSchema>;

/**
 * The array of monsters — at least one, at most `UPLOAD_LIMITS.maxMonsters`.
 * The upper bound protects the validation and ingestion boundary from an
 * oversized document even when it fits under the 5 MB file cap.
 */
export const monstersArraySchema = z
  .array(rawMonsterSchema)
  .min(1, 'The monsters array must contain at least one monster')
  .max(
    UPLOAD_LIMITS.maxMonsters,
    `The monsters array must contain at most ${UPLOAD_LIMITS.maxMonsters} monsters`,
  );

/** Uploaded monster document format — a bare array or `{ monsters: [...] }`. */
export interface MonsterUploadDocument {
  monsters?: unknown;
}

function formatIssuePath(path: PropertyKey[]): {
  field?: string;
  index?: number;
} {
  if (path.length === 0) return {};
  const [first, ...rest] = path;
  const index = typeof first === 'number' ? first : undefined;
  let field = `monsters[${String(first)}]`;
  for (const segment of rest) {
    field +=
      typeof segment === 'number' ? `[${segment}]` : `.${String(segment)}`;
  }
  return { field, index };
}

function issuesToErrors(
  issues: z.core.$ZodIssue[],
  basePath: PropertyKey[] = [],
): ValidationError[] {
  return issues.map((issue) => {
    const { field, index } = formatIssuePath([...basePath, ...issue.path]);
    const error: ValidationError = { message: issue.message };
    if (field !== undefined) error.field = field;
    if (index !== undefined) error.index = index;
    return error;
  });
}

function extractMonstersArray(
  document: unknown,
): { ok: true; monsters: unknown[] } | { ok: false; result: ValidationResult } {
  const candidate = Array.isArray(document)
    ? document
    : document && typeof document === 'object'
      ? (document as MonsterUploadDocument).monsters
      : undefined;

  if (!Array.isArray(candidate)) {
    return {
      ok: false,
      result: {
        valid: false,
        errors: [
          {
            message:
              'Upload document must be an array of monsters or contain a "monsters" array',
          },
        ],
      },
    };
  }

  return { ok: true, monsters: candidate };
}

/**
 * Validates a single monster from raw JSON data. Stable public export; the
 * `index` only shapes `monsters[index].field` error paths.
 */
export function validateMonsterData(
  data: unknown,
  index: number = 0,
): ValidationResult {
  const result = rawMonsterSchema.safeParse(data);
  if (result.success) {
    return { valid: true, errors: [] };
  }
  return {
    valid: false,
    errors: issuesToErrors(result.error.issues, [index]),
  };
}

/** Validates an entire monster upload document (bare array or `{ monsters }`). */
export function validateMonsterUploadDocument(
  document: unknown,
): ValidationResult {
  const extracted = extractMonstersArray(document);
  if (!extracted.ok) {
    return extracted.result;
  }

  const parsed = monstersArraySchema.safeParse(extracted.monsters);
  if (parsed.success) {
    return { valid: true, errors: [] };
  }

  return {
    valid: false,
    errors: issuesToErrors(parsed.error.issues),
  };
}
