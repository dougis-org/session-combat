import {
  MonsterTemplate,
  AbilityScores,
  CreatureAbility,
  DnDAlignment,
  normalizeAlignment,
} from '@/lib/types';
import { filterToDamageTypes } from '@/lib/constants';
import {
  rawMonsterSchema,
  type ParsedMonster,
  type ValidSize,
} from './monsterUploadSchema';

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
  console.warn(`transformMonsterData: unrecognised alignment "${raw}" dropped`);
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
