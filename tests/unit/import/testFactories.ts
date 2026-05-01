import { Open5ECreature } from "@/lib/import/open5eAdapter";
import { Open5ESpell } from "@/lib/import/open5eAdapter";

export function createBaseSpell(
  overrides: Partial<Open5ESpell> = {}
): Open5ESpell {
  return {
    slug: "test-slug",
    name: "Test Spell",
    level: 1,
    school: "evocation",
    concentration: false,
    casting_time: "1 action",
    range: "Self",
    duration: "Instantaneous",
    components: ["V"],
    description: "Test description",
    ...overrides,
  };
}

export function createBaseCreature(
  overrides: Partial<Open5ECreature> = {}
): Open5ECreature {
  return {
    slug: "test-slug",
    name: "Test Monster",
    size: "medium",
    type: "humanoid",
    alignment: "neutral",
    speed: 30,
    strength: 10,
    dexterity: 10,
    constitution: 10,
    intelligence: 10,
    wisdom: 10,
    charisma: 10,
    hit_points: 10,
    armor_class: [{ ac: 10 }],
    challenge_rating: "1",
    actions: [],
    ...overrides,
  };
}