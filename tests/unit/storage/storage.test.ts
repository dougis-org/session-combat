import { describe, test, expect, jest, beforeEach } from "@jest/globals";
import { storage } from "@/lib/storage";
import { getDatabase } from "@/lib/db";

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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

describe("storage.deleteCharacter", () => {
  let charactersMock: ReturnType<typeof makeMockCollection>;
  let partiesMock: ReturnType<typeof makeMockCollection>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
