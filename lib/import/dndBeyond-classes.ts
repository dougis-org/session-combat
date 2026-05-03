import { DnDClass, DnDRace, VALID_CLASSES, VALID_RACES, CharacterClass } from "../types";
import { isPresent, createValidationError, escapeRegExp } from "./dndBeyond-utils";

interface DndBeyondClassEntry {
  level?: number | null;
  definition?: {
    name?: string | null;
  } | null;
}

export function normalizeClasses(
  classes: DndBeyondClassEntry[] | null | undefined,
  warnings: string[],
): CharacterClass[] {
  const merged = (classes || [])
    .map((entry) => normalizeClassEntry(entry, warnings))
    .filter(isPresent)
    .reduce((classLevels, entry) => {
      classLevels.set(
        entry.className,
        (classLevels.get(entry.className) || 0) + entry.level,
      );
      return classLevels;
    }, new Map<DnDClass, number>());

  const normalized = Array.from(merged.entries()).map(([className, level]) => ({
    class: className,
    level,
  }));

  if (normalized.length === 0) {
    throw createValidationError(
      "The imported D&D Beyond character did not include any supported classes.",
    );
  }

  return normalized;
}

export function normalizeClassEntry(
  entry: DndBeyondClassEntry,
  warnings: string[],
): { className: DnDClass; level: number } | null {
  const className = entry.definition?.name?.trim();

  if (!className) {
    return null;
  }

  if (!VALID_CLASSES.includes(className as DnDClass)) {
    warnings.push(`Class "${className}" is not supported and was omitted.`);
    return null;
  }

  return {
    className: className as DnDClass,
    level: Math.max(1, Math.trunc(entry.level || 0)),
  };
}

export function normalizeRace(
  raceName: string | null | undefined,
  warnings?: string[],
): DnDRace | undefined {
  if (!raceName) {
    return undefined;
  }

  const trimmedRaceName = raceName.trim();

  // 1. Exact match
  if (VALID_RACES.includes(trimmedRaceName as DnDRace)) {
    return trimmedRaceName as DnDRace;
  }

  // 2. Case-insensitive match
  const lowerRaceName = trimmedRaceName.toLowerCase();
  const caseInsensitiveMatch = VALID_RACES.find(
    (race) => race.toLowerCase() === lowerRaceName,
  );

  if (caseInsensitiveMatch) {
    return caseInsensitiveMatch;
  }

  // 3. Substring fallback to supported races
  // We sort by length descending to ensure more specific names (like "Half-Elf")
  // are matched before base names (like "Elf").
  const substringMatch = [...VALID_RACES]
    .sort((a, b) => b.length - a.length)
    .find((race) => new RegExp(`\\b${escapeRegExp(race)}\\b`, "i").test(trimmedRaceName));

  if (substringMatch) {
    if (warnings) {
      warnings.push(
        `Race "${trimmedRaceName}" was normalized to "${substringMatch}".`,
      );
    }
    return substringMatch;
  }

  return undefined;
}