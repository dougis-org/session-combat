import { DnDSpellSchool, isValidSpellSchool } from "@/lib/types";

export interface SpellValidationError {
  field: string;
  message: string;
}

export function validateSpellName(name: unknown): SpellValidationError | null {
  if (!name || typeof name !== "string" || name.trim() === "") {
    return { field: "name", message: "Spell name is required" };
  }
  return null;
}

export function validateSpellLevel(
  level: unknown
): SpellValidationError | null {
  if (level === undefined || level === null) {
    return { field: "level", message: "Level is required" };
  }
  if (typeof level !== "number" || level < 0 || level > 9) {
    return { field: "level", message: "Level must be 0-9" };
  }
  return null;
}

export function validateSpellSchool(
  school: unknown
): SpellValidationError | null {
  if (!isValidSpellSchool(school)) {
    return { field: "school", message: "Invalid spell school" };
  }
  return null;
}

export function validateSpellComponents(
  components: unknown
): SpellValidationError | null {
  if (components === undefined || components === null) {
    return null;
  }
  if (typeof components !== "object") {
    return { field: "components", message: "Components must be an object" };
  }
  return null;
}

export function parseSpellSchool(school: unknown): DnDSpellSchool {
  if (isValidSpellSchool(school)) {
    return school;
  }
  return "Evocation";
}