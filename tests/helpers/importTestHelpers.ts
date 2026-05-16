import { IOpen5EClient, Open5ECreature, Open5ESpell } from "@/lib/import/open5eAdapter";

export function createMockFetch(response: unknown) {
  return jest.fn().mockResolvedValue({
    ok: true,
    json: jest.fn().mockResolvedValue(response),
    status: 200,
    headers: { get: jest.fn().mockReturnValue(null) },
    clone: jest.fn().mockReturnThis(),
  });
}

export function createMockFetch429(retryAfter: string | null) {
  return jest.fn().mockResolvedValue({
    ok: false,
    status: 429,
    headers: {
      get: jest.fn().mockImplementation((name: string) =>
        name === "Retry-After" ? retryAfter : null
      ),
    },
    clone: jest.fn().mockReturnThis(),
  });
}

export function createPaginatedResponse<T>(
  results: T[],
  options: { next?: string | null; previous?: string | null } = {}
) {
  return {
    results,
    count: results.length,
    next: options.next ?? null,
    previous: options.previous ?? null,
  };
}

export const SAMPLE_CREATURE: Open5ECreature = {
  key: "goblin",
  name: "Goblin",
  size: { Name: "Small", key: "small" },
  type: { Name: "Humanoid", key: "humanoid" },
  alignment: "neutral evil",
  speed: { walk: 30 },
  ability_scores: {
    strength: 8,
    dexterity: 14,
    constitution: 12,
    intelligence: 10,
    wisdom: 8,
    charisma: 8,
  },
  hit_points: 7,
  armor_class: 15,
  challenge_rating: 0.25,
  actions: [{ name: "Attack", desc: "Melee weapon attack" }],
};

export const SAMPLE_SPELL: Open5ESpell = {
  key: "fireball",
  name: "Fireball",
  level: 3,
  school: { Name: "Evocation", key: "evocation" },
  concentration: false,
  casting_time: "1 action",
  range: 150,
  range_text: "150 feet",
  duration: "Instantaneous",
  verbal: true,
  somatic: true,
  material: true,
  desc: "A bright streak flashes from your pointing finger",
};

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

export function createTestSpell(overrides: Partial<Open5ESpell> = {}): Open5ESpell {
  return {
    key: "test-spell",
    name: "Test Spell",
    level: 1,
    school: { Name: "Evocation", key: "evocation" },
    concentration: false,
    casting_time: "1 action",
    range: 0,
    range_text: "Self",
    duration: "Instantaneous",
    verbal: false,
    somatic: false,
    material: false,
    desc: "Test description",
    ...overrides,
  };
}

export function createMockClient(creatures: Open5ECreature[], spells: Open5ESpell[]) {
  return {
    async *getAllMonsters() {
      for (const creature of creatures) {
        yield creature;
      }
    },
    async *getAllSpells() {
      for (const spell of spells) {
        yield spell;
      }
    },
  } as unknown as IOpen5EClient;
}