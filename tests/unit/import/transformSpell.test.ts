import { Open5ESpell } from "@/lib/import/open5eAdapter";
import { transformSpell } from "@/lib/import/transformSpell";
import { GLOBAL_USER_ID } from "@/lib/constants";
import { createBaseSpell } from "./testFactories";

describe("transformSpell", () => {
  describe("school mapping", () => {
    const SCHOOLS: Array<{ input: { Name: string; key: string }; expected: string }> = [
      { input: { Name: "Abjuration", key: "abjuration" }, expected: "Abjuration" },
      { input: { Name: "Conjuration", key: "conjuration" }, expected: "Conjuration" },
      { input: { Name: "Divination", key: "divination" }, expected: "Divination" },
      { input: { Name: "Enchantment", key: "enchantment" }, expected: "Enchantment" },
      { input: { Name: "Evocation", key: "evocation" }, expected: "Evocation" },
      { input: { Name: "Illusion", key: "illusion" }, expected: "Illusion" },
      { input: { Name: "Necromancy", key: "necromancy" }, expected: "Necromancy" },
      { input: { Name: "Transmutation", key: "transmutation" }, expected: "Transmutation" },
      { input: { Name: "Unknown", key: "unknown" }, expected: "Evocation" },
    ];

    test.each(SCHOOLS)("maps '$input.key' to '$expected'", ({ input, expected }) => {
      const raw = createBaseSpell({ school: input });
      const { spell } = transformSpell(raw);
      expect(spell.school).toBe(expected);
    });

    it("handles string school for backwards compatibility", () => {
      const raw = createBaseSpell({ school: "divination" as unknown as { Name: string; key: string } });
      const { spell } = transformSpell(raw);
      expect(spell.school).toBe("Divination");
    });

    it("defaults to Evocation for invalid school object", () => {
      const raw = createBaseSpell({ school: { Name: "Invalid", key: "invalid_school" } });
      const { spell } = transformSpell(raw);
      expect(spell.school).toBe("Evocation");
    });
  });

  describe("components", () => {
    it("uses boolean flags from API", () => {
      const raw = createBaseSpell({ verbal: true, somatic: false, material: false });
      const { spell } = transformSpell(raw);
      expect(spell.components).toEqual({ verbal: true, somatic: false, material: false });
    });

    it("handles all components true", () => {
      const raw = createBaseSpell({ verbal: true, somatic: true, material: true });
      const { spell } = transformSpell(raw);
      expect(spell.components).toEqual({ verbal: true, somatic: true, material: true });
    });

    it("handles all components false", () => {
      const raw = createBaseSpell({ verbal: false, somatic: false, material: false });
      const { spell } = transformSpell(raw);
      expect(spell.components).toEqual({ verbal: false, somatic: false, material: false });
    });
  });

  describe("validation", () => {
    it("returns valid=true for complete spell", () => {
      const raw: Open5ESpell = {
        key: "fireball",
        name: "Fireball",
        level: 3,
        school: { Name: "Evocation", key: "evocation" },
        concentration: true,
        casting_time: "1 action",
        range: 150,
        range_text: "150 feet",
        duration: "Concentration, up to 1 minute",
        verbal: true,
        somatic: true,
        material: true,
        desc: "A bright streak flashes from your pointing finger",
        higher_level: "When you cast this spell using a 4th-level slot",
      };
      const result = transformSpell(raw);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("returns valid=false for missing name", () => {
      const raw = createBaseSpell({ name: "" });
      const result = transformSpell(raw);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain("Missing required field: name");
    });

    it("returns valid=false for missing level", () => {
      const raw = createBaseSpell({ level: undefined as unknown as number });
      const result = transformSpell(raw);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain("Missing required field: level");
    });

    it("returns valid=false for null level", () => {
      const raw = createBaseSpell({ level: null as unknown as number });
      const result = transformSpell(raw);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain("Missing required field: level");
    });

    it("collects multiple errors", () => {
      const raw = createBaseSpell({
        name: "",
        level: undefined as unknown as number,
      });
      const result = transformSpell(raw);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe("spell structure", () => {
    it("creates spell with all fields", () => {
      const raw: Open5ESpell = {
        key: "magic-missile",
        name: "Magic Missile",
        level: 1,
        school: { Name: "Evocation", key: "evocation" },
        concentration: false,
        casting_time: "1 action",
        range: 120,
        range_text: "120 feet",
        duration: "Instantaneous",
        verbal: true,
        somatic: true,
        material: false,
        desc: "You create three glowing darts",
        higher_level: "When you cast this spell using a spell slot of 2nd level or higher",
      };

      const { spell } = transformSpell(raw);

      expect(spell.id).toBeDefined();
      expect(spell.userId).toBe(GLOBAL_USER_ID);
      expect(spell.name).toBe("Magic Missile");
      expect(spell.level).toBe(1);
      expect(spell.concentration).toBe(false);
      expect(spell.school).toBe("Evocation");
      expect(spell.description).toBe("You create three glowing darts");
      expect(spell.castingTime).toBe("1 action");
      expect(spell.range).toBe("120 feet");
      expect(spell.duration).toBe("Instantaneous");
      expect(spell.components).toEqual({ verbal: true, somatic: true, material: false });
      expect(spell.higherLevel).toBe("When you cast this spell using a spell slot of 2nd level or higher");
      expect(spell.isGlobal).toBe(true);
      expect(spell.source).toBe("open5e");
      expect(spell.createdAt).toBeInstanceOf(Date);
      expect(spell.updatedAt).toBeInstanceOf(Date);
    });

    it("applies defaults for missing optional fields", () => {
      const raw = createBaseSpell({
        level: 0,
        school: { Name: "Divination", key: "divination" },
        casting_time: "",
        range: 0,
        range_text: "Self",
        duration: "",
        verbal: false,
        somatic: false,
        material: false,
        desc: "",
      });

      const { spell } = transformSpell(raw);

      expect(spell.name).toBe("Test Spell");
      expect(spell.level).toBe(0);
      expect(spell.concentration).toBe(false);
      expect(spell.school).toBe("Divination");
      expect(spell.description).toBe("");
      expect(spell.castingTime).toBe("1 action");
      expect(spell.range).toBe("Self");
      expect(spell.duration).toBe("Instantaneous");
      expect(spell.components).toEqual({ verbal: false, somatic: false, material: false });
      expect(spell.higherLevel).toBeUndefined();
    });

    it("uses range_text when available, falls back to range ft", () => {
      const withRangeText = createBaseSpell({ range: 30, range_text: "30 feet" });
      const withoutRangeText = createBaseSpell({ range: 30, range_text: "" });

      const { spell: spell1 } = transformSpell(withRangeText);
      const { spell: spell2 } = transformSpell(withoutRangeText);

      expect(spell1.range).toBe("30 feet");
      expect(spell2.range).toBe("30 ft.");
    });
  });
});