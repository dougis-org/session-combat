/**
 * @jest-environment node
 */
import { storage } from "@/lib/storage";
import { DuplicateShareError } from "@/lib/errors";
import { CampaignCharacterShare } from "@/lib/types";

jest.mock("@/lib/db", () => ({
  getDatabase: jest.fn(),
}));

import { getDatabase } from "@/lib/db";

const mockedDb = {
  collection: jest.fn(),
};

const mockedInsertCollection = {
  insertOne: jest.fn(),
};

const mockedDeleteCollection = {
  deleteOne: jest.fn(),
};

const mockedFindCollection = {
  find: jest.fn(),
};

jest.mocked(getDatabase).mockResolvedValue(mockedDb as any);

const BASE_SHARE: CampaignCharacterShare = {
  id: "share-1",
  campaignId: "camp-1",
  characterId: "char-1",
  userId: "user-1",
  sharedAt: new Date("2026-01-01"),
};

describe("DuplicateShareError", () => {
  it("has name DuplicateShareError", () => {
    const err = new DuplicateShareError("c1", "ch1");
    expect(err.name).toBe("DuplicateShareError");
  });

  it("message includes campaignId and characterId", () => {
    const err = new DuplicateShareError("c1", "ch1");
    expect(err.message).toContain("c1");
    expect(err.message).toContain("ch1");
  });

  it("is an instance of Error", () => {
    const err = new DuplicateShareError("c1", "ch1");
    expect(err instanceof Error).toBe(true);
  });
});

describe("storage.addShare", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedDb.collection.mockReturnValue(mockedInsertCollection);
  });

  it("T3-1: inserts share without _id field", async () => {
    mockedInsertCollection.insertOne.mockResolvedValue({ insertedId: "mongo-id" });

    await storage.addShare(BASE_SHARE);

    expect(mockedInsertCollection.insertOne).toHaveBeenCalledTimes(1);
    const insertArg = mockedInsertCollection.insertOne.mock.calls[0][0];
    expect(insertArg).not.toHaveProperty("_id");
    expect(insertArg.campaignId).toBe("camp-1");
    expect(insertArg.characterId).toBe("char-1");
    expect(insertArg.userId).toBe("user-1");
  });

  it("T3-2: throws DuplicateShareError on code 11000", async () => {
    mockedInsertCollection.insertOne.mockRejectedValue({ code: 11000 });

    await expect(storage.addShare(BASE_SHARE)).rejects.toThrow(DuplicateShareError);
  });

  it("T3-3: re-throws non-11000 errors", async () => {
    const generic = new Error("network failure");
    mockedInsertCollection.insertOne.mockRejectedValue(generic);

    await expect(storage.addShare(BASE_SHARE)).rejects.toThrow("network failure");
  });
});

describe("storage.removeShare", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedDb.collection.mockReturnValue(mockedDeleteCollection);
  });

  it("T3-4: returns true when a record is deleted", async () => {
    mockedDeleteCollection.deleteOne.mockResolvedValue({ deletedCount: 1 });

    const result = await storage.removeShare("camp-1", "char-1", "user-1");

    expect(result).toBe(true);
    expect(mockedDeleteCollection.deleteOne).toHaveBeenCalledWith({
      campaignId: "camp-1",
      characterId: "char-1",
      userId: "user-1",
    });
  });

  it("T3-5: returns false when no record found", async () => {
    mockedDeleteCollection.deleteOne.mockResolvedValue({ deletedCount: 0 });

    const result = await storage.removeShare("camp-1", "char-1", "user-1");

    expect(result).toBe(false);
  });
});

describe("storage.listSharesForCampaign", () => {
  const doc1 = { ...BASE_SHARE, _id: "mongo-1" };
  const doc2 = { ...BASE_SHARE, id: "share-2", characterId: "char-2", _id: "mongo-2" };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("T3-6: returns only the caller's shares with _id stripped", async () => {
    const mockToArray = jest.fn().mockResolvedValue([doc1, doc2]);
    const mockFind = jest.fn().mockReturnValue({ toArray: mockToArray });
    mockedDb.collection.mockReturnValue({ find: mockFind });

    const result = await storage.listSharesForCampaign("camp-1", "user-1");

    expect(result).toHaveLength(2);
    expect(result[0]).not.toHaveProperty("_id");
    expect(result[0].id).toBe("share-1");
    expect(result[1].id).toBe("share-2");
  });

  it("T3-7: returns empty array when no shares match", async () => {
    const mockToArray = jest.fn().mockResolvedValue([]);
    const mockFind = jest.fn().mockReturnValue({ toArray: mockToArray });
    mockedDb.collection.mockReturnValue({ find: mockFind });

    const result = await storage.listSharesForCampaign("camp-1", "user-1");

    expect(result).toEqual([]);
  });

  it("T3-8: query includes both campaignId and userId", async () => {
    const mockToArray = jest.fn().mockResolvedValue([]);
    const mockFind = jest.fn().mockReturnValue({ toArray: mockToArray });
    mockedDb.collection.mockReturnValue({ find: mockFind });

    await storage.listSharesForCampaign("camp-1", "user-1");

    expect(mockFind).toHaveBeenCalledWith({ campaignId: "camp-1", userId: "user-1" });
  });
});
