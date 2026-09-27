import { z } from 'zod';
import { VALID_SIZES, UPLOAD_LIMITS } from './monsterUploadSchema';
import { VALID_ALIGNMENTS } from '@/lib/types';
import { DAMAGE_TYPES } from '@/lib/constants';
import type { ValidationResult } from './core';

/**
 * Validates monster instances embedded directly in an Encounter document
 * (as opposed to a MonsterTemplate/upload document — see monsterUploadSchema.ts).
 * Encounter monsters carry an `id` and mandatory combat-state fields (hp/maxHp)
 * that raw upload data does not.
 */

const abilityScoreSchema = z.number().int().min(1).max(30);

const abilityScoresSchema = z.object({
  strength: abilityScoreSchema,
  dexterity: abilityScoreSchema,
  constitution: abilityScoreSchema,
  intelligence: abilityScoreSchema,
  wisdom: abilityScoreSchema,
  charisma: abilityScoreSchema,
});

const shortString = () => z.string().trim().max(UPLOAD_LIMITS.shortText);
const stringList = () =>
  z.array(z.string().max(UPLOAD_LIMITS.listItem)).max(UPLOAD_LIMITS.listLength);
const damageTypeList = () => z.array(z.enum(DAMAGE_TYPES)).max(UPLOAD_LIMITS.listLength);

const boundedRecord = <V extends z.ZodTypeAny>(value: V) =>
  z
    .record(z.string().max(UPLOAD_LIMITS.recordKey), value)
    .refine((v) => Object.keys(v).length <= UPLOAD_LIMITS.listLength, {
      message: `must have at most ${UPLOAD_LIMITS.listLength} entries`,
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

export const encounterMonsterSchema = z
  .object({
    id: z.string().trim().min(1).max(UPLOAD_LIMITS.name),
    userId: z.string().trim().min(1).max(UPLOAD_LIMITS.name).optional(),
    templateId: z.string().trim().min(1).max(UPLOAD_LIMITS.name).optional(),
    name: z.string().trim().min(1).max(UPLOAD_LIMITS.name),
    size: z.enum(VALID_SIZES, {
      error: () => `size must be one of: ${VALID_SIZES.join(', ')}`,
    }),
    type: z.string().trim().min(1).max(UPLOAD_LIMITS.shortText),
    alignment: z.enum(VALID_ALIGNMENTS).optional(),
    ac: z.number().int().min(0).max(30),
    acNote: shortString().optional(),
    hp: z.number().int().min(0),
    maxHp: z.number().int().min(1),
    speed: z.string().trim().min(1).max(UPLOAD_LIMITS.shortText),
    abilityScores: abilityScoresSchema,
    savingThrows: boundedRecord(z.number()).optional(),
    skills: boundedRecord(z.number()).optional(),
    damageResistances: damageTypeList().optional(),
    damageImmunities: damageTypeList().optional(),
    damageVulnerabilities: damageTypeList().optional(),
    conditionImmunities: stringList().optional(),
    senses: boundedRecord(z.string().max(UPLOAD_LIMITS.recordValue)).optional(),
    languages: stringList().optional(),
    communication: shortString().optional(),
    challengeRating: z.number().min(0),
    experiencePoints: z.number().min(0).optional(),
    description: z.string().max(UPLOAD_LIMITS.description).optional(),
    source: shortString().optional(),
    traits: abilityArray().optional(),
    actions: abilityArray().optional(),
    bonusActions: abilityArray().optional(),
    reactions: abilityArray().optional(),
    lairActions: abilityArray().optional(),
    legendaryActions: abilityArray().optional(),
    legendaryActionCount: z.number().int().min(0).optional(),
    initiative: z.number().optional(),
  })
  .superRefine((value, ctx) => {
    if (value.hp > value.maxHp) {
      ctx.addIssue({
        code: 'custom',
        path: ['hp'],
        message: 'hp must be less than or equal to maxHp',
      });
    }
  });

export const encounterMonstersArraySchema = z
  .array(encounterMonsterSchema)
  .max(UPLOAD_LIMITS.maxMonsters);

export type EncounterMonster = z.infer<typeof encounterMonsterSchema>;

/** Validates an Encounter's full `monsters` array (may be empty). */
export function validateEncounterMonsters(
  data: unknown
): ({ valid: true; value: EncounterMonster[] } & ValidationResult) | ({ valid: false } & ValidationResult) {
  const parsed = encounterMonstersArraySchema.safeParse(data);
  if (parsed.success) {
    return { valid: true, value: parsed.data, errors: [] };
  }
  return {
    valid: false,
    errors: parsed.error.issues.map((issue) => {
      const [index, ...rest] = issue.path;
      let field = `monsters[${String(index)}]`;
      for (const segment of rest) {
        field += typeof segment === 'number' ? `[${segment}]` : `.${String(segment)}`;
      }
      return {
        field,
        index: typeof index === 'number' ? index : undefined,
        message: issue.message,
      };
    }),
  };
}
