import { Open5ECreature } from "@/lib/import/open5eAdapter";
import { Open5ESpell } from "@/lib/import/open5eAdapter";

export function createBaseSpell(
  overrides: Partial<Open5ESpell> = {}
): Open5ESpell {
  return {
    key: "test-key",
    name: "Test Spell",
    level: 1,
    school: { Name: "Evocation", key: "evocation" },
    concentration: false,
    casting_time: "1 action",
    range: 0,
    range_text: "Self",
    duration: "Instantaneous",
    verbal: true,
    somatic: true,
    material: false,
    desc: "Test description",
    ...overrides,
  };
}

export function createBaseCreature(
  overrides: Partial<Open5ECreature> = {}
): Open5ECreature {
  return {
    key: "test-key",
    name: "Test Monster",
    size: { Name: "Medium", key: "medium" },
    type: { Name: "Humanoid", key: "humanoid" },
    alignment: "neutral",
    speed: { walk: 30, unit: "feet" },
    ability_scores: {
      strength: 10,
      dexterity: 10,
      constitution: 10,
      intelligence: 10,
      wisdom: 10,
      charisma: 10,
    },
    hit_points: 10,
    armor_class: 10,
    challenge_rating: 1,
    actions: [],
    traits: [],
    ...overrides,
  };
}