import { Open5ECreature } from "@/lib/import/open5eAdapter";
import { transformMonster } from "@/lib/import/transformMonster";
import { GLOBAL_USER_ID } from "@/lib/constants";
import { createBaseCreature } from "./testFactories";

describe("transformMonster", () => {
  describe("alignment normalization", () => {
    const CASES: Array<{ input: string | undefined; expected: string }> = [
      { input: "lawful good", expected: "Lawful Good" },
      { input: "neutral good", expected: "Neutral Good" },
      { input: "chaotic good", expected: "Chaotic Good" },
      { input: "lawful neutral", expected: "Lawful Neutral" },
      { input: "neutral", expected: "Neutral" },
      { input: "chaotic neutral", expected: "Chaotic Neutral" },
      { input: "lawful evil", expected: "Lawful Evil" },
      { input: "neutral evil", expected: "Neutral Evil" },
      { input: "chaotic evil", expected: "Chaotic Evil" },
      { input: "unaligned", expected: "Unaligned" },
      { input: " Chaotic Evil ", expected: "Chaotic Evil" },
      { input: undefined, expected: "Unaligned" },
      { input: "random alignment", expected: "Unaligned" },
    ];

    test.each(CASES)("maps '$input' to '$expected'", ({ input, expected }) => {
      const raw = createBaseCreature({ alignment: input });
      const { monster } = transformMonster(raw);
      expect(monster.alignment).toBe(expected);
    });
  });

  describe("size mapping", () => {
    const SIZES: Array<{ input: { Name: string; key: string }; expected: string }> = [
      { input: { Name: "Tiny", key: "tiny" }, expected: "tiny" },
      { input: { Name: "Small", key: "small" }, expected: "small" },
      { input: { Name: "Medium", key: "medium" }, expected: "medium" },
      { input: { Name: "Large", key: "large" }, expected: "large" },
      { input: { Name: "Huge", key: "huge" }, expected: "huge" },
      { input: { Name: "Gargantuan", key: "gargantuan" }, expected: "gargantuan" },
      { input: { Name: "Tiny", key: "TINY" }, expected: "tiny" },
      { input: { Name: "Large", key: "LARGE" }, expected: "large" },
      { input: { Name: "Unknown", key: "unknown" }, expected: "medium" },
      { input: { Name: "Unknown", key: "" }, expected: "medium" },
    ];

    test.each(SIZES)("maps '$input.key' to '$expected'", ({ input, expected }) => {
      const raw = createBaseCreature({ size: input });
      const { monster } = transformMonster(raw);
      expect(monster.size).toBe(expected);
    });
  });

  describe("speed normalization", () => {
    it("handles record format with walk and fly", () => {
      const raw = createBaseCreature({ speed: { walk: 30, fly: 60 } });
      const { monster } = transformMonster(raw);
      expect(monster.speed).toBe("walk 30, fly 60");
    });

    it("handles record format with swim", () => {
      const raw = createBaseCreature({ speed: { walk: 10, swim: 40 } });
      const { monster } = transformMonster(raw);
      expect(monster.speed).toBe("walk 10, swim 40");
    });

    it("handles empty speed record", () => {
      const raw = createBaseCreature({ speed: {} });
      const { monster } = transformMonster(raw);
      expect(monster.speed).toBe("30 ft.");
    });
  });

  describe("validation", () => {
    it("returns valid=true for complete creature", () => {
      const raw: Open5ECreature = {
        key: "goblin",
        name: "Goblin",
        size: { Name: "Small", key: "small" },
        type: { Name: "Humanoid", key: "humanoid" },
        alignment: "neutral evil",
        speed: { walk: 30 },
        ability_scores: {
          strength: 8,
          dexterity: 14,
          constitution: 12,
          intelligence: 10,
          wisdom: 8,
          charisma: 8,
        },
        hit_points: 7,
        armor_class: 15,
        challenge_rating: 0.25,
        actions: [{ name: "Attack", desc: "Melee weapon attack" }],
      };
      const result = transformMonster(raw);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("returns valid=false with errors for missing name", () => {
      const raw = createBaseCreature({ name: "" });
      const result = transformMonster(raw);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain("Missing required field: name");
    });

    it("returns valid=false with errors for missing type", () => {
      const raw = createBaseCreature({ type: { Name: "", key: "" } });
      const result = transformMonster(raw);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain("Missing required field: type");
    });

    it("collects multiple errors", () => {
      const raw = createBaseCreature({ name: "", type: { Name: "", key: "" } });
      const result = transformMonster(raw);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBe(2);
    });
  });

  describe("monster structure", () => {
    it("creates monster with all fields", () => {
      const raw: Open5ECreature = {
        key: "aboleth",
        name: "Aboleth",
        size: { Name: "Large", key: "large" },
        type: { Name: "Aberration", key: "aberration" },
        alignment: "chaotic evil",
        speed: { walk: 10, swim: 40 },
        ability_scores: {
          strength: 21,
          dexterity: 9,
          constitution: 15,
          intelligence: 18,
          wisdom: 15,
          charisma: 18,
        },
        hit_points: 135,
        armor_class: 17,
        challenge_rating: 10,
        actions: [{ name: "Tentacle", desc: "Melee weapon attack" }],
        traits: [{ name: "Mucus Cloud", desc: "Underwater creatures" }],
      };

      const { monster } = transformMonster(raw);

      expect(monster.id).toBeDefined();
      expect(monster.userId).toBe(GLOBAL_USER_ID);
      expect(monster.name).toBe("Aboleth");
      expect(monster.size).toBe("large");
      expect(monster.type).toBe("aberration");
      expect(monster.alignment).toBe("Chaotic Evil");
      expect(monster.speed).toBe("walk 10, swim 40");
      expect(monster.challengeRating).toBe(10);
      expect(monster.abilityScores).toEqual({
        strength: 21,
        dexterity: 9,
        constitution: 15,
        intelligence: 18,
        wisdom: 15,
        charisma: 18,
      });
      expect(monster.ac).toBe(17);
      expect(monster.hp).toBe(135);
      expect(monster.maxHp).toBe(135);
      expect(monster.isGlobal).toBe(true);
      expect(monster.source).toBe("open5e");
      expect(monster.traits).toHaveLength(1);
      expect(monster.traits?.[0]?.name).toBe("Mucus Cloud");
      expect(monster.actions).toHaveLength(1);
      expect(monster.actions?.[0]?.name).toBe("Tentacle");
      expect(monster.createdAt).toBeInstanceOf(Date);
      expect(monster.updatedAt).toBeInstanceOf(Date);
    });

    it("applies defaults for missing optional fields", () => {
      const raw = createBaseCreature({
        name: "Test",
        size: { Name: "Medium", key: "medium" },
        type: { Name: "Unknown", key: "unknown" },
        ability_scores: {
          strength: 0,
          dexterity: 0,
          constitution: 0,
          intelligence: 0,
          wisdom: 0,
          charisma: 0,
        },
        hit_points: 0,
        armor_class: 0,
        challenge_rating: 0,
        speed: {},
      });

      const { monster } = transformMonster(raw);

      expect(monster.name).toBe("Test");
      expect(monster.size).toBe("medium");
      expect(monster.type).toBe("unknown");
      expect(monster.alignment).toBe("Neutral");
      expect(monster.speed).toBe("30 ft.");
      expect(monster.challengeRating).toBe(0);
      expect(monster.abilityScores).toEqual({
        strength: 10,
        dexterity: 10,
        constitution: 10,
        intelligence: 10,
        wisdom: 10,
        charisma: 10,
      });
      expect(monster.ac).toBe(10);
      expect(monster.hp).toBe(1);
      expect(monster.maxHp).toBe(1);
      expect(monster.traits).toHaveLength(0);
      expect(monster.actions).toHaveLength(0);
      expect(monster.legendaryActions).toHaveLength(0);
    });
  });
});