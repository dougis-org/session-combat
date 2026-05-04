import {
  sumModifierBonusesBySubtype,
  isBonusLikeModifier,
  getModifierNumericValue,
  ABILITY_ID_MAP,
  indexStatValues,
  resolveAbilityScore,
  flattenModifiers,
} from "@/lib/import/dndBeyond-utils";

describe("dndBeyond-utils", () => {
  describe("sumModifierBonusesBySubtype", () => {
    it("aggregates bonus modifiers by subType", () => {
      const modifiers = [
        { type: "bonus", subType: "strength-score", value: 2 } as const,
        { type: "bonus", subType: "strength-score", value: 1 } as const,
        { type: "bonus", subType: "charisma-score", value: 3 } as const,
      ];
      const result = sumModifierBonusesBySubtype(modifiers);
      expect(result["strength-score"]).toBe(3);
      expect(result["charisma-score"]).toBe(3);
    });

    it("skips modifiers with non-numeric values", () => {
      const modifiers = [
        { type: "bonus", subType: "strength-score", value: 2 } as const,
        { type: "bonus", subType: "strength-score", value: null } as const,
        { type: "bonus", subType: "strength-score", fixedValue: 1 } as const,
      ];
      const result = sumModifierBonusesBySubtype(modifiers);
      expect(result["strength-score"]).toBe(3);
    });

    it("skips non-bonus-like modifiers", () => {
      const modifiers = [
        { type: "bonus", subType: "strength-score", value: 2 } as const,
        { type: "proficiency", subType: "strength-saving-throws", value: 1 } as const,
        { type: "language", subType: "elvish", value: null } as const,
      ];
      const result = sumModifierBonusesBySubtype(modifiers);
      expect(result["strength-score"]).toBe(2);
      expect(result["strength-saving-throws"]).toBeUndefined();
      expect(result["elvish"]).toBeUndefined();
    });

    it("skips modifiers without a subType", () => {
      const modifiers = [
        { type: "bonus", subType: "strength-score", value: 2 } as const,
        { type: "bonus", subType: null, value: 1 } as const,
      ];
      const result = sumModifierBonusesBySubtype(modifiers);
      expect(result["strength-score"]).toBe(2);
      expect(result["null"]).toBeUndefined();
    });

    it("returns empty object for empty array", () => {
      const result = sumModifierBonusesBySubtype([]);
      expect(result).toEqual({});
    });

    it("returns empty object when all modifiers are skipped", () => {
      const modifiers = [
        { type: "proficiency", subType: "strength-saving-throws", value: 1 } as const,
        { type: "language", subType: null, value: null } as const,
      ];
      const result = sumModifierBonusesBySubtype(modifiers);
      expect(result).toEqual({});
    });
  });

  describe("isBonusLikeModifier", () => {
    it("returns true for bonus type", () => {
      expect(isBonusLikeModifier({ type: "bonus" })).toBe(true);
    });

    it("returns true for set-base type", () => {
      expect(isBonusLikeModifier({ type: "set-base" })).toBe(true);
    });

    it("returns false for other types", () => {
      expect(isBonusLikeModifier({ type: "proficiency" })).toBe(false);
      expect(isBonusLikeModifier({ type: "expertise" })).toBe(false);
      expect(isBonusLikeModifier({ type: "language" })).toBe(false);
      expect(isBonusLikeModifier({ type: undefined })).toBe(false);
    });
  });

  describe("getModifierNumericValue", () => {
    it("returns value when it's a number", () => {
      expect(getModifierNumericValue({ value: 5 })).toBe(5);
    });

    it("returns fixedValue when value is not a number", () => {
      expect(getModifierNumericValue({ value: null, fixedValue: 3 })).toBe(3);
    });

    it("returns null when both are non-numeric", () => {
      expect(getModifierNumericValue({ value: null, fixedValue: null })).toBeNull();
      expect(getModifierNumericValue({ value: undefined, fixedValue: undefined })).toBeNull();
    });
  });

  describe("indexStatValues", () => {
    it("creates map of stat id to value", () => {
      const stats = [
        { id: 1, value: 10 },
        { id: 2, value: 14 },
        { id: 3, value: null },
      ] as const;
      const result = indexStatValues(stats);
      expect(result.get(1)).toBe(10);
      expect(result.get(2)).toBe(14);
      expect(result.has(3)).toBe(false);
    });

    it("returns empty map for null/undefined input", () => {
      expect(indexStatValues(null).size).toBe(0);
      expect(indexStatValues(undefined).size).toBe(0);
    });
  });

  describe("resolveAbilityScore", () => {
    it("returns override when available", () => {
      const baseScores = new Map([[1, 10]]);
      const bonusScores = new Map([[1, 2]]);
      const overrideScores = new Map([[1, 15]]);
      const scoreBonuses = {};

      const result = resolveAbilityScore(1, "strength", baseScores, bonusScores, overrideScores, scoreBonuses);
      expect(result).toBe(15);
    });

    it("combines base, bonus, and score bonus", () => {
      const baseScores = new Map([[1, 10]]);
      const bonusScores = new Map([[1, 2]]);
      const overrideScores = new Map();
      const scoreBonuses = { "strength-score": 1 };

      const result = resolveAbilityScore(1, "strength", baseScores, bonusScores, overrideScores, scoreBonuses);
      expect(result).toBe(13);
    });

    it("throws when base value is missing", () => {
      const baseScores = new Map();
      const bonusScores = new Map();
      const overrideScores = new Map();
      const scoreBonuses = {};

      expect(() =>
        resolveAbilityScore(1, "strength", baseScores, bonusScores, overrideScores, scoreBonuses)
      ).toThrow(/missing strength data/i);
    });
  });

  describe("ABILITY_ID_MAP", () => {
    it("maps all six ability IDs", () => {
      expect(ABILITY_ID_MAP[1]).toBe("strength");
      expect(ABILITY_ID_MAP[2]).toBe("dexterity");
      expect(ABILITY_ID_MAP[3]).toBe("constitution");
      expect(ABILITY_ID_MAP[4]).toBe("intelligence");
      expect(ABILITY_ID_MAP[5]).toBe("wisdom");
      expect(ABILITY_ID_MAP[6]).toBe("charisma");
    });
  });

  describe("flattenModifiers", () => {
    it("returns empty array for undefined input", () => {
      expect(flattenModifiers(undefined)).toEqual([]);
    });

    it("returns empty array for null input", () => {
      expect(flattenModifiers(null)).toEqual([]);
    });

    it("returns empty array when modifier groups are empty object", () => {
      expect(flattenModifiers({})).toEqual([]);
    });

    it("flattens multiple modifier arrays into single array", () => {
      const modifierGroups: Record<string, { type: "bonus"; subType: string; value: number }[] | null> = {
        strength: [{ type: "bonus", subType: "strength-score", value: 2 }],
        dexterity: [{ type: "bonus", subType: "dexterity-score", value: 1 }],
      };
      const result = flattenModifiers(modifierGroups);
      expect(result).toHaveLength(2);
      expect(result[0].subType).toBe("strength-score");
      expect(result[1].subType).toBe("dexterity-score");
    });

    it("skips null arrays in modifier groups", () => {
      const modifierGroups: Record<string, { type: "bonus"; subType: string; value: number }[] | null> = {
        strength: [{ type: "bonus", subType: "strength-score", value: 2 }],
        dexterity: null,
      };
      const result = flattenModifiers(modifierGroups);
      expect(result).toHaveLength(1);
      expect(result[0].subType).toBe("strength-score");
    });

    it("skips undefined arrays in modifier groups", () => {
      const modifierGroups: Record<string, { type: "bonus"; subType: string; value: number }[] | null | undefined> = {
        strength: undefined,
        charisma: [{ type: "bonus", subType: "charisma-score", value: 3 }],
      };
      const result = flattenModifiers(modifierGroups);
      expect(result).toHaveLength(1);
      expect(result[0].subType).toBe("charisma-score");
    });
  });
});