import { MonsterTemplate, DnDAlignment } from "@/lib/types";
import { Open5ECreature } from "./open5eAdapter";
import { GLOBAL_USER_ID } from "@/lib/constants";
import { v4 as uuidv4 } from "uuid";

function normalizeAlignment(
  alignment: string | undefined
): DnDAlignment | undefined {
  if (!alignment) return undefined;

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

  return alignmentMap[trimmed] || "Unaligned";
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

function normalizeSpeed(speed: Record<string, string | number> | string | number | undefined): string {
  if (!speed) return "30 ft.";
  if (typeof speed === "string") return speed;
  if (typeof speed === "number") return `${speed} ft.`;
  return Object.entries(speed)
    .map(([key, value]) => `${key} ${value}`)
    .join(", ");
}

export function transformMonster(
  raw: Open5ECreature
): { monster: MonsterTemplate; valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!raw.name) {
    errors.push("Missing required field: name");
  }

  if (!raw.type) {
    errors.push("Missing required field: type");
  }

  const monster: MonsterTemplate = {
    _id: undefined,
    id: uuidv4(),
    userId: GLOBAL_USER_ID,
    name: raw.name || "Unknown",
    size: mapSize(raw.size || "medium"),
    type: raw.type || "unknown",
    alignment: normalizeAlignment(raw.alignment),
    speed: normalizeSpeed(raw.speed),
    challengeRating: parseFloat(raw.challenge_rating) || 0,
    abilityScores: {
      strength: raw.strength || 10,
      dexterity: raw.dexterity || 10,
      constitution: raw.constitution || 10,
      intelligence: raw.intelligence || 10,
      wisdom: raw.wisdom || 10,
      charisma: raw.charisma || 10,
    },
    ac:
      raw.armor_class?.[0]?.ac ||
      10,
    acNote: raw.armor_class?.[0]?.note,
    hp: raw.hit_points || 1,
    maxHp: raw.hit_points || 1,
    isGlobal: true,
    source: "open5e",
    traits: (raw.special_abilities || []).map((ability) => ({
      name: ability.name,
      description: ability.desc,
    })),
    actions: (raw.actions || []).map((action) => ({
      name: action.name,
      description: action.desc,
    })),
    legendaryActions: (raw.legendary_actions || []).map((action) => ({
      name: action.name,
      description: action.desc,
    })),
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  return { monster, valid: errors.length === 0, errors };
}
