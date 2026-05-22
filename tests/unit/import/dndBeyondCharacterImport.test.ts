import { normalizeDndBeyondCharacter } from "@/lib/dndBeyondCharacterImport";
import {
  sampleDndBeyondCharacterResponse,
  unsupportedDndBeyondCharacterResponse,
} from "@/tests/fixtures/dndBeyondCharacter";

function expectDefined<T>(
  value: T | undefined | null,
  label: string,
): NonNullable<T> {
  if (value === undefined || value === null) {
    throw new Error(`${label} should be defined and not null`);
  }
  expect(value).toBeDefined();
  expect(value).not.toBeNull();
  return value;
}

describe("dndBeyondCharacterImport", () => {
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
    const senses = expectDefined(result.character.senses, "senses");
    expect(senses["passive perception"]).toBe("18");
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
        'Race "Warforged" is not supported and was omitted.',
        "Alignment was not supported and was omitted.",
      ]),
    );
    expect(result.warnings).not.toEqual(
      expect.arrayContaining([expect.stringContaining("999")]),
    );
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
            subType: "poison",
            fixedValue: null,
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
    const senses = expectDefined(result.character.senses, "senses");
    expect(senses).toMatchObject({
      blindsight: "15 ft.",
      darkvision: "60 ft.",
      speed: "30 ft.",
    });
    expect(result.character.damageImmunities).toContain("poison");
    expect(result.character.damageImmunities).not.toContain("Poisoned");
    expect(result.character.conditionImmunities).toContain("Poisoned");
    expect(result.character.damageResistances).toContain("fire");
    expect(result.character.damageVulnerabilities).toContain("cold");
    const savingThrows = expectDefined(
      result.character.savingThrows,
      "savingThrows",
    );
    const skills = expectDefined(result.character.skills, "skills");
    expect(savingThrows.wisdom).toBe(5);
    expect(skills.stealth).toBe(9);
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
});
