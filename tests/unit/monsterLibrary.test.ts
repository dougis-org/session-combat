import { ALL_SRD_MONSTERS } from "../../lib/data/monsters";

const VALID_SIZES = new Set(["tiny", "small", "medium", "large", "huge", "gargantuan"]);
const FULL_ABILITY_KEYS = new Set(["strength", "dexterity", "constitution", "intelligence", "wisdom", "charisma"]);
const ABBREVIATED_KEYS = new Set(["str", "dex", "con", "int", "wis", "cha"]);
const FORBIDDEN_FIELDS = ["armorType", "hitDice", "hitPoints"];
const REQUIRED_FIELDS = ["name", "size", "type", "ac", "hp", "maxHp", "speed", "abilityScores", "challengeRating"];
const ALL_CATEGORIES = [
  "aberration", "beast", "celestial", "construct", "dragon",
  "elemental", "fey", "fiend", "giant", "humanoid",
  "monstrosity", "ooze", "plant", "undead",
];

describe("ALL_SRD_MONSTERS", () => {
  test("is non-empty (> 300 entries)", () => {
    expect(ALL_SRD_MONSTERS.length).toBeGreaterThan(300);
  });

  test("covers all 14 creature categories", () => {
    const types = new Set(ALL_SRD_MONSTERS.map(m => m.type));
    for (const category of ALL_CATEGORIES) {
      expect(types).toContain(category);
    }
  });

  describe("every monster", () => {
    test("has all required fields with non-null values", () => {
      for (const monster of ALL_SRD_MONSTERS) {
        for (const field of REQUIRED_FIELDS) {
          expect(monster).toHaveProperty(field);
          expect((monster as Record<string, unknown>)[field]).not.toBeNull();
          expect((monster as Record<string, unknown>)[field]).not.toBeUndefined();
        }
      }
    });

    test("speed is a non-empty string (not an object)", () => {
      for (const monster of ALL_SRD_MONSTERS) {
        expect(typeof monster.speed).toBe("string");
        expect(monster.speed.length).toBeGreaterThan(0);
      }
    });

    test("abilityScores exists with full key names (not abbreviated)", () => {
      for (const monster of ALL_SRD_MONSTERS) {
        expect(monster.abilityScores).toBeDefined();
        const keys = Object.keys(monster.abilityScores);
        for (const key of keys) {
          expect(ABBREVIATED_KEYS).not.toContain(key);
          expect(FULL_ABILITY_KEYS).toContain(key);
        }
        // All 6 must be present
        for (const key of FULL_ABILITY_KEYS) {
          expect(monster.abilityScores).toHaveProperty(key);
        }
      }
    });

    test("savingThrows uses full key names when present", () => {
      for (const monster of ALL_SRD_MONSTERS) {
        if (!monster.savingThrows) continue;
        for (const key of Object.keys(monster.savingThrows)) {
          expect(ABBREVIATED_KEYS).not.toContain(key);
          expect(FULL_ABILITY_KEYS).toContain(key);
        }
      }
    });

    test("senses is a Record<string, string> when present (not a string)", () => {
      for (const monster of ALL_SRD_MONSTERS) {
        if (monster.senses === undefined || monster.senses === null) continue;
        expect(typeof monster.senses).toBe("object");
        expect(Array.isArray(monster.senses)).toBe(false);
        for (const val of Object.values(monster.senses)) {
          expect(typeof val).toBe("string");
        }
      }
    });

    test("maxHp is a positive number >= hp", () => {
      for (const monster of ALL_SRD_MONSTERS) {
        expect(typeof monster.maxHp).toBe("number");
        expect(monster.maxHp).toBeGreaterThan(0);
        expect(monster.maxHp).toBeGreaterThanOrEqual(monster.hp);
      }
    });

    test("size is lowercase and a valid size value", () => {
      for (const monster of ALL_SRD_MONSTERS) {
        expect(monster.size).toBe(monster.size.toLowerCase());
        expect(VALID_SIZES).toContain(monster.size);
      }
    });

    test("has no forbidden extra fields (armorType, hitDice, hitPoints)", () => {
      for (const monster of ALL_SRD_MONSTERS) {
        const m = monster as Record<string, unknown>;
        for (const field of FORBIDDEN_FIELDS) {
          expect(m[field]).toBeUndefined();
        }
      }
    });
  });
});
