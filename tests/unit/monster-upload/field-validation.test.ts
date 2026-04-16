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

const expectValid = (data: RawMonsterData) => {
  expect(validateMonsterData(data).valid).toBe(true);
};

const expectInvalid = (data: any) => {
  expect(validateMonsterData(data).valid).toBe(false);
};

const expectInvalidField = (data: any, field: string) => {
  const result = validateMonsterData(data);
  expect(result.valid).toBe(false);
  expect(result.errors[0].field).toContain(field);
};

describe("validateMonsterData", () => {
  describe("required fields", () => {
    it("should require name", () => {
      const result = validateMonsterData({ maxHp: 10 } as any);
      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({ field: expect.stringContaining("name") }),
      );
    });

    it("should reject empty string name", () => {
      expectInvalid({ name: "", maxHp: 10 });
    });

    it("should require maxHp", () => {
      const result = validateMonsterData({ name: "Goblin" } as any);
      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({ field: expect.stringContaining("maxHp") }),
      );
    });

    it("should reject maxHp <= 0", () => {
      expectInvalid({ name: "Goblin", maxHp: 0 });
    });
  });

  describe("optional fields with validation", () => {
    it("should accept valid size values", () => {
      for (const size of VALID_SIZES) {
        expectValid(createRawMonster({ size }));
      }
    });

    it("should reject invalid size values", () => {
      const result = validateMonsterData(createRawMonster({ size: INVALID_SIZE }));
      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({ field: expect.stringContaining("size") }),
      );
    });

    it("should accept valid AC values (0-30)", () => {
      for (const ac of VALID_AC_VALUES) {
        expectValid(createRawMonster({ ac }));
      }
    });

    it("should reject AC outside valid range", () => {
      expectInvalid(createRawMonster({ ac: INVALID_AC }));
    });

    it("should accept valid challengeRating values", () => {
      expectValid(createRawMonster({ challengeRating: 5 }));
    });

    it("should reject negative challengeRating", () => {
      expectInvalid(createRawMonster({ challengeRating: -1 }));
    });
  });

  describe("ability scores", () => {
    it("should accept valid ability scores", () => {
      expectValid(createRawMonster({ abilityScores: VALID_ABILITY_SCORES }));
    });

    it("should reject missing ability score fields", () => {
      expectInvalid(createRawMonster({ abilityScores: { strength: 10, dexterity: 11 } as any }));
    });

    it("should reject ability scores outside valid range (1-30)", () => {
      expectInvalid(createRawMonster({
        abilityScores: { strength: 40, dexterity: 10, constitution: 10, intelligence: 10, wisdom: 10, charisma: 10 },
      }));
    });
  });

  describe("array fields", () => {
    it("should accept empty arrays for optional arrays", () => {
      expectValid(createRawMonster({ languages: [], traits: [] }));
    });

    it("should accept valid language arrays", () => {
      expectValid(createRawMonster({ languages: VALID_LANGUAGES }));
    });

    it("should reject non-string values in language arrays", () => {
      expectInvalid(createRawMonster({ languages: ["Common", 123 as any] }));
    });

    it("should accept valid traits with name and description", () => {
      expectValid(createRawMonster({ traits: [VALID_TRAIT] }));
    });

    it("should reject traits without required fields", () => {
      expectInvalid(createRawMonster({ traits: [{ name: "Keen Smell" }] as any }));
    });
  });

  describe("legendaryActionCount validation", () => {
    it("should accept valid legendaryActionCount", () => {
      expectValid(createRawMonster({ legendaryActionCount: 3 }));
    });

    it("should accept legendaryActionCount of 0", () => {
      expectValid(createRawMonster({ legendaryActionCount: 0 }));
    });

    it("should accept omitted legendaryActionCount", () => {
      expectValid(createRawMonster());
    });

    it("should reject non-integer legendaryActionCount", () => {
      expectInvalidField(createRawMonster({ legendaryActionCount: 1.5 }), "legendaryActionCount");
    });

    it("should reject negative legendaryActionCount", () => {
      expectInvalidField(createRawMonster({ legendaryActionCount: -1 }), "legendaryActionCount");
    });

    it("should reject string legendaryActionCount", () => {
      expectInvalidField(createRawMonster({ legendaryActionCount: "three" as unknown as number }), "legendaryActionCount");
    });

    it("should reject NaN legendaryActionCount", () => {
      expectInvalidField(createRawMonster({ legendaryActionCount: NaN }), "legendaryActionCount");
    });
  });
});
