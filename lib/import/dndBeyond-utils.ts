import { AbilityScores } from "../types";

export class DndBeyondImportError extends Error {
  readonly status: number;
  readonly exposeMessage: boolean;

  constructor(
    message: string,
    options: { status: number; exposeMessage?: boolean } = { status: 400 },
  ) {
    super(message);
    this.name = "DndBeyondImportError";
    this.status = options.status;
    this.exposeMessage = options.exposeMessage ?? options.status < 500;
  }
}

export function createValidationError(message: string): DndBeyondImportError {
  return new DndBeyondImportError(message, { status: 400 });
}

export function isPresent<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined;
}

export function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export const ABILITY_ID_MAP: Record<number, keyof AbilityScores> = {
  1: "strength",
  2: "dexterity",
  3: "constitution",
  4: "intelligence",
  5: "wisdom",
  6: "charisma",
};

export const ABILITY_KEYS = Object.values(ABILITY_ID_MAP);

interface DndBeyondStatValue {
  id: number;
  value: number | null;
}

interface DndBeyondModifier {
  type?: "bonus" | "set" | "set-base" | "proficiency" | "expertise" | "language" | "resistance" | "immunity" | "vulnerability" | null;
  subType?: string | null;
  fixedValue?: number | null;
  value?: number | null;
  friendlySubtypeName?: string | null;
}

export function indexStatValues(
  stats: DndBeyondStatValue[] | null | undefined,
): Map<number, number> {
  return new Map(
    (stats || [])
      .filter(
        (stat): stat is DndBeyondStatValue & { value: number } =>
          typeof stat.value === "number",
      )
      .map((stat) => [stat.id, stat.value]),
  );
}

export function resolveAbilityScore(
  statId: number,
  ability: keyof AbilityScores,
  baseScores: Map<number, number>,
  bonusScores: Map<number, number>,
  overrideScores: Map<number, number>,
  scoreBonuses: Record<string, number>,
): number {
  const baseValue = baseScores.get(statId);

  if (typeof baseValue !== "number") {
    throw createValidationError(
      `The imported D&D Beyond character is missing ${ability} data.`,
    );
  }

  return (
    overrideScores.get(statId) ??
    baseValue +
      (bonusScores.get(statId) || 0) +
      (scoreBonuses[`${ability}-score`] || 0)
  );
}

export function isBonusLikeModifier(modifier: DndBeyondModifier): boolean {
  return modifier.type === "bonus" || modifier.type === "set-base";
}

export function getModifierNumericValue(modifier: DndBeyondModifier): number | null {
  return typeof modifier.value === "number"
    ? modifier.value
    : typeof modifier.fixedValue === "number"
      ? modifier.fixedValue
      : null;
}

export function sumModifierBonusesBySubtype(
  modifiers: DndBeyondModifier[],
): Record<string, number> {
  return modifiers.reduce<Record<string, number>>((accumulator, modifier) => {
    if (!isBonusLikeModifier(modifier) || !modifier.subType) {
      return accumulator;
    }

    const numericValue = getModifierNumericValue(modifier);
    if (typeof numericValue !== "number") {
      return accumulator;
    }

    accumulator[modifier.subType] =
      (accumulator[modifier.subType] || 0) + numericValue;
    return accumulator;
  }, {});
}