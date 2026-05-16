import { SpellTemplate } from "@/lib/types";
import { buildSpellFromBody, applySpellUpdates, SpellBody } from "@/lib/api/spell-helpers";

const BASE_SPELL: SpellTemplate = {
  id: "existing-id",
  userId: "global-user",
  isGlobal: true,
  source: "open5e",
  name: "Fireball",
  level: 3,
  concentration: false,
  school: "Evocation",
  description: "A bright fire blooms.",
  castingTime: "1 action",
  range: "150 ft.",
  duration: "Instantaneous",
  components: { verbal: true, somatic: true, material: true },
  higherLevel: "Add 1d6 per level",
  damageType: "fire",
  saveDc: 15,
  saveType: "Dexterity",
  attackRoll: true,
  createdAt: new Date("2024-01-01"),
  updatedAt: new Date("2024-01-01"),
};

describe("buildSpellFromBody", () => {
  it("creates a spell with all provided fields", () => {
    const body: SpellBody = {
      name: "Magic Missile",
      level: 1,
      concentration: true,
      school: "Evocation",
      description: "Three darts deal 1d4+1 each.",
      castingTime: "1 bonus action",
      range: "120 ft.",
      duration: "Instantaneous",
      components: { verbal: true, somatic: true, material: false },
      higherLevel: "Extra dart per slot level",
      damageType: "force",
      saveDc: 14,
      saveType: "none",
      attackRoll: false,
    };

    const spell = buildSpellFromBody(body);

    expect(spell.name).toBe("Magic Missile");
    expect(spell.userId).toBe("GLOBAL");
    expect(spell.isGlobal).toBe(true);
    expect(spell.source).toBe("open5e");
    expect(spell.level).toBe(1);
    expect(spell.concentration).toBe(true);
    expect(spell.school).toBe("Evocation");
    expect(spell.description).toBe("Three darts deal 1d4+1 each.");
    expect(spell.castingTime).toBe("1 bonus action");
    expect(spell.range).toBe("120 ft.");
    expect(spell.duration).toBe("Instantaneous");
    expect(spell.components).toEqual({ verbal: true, somatic: true, material: false });
    expect(spell.higherLevel).toBe("Extra dart per slot level");
    expect(spell.damageType).toBe("force");
    expect(spell.saveDc).toBe(14);
    expect(spell.saveType).toBe("none");
    expect(spell.attackRoll).toBe(false);
    expect(spell.createdAt).toBeInstanceOf(Date);
    expect(spell.updatedAt).toBeInstanceOf(Date);
  });

  it("applies default values for missing optional fields", () => {
    const body: SpellBody = {
      name: "Prestidigitation",
    };

    const spell = buildSpellFromBody(body);

    expect(spell.name).toBe("Prestidigitation");
    expect(spell.level).toBe(0);
    expect(spell.concentration).toBe(false);
    expect(spell.school).toBe("Evocation");
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

  it("handles empty body", () => {
    const spell = buildSpellFromBody({});

    expect(spell.name).toBe("");
    expect(spell.level).toBe(0);
    expect(spell.school).toBe("Evocation");
    expect(spell.concentration).toBe(false);
    expect(spell.higherLevel).toBeUndefined();
  });

  it("trims whitespace from name", () => {
    const body = { name: "  Cure Wounds  " };
    const spell = buildSpellFromBody(body);
    expect(spell.name).toBe("Cure Wounds");
  });

  it("defaults name to empty string when missing", () => {
    const spell = buildSpellFromBody({});
    expect(spell.name).toBe("");
  });

  it("parses components object correctly", () => {
    const body = {
      components: { verbal: true, somatic: false, material: true, extra: "ignored" },
    };
    const spell = buildSpellFromBody(body);
    expect(spell.components).toEqual({ verbal: true, somatic: false, material: true });
  });

  it("handles undefined components", () => {
    const spell = buildSpellFromBody({ name: "Test" });
    expect(spell.components).toEqual({ verbal: false, somatic: false, material: false });
  });
});

describe("applySpellUpdates", () => {
  it("returns existing unchanged when no updates provided", () => {
    const result = applySpellUpdates(BASE_SPELL, {});
    expect(result.spell.name).toBe(BASE_SPELL.name);
    expect(result.spell.level).toBe(BASE_SPELL.level);
    expect(result.spell.school).toBe(BASE_SPELL.school);
    expect(result.spell.concentration).toBe(BASE_SPELL.concentration);
    expect(result.spell.description).toBe(BASE_SPELL.description);
    expect(result.spell.higherLevel).toBe(BASE_SPELL.higherLevel);
    expect(result.spell.damageType).toBe(BASE_SPELL.damageType);
    expect(result.spell.saveDc).toBe(BASE_SPELL.saveDc);
    expect(result.spell.saveType).toBe(BASE_SPELL.saveType);
    expect(result.spell.attackRoll).toBe(BASE_SPELL.attackRoll);
    expect(result.spell.updatedAt).toBeInstanceOf(Date);
    expect(result.errors).toHaveLength(0);
  });

  it("updates name and preserves other fields", () => {
    const result = applySpellUpdates(BASE_SPELL, { name: "  Revised Fireball  " });
    expect(result.errors).toHaveLength(0);
    expect(result.spell.name).toBe("Revised Fireball");
    expect(result.spell.level).toBe(BASE_SPELL.level);
    expect(result.spell.description).toBe(BASE_SPELL.description);
  });

  it("returns error when name is empty string", () => {
    const result = applySpellUpdates(BASE_SPELL, { name: "   " });
    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.spell).toEqual(BASE_SPELL);
  });

  it("validates level is within 0-9 range", () => {
    const result = applySpellUpdates(BASE_SPELL, { level: 12 });
    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.spell).toEqual(BASE_SPELL);
  });

  it("validates school is a valid DnDSpellSchool", () => {
    const result = applySpellUpdates(BASE_SPELL, { school: "NotASchool" });
    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.spell).toEqual(BASE_SPELL);
  });

  it("allows valid school names", () => {
    const result = applySpellUpdates(BASE_SPELL, { school: "Necromancy" });
    expect(result.errors).toHaveLength(0);
    expect(result.spell.school).toBe("Necromancy");
  });

  it("updates concentration field", () => {
    const result = applySpellUpdates(BASE_SPELL, { concentration: true });
    expect(result.errors).toHaveLength(0);
    expect(result.spell.concentration).toBe(true);
  });

  it("updates description", () => {
    const result = applySpellUpdates(BASE_SPELL, { description: "New description" });
    expect(result.errors).toHaveLength(0);
    expect(result.spell.description).toBe("New description");
  });

  it("updates higherLevel to null (clears it)", () => {
    const result = applySpellUpdates(BASE_SPELL, { higherLevel: null });
    expect(result.errors).toHaveLength(0);
    expect(result.spell.higherLevel).toBeNull();
  });

  it("updates higherLevel to a string value", () => {
    const result = applySpellUpdates(BASE_SPELL, { higherLevel: "Upcast description" });
    expect(result.errors).toHaveLength(0);
    expect(result.spell.higherLevel).toBe("Upcast description");
  });

  it("preserves higherLevel when omitted", () => {
    const result = applySpellUpdates(BASE_SPELL, { name: "Changed" });
    expect(result.errors).toHaveLength(0);
    expect(result.spell.higherLevel).toBe(BASE_SPELL.higherLevel);
  });

  it("updates damageType to null (clears it)", () => {
    const result = applySpellUpdates(BASE_SPELL, { damageType: null });
    expect(result.errors).toHaveLength(0);
    expect(result.spell.damageType).toBeNull();
  });

  it("updates saveDc to null (clears it)", () => {
    const result = applySpellUpdates(BASE_SPELL, { saveDc: null });
    expect(result.errors).toHaveLength(0);
    expect(result.spell.saveDc).toBeNull();
  });

  it("updates saveType to null (clears it)", () => {
    const result = applySpellUpdates(BASE_SPELL, { saveType: null });
    expect(result.errors).toHaveLength(0);
    expect(result.spell.saveType).toBeNull();
  });

  it("updates attackRoll", () => {
    const result = applySpellUpdates(BASE_SPELL, { attackRoll: false });
    expect(result.errors).toHaveLength(0);
    expect(result.spell.attackRoll).toBe(false);
  });

  it("updates multiple fields at once", () => {
    const result = applySpellUpdates(BASE_SPELL, {
      name: "New Name",
      level: 5,
      concentration: true,
      school: "Conjuration",
    });
    expect(result.errors).toHaveLength(0);
    expect(result.spell.name).toBe("New Name");
    expect(result.spell.level).toBe(5);
    expect(result.spell.concentration).toBe(true);
    expect(result.spell.school).toBe("Conjuration");
  });

  it("sets updatedAt to current date", () => {
    const before = new Date();
    const result = applySpellUpdates(BASE_SPELL, { name: "Updated" });
    const after = new Date();
    expect(result.spell.updatedAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
    expect(result.spell.updatedAt.getTime()).toBeLessThanOrEqual(after.getTime());
  });

  it("updates components via parseComponents", () => {
    const result = applySpellUpdates(BASE_SPELL, {
      components: { verbal: true, somatic: false, material: false },
    });
    expect(result.errors).toHaveLength(0);
    expect(result.spell.components).toEqual({ verbal: true, somatic: false, material: false });
  });

  it("preserves existing components when omitted", () => {
    const result = applySpellUpdates(BASE_SPELL, { name: "Changed" });
    expect(result.spell.components).toEqual(BASE_SPELL.components);
  });
});