import {
  normalizeClasses,
  normalizeRace,
} from "@/lib/import/dndBeyond-classes";
import {
  mountainDwarfCharacterResponse,
  aasimarArtificerCharacterResponse,
} from "@/tests/fixtures/dndBeyondCharacter";

describe("dndBeyond-classes", () => {
  describe("normalizeClasses", () => {
    test("fails when no supported classes remain after normalization", () => {
      const warnings: string[] = [];
      expect(() =>
        normalizeClasses(
          [{ level: 3, definition: { name: "Commoner" } }],
          warnings,
        ),
      ).toThrow(/did not include any supported classes/i);
    });

    test("merges duplicate supported classes and warns about unsupported ones", () => {
      const warnings: string[] = [];
      const result = normalizeClasses(
        [
          { level: 2, definition: { name: "Rogue" } },
          { level: 3, definition: { name: "Rogue" } },
          { level: 1, definition: { name: "Commoner" } },
          { level: 0, definition: { name: "Warlock" } },
        ],
        warnings,
      );

      expect(result).toEqual([
        { class: "Rogue", level: 5 },
        { class: "Warlock", level: 1 },
      ]);
      expect(warnings).toContain(
        'Class "Commoner" is not supported and was omitted.',
      );
    });

    test("normalizes Artificer successfully", () => {
      const warnings: string[] = [];
      const result = normalizeClasses(
        aasimarArtificerCharacterResponse.data.classes,
        warnings,
      );
      expect(result).toEqual([{ class: "Artificer", level: 3 }]);
      expect(warnings).toEqual([]);
    });
  });

  describe("normalizeRace", () => {
    test("normalizes Mountain Dwarf successfully", () => {
      const warnings: string[] = [];
      const race = normalizeRace(
        mountainDwarfCharacterResponse.data.race?.fullName,
        warnings,
      );
      expect(race).toBe("Mountain Dwarf");
      expect(warnings).toEqual([]);
    });

    test("normalizes Aasimar successfully", () => {
      const warnings: string[] = [];
      const race = normalizeRace(
        aasimarArtificerCharacterResponse.data.race?.fullName,
        warnings,
      );
      expect(race).toBe("Aasimar");
      expect(warnings).toEqual([]);
    });

    test("normalizes race names with mixed casing and whitespace", () => {
      const warnings: string[] = [];
      const race = normalizeRace("  mountain DWARF  ", warnings);
      expect(race).toBe("Mountain Dwarf");
      expect(warnings).toEqual([]);
    });

    test("falls back to base race via substring matching", () => {
      const warnings: string[] = [];
      const race = normalizeRace("Custom Elf Variation", warnings);
      expect(race).toBe("Elf");
      expect(warnings).toContain(
        'Race "Custom Elf Variation" was normalized to "Elf".',
      );
    });
  });
});
