import {
  transformMonsterData,
  RawMonsterData,
} from "@/lib/validation/monsterUpload";

const MINIMAL_RAW: RawMonsterData = {
  name: "Test Monster",
  hp: 20,
  maxHp: 20,
  ac: 13,
  challengeRating: 1,
};

describe("transformMonsterData", () => {
  it("should transform minimal monster data with defaults", () => {
    const raw: RawMonsterData = { name: "Goblin", maxHp: 7 };
    const result = transformMonsterData(raw, "user123");

    expect(result.id).toBeDefined();
    expect(result.userId).toBe("user123");
    expect(result.name).toBe("Goblin");
    expect(result.maxHp).toBe(7);
    expect(result.hp).toBe(7);
    expect(result.ac).toBe(10);
    expect(result.size).toBe("medium");
    expect(result.type).toBe("humanoid");
    expect(result.isGlobal).toBe(false);
    expect(result.createdAt).toBeInstanceOf(Date);
    expect(result.updatedAt).toBeInstanceOf(Date);
  });

  it("should transform complete monster data", () => {
    const raw: RawMonsterData = {
      name: "Aboleth",
      size: "large",
      type: "aberration",
      alignment: "Chaotic Evil",
      ac: 17,
      hp: 135,
      maxHp: 135,
      speed: "10 ft., swim 40 ft.",
      challengeRating: 10,
      experiencePoints: 5900,
      description: "An ancient aberration",
      source: "SRD",
      abilityScores: {
        strength: 21,
        dexterity: 9,
        constitution: 15,
        intelligence: 18,
        wisdom: 15,
        charisma: 18,
      },
      languages: ["Abyssal"],
      traits: [
        {
          name: "Amphibious",
          description: "The aboleth can breathe air and water.",
        },
      ],
    };

    const result = transformMonsterData(raw, "user123");

    expect(result.name).toBe("Aboleth");
    expect(result.size).toBe("large");
    expect(result.type).toBe("aberration");
    expect(result.alignment).toBe("Chaotic Evil");
    expect(result.ac).toBe(17);
    expect(result.hp).toBe(135);
    expect(result.maxHp).toBe(135);
    expect(result.speed).toBe("10 ft., swim 40 ft.");
    expect(result.challengeRating).toBe(10);
    expect(result.experiencePoints).toBe(5900);
    expect(result.description).toBe("An ancient aberration");
    expect(result.source).toBe("SRD");
    expect(result.abilityScores.strength).toBe(21);
    expect(result.languages).toHaveLength(1);
    const traits = result.traits ?? [];
    expect(traits).toHaveLength(1);
    expect(traits[0]?.name).toBe("Amphibious");
  });

  it("should clamp hp to maxHp if provided value is higher", () => {
    const raw: RawMonsterData = { name: "Test", hp: 100, maxHp: 50 };
    const result = transformMonsterData(raw, "user123");

    expect(result.hp).toBe(50);
    expect(result.maxHp).toBe(50);
  });

  it("should set hp to maxHp if hp not provided", () => {
    const raw: RawMonsterData = { name: "Test", maxHp: 25 };
    const result = transformMonsterData(raw, "user123");

    expect(result.hp).toBe(25);
    expect(result.maxHp).toBe(25);
  });

  it("should trim whitespace from name", () => {
    const raw: RawMonsterData = { name: "  Goblin  ", maxHp: 7 };
    const result = transformMonsterData(raw, "user123");

    expect(result.name).toBe("Goblin");
  });

  it("should assign unique IDs to each monster", () => {
    const raw: RawMonsterData = { name: "Test", maxHp: 10 };
    const result1 = transformMonsterData(raw, "user123");
    const result2 = transformMonsterData(raw, "user123");

    expect(result1.id).not.toBe(result2.id);
  });

  it("should assign correct userId from parameter", () => {
    const raw: RawMonsterData = { name: "Test", maxHp: 10 };
    const result = transformMonsterData(raw, "user-special-id");

    expect(result.userId).toBe("user-special-id");
  });

  it("should set isGlobal to false for user uploads", () => {
    const raw: RawMonsterData = { name: "Test", maxHp: 10 };
    const result = transformMonsterData(raw, "user123");

    expect(result.isGlobal).toBe(false);
  });

  describe("legendaryActionCount pass-through", () => {
    it("should pass through valid legendaryActionCount", () => {
      const raw: RawMonsterData = { name: "Aboleth", maxHp: 135, legendaryActionCount: 3 };
      const result = transformMonsterData(raw, "user123");
      expect(result.legendaryActionCount).toBe(3);
    });

    it("should pass through legendaryActionCount of 0", () => {
      const raw: RawMonsterData = { name: "Goblin", maxHp: 7, legendaryActionCount: 0 };
      const result = transformMonsterData(raw, "user123");
      expect(result.legendaryActionCount).toBe(0);
    });

    it("should return undefined legendaryActionCount when not provided", () => {
      const raw: RawMonsterData = { name: "Goblin", maxHp: 7 };
      const result = transformMonsterData(raw, "user123");
      expect(result.legendaryActionCount).toBeUndefined();
    });
  });

  describe("damage type filtering", () => {
    type DamageField = "damageResistances" | "damageImmunities" | "damageVulnerabilities";

    const filterDamage = (field: DamageField, input: string[]) =>
      transformMonsterData({ ...MINIMAL_RAW, [field]: input }, "user1")[field];

    it("passes through valid lowercase DamageType values unchanged", () => {
      expect(filterDamage("damageResistances", ["fire", "cold"])).toEqual(["fire", "cold"]);
    });

    it("normalizes mixed-case values to lowercase canonical types", () => {
      expect(filterDamage("damageImmunities", ["Fire", "COLD", "Poison"])).toEqual(["fire", "cold", "poison"]);
    });

    it("trims whitespace from values", () => {
      expect(filterDamage("damageVulnerabilities", [" fire ", "cold "])).toEqual(["fire", "cold"]);
    });

    it("filters out freeform non-DamageType strings", () => {
      expect(filterDamage("damageResistances", ["fire", "from nonmagical weapons", "bludgeoning, piercing"])).toEqual(["fire"]);
    });

    it("produces empty array when all values are invalid", () => {
      expect(filterDamage("damageResistances", ["damage from spells", "nonmagical bludgeoning"])).toEqual([]);
    });

    it("handles undefined resistance arrays (absent key) → empty array", () => {
      const result = transformMonsterData(MINIMAL_RAW, "user1");
      expect(result.damageResistances).toEqual([]);
      expect(result.damageImmunities).toEqual([]);
      expect(result.damageVulnerabilities).toEqual([]);
    });

    it("handles empty resistance arrays", () => {
      const result = transformMonsterData(
        { ...MINIMAL_RAW, damageResistances: [], damageImmunities: [], damageVulnerabilities: [] },
        "user1",
      );
      expect(result.damageResistances).toEqual([]);
      expect(result.damageImmunities).toEqual([]);
      expect(result.damageVulnerabilities).toEqual([]);
    });

    it("all 13 canonical types pass through", () => {
      const all13 = ["acid", "bludgeoning", "cold", "fire", "force", "lightning", "necrotic", "piercing", "poison", "psychic", "radiant", "slashing", "thunder"];
      expect(filterDamage("damageImmunities", all13)).toEqual(all13);
    });

    it("mixed valid and invalid values: keeps only valid", () => {
      const result = transformMonsterData(
        {
          ...MINIMAL_RAW,
          damageResistances: ["fire", "cold"],
          damageImmunities: ["poison", "invalid-type"],
          damageVulnerabilities: ["lightning", ""],
        },
        "user1",
      );
      expect(result.damageResistances).toEqual(["fire", "cold"]);
      expect(result.damageImmunities).toEqual(["poison"]);
      expect(result.damageVulnerabilities).toEqual(["lightning"]);
    });

  });

  it("normalizes alignment casing and whitespace to canonical values", () => {
    const result = transformMonsterData(
      { ...MINIMAL_RAW, alignment: " chaotic evil " },
      "user1",
    );
    expect(result.alignment).toBe("Chaotic Evil");
  });
});
