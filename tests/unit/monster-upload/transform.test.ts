import {
  transformMonsterData,
  RawMonsterData,
} from "@/lib/validation/monsterUpload";
import { GLOBAL_USER_ID } from "@/lib/constants";

const ABILITY_SCORES = {
  strength: 10,
  dexterity: 10,
  constitution: 10,
  intelligence: 10,
  wisdom: 10,
  charisma: 10,
};

const baseRaw = (overrides?: Partial<RawMonsterData>): RawMonsterData => ({
  name: "Test Monster",
  size: "medium",
  type: "humanoid",
  ac: 13,
  maxHp: 20,
  speed: "30 ft.",
  challengeRating: 1,
  abilityScores: { ...ABILITY_SCORES },
  ...overrides,
});

const personal = { userId: "user123", isGlobal: false };

describe("transformMonsterData", () => {
  it("should transform monster data and default hp to maxHp", () => {
    const result = transformMonsterData(baseRaw({ name: "Goblin", maxHp: 7 }), personal);

    expect(result.id).toBeDefined();
    expect(result.userId).toBe("user123");
    expect(result.name).toBe("Goblin");
    expect(result.maxHp).toBe(7);
    expect(result.hp).toBe(7);
    expect(result.ac).toBe(13);
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

    const result = transformMonsterData(raw, personal);

    expect(result.name).toBe("Aboleth");
    expect(result.size).toBe("large");
    expect(result.type).toBe("aberration");
    expect(result.alignment).toBe("Chaotic Evil");
    expect(result.ac).toBe(17);
    expect(result.hp).toBe(135);
    expect(result.maxHp).toBe(135);
    expect(result.speed).toBe("10 ft., swim 40 ft.");
    expect(result.challengeRating).toBe(10);
    expect(result.description).toBe("An ancient aberration");
    expect(result.source).toBe("SRD");
    expect(result.abilityScores.strength).toBe(21);
    expect(result.languages).toHaveLength(1);
    const traits = result.traits ?? [];
    expect(traits).toHaveLength(1);
    expect(traits[0]?.name).toBe("Amphibious");
  });

  it("should preserve hp below maxHp", () => {
    const result = transformMonsterData(baseRaw({ hp: 12, maxHp: 50 }), personal);
    expect(result.hp).toBe(12);
    expect(result.maxHp).toBe(50);
  });

  it("should set hp to maxHp if hp not provided", () => {
    const result = transformMonsterData(baseRaw({ maxHp: 25 }), personal);
    expect(result.hp).toBe(25);
    expect(result.maxHp).toBe(25);
  });

  it("should trim whitespace from name", () => {
    const result = transformMonsterData(baseRaw({ name: "  Goblin  " }), personal);
    expect(result.name).toBe("Goblin");
  });

  it("should assign unique IDs to each monster", () => {
    const result1 = transformMonsterData(baseRaw(), personal);
    const result2 = transformMonsterData(baseRaw(), personal);
    expect(result1.id).not.toBe(result2.id);
  });

  it("should assign correct userId from options", () => {
    const result = transformMonsterData(baseRaw(), { userId: "user-special-id", isGlobal: false });
    expect(result.userId).toBe("user-special-id");
  });

  it("should set isGlobal false and keep the caller userId for personal imports", () => {
    const result = transformMonsterData(baseRaw(), personal);
    expect(result.isGlobal).toBe(false);
    expect(result.userId).toBe("user123");
  });

  it("should set isGlobal true and GLOBAL_USER_ID for global imports", () => {
    const result = transformMonsterData(baseRaw(), {
      userId: GLOBAL_USER_ID,
      isGlobal: true,
    });
    expect(result.isGlobal).toBe(true);
    expect(result.userId).toBe(GLOBAL_USER_ID);
  });

  describe("legendaryActionCount pass-through", () => {
    it("should pass through valid legendaryActionCount", () => {
      const result = transformMonsterData(baseRaw({ legendaryActionCount: 3 }), personal);
      expect(result.legendaryActionCount).toBe(3);
    });

    it("should pass through legendaryActionCount of 0", () => {
      const result = transformMonsterData(baseRaw({ legendaryActionCount: 0 }), personal);
      expect(result.legendaryActionCount).toBe(0);
    });

    it("should return undefined legendaryActionCount when not provided", () => {
      const result = transformMonsterData(baseRaw(), personal);
      expect(result.legendaryActionCount).toBeUndefined();
    });
  });

  describe("damage type filtering", () => {
    type DamageField = "damageResistances" | "damageImmunities" | "damageVulnerabilities";

    const filterDamage = (field: DamageField, input: string[]) =>
      transformMonsterData(baseRaw({ [field]: input }), personal)[field];

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
      const result = transformMonsterData(baseRaw(), personal);
      expect(result.damageResistances).toEqual([]);
      expect(result.damageImmunities).toEqual([]);
      expect(result.damageVulnerabilities).toEqual([]);
    });

    it("all 13 canonical types pass through", () => {
      const all13 = ["acid", "bludgeoning", "cold", "fire", "force", "lightning", "necrotic", "piercing", "poison", "psychic", "radiant", "slashing", "thunder"];
      expect(filterDamage("damageImmunities", all13)).toEqual(all13);
    });
  });

  it("normalizes alignment casing and whitespace to canonical values", () => {
    const result = transformMonsterData(baseRaw({ alignment: " chaotic evil " }), personal);
    expect(result.alignment).toBe("Chaotic Evil");
  });

  it("drops an unrecognised alignment without erroring", () => {
    const warn = jest.spyOn(console, "warn").mockImplementation(() => {});
    const result = transformMonsterData(baseRaw({ alignment: "banana" }), personal);
    expect(result.alignment).toBeUndefined();
    warn.mockRestore();
  });
});
