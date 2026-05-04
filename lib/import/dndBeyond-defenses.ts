import { dedupeStrings, titleize, isDamageTypeModifier } from "./utils";

interface DndBeyondModifier {
  type?: "bonus" | "set" | "set-base" | "proficiency" | "expertise" | "language" | "resistance" | "immunity" | "vulnerability" | null;
  subType?: string | null;
  friendlySubtypeName?: string | null;
}

export function normalizeImmunities(modifiers: DndBeyondModifier[]): {
  damageImmunities: string[];
  conditionImmunities: string[];
} {
  const classified = modifiers
    .filter((modifier) => modifier.type === "immunity")
    .reduce(
      (result, modifier) => {
        const label =
          modifier.friendlySubtypeName || titleize(modifier.subType || "");

        if (!label) {
          return result;
        }

        if (isDamageTypeModifier(modifier)) {
          result.damageImmunities.push(label);
        } else {
          result.conditionImmunities.push(label);
        }

        return result;
      },
      {
        damageImmunities: [] as string[],
        conditionImmunities: [] as string[],
      },
    );

  return {
    damageImmunities: dedupeStrings(classified.damageImmunities),
    conditionImmunities: dedupeStrings(classified.conditionImmunities),
  };
}

export function normalizeByModifierType(
  modifiers: DndBeyondModifier[],
  type: string,
): string[] {
  return dedupeStrings(
    modifiers
      .filter((modifier) => modifier.type === type)
      .map(
        (modifier) =>
          modifier.friendlySubtypeName || titleize(modifier.subType || ""),
      ),
  );
}

export function normalizeLanguages(modifiers: DndBeyondModifier[]): string[] {
  return normalizeByModifierType(modifiers, "language");
}
