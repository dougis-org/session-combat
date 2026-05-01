import { Open5EClient, IOpen5EClient, PaginatedResponse, Open5ECreature, Open5ESpell } from "@/lib/import/open5eAdapter";

describe("Open5EClient", () => {
  function createMockFetch(response: unknown) {
    return jest.fn().mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue(response),
      status: 200,
      headers: { get: jest.fn().mockReturnValue(null) },
      clone: jest.fn().mockReturnThis(),
    });
  }

  describe("fetchMonsters", () => {
    it("returns paginated creatures from API", async () => {
      const mockData: PaginatedResponse<Open5ECreature> = {
        results: [
          {
            key: "goblin",
            name: "Goblin",
            size: { Name: "Small", key: "small" },
            type: { Name: "Humanoid", key: "humanoid" },
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
            actions: [],
            speed: { walk: 30 },
            alignment: "neutral",
          },
        ],
        count: 1,
        next: null,
        previous: null,
      };

      const mockFetch = createMockFetch(mockData);
      const client = new Open5EClient(mockFetch as unknown as typeof fetch);

      const result = await client.fetchMonsters(1);

      expect(result).toEqual(mockData);
      expect(mockFetch).toHaveBeenCalledWith(
        "https://api.open5e.com/v2/creatures/?page=1"
      );
    });

    it("passes page parameter correctly", async () => {
      const mockData: PaginatedResponse<Open5ECreature> = {
        results: [],
        count: 0,
        next: null,
        previous: null,
      };

      const mockFetch = createMockFetch(mockData);
      const client = new Open5EClient(mockFetch as unknown as typeof fetch);

      await client.fetchMonsters(3);

      expect(mockFetch).toHaveBeenCalledWith(
        "https://api.open5e.com/v2/creatures/?page=3"
      );
    });
  });

  describe("fetchSpells", () => {
    it("returns paginated spells from API", async () => {
      const mockData: PaginatedResponse<Open5ESpell> = {
        results: [
          {
            key: "fireball",
            name: "Fireball",
            level: 3,
            school: { Name: "Evocation", key: "evocation" },
            concentration: false,
            casting_time: "1 action",
            range: 0,
            range_text: "Self",
            duration: "Instantaneous",
            verbal: true,
            somatic: true,
            material: true,
            desc: "A ball of fire",
          },
        ],
        count: 1,
        next: null,
        previous: null,
      };

      const mockFetch = createMockFetch(mockData);
      const client = new Open5EClient(mockFetch as unknown as typeof fetch);

      const result = await client.fetchSpells(1);

      expect(result).toEqual(mockData);
      expect(mockFetch).toHaveBeenCalledWith(
        "https://api.open5e.com/v2/spells/?page=1"
      );
    });
  });

  describe("getAllMonsters", () => {
    it("yields all monsters from all pages", async () => {
      const page1: PaginatedResponse<Open5ECreature> = {
        results: [{
          key: "goblin",
          name: "Goblin",
          size: { Name: "Small", key: "small" },
          type: { Name: "Humanoid", key: "humanoid" },
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
          actions: [],
          speed: { walk: 30 },
          alignment: "neutral",
        }],
        count: 2,
        next: "https://api.open5e.com/v2/creatures/?page=2",
        previous: null,
      };

      const page2: PaginatedResponse<Open5ECreature> = {
        results: [{
          key: "orc",
          name: "Orc",
          size: { Name: "Medium", key: "medium" },
          type: { Name: "Humanoid", key: "humanoid" },
          ability_scores: {
            strength: 16,
            dexterity: 12,
            constitution: 16,
            intelligence: 7,
            wisdom: 11,
            charisma: 10,
          },
          hit_points: 15,
          armor_class: 13,
          challenge_rating: 0.5,
          actions: [],
          speed: { walk: 30 },
          alignment: "chaotic evil",
        }],
        count: 2,
        next: null,
        previous: null,
      };

      let callCount = 0;
      const mockFetch = jest.fn().mockImplementation(() => {
        callCount++;
        return Promise.resolve({
          ok: true,
          json: jest.fn().mockResolvedValue(callCount === 1 ? page1 : page2),
          status: 200,
          headers: { get: jest.fn().mockReturnValue(null) },
          clone: jest.fn().mockReturnThis(),
        });
      });

      const client = new Open5EClient(mockFetch as unknown as typeof fetch);
      const monsters: Open5ECreature[] = [];

      for await (const monster of client.getAllMonsters()) {
        monsters.push(monster);
      }

      expect(monsters).toHaveLength(2);
      expect(monsters[0].key).toBe("goblin");
      expect(monsters[1].key).toBe("orc");
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it("stops when no more pages", async () => {
      const singlePage: PaginatedResponse<Open5ECreature> = {
        results: [{
          key: "goblin",
          name: "Goblin",
          size: { Name: "Small", key: "small" },
          type: { Name: "Humanoid", key: "humanoid" },
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
          actions: [],
          speed: { walk: 30 },
          alignment: "neutral",
        }],
        count: 1,
        next: null,
        previous: null,
      };

      const mockFetch = createMockFetch(singlePage);
      const client = new Open5EClient(mockFetch as unknown as typeof fetch);
      const monsters: Open5ECreature[] = [];

      for await (const monster of client.getAllMonsters()) {
        monsters.push(monster);
      }

      expect(monsters).toHaveLength(1);
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });
  });

  describe("getAllSpells", () => {
    it("yields all spells from all pages", async () => {
      const page1: PaginatedResponse<Open5ESpell> = {
        results: [{
          key: "fireball",
          name: "Fireball",
          level: 3,
          school: { Name: "Evocation", key: "evocation" },
          concentration: false,
          casting_time: "1 action",
          range: 0,
          range_text: "Self",
          duration: "Instantaneous",
          verbal: true,
          somatic: true,
          desc: "Fire",
        }],
        count: 2,
        next: "https://api.open5e.com/v2/spells/?page=2",
        previous: null,
      };

      const page2: PaginatedResponse<Open5ESpell> = {
        results: [{
          key: "magic-missile",
          name: "Magic Missile",
          level: 1,
          school: { Name: "Evocation", key: "evocation" },
          concentration: false,
          casting_time: "1 action",
          range: 0,
          range_text: "Self",
          duration: "Instantaneous",
          verbal: true,
          somatic: true,
          desc: " missiles",
        }],
        count: 2,
        next: null,
        previous: null,
      };

      let callCount = 0;
      const mockFetch = jest.fn().mockImplementation(() => {
        callCount++;
        return Promise.resolve({
          ok: true,
          json: jest.fn().mockResolvedValue(callCount === 1 ? page1 : page2),
          status: 200,
          headers: { get: jest.fn().mockReturnValue(null) },
          clone: jest.fn().mockReturnThis(),
        });
      });

      const client = new Open5EClient(mockFetch as unknown as typeof fetch);
      const spells: Open5ESpell[] = [];

      for await (const spell of client.getAllSpells()) {
        spells.push(spell);
      }

      expect(spells).toHaveLength(2);
      expect(spells[0].key).toBe("fireball");
      expect(spells[1].key).toBe("magic-missile");
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });
  });
});

describe("SSRF protection", () => {
  it("rejects URLs with different hosts via isAllowedUrl", () => {
    const { isAllowedUrl } = require("@/lib/import/open5eAdapter");
    expect(isAllowedUrl("https://evil.com/api")).toBe(false);
    expect(isAllowedUrl("https://api.open5e.com/v2/creatures")).toBe(true);
  });
});