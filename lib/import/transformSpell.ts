import { SpellTemplate, DnDSpellSchool, isValidSpellSchool } from "@/lib/types";
import { Open5ESpell } from "./open5eAdapter";
import { GLOBAL_USER_ID } from "@/lib/constants";
import { v4 as uuidv4 } from "uuid";

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

function mapSchool(school: string): DnDSpellSchool {
  const normalized = school.toLowerCase().trim();
  return SCHOOL_MAP[normalized] || "Evocation";
}

function parseComponents(
  components: string[]
): SpellTemplate["components"] {
  return {
    verbal: components.some(
      (c) => c.toLowerCase() === "v" || c.toLowerCase().includes("verbal")
    ),
    somatic: components.some(
      (c) => c.toLowerCase() === "s" || c.toLowerCase().includes("somatic")
    ),
    material: components.some(
      (c) =>
        c.toLowerCase() === "m" ||
        c.toLowerCase().includes("material") ||
        c.toLowerCase().includes("a material component")
    ),
  };
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

  if (!isValidSpellSchool(raw.school)) {
    errors.push(`Invalid school: ${raw.school}`);
  }

  const spell: SpellTemplate = {
    _id: undefined,
    id: uuidv4(),
    userId: GLOBAL_USER_ID,
    isGlobal: true,
    source: "open5e",
    name: raw.name || "Unknown",
    level: raw.level ?? 0,
    concentration: raw.concentration ?? false,
    school: mapSchool(raw.school),
    description: raw.description || "",
    castingTime: raw.casting_time || "1 action",
    range: raw.range || "Self",
    duration: raw.duration || "Instantaneous",
    components: parseComponents(raw.components || []),
    higherLevel: raw.higher_level,
    damageType: raw.damage_type,
    saveDc: raw.save_dc,
    saveType: raw.save_ability,
    attackRoll: Boolean(raw.dc_damage),
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  return { spell, valid: errors.length === 0, errors };
}
