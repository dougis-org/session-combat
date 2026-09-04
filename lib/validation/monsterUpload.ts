import { z } from 'zod';
import {
  MonsterTemplate,
  AbilityScores,
  CreatureAbility,
  DnDAlignment,
  normalizeAlignment,
} from '@/lib/types';
import { filterToDamageTypes } from '@/lib/constants';
import type { ValidationError, ValidationResult } from './core';

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
 * Field-appropriate maximum lengths for user-controlled strings. Shared so the
 * generated structure document stays consistent with what validation enforces.
 */
export const UPLOAD_LIMITS = {
  name: 200,
  shortText: 200, // type, speed, alignment, acNote, source
  description: 5000,
  abilityName: 200,
  abilityText: 2000,
  abilityShort: 100,
  listItem: 120, // language / condition / damage-type strings
  listLength: 500, // max entries in any collection field
  recordKey: 100,
  recordValue: 200,
} as const;

const shortString = () => z.string().max(UPLOAD_LIMITS.shortText);
const listItemString = () => z.string().max(UPLOAD_LIMITS.listItem);
const stringList = () =>
  z.array(listItemString()).max(UPLOAD_LIMITS.listLength);
const abilityArray = () =>
  z.array(creatureAbilitySchema).max(UPLOAD_LIMITS.listLength);

const abilityScoreSchema = z
  .number()
  .int()
  .min(1)
  .max(30);

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

/**
 * Single-source-of-truth schema for one uploadable monster.
 *
 * Unknown keys are stripped (Zod's default object behavior). Calculated fields
 * such as `experiencePoints` are intentionally absent so the structure document
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
    savingThrows: z
      .record(z.string().max(UPLOAD_LIMITS.recordKey), z.number())
      .optional(),
    skills: z
      .record(z.string().max(UPLOAD_LIMITS.recordKey), z.number())
      .optional(),
    damageResistances: stringList().optional(),
    damageImmunities: stringList().optional(),
    damageVulnerabilities: stringList().optional(),
    conditionImmunities: stringList().optional(),
    senses: z
      .record(
        z.string().max(UPLOAD_LIMITS.recordKey),
        z.string().max(UPLOAD_LIMITS.recordValue),
      )
      .optional(),
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

/**
 * Parsed + defaulted monster shape (Zod output).
 */
export type ParsedMonster = z.infer<typeof rawMonsterSchema>;

/**
 * Raw monster data from JSON upload (schema input — before defaults).
 */
export type RawMonsterData = z.input<typeof rawMonsterSchema>;

/**
 * The array of monsters, requiring at least one entry.
 */
export const monstersArraySchema = z
  .array(rawMonsterSchema)
  .min(1, 'The monsters array must contain at least one monster');

/**
 * Uploaded monster document format — a bare array or `{ monsters: [...] }`.
 */
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

/**
 * Normalize an upload document to a bare monsters array, or return an error
 * result describing why it is not a valid document shape.
 */
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
 * Validates a single monster from raw JSON data.
 *
 * Kept as a stable public export; delegates to {@link rawMonsterSchema}. The
 * `index` is used only to build `monsters[index].field` error paths.
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

/**
 * Validates an entire monster upload document (bare array or `{ monsters }`).
 */
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

function normalizeUploadAlignment(
  raw: string | undefined,
): DnDAlignment | undefined {
  if (raw === undefined || raw === null || raw === '') {
    return undefined;
  }
  const normalized = normalizeAlignment(raw);
  if (normalized) {
    return normalized;
  }
  console.warn(
    `transformMonsterData: unrecognised alignment "${raw}" dropped`,
  );
  return undefined;
}

export interface TransformOptions {
  userId: string;
  isGlobal: boolean;
}

/**
 * Transforms validated raw monster data into a MonsterTemplate.
 *
 * Parses through {@link rawMonsterSchema} first (idempotent) so defaults such as
 * `hp = maxHp` are applied consistently regardless of caller.
 */
export function transformMonsterData(
  raw: unknown,
  options: TransformOptions,
): MonsterTemplate {
  const parsed: ParsedMonster = rawMonsterSchema.parse(raw);
  const now = new Date();
  const maxHp = parsed.maxHp;
  const hp = Math.min(parsed.hp ?? maxHp, maxHp);

  return {
    id: crypto.randomUUID(),
    userId: options.userId,
    name: parsed.name.trim(),
    size: parsed.size as ValidSize,
    type: parsed.type,
    alignment: normalizeUploadAlignment(parsed.alignment),
    ac: parsed.ac,
    acNote: parsed.acNote || undefined,
    hp,
    maxHp,
    speed: parsed.speed,
    abilityScores: parsed.abilityScores as AbilityScores,
    savingThrows: (parsed.savingThrows || {}) as Record<string, number>,
    skills: (parsed.skills || {}) as Record<string, number>,
    damageResistances: filterToDamageTypes(parsed.damageResistances || []),
    damageImmunities: filterToDamageTypes(parsed.damageImmunities || []),
    damageVulnerabilities: filterToDamageTypes(
      parsed.damageVulnerabilities || [],
    ),
    conditionImmunities: (parsed.conditionImmunities || []) as string[],
    senses: (parsed.senses || {}) as Record<string, string>,
    languages: (parsed.languages || []) as string[],
    traits: (parsed.traits || []) as CreatureAbility[],
    actions: (parsed.actions || []) as CreatureAbility[],
    bonusActions: (parsed.bonusActions || []) as CreatureAbility[],
    reactions: (parsed.reactions || []) as CreatureAbility[],
    lairActions: (parsed.lairActions || []) as CreatureAbility[],
    legendaryActions: (parsed.legendaryActions || []) as CreatureAbility[],
    legendaryActionCount: parsed.legendaryActionCount,
    challengeRating: parsed.challengeRating,
    description: parsed.description || undefined,
    source: parsed.source || undefined,
    isGlobal: options.isGlobal,
    createdAt: now,
    updatedAt: now,
  };
}

/**
 * A plain-data description of one field the importer accepts, used to render
 * the modal's field table and generate the downloadable example.
 */
export interface FieldDescriptor {
  name: string;
  type: string;
  required: boolean;
  description: string;
}

/**
 * Describes every field the upload schema accepts. Calculated fields
 * (e.g. experience points) are intentionally excluded.
 */
export function describeMonsterUploadSchema(): FieldDescriptor[] {
  return [
    { name: 'name', type: 'string', required: true, description: 'Monster name (1–200 characters).' },
    { name: 'size', type: `enum (${VALID_SIZES.join(' | ')})`, required: true, description: 'Creature size category.' },
    { name: 'type', type: 'string', required: true, description: 'Creature type, e.g. "humanoid", "dragon".' },
    { name: 'alignment', type: 'string', required: false, description: 'Alignment, e.g. "Chaotic Evil". Unrecognized values are dropped.' },
    { name: 'ac', type: 'integer (0–30)', required: true, description: 'Armor class.' },
    { name: 'acNote', type: 'string', required: false, description: 'Note about the AC source, e.g. "natural armor".' },
    { name: 'hp', type: 'integer (≥ 1)', required: false, description: 'Current hit points. Defaults to maxHp; must be ≤ maxHp.' },
    { name: 'maxHp', type: 'integer (≥ 1)', required: true, description: 'Maximum hit points.' },
    { name: 'speed', type: 'string', required: true, description: 'Speed description, e.g. "30 ft., fly 60 ft.".' },
    { name: 'abilityScores', type: 'object (strength, dexterity, constitution, intelligence, wisdom, charisma; each integer 1–30)', required: true, description: 'All six ability scores.' },
    { name: 'savingThrows', type: 'object (string → number)', required: false, description: 'Saving throw bonuses keyed by ability.' },
    { name: 'skills', type: 'object (string → number)', required: false, description: 'Skill bonuses keyed by skill name.' },
    { name: 'damageResistances', type: 'string[]', required: false, description: 'Damage types resisted; unknown types are filtered out.' },
    { name: 'damageImmunities', type: 'string[]', required: false, description: 'Damage types the monster is immune to.' },
    { name: 'damageVulnerabilities', type: 'string[]', required: false, description: 'Damage types the monster is vulnerable to.' },
    { name: 'conditionImmunities', type: 'string[]', required: false, description: 'Conditions the monster is immune to.' },
    { name: 'senses', type: 'object (string → string)', required: false, description: 'Senses, e.g. { "darkvision": "60 ft." }.' },
    { name: 'languages', type: 'string[]', required: false, description: 'Languages the monster knows.' },
    { name: 'challengeRating', type: 'number (≥ 0)', required: true, description: 'Challenge rating.' },
    { name: 'description', type: 'string', required: false, description: 'Freeform lore or notes.' },
    { name: 'source', type: 'string', required: false, description: 'Sourcebook name; used with name for duplicate detection.' },
    { name: 'traits', type: 'CreatureAbility[]', required: false, description: 'Passive traits ({ name, description, ... }).' },
    { name: 'actions', type: 'CreatureAbility[]', required: false, description: 'Actions the monster can take.' },
    { name: 'bonusActions', type: 'CreatureAbility[]', required: false, description: 'Bonus actions.' },
    { name: 'reactions', type: 'CreatureAbility[]', required: false, description: 'Reactions.' },
    { name: 'lairActions', type: 'CreatureAbility[]', required: false, description: 'Lair actions.' },
    { name: 'legendaryActions', type: 'CreatureAbility[]', required: false, description: 'Legendary actions.' },
    { name: 'legendaryActionCount', type: 'integer (≥ 0)', required: false, description: 'Legendary action pool size.' },
  ];
}

/**
 * A one-monster array populated with every field, used as the downloadable
 * template. Passes {@link validateMonsterUploadDocument} unchanged.
 */
export function buildMonsterImportExample(): unknown[] {
  return [
    {
      name: 'Example Dire Wolf',
      size: 'large',
      type: 'beast',
      alignment: 'Unaligned',
      ac: 14,
      acNote: 'natural armor',
      hp: 37,
      maxHp: 37,
      speed: '50 ft.',
      abilityScores: {
        strength: 17,
        dexterity: 15,
        constitution: 15,
        intelligence: 3,
        wisdom: 12,
        charisma: 7,
      },
      savingThrows: { wisdom: 1 },
      skills: { perception: 3, stealth: 4 },
      damageResistances: ['cold'],
      damageImmunities: [],
      damageVulnerabilities: ['fire'],
      conditionImmunities: ['frightened'],
      senses: { 'passive Perception': '13' },
      languages: [],
      challengeRating: 1,
      description: 'A representative example monster with every field populated.',
      source: 'Import Template',
      traits: [
        {
          name: 'Pack Tactics',
          description:
            'The wolf has advantage on attack rolls against a creature if at least one of the wolf’s allies is within 5 feet of the creature and the ally isn’t incapacitated.',
        },
      ],
      actions: [
        {
          name: 'Bite',
          description: 'Melee Weapon Attack: 2d6 + 3 piercing damage.',
          attackBonus: 5,
          damageDescription: '2d6 + 3 piercing',
        },
      ],
      bonusActions: [],
      reactions: [],
      lairActions: [],
      legendaryActions: [],
      legendaryActionCount: 0,
    },
  ];
}
