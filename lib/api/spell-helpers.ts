import { SpellTemplate, DnDSpellSchool, isValidSpellSchool } from "@/lib/types";
import { GLOBAL_USER_ID } from "@/lib/constants";
import { randomUUID } from "crypto";
import {
  validateSpellName,
  validateSpellLevel,
  validateSpellSchool,
  parseSpellSchool,
  parseComponents,
} from "@/lib/import/spellValidation";

export interface SpellBody {
  name?: string | null;
  level?: number | null;
  concentration?: boolean | null;
  school?: string | null;
  description?: string | null;
  castingTime?: string | null;
  range?: string | null;
  duration?: string | null;
  components?: unknown;
  higherLevel?: string | null;
  damageType?: string | null;
  saveDc?: number | null;
  saveType?: string | null;
  attackRoll?: boolean | null;
}

export function buildSpellFromBody(body: SpellBody): SpellTemplate {
  return {
    id: randomUUID(),
    userId: GLOBAL_USER_ID,
    isGlobal: true,
    source: "open5e",
    name: body.name?.trim() ?? "",
    level: body.level ?? 0,
    concentration: Boolean(body.concentration),
    school: parseSpellSchool(body.school),
    description: body.description || "",
    castingTime: body.castingTime || "1 action",
    range: body.range || "Self",
    duration: body.duration || "Instantaneous",
    components: parseComponents(body.components),
    higherLevel: body.higherLevel ?? undefined,
    damageType: body.damageType ?? undefined,
    saveDc: body.saveDc ?? undefined,
    saveType: body.saveType ?? undefined,
    attackRoll: Boolean(body.attackRoll),
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

export function applySpellUpdates(
  existing: SpellTemplate,
  updates: SpellBody
): { spell: SpellTemplate; errors: Array<{ field: string; message: string }> } {
  const errors: Array<{ field: string; message: string }> = [];

  if (updates.name !== undefined && updates.name !== null) {
    const err = validateSpellName(updates.name);
    if (err) errors.push({ field: err.field, message: err.message });
  }

  if (updates.level !== undefined && updates.level !== null) {
    const err = validateSpellLevel(updates.level);
    if (err) errors.push({ field: err.field, message: err.message });
  }

  if (updates.school !== undefined && updates.school !== null) {
    const err = validateSpellSchool(updates.school);
    if (err) errors.push({ field: err.field, message: err.message });
  }

  if (errors.length > 0) {
    return { spell: existing, errors };
  }

  const spell: SpellTemplate = {
    ...existing,
    name: updates.name !== undefined ? (typeof updates.name === "string" ? updates.name.trim() : existing.name) : existing.name,
    level: updates.level != null ? updates.level : existing.level,
    concentration:
      updates.concentration != null
        ? updates.concentration
        : existing.concentration,
    school:
      updates.school != null
        ? isValidSpellSchool(updates.school)
          ? (updates.school as DnDSpellSchool)
          : existing.school
        : existing.school,
    description:
      updates.description != null ? updates.description : existing.description,
    castingTime:
      updates.castingTime != null ? updates.castingTime : existing.castingTime,
    range: updates.range != null ? updates.range : existing.range,
    duration: updates.duration != null ? updates.duration : existing.duration,
    components:
      updates.components !== undefined
        ? parseComponents(updates.components)
        : existing.components,
    higherLevel:
      updates.higherLevel !== undefined ? updates.higherLevel : existing.higherLevel,
    damageType:
      updates.damageType !== undefined ? updates.damageType : existing.damageType,
    saveDc: updates.saveDc !== undefined ? updates.saveDc : existing.saveDc,
    saveType: updates.saveType !== undefined ? updates.saveType : existing.saveType,
    attackRoll:
      updates.attackRoll !== undefined ? updates.attackRoll : existing.attackRoll,
    updatedAt: new Date(),
  };

  return { spell, errors: [] };
}
