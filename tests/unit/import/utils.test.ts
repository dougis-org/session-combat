import {
  sanitizeHtmlSnippet,
  mapNarrativeEntries,
  titleize,
  getAbilityModifier,
  getProficiencyBonus,
  dedupeStrings,
} from "../../../lib/import/utils";

describe("import/utils", () => {
  describe("sanitizeHtmlSnippet", () => {
    it("should strip HTML tags", () => {
      const input = "<p>Use your <strong>bonus action</strong> to activate.</p>";
      const result = sanitizeHtmlSnippet(input);
      expect(result).toBe("Use your bonus action to activate.");
    });

    it("should normalize whitespace", () => {
      const input = "Use   your\n\nreaction";
      const result = sanitizeHtmlSnippet(input);
      expect(result).toBe("Use your reaction");
    });

    it("should handle empty string", () => {
      const result = sanitizeHtmlSnippet("");
      expect(result).toBe("");
    });

    it("should handle whitespace-only input", () => {
      const result = sanitizeHtmlSnippet("   \n  ");
      expect(result).toBe("");
    });

    it("should handle complex nested HTML", () => {
      const input = "<div><p>Damage: <strong>2d6</strong> <em>fire</em></p></div>";
      const result = sanitizeHtmlSnippet(input);
      expect(result).toBe("Damage: 2d6 fire");
    });

    it("should handle self-closing tags", () => {
      const input = "<p>Line 1<br/>Line 2</p>";
      const result = sanitizeHtmlSnippet(input);
      expect(result).toBe("Line 1 Line 2");
    });

    it("should handle entities (preserve them, then normalize whitespace)", () => {
      const input = "<p>&nbsp;&nbsp;&nbsp;</p>";
      const result = sanitizeHtmlSnippet(input);
      expect(result).toBe("&nbsp;&nbsp;&nbsp;");
    });
  });

  describe("mapNarrativeEntries", () => {
    it("should map traits with title mapping", () => {
      const entries = {
        personalityTraits: "I like gold",
        ideals: "Charity",
        bonds: null,
      };

      const titleMap = {
        personalityTraits: "Personality Traits",
        ideals: "Ideals",
        bonds: "Bonds",
      };

      const result = mapNarrativeEntries(entries, titleMap);

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        name: "Personality Traits",
        description: "I like gold",
      });
      expect(result[1]).toEqual({
        name: "Ideals",
        description: "Charity",
      });
    });

    it("should filter null values", () => {
      const entries = {
        key1: "value1",
        key2: null,
        key3: "value3",
      };

      const titleMap = {
        key1: "Key 1",
        key2: "Key 2",
        key3: "Key 3",
      };

      const result = mapNarrativeEntries(entries, titleMap);

      expect(result).toHaveLength(2);
      expect(result.map((r) => r.description)).toContain("value1");
      expect(result.map((r) => r.description)).toContain("value3");
    });

    it("should filter empty strings", () => {
      const entries = {
        key1: "value1",
        key2: "",
        key3: "   ",
      };

      const titleMap = {
        key1: "Key 1",
        key2: "Key 2",
        key3: "Key 3",
      };

      const result = mapNarrativeEntries(entries, titleMap);

      expect(result).toHaveLength(1);
      expect(result[0].description).toBe("value1");
    });

    it("should fallback to titleize for unmapped keys", () => {
      const entries = {
        appearance: "Tall and blue",
        custom_field: "Custom value",
      };

      const titleMap = {
        appearance: "Appearance",
      };

      const result = mapNarrativeEntries(entries, titleMap);

      expect(result).toHaveLength(2);
      expect(result.find((r) => r.description === "Tall and blue")).toEqual({
        name: "Appearance",
        description: "Tall and blue",
      });
      expect(result.find((r) => r.description === "Custom value")).toEqual({
        name: "Custom Field",
        description: "Custom value",
      });
    });

    it("should handle null entries object", () => {
      const result = mapNarrativeEntries(null, {});
      expect(result).toEqual([]);
    });

    it("should handle undefined entries object", () => {
      const result = mapNarrativeEntries(undefined, {});
      expect(result).toEqual([]);
    });

    it("should trim whitespace from descriptions", () => {
      const entries = {
        key1: "  value with spaces  ",
      };

      const titleMap = {
        key1: "Key 1",
      };

      const result = mapNarrativeEntries(entries, titleMap);

      expect(result[0].description).toBe("value with spaces");
    });

    it("should be provider-agnostic", () => {
      const entries = {
        field1: "content1",
        field2: "content2",
      };

      const customMap = {
        field1: "Custom Name 1",
        field2: "Custom Name 2",
      };

      const result = mapNarrativeEntries(entries, customMap);

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        name: "Custom Name 1",
        description: "content1",
      });
      expect(result[1]).toEqual({
        name: "Custom Name 2",
        description: "content2",
      });
    });
  });

  describe("titleize", () => {
    it("should capitalize words", () => {
      expect(titleize("hello world")).toBe("Hello World");
    });

    it("should handle underscores", () => {
      expect(titleize("hello_world")).toBe("Hello World");
    });

    it("should handle dashes", () => {
      expect(titleize("hello-world")).toBe("Hello World");
    });

    it("should handle mixed delimiters", () => {
      expect(titleize("hello_world-test")).toBe("Hello World Test");
    });
  });

  describe("getAbilityModifier", () => {
    it("should calculate correct modifiers", () => {
      expect(getAbilityModifier(10)).toBe(0);
      expect(getAbilityModifier(11)).toBe(0);
      expect(getAbilityModifier(12)).toBe(1);
      expect(getAbilityModifier(20)).toBe(5);
      expect(getAbilityModifier(8)).toBe(-1);
    });
  });

  describe("getProficiencyBonus", () => {
    it("should calculate correct proficiency bonus", () => {
      expect(getProficiencyBonus(1)).toBe(2);
      expect(getProficiencyBonus(5)).toBe(3);
      expect(getProficiencyBonus(9)).toBe(4);
      expect(getProficiencyBonus(13)).toBe(5);
      expect(getProficiencyBonus(17)).toBe(6);
    });
  });

  describe("dedupeStrings", () => {
    it("should remove duplicates", () => {
      const result = dedupeStrings(["a", "b", "a", "c", "b"]);
      expect(result).toEqual(["a", "b", "c"]);
    });

    it("should remove falsy values", () => {
      const result = dedupeStrings(["a", "", "b", null as any, "a"]);
      expect(result).toEqual(["a", "b"]);
    });
  });
});
