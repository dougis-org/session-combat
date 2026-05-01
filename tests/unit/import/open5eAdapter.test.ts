import { Open5EClient, PaginatedResponse, Open5ECreature, Open5ESpell } from "@/lib/import/open5eAdapter";
import {
  createMockFetch,
  createPaginatedResponse,
  SAMPLE_CREATURE,
  SAMPLE_SPELL,
} from "./open5e.mockHelpers";

describe("Open5EClient", () => {
  describe("fetchMonsters", () => {
    it("returns paginated creatures from API", async () => {
      const mockData = createPaginatedResponse<Open5ECreature>([SAMPLE_CREATURE]);
      const mockFetch = createMockFetch(mockData);
      const client = new Open5EClient(mockFetch as unknown as typeof fetch);

      const result = await client.fetchMonsters(1);

      expect(result).toEqual(mockData);
      expect(mockFetch).toHaveBeenCalledWith(
        "https://api.open5e.com/v2/creatures/?page=1"
      );
    });

    it("passes page parameter correctly", async () => {
      const mockData = createPaginatedResponse<Open5ECreature>([]);
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
      const mockData = createPaginatedResponse<Open5ESpell>([SAMPLE_SPELL]);
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
      const goblin: Open5ECreature = { ...SAMPLE_CREATURE, key: "goblin", name: "Goblin" };
      const orc: Open5ECreature = {
        ...SAMPLE_CREATURE,
        key: "orc",
        name: "Orc",
        ability_scores: {
          strength: 16,
          dexterity: 12,
          constitution: 16,
          intelligence: 7,
          wisdom: 11,
          charisma: 10,
        },
      };

      const page1 = createPaginatedResponse<Open5ECreature>([goblin], {
        next: "https://api.open5e.com/v2/creatures/?page=2",
      });
      const page2 = createPaginatedResponse<Open5ECreature>([orc]);

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
      const mockData = createPaginatedResponse<Open5ECreature>([SAMPLE_CREATURE]);
      const mockFetch = createMockFetch(mockData);
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
      const fireball: Open5ESpell = { ...SAMPLE_SPELL, key: "fireball", name: "Fireball" };
      const magicMissile: Open5ESpell = {
        ...SAMPLE_SPELL,
        key: "magic-missile",
        name: "Magic Missile",
        level: 1,
      };

      const page1 = createPaginatedResponse<Open5ESpell>([fireball], {
        next: "https://api.open5e.com/v2/spells/?page=2",
      });
      const page2 = createPaginatedResponse<Open5ESpell>([magicMissile]);

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