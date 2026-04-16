import { describe, test, expect, jest, beforeEach } from "@jest/globals";
import { storage } from "@/lib/storage";
import { getDatabase } from "@/lib/db";
import { GLOBAL_USER_ID } from "@/lib/constants";
import type { Encounter, MonsterTemplate } from "@/lib/types";

jest.mock("@/lib/db", () => ({
  getDatabase: jest.fn(),
}));

const mockedGetDatabase = jest.mocked(getDatabase);

// Per-collection mock factories
function makeMockCollection() {
  const toArray = jest.fn<() => Promise<unknown[]>>();
  const find = jest.fn(() => ({ toArray }));
  const updateOne = jest.fn<() => Promise<unknown>>();
  const updateMany = jest.fn<() => Promise<unknown>>();
  return { find, toArray, updateOne, updateMany };
}

describe("storage.loadCharacters", () => {
  let charactersActiveMock: ReturnType<typeof makeMockCollection>;
  let charactersMock: ReturnType<typeof makeMockCollection>;
  let mockDb: any;

  beforeEach(() => {
    charactersActiveMock = makeMockCollection();
    charactersMock = makeMockCollection();
    mockDb = {
      collection: jest.fn((name: string) => {
        if (name === "characters_active") return charactersActiveMock;
        if (name === "characters") return charactersMock;
        throw new Error(`unexpected collection: ${name}`);
      }),
    };
    mockedGetDatabase.mockResolvedValue(mockDb);
  });

  test("queries characters_active view", async () => {
    const chars = [{ id: "char1", name: "Test", userId: "user1" }];
    charactersActiveMock.toArray.mockResolvedValue(chars as never);

    const result = await storage.loadCharacters("user1");

    expect(mockDb.collection).toHaveBeenCalledWith("characters_active");
    expect(charactersActiveMock.find).toHaveBeenCalledWith({ userId: "user1" });
    expect(result).toEqual(chars);
  });

  test("ensures id field is set from _id when id is missing", async () => {
    const chars = [{ _id: { toString: () => "mongo-id" }, name: "Test", userId: "user1" }];
    charactersActiveMock.toArray.mockResolvedValue(chars as never);

    const result = await storage.loadCharacters("user1");

    expect(result[0].id).toBe("mongo-id");
  });

  test("falls back to characters collection when view is unavailable", async () => {
    const viewError = new Error("ns does not exist");
    charactersActiveMock.toArray.mockRejectedValue(viewError as never);

    const fallbackChars = [{ id: "char1", name: "Test", userId: "user1" }];
    charactersMock.toArray.mockResolvedValue(fallbackChars as never);

    const result = await storage.loadCharacters("user1");

    expect(mockDb.collection).toHaveBeenCalledWith("characters");
    expect(charactersMock.find).toHaveBeenCalledWith({
      userId: "user1",
      deletedAt: null,
    });
    expect(result).toEqual(fallbackChars);
  });

  test("returns empty array when getDatabase fails", async () => {
    mockedGetDatabase.mockRejectedValue(new Error("connection failed") as never);

    const result = await storage.loadCharacters("user1");

    expect(result).toEqual([]);
  });
});

describe("storage entity loader normalization", () => {
  let encountersMock: ReturnType<typeof makeMockCollection>;
  let partiesMock: ReturnType<typeof makeMockCollection>;
  let templatesMock: ReturnType<typeof makeMockCollection>;
  let mockDb: any;

  beforeEach(() => {
    encountersMock = makeMockCollection();
    partiesMock = makeMockCollection();
    templatesMock = makeMockCollection();
    mockDb = {
      collection: jest.fn((name: string) => {
        if (name === "encounters") return encountersMock;
        if (name === "parties") return partiesMock;
        if (name === "monsterTemplates") return templatesMock;
        throw new Error(`unexpected collection: ${name}`);
      }),
    };
    mockedGetDatabase.mockResolvedValue(mockDb);
  });

  test("loadEncounters preserves stored id when _id is also present", async () => {
    const encounter: Encounter = {
      id: "enc-uuid",
      _id: "mongo-id",
      name: "Encounter",
      userId: "user1",
      description: "test encounter",
      monsters: [],
      createdAt: new Date("2026-04-07T00:00:00Z"),
      updatedAt: new Date("2026-04-07T00:00:00Z"),
    };

    encountersMock.toArray.mockResolvedValue(
      [
        {
          ...encounter,
          _id: { toString: () => "mongo-id" },
        },
      ] as never,
    );

    const result = await storage.loadEncounters("user1");

    expect(encountersMock.find).toHaveBeenCalledWith({ userId: "user1" });
    expect(result[0].id).toBe("enc-uuid");
  });

  test("loadParties falls back to _id when id is missing", async () => {
    partiesMock.toArray.mockResolvedValue(
      [
        {
          _id: { toString: () => "party-mongo-id" },
          name: "Party",
          userId: "user1",
          characterIds: [],
        },
      ] as never,
    );

    const result = await storage.loadParties("user1");

    expect(partiesMock.find).toHaveBeenCalledWith({ userId: "user1" });
    expect(result[0].id).toBe("party-mongo-id");
  });

  test("loadMonsterTemplates preserves stored id when _id is also present", async () => {
    const template: MonsterTemplate = {
      id: "template-uuid",
      _id: "mongo-id",
      name: "Template",
      userId: "user1",
      size: "medium",
      type: "humanoid",
      alignment: "Neutral",
      speed: "30 ft.",
      challengeRating: 1,
      abilityScores: {
        strength: 10,
        dexterity: 10,
        constitution: 10,
        intelligence: 10,
        wisdom: 10,
        charisma: 10,
      },
      ac: 12,
      hp: 10,
      maxHp: 10,
      createdAt: new Date("2026-04-07T00:00:00Z"),
      updatedAt: new Date("2026-04-07T00:00:00Z"),
    };

    templatesMock.toArray.mockResolvedValue(
      [
        {
          ...template,
          _id: { toString: () => "mongo-id" },
        },
      ] as never,
    );

    const result = await storage.loadMonsterTemplates("user1");

    expect(templatesMock.find).toHaveBeenCalledWith({ userId: "user1" });
    expect(result[0].id).toBe("template-uuid");
  });

  test("loadGlobalMonsterTemplates delegates to the global user template query", async () => {
    templatesMock.toArray.mockResolvedValue([] as never);

    await storage.loadGlobalMonsterTemplates();

    expect(templatesMock.find).toHaveBeenCalledWith({ userId: GLOBAL_USER_ID });
  });
});

describe("storage.deleteCharacter", () => {
  let charactersMock: ReturnType<typeof makeMockCollection>;
  let partiesMock: ReturnType<typeof makeMockCollection>;
  let mockDb: any;

  beforeEach(() => {
    charactersMock = makeMockCollection();
    partiesMock = makeMockCollection();
    mockDb = {
      collection: jest.fn((name: string) => {
        if (name === "characters") return charactersMock;
        if (name === "parties") return partiesMock;
        throw new Error(`unexpected collection: ${name}`);
      }),
    };
    mockedGetDatabase.mockResolvedValue(mockDb);
    charactersMock.updateOne.mockResolvedValue({} as never);
    partiesMock.updateMany.mockResolvedValue({} as never);
  });

  test("soft deletes character by setting deletedAt timestamp", async () => {
    await storage.deleteCharacter("char1", "user1");

    expect(mockDb.collection).toHaveBeenCalledWith("characters");
    expect(charactersMock.updateOne).toHaveBeenCalledWith(
      { id: "char1", userId: "user1" },
      { $set: { deletedAt: expect.any(Date) } },
    );
  });

  test("removes character from all parties for referential integrity", async () => {
    await storage.deleteCharacter("char1", "user1");

    expect(mockDb.collection).toHaveBeenCalledWith("parties");
    expect(partiesMock.updateMany).toHaveBeenCalledWith(
      { userId: "user1" },
      { $pull: { characterIds: "char1" } },
    );
  });

  test("throws error on database failure", async () => {
    charactersMock.updateOne.mockRejectedValue(new Error("db error") as never);

    await expect(storage.deleteCharacter("char1", "user1")).rejects.toThrow("db error");
  });
});

describe("storage.saveParty", () => {
  let updateOne: jest.Mock;
  let mockCollection: jest.Mock;

  beforeEach(() => {
    updateOne = jest.fn<() => Promise<unknown>>().mockResolvedValue({
      matchedCount: 1,
      modifiedCount: 1,
      upsertedId: null,
    });
    mockCollection = jest.fn(() => ({ updateOne }));
    mockedGetDatabase.mockResolvedValue({ collection: mockCollection } as any);
  });

  test("upserts by application id and userId, strips _id from $set payload", async () => {
    const party = {
      _id: "507f1f77bcf86cd799439011",
      id: "party-123",
      userId: "user-1",
      name: "Updated Party",
      description: "Edited without relying on MongoDB _id",
      characterIds: ["char-1"],
      createdAt: new Date("2026-04-07T00:00:00.000Z"),
      updatedAt: new Date("2026-04-07T00:05:00.000Z"),
    };

    await storage.saveParty(party as any);
    const { _id, ...expectedPartyData } = party;

    expect(mockCollection).toHaveBeenCalledWith("parties");
    expect(updateOne).toHaveBeenCalledWith(
      { id: party.id, userId: party.userId },
      { $set: expectedPartyData },
      { upsert: true }
    );
  });
});
