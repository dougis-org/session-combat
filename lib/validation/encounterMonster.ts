import { z } from 'zod';
import { VALID_SIZES, UPLOAD_LIMITS } from './monsterUploadSchema';
import type { Monster } from '@/lib/types';
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

const boundedRecord = <V extends z.ZodTypeAny>(value: V) =>
  z
    .record(z.string().max(UPLOAD_LIMITS.recordKey), value)
    .refine((v) => Object.keys(v).length <= UPLOAD_LIMITS.listLength, {
      message: `must have at most ${UPLOAD_LIMITS.listLength} entries`,
    });

const creatureAbilitySchema = z.object({
  name: z.string().trim().min(1).max(UPLOAD_LIMITS.abilityName),
  description: z.string().trim().max(UPLOAD_LIMITS.abilityText),
  // Persisted Monster/MonsterTemplate documents store unset optional fields as
  // explicit `null`, not an absent key — every optional field here must accept
  // both (`.nullish()`), not just `.optional()` (same rule as the top-level
  // encounterMonsterSchema below).
  attackBonus: z.number().nullish(),
  damageDescription: z.string().max(UPLOAD_LIMITS.abilityShort).nullish(),
  saveDC: z.number().nullish(),
  saveType: z.string().max(UPLOAD_LIMITS.abilityShort).nullish(),
  recharge: z.string().max(UPLOAD_LIMITS.abilityShort).nullish(),
  cost: z.number().nullish(),
  usesRemaining: z.number().nullish(),
});

const abilityArray = () =>
  z.array(creatureAbilitySchema).max(UPLOAD_LIMITS.listLength);

export const encounterMonsterSchema = z
  .object({
    id: z.string().trim().min(1).max(UPLOAD_LIMITS.name),
    userId: z.string().trim().min(1).max(UPLOAD_LIMITS.name).nullish(),
    templateId: z.string().trim().min(1).max(UPLOAD_LIMITS.name).nullish(),
    name: z.string().trim().min(1).max(UPLOAD_LIMITS.name),
    size: z.enum(VALID_SIZES, {
      error: () => `size must be one of: ${VALID_SIZES.join(', ')}`,
    }),
    type: z.string().trim().min(1).max(UPLOAD_LIMITS.shortText),
    // Matches upload validation's leniency (monsterUploadSchema's rawMonsterSchema):
    // free-form string, not a strict enum — real library/import data isn't reliably
    // title-cased ("lawful evil" vs "Lawful Evil") even though the Monster type
    // declares a literal union.
    alignment: shortString().nullish(),
    ac: z.number().int().min(0).max(30),
    // Persisted Monster/MonsterTemplate documents store unset optional fields as
    // explicit `null`, not an absent key — every optional field here must accept
    // both (`.nullish()`), not just `.optional()`.
    acNote: shortString().nullish(),
    // Optional: a freshly added monster instance (copied from a MonsterTemplate)
    // may not carry an explicit hp yet — defaults to maxHp below.
    hp: z.number().int().min(0).nullish(),
    maxHp: z.number().int().min(1),
    speed: z.string().trim().min(1).max(UPLOAD_LIMITS.shortText),
    abilityScores: abilityScoresSchema,
    savingThrows: boundedRecord(z.number()).nullish(),
    skills: boundedRecord(z.number()).nullish(),
    damageResistances: stringList().nullish(),
    damageImmunities: stringList().nullish(),
    damageVulnerabilities: stringList().nullish(),
    conditionImmunities: stringList().nullish(),
    senses: boundedRecord(z.string().max(UPLOAD_LIMITS.recordValue)).nullish(),
    languages: stringList().nullish(),
    communication: shortString().nullish(),
    challengeRating: z.number().min(0),
    experiencePoints: z.number().min(0).nullish(),
    description: z.string().max(UPLOAD_LIMITS.description).nullish(),
    source: shortString().nullish(),
    traits: abilityArray().nullish(),
    actions: abilityArray().nullish(),
    bonusActions: abilityArray().nullish(),
    reactions: abilityArray().nullish(),
    lairActions: abilityArray().nullish(),
    legendaryActions: abilityArray().nullish(),
    legendaryActionCount: z.number().int().min(0).nullish(),
    initiative: z.number().nullish(),
  })
  .superRefine((value, ctx) => {
    if (value.hp !== undefined && value.hp !== null && value.hp > value.maxHp) {
      ctx.addIssue({
        code: 'custom',
        path: ['hp'],
        message: 'hp must be less than or equal to maxHp',
      });
    }
  })
  .transform((value) => {
    // Drop every `null`/`undefined` optional field entirely (rather than
    // keeping the key with an `undefined` value) so the output matches
    // Monster's `field?: T` shape (an absent key, never `field: T | null`)
    // AND round-trips cleanly through MongoDB: the driver serializes an
    // explicit `undefined` value back to BSON `null` (no `ignoreUndefined`
    // option is set), which would otherwise re-introduce the exact
    // null-vs-absent ambiguity this schema exists to remove.
    const normalized = Object.fromEntries(
      Object.entries(value).filter(([, v]) => v !== null && v !== undefined)
    ) as typeof value;
    return { ...normalized, hp: normalized.hp ?? normalized.maxHp };
  });

export const encounterMonstersArraySchema = z
  .array(encounterMonsterSchema)
  .max(UPLOAD_LIMITS.maxMonsters);

export type EncounterMonster = z.infer<typeof encounterMonsterSchema>;

/** Validates an Encounter's full `monsters` array (may be empty). */
export function validateEncounterMonsters(
  data: unknown
): ({ valid: true; value: Monster[] } & ValidationResult) | ({ valid: false } & ValidationResult) {
  const parsed = encounterMonstersArraySchema.safeParse(data);
  if (parsed.success) {
    return { valid: true, value: parsed.data as unknown as Monster[], errors: [] };
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
