import { validateEncounterMonsters } from "@/lib/validation/encounterMonster";

const VALID_MONSTER = {
  id: "mon-1",
  name: "Goblin",
  size: "small" as const,
  type: "humanoid",
  ac: 15,
  hp: 7,
  maxHp: 7,
  speed: "30 ft.",
  abilityScores: {
    strength: 8,
    dexterity: 14,
    constitution: 10,
    intelligence: 10,
    wisdom: 8,
    charisma: 8,
  },
  challengeRating: 0.25,
};

describe("validateEncounterMonsters", () => {
  it("accepts an empty array", () => {
    const result = validateEncounterMonsters([]);
    expect(result.valid).toBe(true);
    if (result.valid) {
      expect(result.value).toEqual([]);
    }
  });

  it("accepts a well-formed monster and returns the parsed value", () => {
    const result = validateEncounterMonsters([VALID_MONSTER]);
    expect(result.valid).toBe(true);
    if (result.valid) {
      expect(result.value).toHaveLength(1);
      expect(result.value[0].name).toBe("Goblin");
    }
  });

  it("rejects a non-array payload", () => {
    const result = validateEncounterMonsters("not-an-array");
    expect(result.valid).toBe(false);
  });

  it("rejects a monster missing required fields", () => {
    const result = validateEncounterMonsters([{ name: "Incomplete" }]);
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.errors.length).toBeGreaterThan(0);
    }
  });

  it("rejects an invalid size enum value", () => {
    const result = validateEncounterMonsters([{ ...VALID_MONSTER, size: "colossal" }]);
    expect(result.valid).toBe(false);
  });

  it("accepts a free-form alignment string (matches upload validation's leniency)", () => {
    // Real imported/library data isn't reliably title-cased (e.g. "lawful evil"),
    // so this is intentionally not a strict enum — see monsterUploadSchema.ts.
    const result = validateEncounterMonsters([{ ...VALID_MONSTER, alignment: "lawful evil" }]);
    expect(result.valid).toBe(true);
  });

  it("accepts a monster with no explicit hp, defaulting it to maxHp", () => {
    const { hp, ...withoutHp } = VALID_MONSTER;
    const result = validateEncounterMonsters([withoutHp]);
    expect(result.valid).toBe(true);
    if (result.valid) {
      expect(result.value[0].hp).toBe(VALID_MONSTER.maxHp);
    }
  });

  it("rejects hp greater than maxHp", () => {
    const result = validateEncounterMonsters([{ ...VALID_MONSTER, hp: 100, maxHp: 10 }]);
    expect(result.valid).toBe(false);
  });

  it("strips unknown keys from the parsed output", () => {
    const result = validateEncounterMonsters([{ ...VALID_MONSTER, unexpectedField: "x" }]);
    expect(result.valid).toBe(true);
    if (result.valid) {
      expect(result.value[0]).not.toHaveProperty("unexpectedField");
    }
  });
});
