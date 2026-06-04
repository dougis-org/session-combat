// DnD Beyond-specific test helpers.
// Contains factories for raw DnD Beyond API shapes (modifiers, inventory entries, stat blocks).
// Do NOT put normalized 5e output shapes here — those go in characterTestHelpers.ts.

import type { DndBeyondModifier } from "@/lib/dndBeyondCharacterImport";

// "set" modifiers carry their value in fixedValue; all other types use value.
// This factory mirrors how the helper functions in lib/import/ consume the shape.
export function createModifier(
  type: DndBeyondModifier["type"],
  subType: string,
  value?: number,
): DndBeyondModifier {
  return {
    type,
    subType,
    fixedValue: type === "set" ? (value ?? null) : null,
    value: type !== "set" ? (value ?? null) : null,
    friendlySubtypeName: null,
  };
}

export function createModifierList(...modifiers: DndBeyondModifier[]): DndBeyondModifier[] {
  return modifiers;
}
