import { IOpen5EClient, Open5ECreature, Open5ESpell } from "@/lib/import/open5eAdapter";

export function createMockClient(creatures: Open5ECreature[], spells: Open5ESpell[]) {
  return {
    getAllMonsters: () => (async function* () {
      for (const creature of creatures) {
        yield creature;
      }
    })(),
    getAllSpells: () => (async function* () {
      for (const spell of spells) {
        yield spell;
      }
    })(),
  } as unknown as IOpen5EClient;
}

export function createTestCreature(overrides: Partial<Open5ECreature> = {}): Open5ECreature {
  return {
    key: "test-creature",
    name: "Test Creature",
    size: { Name: "Medium", key: "medium" },
    type: { Name: "Beast", key: "beast" },
    alignment: "neutral",
    speed: { walk: 30 },
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