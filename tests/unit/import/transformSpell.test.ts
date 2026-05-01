import { Open5ESpell } from "@/lib/import/open5eAdapter";
import { transformSpell } from "@/lib/import/transformSpell";
import { GLOBAL_USER_ID } from "@/lib/constants";

describe("transformSpell", () => {
  describe("school mapping", () => {
    const SCHOOLS: Array<{ input: string; expected: string }> = [
      { input: "abjuration", expected: "Abjuration" },
      { input: "conjuration", expected: "Conjuration" },
      { input: "divination", expected: "Divination" },
      { input: "enchantment", expected: "Enchantment" },
      { input: "evocation", expected: "Evocation" },
      { input: "illusion", expected: "Illusion" },
      { input: "necromancy", expected: "Necromancy" },
      { input: "transmutation", expected: "Transmutation" },
      { input: "ABJURATION", expected: "Abjuration" },
      { input: "Evocation", expected: "Evocation" },
      { input: "  divination  ", expected: "Divination" },
      { input: "unknown school", expected: "Evocation" },
      { input: "", expected: "Evocation" },
    ];

    test.each(SCHOOLS)("maps '$input' to '$expected'", ({ input, expected }) => {
      const raw: Open5ESpell = {
        slug: "test-spell",
        name: "Test Spell",
        level: 1,
        school: input,
        concentration: false,
        casting_time: "1 action",
        range: "Self",
        duration: "Instantaneous",
        components: ["V"],
        description: "Test description",
      };
      const { spell } = transformSpell(raw);
      expect(spell.school).toBe(expected);
    });
  });

  describe("components parsing", () => {
    it("parses verbal component", () => {
      const raw: Open5ESpell = {
        slug: "test",
        name: "Test",
        level: 0,
        school: "evocation",
        concentration: false,
        casting_time: "1 action",
        range: "Self",
        duration: "Instantaneous",
        components: ["V"],
        description: "Test",
      };
      const { spell } = transformSpell(raw);
      expect(spell.components).toEqual({ verbal: true, somatic: false, material: false });
    });

    it("parses somatic component", () => {
      const raw: Open5ESpell = {
        slug: "test",
        name: "Test",
        level: 0,
        school: "evocation",
        concentration: false,
        casting_time: "1 action",
        range: "Self",
        duration: "Instantaneous",
        components: ["S"],
        description: "Test",
      };
      const { spell } = transformSpell(raw);
      expect(spell.components).toEqual({ verbal: false, somatic: true, material: false });
    });

    it("parses material component", () => {
      const raw: Open5ESpell = {
        slug: "test",
        name: "Test",
        level: 0,
        school: "evocation",
        concentration: false,
        casting_time: "1 action",
        range: "Self",
        duration: "Instantaneous",
        components: ["M"],
        description: "Test",
      };
      const { spell } = transformSpell(raw);
      expect(spell.components).toEqual({ verbal: false, somatic: false, material: true });
    });

    it("parses V,S,M together", () => {
      const raw: Open5ESpell = {
        slug: "test",
        name: "Test",
        level: 3,
        school: "evocation",
        concentration: true,
        casting_time: "1 action",
        range: "Self",
        duration: "Concentration, up to 1 minute",
        components: ["V", "S", "M"],
        material: "A pinch of sulfur",
        description: "Test",
      };
      const { spell } = transformSpell(raw);
      expect(spell.components).toEqual({ verbal: true, somatic: true, material: true });
    });

    it("parses verbal from full word", () => {
      const raw: Open5ESpell = {
        slug: "test",
        name: "Test",
        level: 0,
        school: "evocation",
        concentration: false,
        casting_time: "1 action",
        range: "Self",
        duration: "Instantaneous",
        components: ["verbal"],
        description: "Test",
      };
      const { spell } = transformSpell(raw);
      expect(spell.components.verbal).toBe(true);
    });

    it("parses somatic from full word", () => {
      const raw: Open5ESpell = {
        slug: "test",
        name: "Test",
        level: 0,
        school: "evocation",
        concentration: false,
        casting_time: "1 action",
        range: "Self",
        duration: "Instantaneous",
        components: ["somatic"],
        description: "Test",
      };
      const { spell } = transformSpell(raw);
      expect(spell.components.somatic).toBe(true);
    });

    it("parses material from full phrase", () => {
      const raw: Open5ESpell = {
        slug: "test",
        name: "Test",
        level: 0,
        school: "evocation",
        concentration: false,
        casting_time: "1 action",
        range: "Self",
        duration: "Instantaneous",
        components: ["a material component"],
        description: "Test",
      };
      const { spell } = transformSpell(raw);
      expect(spell.components.material).toBe(true);
    });

    it("handles empty components", () => {
      const raw: Open5ESpell = {
        slug: "test",
        name: "Test",
        level: 0,
        school: "evocation",
        concentration: false,
        casting_time: "1 action",
        range: "Self",
        duration: "Instantaneous",
        components: [],
        description: "Test",
      };
      const { spell } = transformSpell(raw);
      expect(spell.components).toEqual({ verbal: false, somatic: false, material: false });
    });
  });

  describe("validation", () => {
    it("returns valid=true for complete spell", () => {
      const raw: Open5ESpell = {
        slug: "fireball",
        name: "Fireball",
        level: 3,
        school: "evocation",
        concentration: true,
        casting_time: "1 action",
        range: "150 feet",
        duration: "Concentration, up to 1 minute",
        components: ["V", "S", "M"],
        material: "A tiny ball of bat guano and sulfur",
        description: "A bright streak flashes from your pointing finger",
        higher_level: "When you cast this spell using a 4th-level slot",
        damage_type: "fire",
        dc_damage: "8d6",
        save_dc: 10,
        save_ability: "dexterity",
      };
      const result = transformSpell(raw);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("returns valid=false for missing name", () => {
      const raw: Open5ESpell = {
        slug: "test",
        name: "",
        level: 1,
        school: "evocation",
        concentration: false,
        casting_time: "1 action",
        range: "Self",
        duration: "Instantaneous",
        components: ["V"],
        description: "Test",
      };
      const result = transformSpell(raw);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain("Missing required field: name");
    });

    it("returns valid=false for missing level", () => {
      const raw: Open5ESpell = {
        slug: "test",
        name: "Test",
        level: undefined as unknown as number,
        school: "evocation",
        concentration: false,
        casting_time: "1 action",
        range: "Self",
        duration: "Instantaneous",
        components: ["V"],
        description: "Test",
      };
      const result = transformSpell(raw);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain("Missing required field: level");
    });

    it("returns valid=false for null level", () => {
      const raw: Open5ESpell = {
        slug: "test",
        name: "Test",
        level: null as unknown as number,
        school: "evocation",
        concentration: false,
        casting_time: "1 action",
        range: "Self",
        duration: "Instantaneous",
        components: ["V"],
        description: "Test",
      };
      const result = transformSpell(raw);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain("Missing required field: level");
    });

    it("returns valid=false for invalid school", () => {
      const raw: Open5ESpell = {
        slug: "test",
        name: "Test",
        level: 1,
        school: "not a real school",
        concentration: false,
        casting_time: "1 action",
        range: "Self",
        duration: "Instantaneous",
        components: ["V"],
        description: "Test",
      };
      const result = transformSpell(raw);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes("Invalid school"))).toBe(true);
    });

    it("collects multiple errors", () => {
      const raw: Open5ESpell = {
        slug: "test",
        name: "",
        level: undefined as unknown as number,
        school: "invalid",
        concentration: false,
        casting_time: "1 action",
        range: "Self",
        duration: "Instantaneous",
        components: ["V"],
        description: "Test",
      };
      const result = transformSpell(raw);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe("spell structure", () => {
    it("creates spell with all fields", () => {
      const raw: Open5ESpell = {
        slug: "magic-missile",
        name: "Magic Missile",
        level: 1,
        school: "evocation",
        concentration: false,
        casting_time: "1 action",
        range: "120 feet",
        duration: "Instantaneous",
        components: ["V", "S"],
        description: "You create three glowing darts",
        higher_level: "When you cast this spell using a spell slot of 2nd level or higher",
        damage_type: "force",
        dc_damage: "1d4+1",
        save_dc: 15,
        save_ability: "dexterity",
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
      expect(spell.damageType).toBe("force");
      expect(spell.saveDc).toBe(15);
      expect(spell.saveType).toBe("dexterity");
      expect(spell.attackRoll).toBe(true);
      expect(spell.isGlobal).toBe(true);
      expect(spell.source).toBe("open5e");
      expect(spell.createdAt).toBeInstanceOf(Date);
      expect(spell.updatedAt).toBeInstanceOf(Date);
    });

    it("applies defaults for missing optional fields", () => {
      const raw: Open5ESpell = {
        slug: "test",
        name: "Test Spell",
        level: 0,
        school: "divination",
        concentration: false,
        casting_time: "",
        range: "",
        duration: "",
        components: [],
        description: "",
      };

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
      expect(spell.damageType).toBeUndefined();
      expect(spell.saveDc).toBeUndefined();
      expect(spell.saveType).toBeUndefined();
      expect(spell.attackRoll).toBe(false);
    });

    it("sets attackRoll=true only when dc_damage is present", () => {
      const withDc: Open5ESpell = {
        slug: "test1",
        name: "Test1",
        level: 1,
        school: "evocation",
        concentration: false,
        casting_time: "1 action",
        range: "Self",
        duration: "Instantaneous",
        components: ["V"],
        description: "Test",
        dc_damage: "8d6",
      };

      const withoutDc: Open5ESpell = {
        slug: "test2",
        name: "Test2",
        level: 1,
        school: "evocation",
        concentration: false,
        casting_time: "1 action",
        range: "Self",
        duration: "Instantaneous",
        components: ["V"],
        description: "Test",
      };

      const { spell: spell1 } = transformSpell(withDc);
      const { spell: spell2 } = transformSpell(withoutDc);

      expect(spell1.attackRoll).toBe(true);
      expect(spell2.attackRoll).toBe(false);
    });
  });
});