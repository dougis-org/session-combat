import { z } from 'zod';
import {
  CharacterClass,
  CharacterType,
  DnDAlignment,
  DnDRace,
  VALID_CLASSES,
  VALID_RACES,
  isValidCharacterType,
  isValidRace,
  normalizeAlignment,
  validateCharacterClasses,
} from '@/lib/types';
import { validateString } from '@/lib/validation/core';

/**
 * Bounded validators for character-persistence request bodies. Field-level
 * checks that already exist in the route handlers (name, race, alignment,
 * classes, characterType, gender — each with its own tailored error message)
 * are left as-is; these schemas cover the remaining CreatureStats fields that
 * previously passed straight from the request body into storage with no
 * validation at all. Bounds are resource-exhaustion backstops, not gameplay
 * limits, mirroring lib/validation/rollSubmission.ts.
 */

const MAX_ABILITY_SCORE = 999;
const MAX_HP = 9999;
const MAX_AC = 999;
const MAX_AC_NOTE_LENGTH = 200;
const MAX_ARRAY_LENGTH = 100;
const MAX_STRING_LENGTH = 500;
const MAX_DESCRIPTION_LENGTH = 4000;
const MAX_RECORD_ENTRIES = 100;
const MAX_URL_LENGTH = 2048;

const boundedNumber = z.number().finite().min(-MAX_ABILITY_SCORE).max(MAX_ABILITY_SCORE);
const boundedStringArray = z.array(z.string().max(MAX_STRING_LENGTH)).max(MAX_ARRAY_LENGTH);

/**
 * Wraps a field schema so it also accepts `null` and normalizes it to
 * `undefined`. Required because the MongoDB driver serializes an explicitly
 * `undefined` field as BSON null, so a previously-unset optional field (e.g.
 * `acNote`) round-trips through storage as `null`, not a missing key — a
 * character re-submitted unedited via PUT must not fail validation on that.
 */
function nullish<T extends z.ZodTypeAny>(schema: T) {
  return schema
    .nullable()
    .optional()
    .transform((value) => (value === null ? undefined : value));
}

function boundedRecord<T extends z.ZodTypeAny>(valueSchema: T) {
  return z
    .record(z.string().max(100), valueSchema)
    .refine((record) => Object.keys(record).length <= MAX_RECORD_ENTRIES, {
      message: `must have at most ${MAX_RECORD_ENTRIES} entries`,
    });
}

export const abilityScoresSchema = z.object({
  strength: boundedNumber,
  dexterity: boundedNumber,
  constitution: boundedNumber,
  intelligence: boundedNumber,
  wisdom: boundedNumber,
  charisma: boundedNumber,
});

const savingThrowsSchema = z.object({
  strength: boundedNumber.optional(),
  dexterity: boundedNumber.optional(),
  constitution: boundedNumber.optional(),
  intelligence: boundedNumber.optional(),
  wisdom: boundedNumber.optional(),
  charisma: boundedNumber.optional(),
});

const creatureAbilitySchema = z.object({
  name: z.string().trim().min(1).max(MAX_STRING_LENGTH),
  description: z.string().max(MAX_DESCRIPTION_LENGTH).nullable().transform((v) => v ?? ''),
  attackBonus: nullish(boundedNumber),
  damageDescription: nullish(z.string().max(MAX_STRING_LENGTH)),
  saveDC: nullish(z.number().finite().min(0).max(MAX_ABILITY_SCORE)),
  saveType: nullish(z.string().max(50)),
  recharge: nullish(z.string().max(50)),
  cost: nullish(z.number().finite().min(0).max(20)),
  usesRemaining: nullish(z.number().finite().min(0).max(MAX_ABILITY_SCORE)),
});

const abilityArraySchema = z.array(creatureAbilitySchema).max(MAX_ARRAY_LENGTH);

/** Covers every CreatureStats field a character route accepts but did not previously validate. */
export const creatureStatsBodySchema = z.object({
  hp: nullish(z.number().finite().min(-MAX_HP).max(MAX_HP)),
  maxHp: nullish(z.number().finite().min(0).max(MAX_HP)),
  ac: nullish(z.number().finite().min(0).max(MAX_AC)),
  acNote: nullish(z.string().max(MAX_AC_NOTE_LENGTH)),
  abilityScores: nullish(abilityScoresSchema),
  savingThrows: nullish(savingThrowsSchema),
  skills: nullish(boundedRecord(boundedNumber)),
  damageResistances: nullish(boundedStringArray),
  damageImmunities: nullish(boundedStringArray),
  damageVulnerabilities: nullish(boundedStringArray),
  conditionImmunities: nullish(boundedStringArray),
  senses: nullish(boundedRecord(z.string().max(MAX_STRING_LENGTH))),
  languages: nullish(boundedStringArray),
  traits: nullish(abilityArraySchema),
  actions: nullish(abilityArraySchema),
  bonusActions: nullish(abilityArraySchema),
  reactions: nullish(abilityArraySchema),
});

export type CreatureStatsBody = z.infer<typeof creatureStatsBodySchema>;

export type FieldValidationResult<T> =
  | { valid: true; value: T }
  | { valid: false; error: string };

/** Runs a zod schema and reduces its issues to a single route-friendly error string. */
export function validateWithSchema<T>(
  schema: z.ZodType<T>,
  body: unknown,
): FieldValidationResult<T> {
  const result = schema.safeParse(body);
  if (result.success) {
    return { valid: true, value: result.data };
  }
  const issue = result.error.issues[0];
  const path = issue.path.join('.');
  return {
    valid: false,
    error: path ? `${path}: ${issue.message}` : issue.message,
  };
}

export const characterImportRequestSchema = z.object({
  url: z.string().trim().min(1).max(MAX_URL_LENGTH),
  overwrite: z.boolean().optional(),
});

/** Reusable validator for a `:id` route param naming a character. */
export function validateCharacterId(value: unknown): FieldValidationResult<string> {
  const result = validateString(value, 'id', { required: true, minLength: 1 });
  if (!result.valid) {
    return { valid: false, error: result.error.message };
  }
  return { valid: true, value: result.value };
}

export interface CharacterFieldValidationFailure {
  status: number;
  body: { error: string; validRaces?: readonly string[]; validClasses?: readonly string[] };
}

type CharacterFieldParseResult<T> =
  | { valid: true; value: T }
  | { valid: false; failure: CharacterFieldValidationFailure };

interface CharacterCommonFields {
  race?: DnDRace;
  raceProvided: boolean;
  gender?: string;
  genderProvided: boolean;
  background?: string;
  backgroundProvided: boolean;
  alignment?: DnDAlignment;
  alignmentProvided: boolean;
  characterType?: CharacterType;
  stats: CreatureStatsBody;
}

function parseCommonFields(body: Record<string, unknown>): CharacterFieldParseResult<CharacterCommonFields> {
  const { characterType, gender, alignment, race, background } = body;

  if (characterType !== undefined && characterType !== null && !isValidCharacterType(characterType)) {
    return {
      valid: false,
      failure: {
        status: 400,
        body: { error: 'Invalid characterType. Must be one of: character, npc, companion' },
      },
    };
  }

  if (gender != null && (typeof gender !== 'string' || gender.trim().length > 50)) {
    return {
      valid: false,
      failure: { status: 400, body: { error: 'Gender must be a string of 50 characters or fewer' } },
    };
  }

  const normalizedAlignment = normalizeAlignment(alignment);
  if (alignment !== undefined && alignment !== null && alignment !== '' && !normalizedAlignment) {
    return { valid: false, failure: { status: 400, body: { error: 'Invalid alignment' } } };
  }

  if (race !== undefined && race !== null && race !== '' && !isValidRace(race)) {
    return {
      valid: false,
      failure: {
        status: 400,
        body: { error: 'Invalid race. Must be one of: ' + VALID_RACES.join(', '), validRaces: VALID_RACES },
      },
    };
  }

  if (background != null && (typeof background !== 'string' || background.length > MAX_STRING_LENGTH)) {
    return {
      valid: false,
      failure: { status: 400, body: { error: `background must be a string of ${MAX_STRING_LENGTH} characters or fewer` } },
    };
  }

  const statsValidation = validateWithSchema(creatureStatsBodySchema, {
    hp: body.hp, maxHp: body.maxHp, ac: body.ac, acNote: body.acNote,
    abilityScores: body.abilityScores, savingThrows: body.savingThrows, skills: body.skills,
    damageResistances: body.damageResistances, damageImmunities: body.damageImmunities,
    damageVulnerabilities: body.damageVulnerabilities, conditionImmunities: body.conditionImmunities,
    senses: body.senses, languages: body.languages, traits: body.traits, actions: body.actions,
    bonusActions: body.bonusActions, reactions: body.reactions,
  });
  if (!statsValidation.valid) {
    return { valid: false, failure: { status: 400, body: { error: statsValidation.error } } };
  }

  return {
    valid: true,
    value: {
      race: (race as DnDRace) || undefined,
      raceProvided: race !== undefined,
      gender: typeof gender === 'string' ? gender.trim() || undefined : undefined,
      genderProvided: gender !== undefined,
      background: typeof background === 'string' ? background || undefined : undefined,
      backgroundProvided: background !== undefined,
      alignment: normalizedAlignment,
      alignmentProvided: alignment !== undefined,
      characterType: characterType as CharacterType | undefined,
      stats: statsValidation.value,
    },
  };
}

export interface ParsedCharacterCreateBody extends CharacterCommonFields {
  name: string;
  classes: CharacterClass[];
}

function isPlainRequestBody(body: unknown): body is Record<string, unknown> {
  return body !== null && typeof body === 'object' && !Array.isArray(body);
}

/** Validates a full POST /api/characters body. Mirrors the route's prior inline checks verbatim (same error messages/shapes) so behavior is unchanged, just centralized and run before any storage access. */
export function parseCharacterCreateBody(body: unknown): CharacterFieldParseResult<ParsedCharacterCreateBody> {
  if (!isPlainRequestBody(body)) {
    return { valid: false, failure: { status: 400, body: { error: 'Character name is required' } } };
  }
  const bodyObj = body;
  const { name } = bodyObj;

  if (typeof name !== 'string' || name.trim() === '') {
    return { valid: false, failure: { status: 400, body: { error: 'Character name is required' } } };
  }

  const common = parseCommonFields(bodyObj);
  if (!common.valid) {
    return common;
  }

  let characterClasses: CharacterClass[] = [];
  if (bodyObj.classes !== undefined && bodyObj.classes !== null) {
    const validationResult = validateCharacterClasses(bodyObj.classes, { allowEmpty: true });
    if (!validationResult.valid) {
      return {
        valid: false,
        failure: { status: 400, body: { error: validationResult.error, validClasses: VALID_CLASSES } },
      };
    }
    if (Array.isArray(bodyObj.classes)) {
      characterClasses = (bodyObj.classes as CharacterClass[]).map((c) => ({ class: c.class, level: c.level }));
    }
  }
  if (characterClasses.length === 0) {
    characterClasses = [{ class: 'Fighter', level: 1 }];
  }

  return { valid: true, value: { ...common.value, name: name.trim(), classes: characterClasses } };
}

export interface ParsedCharacterUpdateBody extends CharacterCommonFields {
  name?: string;
  classes?: CharacterClass[];
}

/** Validates a full PUT /api/characters/[id] body. Mirrors the route's prior inline checks verbatim. All fields optional (partial update); `undefined` means "not provided, keep existing". */
export function parseCharacterUpdateBody(body: unknown): CharacterFieldParseResult<ParsedCharacterUpdateBody> {
  if (!isPlainRequestBody(body)) {
    return { valid: false, failure: { status: 400, body: { error: 'Request body must be a JSON object' } } };
  }
  const bodyObj = body;
  const { name } = bodyObj;

  if (name !== undefined && (typeof name !== 'string' || name.trim() === '')) {
    return { valid: false, failure: { status: 400, body: { error: 'Character name is required' } } };
  }

  const common = parseCommonFields(bodyObj);
  if (!common.valid) {
    return common;
  }

  let characterClasses: CharacterClass[] | undefined;
  if (bodyObj.classes !== undefined && bodyObj.classes !== null) {
    const validationResult = validateCharacterClasses(bodyObj.classes, { allowEmpty: false });
    if (!validationResult.valid) {
      return {
        valid: false,
        failure: { status: 400, body: { error: validationResult.error, validClasses: VALID_CLASSES } },
      };
    }
    characterClasses = (bodyObj.classes as CharacterClass[]).map((c) => ({ class: c.class, level: c.level }));
  }

  return {
    valid: true,
    value: {
      ...common.value,
      name: typeof name === 'string' ? name.trim() : undefined,
      classes: characterClasses,
    },
  };
}
