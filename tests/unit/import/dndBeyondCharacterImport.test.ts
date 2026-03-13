import {
  normalizeDndBeyondCharacter,
  parseDndBeyondCharacterUrl,
} from "@/lib/dndBeyondCharacterImport";
import {
  sampleDndBeyondCharacterResponse,
  unsupportedDndBeyondCharacterResponse,
} from "@/tests/fixtures/dndBeyondCharacter";

describe("dndBeyondCharacterImport", () => {
  test("rejects unsupported D&D Beyond hosts", () => {
    expect(() =>
      parseDndBeyondCharacterUrl("https://example.com/characters/91913267/BRdgB3"),
    ).toThrow(/canonical public D&D Beyond character URLs/i);
  });

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
    expect(result.character.bonusActions).toEqual([
      {
        name: "Elemental Gift - Flight",
        description:
          "As a bonus action, you can give yourself a flying speed.",
      },
    ]);
    expect(result.character.reactions).toEqual([
      {
        name: "Uncanny Dodge",
        description: "Use your reaction to halve the attack's damage.",
      },
    ]);
    expect(result.character.senses["passive perception"]).toBe("18");
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

  test("uses armor type rules when calculating armor class", () => {
    const mediumArmorResult = normalizeDndBeyondCharacter({
      ...sampleDndBeyondCharacterResponse.data,
      inventory: [
        {
          equipped: true,
          definition: {
            armorClass: 14,
            armorTypeId: 2,
          },
        },
      ],
    });
    const heavyArmorResult = normalizeDndBeyondCharacter({
      ...sampleDndBeyondCharacterResponse.data,
      inventory: [
        {
          equipped: true,
          definition: {
            armorClass: 16,
            armorTypeId: 3,
          },
        },
      ],
    });
    const noArmorResult = normalizeDndBeyondCharacter({
      ...sampleDndBeyondCharacterResponse.data,
      inventory: [],
    });

    expect(mediumArmorResult.character.ac).toBe(18);
    expect(heavyArmorResult.character.ac).toBe(18);
    expect(noArmorResult.character.ac).toBe(15);
  });

  test("fails when required character identity is missing", () => {
    expect(() =>
      normalizeDndBeyondCharacter({
        ...sampleDndBeyondCharacterResponse.data,
        id: undefined,
      }),
    ).toThrow(/missing an ID/i);

    expect(() =>
      normalizeDndBeyondCharacter({
        ...sampleDndBeyondCharacterResponse.data,
        name: "",
      }),
    ).toThrow(/missing a name/i);
  });

  test("fails when no supported classes remain after normalization", () => {
    expect(() =>
      normalizeDndBeyondCharacter({
        ...sampleDndBeyondCharacterResponse.data,
        classes: [
          {
            level: 3,
            definition: {
              name: "Artificer",
            },
          },
        ],
      }),
    ).toThrow(/did not include any supported classes/i);
  });

  test("fails when a required ability score is missing", () => {
    expect(() =>
      normalizeDndBeyondCharacter({
        ...sampleDndBeyondCharacterResponse.data,
        stats: sampleDndBeyondCharacterResponse.data.stats.filter(
          (stat) => stat.id !== 6,
        ),
      }),
    ).toThrow(/missing charisma data/i);
  });
});
