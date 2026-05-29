import { SpellTemplate, DnDSpellSchool } from "@/lib/types";
import { Open5ESpell } from "./open5eAdapter";
import { GLOBAL_USER_ID } from "@/lib/constants";
import { randomUUID } from "node:crypto";

const SCHOOL_MAP: Record<string, DnDSpellSchool> = {
  abjuration: "Abjuration",
  conjuration: "Conjuration",
  divination: "Divination",
  enchantment: "Enchantment",
  evocation: "Evocation",
  illusion: "Illusion",
  necromancy: "Necromancy",
  transmutation: "Transmutation",
};

function mapSchool(school: { key?: string } | string | undefined): DnDSpellSchool {
  if (!school) return "Evocation";
  const key = typeof school === "string" ? school.toLowerCase() : school.key?.toLowerCase();
  return (key && SCHOOL_MAP[key]) || "Evocation";
}

export function transformSpell(
  raw: Open5ESpell
): { spell: SpellTemplate; valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!raw.name) {
    errors.push("Missing required field: name");
  }

  if (raw.level === undefined || raw.level === null) {
    errors.push("Missing required field: level");
  }

  const spell: SpellTemplate = {
    _id: undefined,
    id: randomUUID(),
    userId: GLOBAL_USER_ID,
    isGlobal: true,
    source: "open5e",
    name: raw.name || "Unknown",
    level: raw.level ?? 0,
    concentration: raw.concentration ?? false,
    school: mapSchool(raw.school),
    description: raw.desc || "",
    castingTime: raw.casting_time || "1 action",
    range: raw.range_text || `${raw.range} ft.`,
    duration: raw.duration || "Instantaneous",
    components: {
      verbal: raw.verbal ?? false,
      somatic: raw.somatic ?? false,
      material: raw.material ?? false,
    },
    higherLevel: raw.higher_level,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  return { spell, valid: errors.length === 0, errors };
}
