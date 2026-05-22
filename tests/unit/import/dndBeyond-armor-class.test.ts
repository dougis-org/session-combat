import {
  normalizeArmorClass,
  getArmorBonuses,
  getUnarmoredAcBonus,
  DNDEBEYOND_ARMOR_TYPE_MAX_DEX_MODIFIER,
} from "@/lib/import/dndBeyond-armor-class";

interface MockDndBeyondModifier {
  type?: "bonus" | "set" | "set-base" | null;
  subType?: string | null;
  fixedValue?: number | null;
  value?: number | null;
}

interface MockDndBeyondInventoryEntry {
  equipped?: boolean | null;
  definition?: {
    armorClass?: number | null;
    armorTypeId?: number | null;
    baseArmorName?: string | null;
  } | null;
}

describe("dndBeyond-armor-class", () => {
  describe("normalizeArmorClass", () => {
    const baseAbilityScores = {
      strength: 10,
      dexterity: 17,
      constitution: 10,
      intelligence: 10,
      wisdom: 10,
      charisma: 10,
    };

    it("Given: medium armor (AC 11, max dex +2), dex +3, no bonuses; When: AC calculated; Then: returns 13", () => {
      const inventory: MockDndBeyondInventoryEntry[] = [
        {
          equipped: true,
          definition: {
            armorClass: 11,
            armorTypeId: 2, // medium
          },
        },
      ];
      const result = normalizeArmorClass(inventory, baseAbilityScores, []);
      expect(result).toBe(13); // 11 + min(3, 2) + 0 = 13
    });

    it("Given: plate armor (AC 18, heavy, max dex 0), dex +3; When: AC calculated; Then: returns 18", () => {
      const inventory: MockDndBeyondInventoryEntry[] = [
        {
          equipped: true,
          definition: {
            armorClass: 18,
            armorTypeId: 3, // heavy
          },
        },
      ];
      const result = normalizeArmorClass(inventory, baseAbilityScores, []);
      expect(result).toBe(18); // 18 + min(3, 0) = 18
    });

    it("Given: inventory with shield (armorTypeId 4, AC 2) before actual armor; When: AC calculated; Then: uses actual armor, not shield", () => {
      const inventory: MockDndBeyondInventoryEntry[] = [
        {
          equipped: true,
          definition: {
            armorClass: 2,
            armorTypeId: 4, // shield
          },
        },
        {
          equipped: true,
          definition: {
            armorClass: 14,
            armorTypeId: 2, // medium armor
          },
        },
      ];
      const result = normalizeArmorClass(inventory, baseAbilityScores, []);
      expect(result).toBe(16); // 14 (armor) + min(3, 2) (dex cap) = 16, not 2 + 3 = 5
    });

    it("Given: no armor (null inventory), dex 17 (+3 mod); When: unarmored AC calculated; Then: returns 13 (10 + dex +3)", () => {
      const result = normalizeArmorClass(null, baseAbilityScores, []);
      expect(result).toBe(13); // 10 + 3 (dex mod from +17 dex score)
    });

    it("Given: no armor, armor-class bonus +1; When: AC calculated; Then: bonus added correctly", () => {
      const modifiers: MockDndBeyondModifier[] = [
        { type: "bonus", subType: "armor-class", value: 1 },
      ];
      const result = normalizeArmorClass(null, baseAbilityScores, modifiers);
      expect(result).toBe(14); // 10 + 3 (dex) + 1 (armor-class bonus)
    });

    it("Given: no armor, unarmored AC bonus (set to 2); When: AC calculated; Then: set bonus added to base formula", () => {
      const modifiers: MockDndBeyondModifier[] = [
        { type: "set", subType: "unarmored-armor-class", value: 2 },
      ];
      const result = normalizeArmorClass(null, baseAbilityScores, modifiers);
      expect(result).toBe(15); // 10 + 3 (dex) + 2 (unarmored set)
    });

    it("Given: armored, armor bonus +1, other modifiers; When: AC calculated; Then: only armor-class bonuses summed", () => {
      const inventory: MockDndBeyondInventoryEntry[] = [
        {
          equipped: true,
          definition: {
            armorClass: 14,
            armorTypeId: 2,
          },
        },
      ];
      const modifiers: MockDndBeyondModifier[] = [
        { type: "bonus", subType: "armor-class", value: 1 },
        { type: "bonus", subType: "other-subtype", value: 5 }, // should be ignored
      ];
      const result = normalizeArmorClass(inventory, baseAbilityScores, modifiers);
      expect(result).toBe(17); // 14 + min(3, 2) + 1 = 17
    });

    it("Given: no equipped armor in inventory (has armor but not equipped); When: AC calculated; Then: uses unarmored calculation", () => {
      const inventory: MockDndBeyondInventoryEntry[] = [
        {
          equipped: false,
          definition: {
            armorClass: 15,
            armorTypeId: 2,
          },
        },
      ];
      const result = normalizeArmorClass(inventory, baseAbilityScores, []);
      expect(result).toBe(13); // 10 + 3 (unarmored dex)
    });
  });

  describe("getArmorBonuses", () => {
    it("Given: modifiers with armor-class subtype; When: bonuses extracted; Then: values summed", () => {
      const modifiers: MockDndBeyondModifier[] = [
        { type: "bonus", subType: "armor-class", value: 1 },
        { type: "bonus", subType: "armor-class", value: 2 },
      ];
      const result = getArmorBonuses(modifiers);
      expect(result).toBe(3);
    });

    it("Given: empty modifier list; When: bonuses extracted; Then: returns 0", () => {
      const result = getArmorBonuses([]);
      expect(result).toBe(0);
    });

    it("Given: modifiers with null values; When: bonuses extracted; Then: nulls treated as 0", () => {
      const modifiers: MockDndBeyondModifier[] = [
        { type: "bonus", subType: "armor-class", value: null },
        { type: "bonus", subType: "armor-class", value: 1 },
      ];
      const result = getArmorBonuses(modifiers);
      expect(result).toBe(1);
    });

    it("Given: mixed modifier types; When: bonuses extracted; Then: only armor-class filtered", () => {
      const modifiers: MockDndBeyondModifier[] = [
        { type: "bonus", subType: "armor-class", value: 2 },
        { type: "bonus", subType: "unarmored-armor-class", value: 5 },
        { type: "bonus", subType: "other", value: 10 },
      ];
      const result = getArmorBonuses(modifiers);
      expect(result).toBe(2);
    });
  });

  describe("getUnarmoredAcBonus", () => {
    it("Given: single set modifier; When: bonus extracted; Then: returns set value", () => {
      const modifiers: MockDndBeyondModifier[] = [
        { type: "set", subType: "unarmored-armor-class", value: 16 },
      ];
      const result = getUnarmoredAcBonus(modifiers);
      expect(result).toBe(16);
    });

    it("Given: multiple set modifiers; When: bonus extracted; Then: returns max set value", () => {
      const modifiers: MockDndBeyondModifier[] = [
        { type: "set", subType: "unarmored-armor-class", value: 14 },
        { type: "set", subType: "unarmored-armor-class", value: 16 },
        { type: "set", subType: "unarmored-armor-class", value: 15 },
      ];
      const result = getUnarmoredAcBonus(modifiers);
      expect(result).toBe(16);
    });

    it("Given: single bonus modifier; When: bonus extracted; Then: returns bonus value", () => {
      const modifiers: MockDndBeyondModifier[] = [
        { type: "bonus", subType: "unarmored-armor-class", value: 2 },
      ];
      const result = getUnarmoredAcBonus(modifiers);
      expect(result).toBe(2);
    });

    it("Given: set + bonus combined; When: bonus extracted; Then: returns set + bonus", () => {
      const modifiers: MockDndBeyondModifier[] = [
        { type: "set", subType: "unarmored-armor-class", value: 13 },
        { type: "bonus", subType: "unarmored-armor-class", value: 2 },
      ];
      const result = getUnarmoredAcBonus(modifiers);
      expect(result).toBe(15); // 13 + 2
    });

    it("Given: empty list; When: bonus extracted; Then: returns 0", () => {
      const result = getUnarmoredAcBonus([]);
      expect(result).toBe(0);
    });

    it("Given: non-unarmored modifiers; When: bonus extracted; Then: returns 0", () => {
      const modifiers: MockDndBeyondModifier[] = [
        { type: "bonus", subType: "armor-class", value: 2 },
        { type: "bonus", subType: "other", value: 5 },
      ];
      const result = getUnarmoredAcBonus(modifiers);
      expect(result).toBe(0);
    });
  });

  describe("armor type rules with sample character modifiers", () => {
    // Sample character: dex 17 (+3 mod), item modifiers include +1+1 armor-class bonus (+2 total)
    const sampleAbilityScores = {
      strength: 10,
      dexterity: 17,
      constitution: 14,
      intelligence: 16,
      wisdom: 10,
      charisma: 21,
    };
    const itemArmorBonuses = [
      { type: "bonus" as const, subType: "armor-class", value: 1, fixedValue: null, friendlySubtypeName: null },
      { type: "bonus" as const, subType: "armor-class", value: 1, fixedValue: null, friendlySubtypeName: null },
    ];

    it("Given: medium armor (AC 14, armorTypeId 2), sample character; When: AC calculated; Then: returns 18", () => {
      const inventory = [{ equipped: true, definition: { armorClass: 14, armorTypeId: 2 } }];
      expect(normalizeArmorClass(inventory, sampleAbilityScores, itemArmorBonuses)).toBe(18);
      // 14 + min(3, 2) + 2 = 18
    });

    it("Given: heavy armor (AC 16, armorTypeId 3), sample character; When: AC calculated; Then: returns 18", () => {
      const inventory = [{ equipped: true, definition: { armorClass: 16, armorTypeId: 3 } }];
      expect(normalizeArmorClass(inventory, sampleAbilityScores, itemArmorBonuses)).toBe(18);
      // 16 + min(3, 0) + 2 = 18
    });

    it("Given: no armor, sample character; When: AC calculated; Then: returns 15", () => {
      expect(normalizeArmorClass([], sampleAbilityScores, itemArmorBonuses)).toBe(15);
      // 10 + 3 + 0 (no unarmored bonus) + 2 = 15
    });
  });

  describe("unarmored AC modifiers with base dex 16 (+3 mod)", () => {
    const dex16Scores = {
      strength: 10,
      dexterity: 16,
      constitution: 10,
      intelligence: 10,
      wisdom: 10,
      charisma: 10,
    };

    it("Given: set unarmored-armor-class modifier value 3; When: AC calculated; Then: returns 16", () => {
      const modifiers = [{ type: "set" as const, subType: "unarmored-armor-class", value: 3, fixedValue: null, friendlySubtypeName: null }];
      expect(normalizeArmorClass([], dex16Scores, modifiers)).toBe(16);
      // 10 + 3 + 3 = 16
    });

    it("Given: bonus unarmored-armor-class modifier value 2; When: AC calculated; Then: returns 15", () => {
      const modifiers = [{ type: "bonus" as const, subType: "unarmored-armor-class", value: 2, fixedValue: null, friendlySubtypeName: null }];
      expect(normalizeArmorClass([], dex16Scores, modifiers)).toBe(15);
      // 10 + 3 + 2 = 15
    });

    it("Given: set value 3 and bonus value 2; When: AC calculated; Then: returns 18", () => {
      const modifiers = [
        { type: "set" as const, subType: "unarmored-armor-class", value: 3, fixedValue: null, friendlySubtypeName: null },
        { type: "bonus" as const, subType: "unarmored-armor-class", value: 2, fixedValue: null, friendlySubtypeName: null },
      ];
      expect(normalizeArmorClass([], dex16Scores, modifiers)).toBe(18);
      // 10 + 3 + 2 + 3 = 18
    });

    it("Given: two set modifiers (values 1 and 3); When: AC calculated; Then: uses max set regardless of order", () => {
      const makeModifiers = (values: number[]) =>
        values.map((value) => ({ type: "set" as const, subType: "unarmored-armor-class", value, fixedValue: null, friendlySubtypeName: null }));

      expect(normalizeArmorClass([], dex16Scores, makeModifiers([1, 3]))).toBe(16);
      expect(normalizeArmorClass([], dex16Scores, makeModifiers([3, 1]))).toBe(16);
      // 10 + 3 (max set) + 3 (dex) = 16
    });
  });

  describe("DNDEBEYOND_ARMOR_TYPE_MAX_DEX_MODIFIER", () => {
    it("Given: medium armor type ID (2); When: constant accessed; Then: returns 2", () => {
      expect(DNDEBEYOND_ARMOR_TYPE_MAX_DEX_MODIFIER[2]).toBe(2);
    });

    it("Given: heavy armor type ID (3); When: constant accessed; Then: returns 0", () => {
      expect(DNDEBEYOND_ARMOR_TYPE_MAX_DEX_MODIFIER[3]).toBe(0);
    });

    it("Given: unknown armor type ID; When: constant accessed; Then: returns undefined", () => {
      expect(DNDEBEYOND_ARMOR_TYPE_MAX_DEX_MODIFIER[999]).toBeUndefined();
    });
  });
});
