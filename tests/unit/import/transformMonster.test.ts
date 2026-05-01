import { Open5ECreature } from "@/lib/import/open5eAdapter";
import { transformMonster } from "@/lib/import/transformMonster";
import { GLOBAL_USER_ID } from "@/lib/constants";

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
      { input: undefined, expected: "Unaligned" },
    ];

    test.each(CASES)("maps '$input' to '$expected'", ({ input, expected }) => {
      const raw: Open5ECreature = {
        slug: "test",
        name: "Test Monster",
        size: "medium",
        type: "humanoid",
        alignment: input,
        speed: { walk: 30 },
        strength: 10,
        dexterity: 10,
        constitution: 10,
        intelligence: 10,
        wisdom: 10,
        charisma: 10,
        hit_points: 10,
        armor_class: [{ ac: 10 }],
        challenge_rating: "1",
        actions: [],
      };
      const { monster } = transformMonster(raw);
      expect(monster.alignment).toBe(expected);
    });
  });

  describe("size mapping", () => {
    const SIZES: Array<{ input: string; expected: string }> = [
      { input: "tiny", expected: "tiny" },
      { input: "small", expected: "small" },
      { input: "medium", expected: "medium" },
      { input: "large", expected: "large" },
      { input: "huge", expected: "huge" },
      { input: "gargantuan", expected: "gargantuan" },
      { input: "TINY", expected: "tiny" },
      { input: "LARGE", expected: "large" },
      { input: "unknown", expected: "medium" },
      { input: "", expected: "medium" },
    ];

    test.each(SIZES)("maps '$input' to '$expected'", ({ input, expected }) => {
      const raw: Open5ECreature = {
        slug: "test",
        name: "Test Monster",
        size: input,
        type: "humanoid",
        alignment: "neutral",
        speed: { walk: 30 },
        strength: 10,
        dexterity: 10,
        constitution: 10,
        intelligence: 10,
        wisdom: 10,
        charisma: 10,
        hit_points: 10,
        armor_class: [{ ac: 10 }],
        challenge_rating: "1",
        actions: [],
      };
      const { monster } = transformMonster(raw);
      expect(monster.size).toBe(expected);
    });
  });

  describe("speed normalization", () => {
    it("handles record format", () => {
      const raw: Open5ECreature = {
        slug: "test",
        name: "Test",
        size: "medium",
        type: "humanoid",
        alignment: "neutral",
        speed: { walk: 30, fly: 60 },
        strength: 10,
        dexterity: 10,
        constitution: 10,
        intelligence: 10,
        wisdom: 10,
        charisma: 10,
        hit_points: 10,
        armor_class: [{ ac: 10 }],
        challenge_rating: "1",
        actions: [],
      };
      const { monster } = transformMonster(raw);
      expect(monster.speed).toBe("walk 30, fly 60");
    });

    it("handles string format", () => {
      const raw: Open5ECreature = {
        slug: "test",
        name: "Test",
        size: "medium",
        type: "humanoid",
        alignment: "neutral",
        speed: "30 ft.",
        strength: 10,
        dexterity: 10,
        constitution: 10,
        intelligence: 10,
        wisdom: 10,
        charisma: 10,
        hit_points: 10,
        armor_class: [{ ac: 10 }],
        challenge_rating: "1",
        actions: [],
      };
      const { monster } = transformMonster(raw);
      expect(monster.speed).toBe("30 ft.");
    });

    it("handles number format", () => {
      const raw: Open5ECreature = {
        slug: "test",
        name: "Test",
        size: "medium",
        type: "humanoid",
        alignment: "neutral",
        speed: 30,
        strength: 10,
        dexterity: 10,
        constitution: 10,
        intelligence: 10,
        wisdom: 10,
        charisma: 10,
        hit_points: 10,
        armor_class: [{ ac: 10 }],
        challenge_rating: "1",
        actions: [],
      };
      const { monster } = transformMonster(raw);
      expect(monster.speed).toBe("30 ft.");
    });

    it("handles missing speed", () => {
      const raw: Open5ECreature = {
        slug: "test",
        name: "Test",
        size: "medium",
        type: "humanoid",
        alignment: "neutral",
        speed: undefined,
        strength: 10,
        dexterity: 10,
        constitution: 10,
        intelligence: 10,
        wisdom: 10,
        charisma: 10,
        hit_points: 10,
        armor_class: [{ ac: 10 }],
        challenge_rating: "1",
        actions: [],
      };
      const { monster } = transformMonster(raw);
      expect(monster.speed).toBe("30 ft.");
    });
  });

  describe("validation", () => {
    it("returns valid=true for complete creature", () => {
      const raw: Open5ECreature = {
        slug: "goblin",
        name: "Goblin",
        size: "small",
        type: "humanoid",
        alignment: "neutral evil",
        speed: { walk: 30 },
        strength: 8,
        dexterity: 14,
        constitution: 12,
        intelligence: 10,
        wisdom: 8,
        charisma: 8,
        hit_points: 7,
        armor_class: [{ ac: 15 }],
        challenge_rating: "0.25",
        actions: [{ name: "Attack", desc: "Melee weapon attack" }],
      };
      const result = transformMonster(raw);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("returns valid=false with errors for missing name", () => {
      const raw: Open5ECreature = {
        slug: "test",
        name: "",
        size: "medium",
        type: "humanoid",
        alignment: "neutral",
        speed: { walk: 30 },
        strength: 10,
        dexterity: 10,
        constitution: 10,
        intelligence: 10,
        wisdom: 10,
        charisma: 10,
        hit_points: 10,
        armor_class: [{ ac: 10 }],
        challenge_rating: "1",
        actions: [],
      };
      const result = transformMonster(raw);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain("Missing required field: name");
    });

    it("returns valid=false with errors for missing type", () => {
      const raw: Open5ECreature = {
        slug: "test",
        name: "Test",
        size: "medium",
        type: "",
        alignment: "neutral",
        speed: { walk: 30 },
        strength: 10,
        dexterity: 10,
        constitution: 10,
        intelligence: 10,
        wisdom: 10,
        charisma: 10,
        hit_points: 10,
        armor_class: [{ ac: 10 }],
        challenge_rating: "1",
        actions: [],
      };
      const result = transformMonster(raw);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain("Missing required field: type");
    });

    it("collects multiple errors", () => {
      const raw: Open5ECreature = {
        slug: "test",
        name: "",
        size: "medium",
        type: "",
        alignment: "neutral",
        speed: { walk: 30 },
        strength: 10,
        dexterity: 10,
        constitution: 10,
        intelligence: 10,
        wisdom: 10,
        charisma: 10,
        hit_points: 10,
        armor_class: [{ ac: 10 }],
        challenge_rating: "1",
        actions: [],
      };
      const result = transformMonster(raw);
      expect(result.valid).toBe(false);
      expect(result.errors).toHaveLength(2);
    });
  });

  describe("monster structure", () => {
    it("creates monster with all fields", () => {
      const raw: Open5ECreature = {
        slug: "aboleth",
        name: "Aboleth",
        size: "large",
        type: "aberration",
        alignment: "chaotic evil",
        speed: { walk: 10, swim: 40 },
        strength: 21,
        dexterity: 9,
        constitution: 15,
        intelligence: 18,
        wisdom: 15,
        charisma: 18,
        hit_points: 135,
        armor_class: [{ ac: 17, note: "with mucus coat" }],
        challenge_rating: "10",
        actions: [{ name: "Tentacle", desc: "Melee weapon attack" }],
        special_abilities: [{ name: "Mucus Cloud", desc: "Underwater creatures" }],
        legendary_actions: [{ name: "Detect", desc: "Detects presence" }],
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
      expect(monster.acNote).toBe("with mucus coat");
      expect(monster.hp).toBe(135);
      expect(monster.maxHp).toBe(135);
      expect(monster.isGlobal).toBe(true);
      expect(monster.source).toBe("open5e");
      expect(monster.traits).toHaveLength(1);
      expect(monster.traits?.[0]?.name).toBe("Mucus Cloud");
      expect(monster.actions).toHaveLength(1);
      expect(monster.actions?.[0]?.name).toBe("Tentacle");
      expect(monster.legendaryActions).toHaveLength(1);
      expect(monster.legendaryActions?.[0]?.name).toBe("Detect");
      expect(monster.createdAt).toBeInstanceOf(Date);
      expect(monster.updatedAt).toBeInstanceOf(Date);
    });

    it("applies defaults for missing optional fields", () => {
      const raw: Open5ECreature = {
        slug: "test",
        name: "Test",
        size: "medium",
        type: "unknown",
        strength: 0,
        dexterity: 0,
        constitution: 0,
        intelligence: 0,
        wisdom: 0,
        charisma: 0,
        hit_points: 0,
        armor_class: [],
        challenge_rating: "invalid",
        actions: [],
      };

      const { monster } = transformMonster(raw);

      expect(monster.name).toBe("Test");
      expect(monster.size).toBe("medium");
      expect(monster.type).toBe("unknown");
      expect(monster.alignment).toBe("Unaligned");
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