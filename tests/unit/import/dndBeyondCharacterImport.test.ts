import {
  normalizeDndBeyondCharacter,
  parseDndBeyondCharacterUrl,
} from "@/lib/dndBeyondCharacterImport";
import {
  sampleDndBeyondCharacterResponse,
  unsupportedDndBeyondCharacterResponse,
} from "@/tests/fixtures/dndBeyondCharacter";

describe("dndBeyondCharacterImport", () => {
  test("rejects invalid or incomplete D&D Beyond URLs", () => {
    expect(() => parseDndBeyondCharacterUrl("not-a-url")).toThrow(
      /enter a valid d&d beyond character url/i,
    );

    expect(() =>
      parseDndBeyondCharacterUrl(
        "https://www.dndbeyond.com/characters/91913267",
      ),
    ).toThrow(/format \/characters\/<id>\/<shareCode>/i);
  });

  test("rejects unsupported D&D Beyond hosts", () => {
    expect(() =>
      parseDndBeyondCharacterUrl(
        "https://example.com/characters/91913267/BRdgB3",
      ),
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

  test("trims whitespace around a canonical D&D Beyond character URL", () => {
    expect(
      parseDndBeyondCharacterUrl(
        "  https://www.dndbeyond.com/characters/91913267/BRdgB3  ",
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
        description: "As a bonus action, you can give yourself a flying speed.",
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

  test("merges duplicate supported classes and warns about unsupported ones", () => {
    const result = normalizeDndBeyondCharacter({
      ...sampleDndBeyondCharacterResponse.data,
      classes: [
        {
          level: 2,
          definition: {
            name: "Rogue",
          },
        },
        {
          level: 3,
          definition: {
            name: "Rogue",
          },
        },
        {
          level: 1,
          definition: {
            name: "Artificer",
          },
        },
        {
          level: 0,
          definition: {
            name: "Warlock",
          },
        },
      ],
    });

    expect(result.character.classes).toEqual([
      { class: "Rogue", level: 5 },
      { class: "Warlock", level: 1 },
    ]);
    expect(result.warnings).toContain(
      'Class "Artificer" is not supported and was omitted.',
    );
  });

  test("prefers override values for hit points and ability scores", () => {
    const result = normalizeDndBeyondCharacter({
      ...sampleDndBeyondCharacterResponse.data,
      currentHitPoints: 31,
      overrideHitPoints: 44,
      bonusHitPoints: 6,
      bonusStats: sampleDndBeyondCharacterResponse.data.bonusStats.map(
        (stat) => (stat.id === 2 ? { ...stat, value: 5 } : stat),
      ),
      overrideStats: sampleDndBeyondCharacterResponse.data.overrideStats.map(
        (stat) =>
          stat.id === 2
            ? {
                ...stat,
                value: 20,
              }
            : stat,
      ),
    });

    expect(result.character.abilityScores.dexterity).toBe(20);
    expect(result.character.maxHp).toBe(44);
    expect(result.character.hp).toBe(31);
  });

  test("clamps explicit current hit points to the normalized range", () => {
    const result = normalizeDndBeyondCharacter({
      ...sampleDndBeyondCharacterResponse.data,
      currentHitPoints: 999,
      overrideHitPoints: 44,
    });

    expect(result.character.maxHp).toBe(44);
    expect(result.character.hp).toBe(44);
  });

  test("falls back to removed hit points and clamps health at zero", () => {
    const result = normalizeDndBeyondCharacter({
      ...sampleDndBeyondCharacterResponse.data,
      removedHitPoints: 999,
      currentHitPoints: undefined,
    });

    expect(result.character.hp).toBe(0);
  });

  test("normalizes languages, senses, defenses, and narrative abilities", () => {
    const result = normalizeDndBeyondCharacter({
      ...sampleDndBeyondCharacterResponse.data,
      modifiers: {
        ...sampleDndBeyondCharacterResponse.data.modifiers,
        custom: [
          {
            type: "language",
            subType: "deep-speech",
            fixedValue: null,
            value: null,
            friendlySubtypeName: null,
          },
          {
            type: "set-base",
            subType: "blindsight",
            fixedValue: 15,
            value: null,
            friendlySubtypeName: null,
          },
          {
            type: "immunity",
            subType: "poisoned",
            fixedValue: null,
            value: null,
            friendlySubtypeName: null,
          },
          {
            type: "vulnerability",
            subType: "cold",
            fixedValue: null,
            value: null,
            friendlySubtypeName: null,
          },
          {
            type: "bonus",
            subType: "wisdom-saving-throws",
            fixedValue: 1,
            value: null,
            friendlySubtypeName: null,
          },
          {
            type: "bonus",
            subType: "stealth",
            fixedValue: 2,
            value: null,
            friendlySubtypeName: null,
          },
        ],
      },
      actions: {
        ...sampleDndBeyondCharacterResponse.data.actions,
        feat: [
          {
            name: "Fancy Footwork",
            description: "<p>Move away without opportunity attacks.</p>",
            activation: { activationType: 1 },
          },
          {
            name: "Ignored",
            description: "",
            activation: { activationType: 1 },
          },
        ],
      },
      traits: {
        ...sampleDndBeyondCharacterResponse.data.traits,
        custom_story: "  Keeps secrets.  ",
      },
      notes: {
        ...sampleDndBeyondCharacterResponse.data.notes,
        otherNotes: "  Carries coded letters.  ",
      },
    });

    expect(result.character.languages).toEqual(
      expect.arrayContaining(["Common", "Infernal", "Deep Speech"]),
    );
    expect(result.character.senses).toMatchObject({
      blindsight: "15 ft.",
      darkvision: "60 ft.",
      speed: "30 ft.",
    });
    expect(result.character.conditionImmunities).toContain("Poisoned");
    expect(result.character.damageResistances).toContain("Fire");
    expect(result.character.damageVulnerabilities).toContain("Cold");
    expect(result.character.savingThrows.wisdom).toBe(5);
    expect(result.character.skills.stealth).toBe(9);
    expect(result.character.actions).toEqual(
      expect.arrayContaining([
        {
          name: "Fancy Footwork",
          description: "Move away without opportunity attacks.",
        },
      ]),
    );
    expect(result.character.traits).toEqual(
      expect.arrayContaining([
        {
          name: "Custom Story",
          description: "Keeps secrets.",
        },
        {
          name: "Other Notes",
          description: "Carries coded letters.",
        },
      ]),
    );
  });

  test("omits speed when missing and defaults passive senses from abilities", () => {
    const result = normalizeDndBeyondCharacter({
      ...sampleDndBeyondCharacterResponse.data,
      race: {
        fullName: "Tiefling",
        weightSpeeds: {
          normal: {
            walk: 0,
          },
        },
      },
      modifiers: {
        ...sampleDndBeyondCharacterResponse.data.modifiers,
        class: [],
        background: [],
      },
    });

    expect(result.character.senses.speed).toBeUndefined();
    expect(result.character.senses["passive insight"]).toBe("10");
    expect(result.character.senses["passive investigation"]).toBe("13");
  });

  test("omits actions whose sanitized descriptions are empty", () => {
    const result = normalizeDndBeyondCharacter({
      ...sampleDndBeyondCharacterResponse.data,
      actions: {
        ...sampleDndBeyondCharacterResponse.data.actions,
        feat: [
          {
            name: "Markup Only",
            description: "<p><br></p>",
            activation: { activationType: 1 },
          },
        ],
      },
    });

    expect(result.character.actions).not.toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          name: "Markup Only",
        }),
      ]),
    );
  });
});
