// DnD Beyond-specific test helpers.
// Contains factories for raw DnD Beyond API shapes (modifiers, inventory entries, stat blocks).
// Do NOT put normalized 5e output shapes here — those go in characterTestHelpers.ts.

interface DndBeyondModifier {
  type?: "bonus" | "set" | "set-base" | "proficiency" | "expertise" | "language" | "resistance" | "immunity" | "vulnerability" | null;
  subType?: string | null;
  fixedValue?: number | null;
  value?: number | null;
  friendlySubtypeName?: string | null;
}

// "set" modifiers carry their value in fixedValue (matching the DnD Beyond API shape);
// all other modifier types carry it in value. getModifierNumericValue falls back from
// value to fixedValue, so both fields work — but this matches the real API contract.
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
