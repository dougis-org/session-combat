import type { AbilityScores } from "../types";

export interface ModifierLike {
  subType?: string | null;
  friendlySubtypeName?: string | null;
}

export function getAbilityModifier(score: number): number {
  return Math.floor((score - 10) / 2);
}

export function getProficiencyBonus(totalLevel: number): number {
  return 2 + Math.floor(Math.max(totalLevel - 1, 0) / 4);
}

export function dedupeStrings(values: string[]): string[] {
  return Array.from(new Set(values.filter(Boolean)));
}

export function titleize(value: string): string {
  return value
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (character) => character.toUpperCase())
    .trim();
}

export const DAMAGE_TYPE_NAMES = new Set([
  "acid",
  "bludgeoning",
  "cold",
  "fire",
  "force",
  "lightning",
  "necrotic",
  "piercing",
  "poison",
  "psychic",
  "radiant",
  "slashing",
  "thunder",
] as const);

export function normalizeModifierCategory(value: string): string {
  return value.toLowerCase().replace(/-/g, " ").trim();
}

export function isDamageTypeModifier(modifier: ModifierLike): boolean {
  type DamageType = typeof DAMAGE_TYPE_NAMES extends ReadonlySet<infer T> ? T : never;
  return [modifier.subType, modifier.friendlySubtypeName]
    .filter((value): value is string => typeof value === "string")
    .some((value) => DAMAGE_TYPE_NAMES.has(normalizeModifierCategory(value) as DamageType));
}

export function isPresent<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined;
}

export function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export const ABILITY_KEYS: ReadonlyArray<keyof AbilityScores> = [
  "strength",
  "dexterity",
  "constitution",
  "intelligence",
  "wisdom",
  "charisma",
] as const;