import { MonsterTemplate, DnDAlignment } from "@/lib/types";
import { Open5ECreature } from "./open5eAdapter";
import { GLOBAL_USER_ID } from "@/lib/constants";
import { randomUUID } from "crypto";

function normalizeAlignment(
  alignment: string | undefined
): DnDAlignment {
  if (!alignment) return "Unaligned";

  const trimmed = alignment.trim().toLowerCase();

  const alignmentMap: Record<string, DnDAlignment> = {
    "lawful good": "Lawful Good",
    "neutral good": "Neutral Good",
    "chaotic good": "Chaotic Good",
    "lawful neutral": "Lawful Neutral",
    neutral: "Neutral",
    "chaotic neutral": "Chaotic Neutral",
    "lawful evil": "Lawful Evil",
    "neutral evil": "Neutral Evil",
    "chaotic evil": "Chaotic Evil",
    unaligned: "Unaligned",
  };

  return alignmentMap[trimmed] ?? "Unaligned";
}

function mapSize(size: string): MonsterTemplate["size"] {
  const sizeMap: Record<string, MonsterTemplate["size"]> = {
    tiny: "tiny",
    small: "small",
    medium: "medium",
    large: "large",
    huge: "huge",
    gargantuan: "gargantuan",
  };
  return sizeMap[size.toLowerCase()] || "medium";
}

function parseChallengeRating(rating: unknown): number {
  if (typeof rating === "number") return rating;
  if (typeof rating === "string" && rating.includes("/")) {
    const [num, den] = rating.split("/").map(Number);
    return den > 0 ? num / den : 0;
  }
  return parseFloat(String(rating)) || 0;
}

function normalizeSpeed(speed: Open5ECreature["speed"]): string {
  if (!speed) return "30 ft.";
  const parts: string[] = [];
  if (speed.walk) parts.push(`walk ${speed.walk}`);
  if (speed.swim) parts.push(`swim ${speed.swim}`);
  if (speed.fly) parts.push(`fly ${speed.fly}`);
  return parts.length > 0 ? parts.join(", ") : "30 ft.";
}

export function transformMonster(
  raw: Open5ECreature
): { monster: MonsterTemplate; valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!raw.name) {
    errors.push("Missing required field: name");
  }

  if (!raw.type?.key) {
    errors.push("Missing required field: type");
  }

  const monster: MonsterTemplate = {
    _id: undefined,
    id: randomUUID(),
    userId: GLOBAL_USER_ID,
    name: raw.name || "Unknown",
    size: mapSize(raw.size?.key || "medium"),
    type: raw.type?.key || "unknown",
    alignment: normalizeAlignment(raw.alignment),
    speed: normalizeSpeed(raw.speed),
    challengeRating: parseChallengeRating(raw.challenge_rating),
    abilityScores: {
      strength: raw.ability_scores?.strength || 10,
      dexterity: raw.ability_scores?.dexterity || 10,
      constitution: raw.ability_scores?.constitution || 10,
      intelligence: raw.ability_scores?.intelligence || 10,
      wisdom: raw.ability_scores?.wisdom || 10,
      charisma: raw.ability_scores?.charisma || 10,
    },
    ac: raw.armor_class || 10,
    acNote: undefined,
    hp: raw.hit_points || 1,
    maxHp: raw.hit_points || 1,
    isGlobal: true,
    source: "open5e",
    traits: (raw.traits || []).map((ability) => ({
      name: ability.name,
      description: ability.desc,
    })),
    actions: (raw.actions || []).map((action) => ({
      name: action.name,
      description: action.desc,
    })),
    legendaryActions: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  return { monster, valid: errors.length === 0, errors };
}
