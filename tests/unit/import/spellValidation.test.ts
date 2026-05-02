import { DnDSpellSchool } from "@/lib/types";
import {
  validateSpellName,
  validateSpellLevel,
  validateSpellSchool,
  validateSpellComponents,
  parseSpellSchool,
} from "@/lib/import/spellValidation";

describe("spellValidation", () => {
  describe("validateSpellName", () => {
    it("returns null for valid name", () => {
      expect(validateSpellName("Fireball")).toBeNull();
    });

    it("returns error for empty string", () => {
      expect(validateSpellName("")).toEqual({
        field: "name",
        message: "Spell name is required",
      });
    });

    it("returns error for whitespace-only string", () => {
      expect(validateSpellName("   ")).toEqual({
        field: "name",
        message: "Spell name is required",
      });
    });

    it("returns error for null", () => {
      expect(validateSpellName(null)).toEqual({
        field: "name",
        message: "Spell name is required",
      });
    });

    it("returns error for undefined", () => {
      expect(validateSpellName(undefined)).toEqual({
        field: "name",
        message: "Spell name is required",
      });
    });

    it("returns error for non-string", () => {
      expect(validateSpellName(123)).toEqual({
        field: "name",
        message: "Spell name is required",
      });
    });
  });

  describe("validateSpellLevel", () => {
    it("returns null for valid level 0", () => {
      expect(validateSpellLevel(0)).toBeNull();
    });

    it("returns null for valid level 1-9", () => {
      for (let i = 1; i <= 9; i++) {
        expect(validateSpellLevel(i)).toBeNull();
      }
    });

    it("returns error for undefined", () => {
      expect(validateSpellLevel(undefined)).toEqual({
        field: "level",
        message: "Level is required",
      });
    });

    it("returns error for null", () => {
      expect(validateSpellLevel(null)).toEqual({
        field: "level",
        message: "Level is required",
      });
    });

    it("returns error for negative level", () => {
      expect(validateSpellLevel(-1)).toEqual({
        field: "level",
        message: "Level must be 0-9",
      });
    });

    it("returns error for level > 9", () => {
      expect(validateSpellLevel(10)).toEqual({
        field: "level",
        message: "Level must be 0-9",
      });
    });

    it("returns error for non-number", () => {
      expect(validateSpellLevel("1")).toEqual({
        field: "level",
        message: "Level must be 0-9",
      });
    });
  });

  describe("validateSpellSchool", () => {
    const validSchools: DnDSpellSchool[] = [
      "Abjuration",
      "Conjuration",
      "Divination",
      "Enchantment",
      "Evocation",
      "Illusion",
      "Necromancy",
      "Transmutation",
    ];

    it("returns null for valid schools", () => {
      for (const school of validSchools) {
        expect(validateSpellSchool(school)).toBeNull();
      }
    });

    it("returns error for invalid school", () => {
      expect(validateSpellSchool("InvalidSchool")).toEqual({
        field: "school",
        message: "Invalid spell school",
      });
    });

    it("returns error for null", () => {
      expect(validateSpellSchool(null)).toEqual({
        field: "school",
        message: "Invalid spell school",
      });
    });

    it("returns error for undefined", () => {
      expect(validateSpellSchool(undefined)).toEqual({
        field: "school",
        message: "Invalid spell school",
      });
    });
  });

  describe("validateSpellComponents", () => {
    it("returns null for valid components object", () => {
      expect(validateSpellComponents({ verbal: true })).toBeNull();
    });

    it("returns null for undefined", () => {
      expect(validateSpellComponents(undefined)).toBeNull();
    });

    it("returns null for null", () => {
      expect(validateSpellComponents(null)).toBeNull();
    });

    it("returns error for non-object", () => {
      expect(validateSpellComponents("V,S,M")).toEqual({
        field: "components",
        message: "Components must be an object",
      });
    });

    it("returns null for array (arrays are objects in JS)", () => {
      expect(validateSpellComponents(["V", "S"])).toBeNull();
    });
  });

  describe("parseSpellSchool", () => {
    it("returns the school if valid", () => {
      expect(parseSpellSchool("Evocation")).toBe("Evocation");
    });

    it("returns Evocation as default for invalid school", () => {
      expect(parseSpellSchool("InvalidSchool")).toBe("Evocation");
    });

    it("returns Evocation for null", () => {
      expect(parseSpellSchool(null)).toBe("Evocation");
    });

    it("returns Evocation for undefined", () => {
      expect(parseSpellSchool(undefined)).toBe("Evocation");
    });
  });
});