import {
  validateMonsterData,
  RawMonsterData,
} from "@/lib/validation/monsterUpload";

const VALID_ABILITY_SCORES = {
  strength: 10,
  dexterity: 11,
  constitution: 12,
  intelligence: 13,
  wisdom: 14,
  charisma: 15,
};

const VALID_SIZES = ["tiny", "small", "medium", "large", "huge", "gargantuan"];
const INVALID_SIZE = "enormous";
const VALID_AC_VALUES = [0, 10, 20, 30];
const INVALID_AC = 40;
const VALID_LANGUAGES = ["Common", "Draconic", "Infernal"];
const VALID_TRAIT = {
  name: "Legendary Action",
  description: "The creature can take a legendary action",
};

const createRawMonster = (overrides?: Partial<RawMonsterData>): RawMonsterData => ({
  name: "Test Monster",
  maxHp: 10,
  ...overrides,
});

describe("validateMonsterData", () => {
  describe("required fields", () => {
    it("should require name", () => {
      const data: RawMonsterData = { maxHp: 10 };
      const result = validateMonsterData(data);

      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          field: expect.stringContaining("name"),
        }),
      );
    });

    it("should reject empty string name", () => {
      const data: RawMonsterData = { name: "", maxHp: 10 };
      const result = validateMonsterData(data);

      expect(result.valid).toBe(false);
    });

    it("should require maxHp", () => {
      const data: RawMonsterData = { name: "Goblin" };
      const result = validateMonsterData(data);

      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          field: expect.stringContaining("maxHp"),
        }),
      );
    });

    it("should reject maxHp <= 0", () => {
      const data: RawMonsterData = { name: "Goblin", maxHp: 0 };
      const result = validateMonsterData(data);

      expect(result.valid).toBe(false);
    });
  });

  describe("optional fields with validation", () => {
    it("should accept valid size values", () => {
      for (const size of VALID_SIZES) {
        const data = createRawMonster({ size });
        const result = validateMonsterData(data);

        expect(result.valid).toBe(true);
      }
    });

    it("should reject invalid size values", () => {
      const data = createRawMonster({ size: INVALID_SIZE });
      const result = validateMonsterData(data);

      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          field: expect.stringContaining("size"),
        }),
      );
    });

    it("should accept valid AC values (0-30)", () => {
      for (const ac of VALID_AC_VALUES) {
        const data = createRawMonster({ ac });
        const result = validateMonsterData(data);

        expect(result.valid).toBe(true);
      }
    });

    it("should reject AC outside valid range", () => {
      const data = createRawMonster({ ac: INVALID_AC });
      const result = validateMonsterData(data);

      expect(result.valid).toBe(false);
    });

    it("should accept valid challengeRating values", () => {
      const data: RawMonsterData = {
        name: "Test",
        maxHp: 10,
        challengeRating: 5,
      };
      const result = validateMonsterData(data);

      expect(result.valid).toBe(true);
    });

    it("should reject negative challengeRating", () => {
      const data: RawMonsterData = {
        name: "Test",
        maxHp: 10,
        challengeRating: -1,
      };
      const result = validateMonsterData(data);

      expect(result.valid).toBe(false);
    });
  });

  describe("ability scores", () => {
    it("should accept valid ability scores", () => {
      const data: RawMonsterData = createRawMonster({
        abilityScores: VALID_ABILITY_SCORES,
      });
      const result = validateMonsterData(data);

      expect(result.valid).toBe(true);
    });

    it("should reject missing ability score fields", () => {
      const data: RawMonsterData = {
        name: "Test",
        maxHp: 10,
        abilityScores: {
          strength: 10,
          dexterity: 11,
          // missing others
        },
      };
      const result = validateMonsterData(data);

      expect(result.valid).toBe(false);
    });

    it("should reject ability scores outside valid range (1-30)", () => {
      const data: RawMonsterData = {
        name: "Test",
        maxHp: 10,
        abilityScores: {
          strength: 40,
          dexterity: 10,
          constitution: 10,
          intelligence: 10,
          wisdom: 10,
          charisma: 10,
        },
      };
      const result = validateMonsterData(data);

      expect(result.valid).toBe(false);
    });
  });

  describe("array fields", () => {
    it("should accept empty arrays for optional arrays", () => {
      const data: RawMonsterData = {
        name: "Test",
        maxHp: 10,
        languages: [],
        traits: [],
      };
      const result = validateMonsterData(data);

      expect(result.valid).toBe(true);
    });

    it("should accept valid language arrays", () => {
      const data = createRawMonster({
        languages: VALID_LANGUAGES,
      });
      const result = validateMonsterData(data);

      expect(result.valid).toBe(true);
    });

    it("should reject non-string values in language arrays", () => {
      const data = createRawMonster({
        languages: ["Common", 123 as any],
      });
      const result = validateMonsterData(data);

      expect(result.valid).toBe(false);
    });

    it("should accept valid traits with name and description", () => {
      const data = createRawMonster({
        traits: [VALID_TRAIT],
      });
      const result = validateMonsterData(data);

      expect(result.valid).toBe(true);
    });

    it("should reject traits without required fields", () => {
      const data = createRawMonster({
        traits: [{ name: "Keen Smell" }] as any,
      });
      const result = validateMonsterData(data);

      expect(result.valid).toBe(false);
    });
  });

  describe("legendaryActionCount validation", () => {
    it("should accept valid legendaryActionCount", () => {
      const raw: RawMonsterData = { name: "Test", maxHp: 10, legendaryActionCount: 3 };
      const result = validateMonsterData(raw);
      expect(result.valid).toBe(true);
    });

    it("should reject non-integer legendaryActionCount", () => {
      const raw: RawMonsterData = { name: "Test", maxHp: 10, legendaryActionCount: 1.5 };
      const result = validateMonsterData(raw);
      expect(result.valid).toBe(false);
      expect(result.errors[0].field).toContain("legendaryActionCount");
    });

    it("should reject negative legendaryActionCount", () => {
      const raw: RawMonsterData = { name: "Test", maxHp: 10, legendaryActionCount: -1 };
      const result = validateMonsterData(raw);
      expect(result.valid).toBe(false);
      expect(result.errors[0].field).toContain("legendaryActionCount");
    });

    it("should reject string legendaryActionCount", () => {
      const raw: RawMonsterData = { name: "Test", maxHp: 10, legendaryActionCount: "three" as unknown as number };
      const result = validateMonsterData(raw);
      expect(result.valid).toBe(false);
      expect(result.errors[0].field).toContain("legendaryActionCount");
    });

    it("should reject NaN legendaryActionCount", () => {
      const raw: RawMonsterData = { name: "Test", maxHp: 10, legendaryActionCount: NaN };
      const result = validateMonsterData(raw);
      expect(result.valid).toBe(false);
      expect(result.errors[0].field).toContain("legendaryActionCount");
    });
  });
});
