import {
  normalizeDndBeyondCharacter,
  parseDndBeyondCharacterUrl,
} from "@/lib/dndBeyondCharacterImport";
import {
  sampleDndBeyondCharacterResponse,
  unsupportedDndBeyondCharacterResponse,
} from "@/tests/fixtures/dndBeyondCharacter";

describe("dndBeyondCharacterImport", () => {
  test("parses a canonical D&D Beyond character URL", () => {
    expect(
      parseDndBeyondCharacterUrl(
        "https://www.dndbeyond.com/characters/91913267/BRdgB3",
      ),
    ).toEqual({
      characterId: "91913267",
      shareCode: "BRdgB3",
      normalizedUrl: "https://www.dndbeyond.com/characters/91913267/BRdgB3",
    });
  });

  test("normalizes a public D&D Beyond character into the local model", () => {
    const result = normalizeDndBeyondCharacter(
      sampleDndBeyondCharacterResponse.data,
    );

    expect(result.character.name).toBe("Dolor Vagarpie");
    expect(result.character.race).toBe("Tiefling");
    expect(result.character.classes).toEqual([
      { class: "Rogue", level: 5 },
      { class: "Warlock", level: 7 },
    ]);
    expect(result.character.abilityScores).toEqual({
      strength: 10,
      dexterity: 17,
      constitution: 14,
      intelligence: 16,
      wisdom: 10,
      charisma: 21,
    });
    expect(result.character.ac).toBe(17);
    expect(result.character.maxHp).toBe(92);
    expect(result.character.hp).toBe(92);
    expect(result.character.languages).toEqual(["Common", "Infernal"]);
    expect(result.warnings).toEqual([]);
  });

  test("coerces unsupported optional values to safe defaults and reports warnings", () => {
    const result = normalizeDndBeyondCharacter(
      unsupportedDndBeyondCharacterResponse.data,
    );

    expect(result.character.race).toBeUndefined();
    expect(result.character.alignment).toBeUndefined();
    expect(result.warnings).toEqual(
      expect.arrayContaining([
        expect.stringContaining("Race"),
        expect.stringContaining("Alignment"),
      ]),
    );
  });
});
