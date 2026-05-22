import { createValidationError } from "./dndBeyond-utils";
import type { DnDAlignment, DnDRace } from "../types";

const CANONICAL_HOST = "www.dndbeyond.com";
const CHARACTER_PATH_PATTERN = /^\/characters\/(\d+)(?:\/([A-Za-z0-9_-]+))?\/?$/;

const ALIGNMENT_ID_MAP: Partial<Record<number, DnDAlignment>> = {
  1: "Lawful Good",
  2: "Neutral Good",
  3: "Chaotic Good",
  4: "Lawful Neutral",
  5: "Neutral",
  6: "Chaotic Neutral",
  7: "Lawful Evil",
  8: "Neutral Evil",
  9: "Chaotic Evil",
};

interface CharacterIdentity {
  name: string;
  sourceCharacterId: string;
}

interface IdentityCharacterData {
  id?: number | string;
  name?: string | null;
  race?: { fullName?: string | null } | null;
  alignmentId?: number | null;
}

interface IdentityNormalizedDetails {
  race?: DnDRace;
  alignment?: DnDAlignment;
}

export interface ParsedDndBeyondCharacterUrl {
  characterId: string;
  shareCode?: string;
  normalizedUrl: string;
}

function parseUrlOrThrow(url: string): URL {
  try {
    return new URL(url.trim());
  } catch {
    throw createValidationError("Enter a valid D&D Beyond character URL.");
  }
}

function isSupportedDndBeyondHostname(hostname: string): boolean {
  const normalized = hostname.toLowerCase();
  return normalized === CANONICAL_HOST || normalized === "dndbeyond.com";
}

export function parseDndBeyondCharacterUrl(
  url: string,
): ParsedDndBeyondCharacterUrl {
  const parsed = parseUrlOrThrow(url);

  if (!isSupportedDndBeyondHostname(parsed.hostname)) {
    throw createValidationError(
      "Only canonical public D&D Beyond character URLs are supported.",
    );
  }

  const match = parsed.pathname.match(CHARACTER_PATH_PATTERN);
  if (!match) {
    throw createValidationError(
      "Use a publicly available D&D Beyond character URL.",
    );
  }

  const [, characterId, shareCode] = match;
  return {
    characterId,
    shareCode,
    normalizedUrl: shareCode
      ? `https://${CANONICAL_HOST}/characters/${characterId}/${shareCode}`
      : `https://${CANONICAL_HOST}/characters/${characterId}`,
  };
}

export function requireCharacterIdentity(
  data: IdentityCharacterData,
): CharacterIdentity {
  const sourceCharacterId = String(data.id ?? "");
  const name = data.name?.trim();

  if (!sourceCharacterId) {
    throw createValidationError(
      "The imported D&D Beyond character is missing an ID.",
    );
  }

  if (!name) {
    throw createValidationError(
      "The imported D&D Beyond character is missing a name.",
    );
  }

  return { name, sourceCharacterId };
}

export function buildNormalizationWarnings(
  data: IdentityCharacterData,
  details: IdentityNormalizedDetails,
): string[] {
  const warnings: string[] = [];

  if (!details.race && data.race?.fullName) {
    warnings.push(
      `Race "${data.race.fullName}" is not supported and was omitted.`,
    );
  }

  if (!details.alignment && typeof data.alignmentId === "number") {
    warnings.push("Alignment was not supported and was omitted.");
  }

  return warnings;
}

export function normalizeAlignmentId(
  alignmentId: number | null | undefined,
): DnDAlignment | undefined {
  if (typeof alignmentId !== "number") {
    return undefined;
  }

  return ALIGNMENT_ID_MAP[alignmentId];
}
