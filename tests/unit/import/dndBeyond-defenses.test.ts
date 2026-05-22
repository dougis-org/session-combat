import {
  normalizeImmunities,
  normalizeByModifierType,
  normalizeLanguages,
} from "@/lib/import/dndBeyond-defenses";

describe("dndBeyond-defenses", () => {
  describe("normalizeImmunities", () => {
    test("separates damage-type immunity (poison) from condition immunity (poisoned)", () => {
      const modifiers = [
        { type: "immunity" as const, subType: "poison", friendlySubtypeName: null },
        { type: "immunity" as const, subType: "poisoned", friendlySubtypeName: null },
      ];
      const result = normalizeImmunities(modifiers);
      expect(result.damageImmunities).toContain("Poison");
      expect(result.damageImmunities).not.toContain("Poisoned");
      expect(result.conditionImmunities).toContain("Poisoned");
      expect(result.conditionImmunities).not.toContain("Poison");
    });

    test("deduplicates repeated immunity entries", () => {
      const modifiers = [
        { type: "immunity" as const, subType: "fire", friendlySubtypeName: null },
        { type: "immunity" as const, subType: "fire", friendlySubtypeName: null },
      ];
      const result = normalizeImmunities(modifiers);
      expect(result.damageImmunities).toEqual(["Fire"]);
    });

    test("returns empty arrays when no immunity modifiers present", () => {
      const modifiers = [
        { type: "resistance" as const, subType: "fire", friendlySubtypeName: null },
        { type: "language" as const, subType: "common", friendlySubtypeName: null },
      ];
      const result = normalizeImmunities(modifiers);
      expect(result.damageImmunities).toEqual([]);
      expect(result.conditionImmunities).toEqual([]);
    });

    test("uses friendlySubtypeName when available", () => {
      const modifiers = [
        {
          type: "immunity" as const,
          subType: "psychic",
          friendlySubtypeName: "Psychic Damage",
        },
      ];
      const result = normalizeImmunities(modifiers);
      expect(result.damageImmunities).toContain("Psychic Damage");
    });
  });

  describe("normalizeByModifierType", () => {
    test("returns only modifiers of the specified type", () => {
      const modifiers = [
        { type: "resistance" as const, subType: "fire", friendlySubtypeName: null },
        { type: "immunity" as const, subType: "poison", friendlySubtypeName: null },
        { type: "resistance" as const, subType: "cold", friendlySubtypeName: null },
      ];
      const result = normalizeByModifierType(modifiers, "resistance");
      expect(result).toEqual(["Fire", "Cold"]);
    });

    test("deduplicates and titleizes results", () => {
      const modifiers = [
        { type: "resistance" as const, subType: "fire", friendlySubtypeName: null },
        { type: "resistance" as const, subType: "fire", friendlySubtypeName: null },
      ];
      const result = normalizeByModifierType(modifiers, "resistance");
      expect(result).toEqual(["Fire"]);
    });

    test("returns empty array when no matching modifiers", () => {
      const modifiers = [
        { type: "immunity" as const, subType: "poison", friendlySubtypeName: null },
      ];
      const result = normalizeByModifierType(modifiers, "resistance");
      expect(result).toEqual([]);
    });
  });

  describe("normalizeLanguages", () => {
    test("extracts language modifiers and titleizes them", () => {
      const modifiers = [
        { type: "language" as const, subType: "deep-speech", friendlySubtypeName: null },
        { type: "language" as const, subType: "common", friendlySubtypeName: "Common" },
      ];
      const result = normalizeLanguages(modifiers);
      expect(result).toContain("Deep Speech");
      expect(result).toContain("Common");
    });

    test("returns empty array when no language modifiers present", () => {
      const modifiers = [
        { type: "resistance" as const, subType: "fire", friendlySubtypeName: null },
      ];
      const result = normalizeLanguages(modifiers);
      expect(result).toEqual([]);
    });
  });
});
