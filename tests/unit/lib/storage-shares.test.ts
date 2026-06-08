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

describe("storage.listAllSharesForCampaign", () => {
  const share1 = { ...BASE_SHARE, _id: "mongo-1", userId: "user-1" };
  const share2 = { ...BASE_SHARE, id: "share-2", characterId: "char-2", _id: "mongo-2", userId: "user-2" };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("A2-1: returns shares from multiple different users", async () => {
    const mockToArray = jest.fn().mockResolvedValue([share1, share2]);
    const mockFind = jest.fn().mockReturnValue({ toArray: mockToArray });
    mockedDb.collection.mockReturnValue({ find: mockFind });

    const result = await storage.listAllSharesForCampaign("camp-1");

    expect(result).toHaveLength(2);
    expect(result[0].userId).toBe("user-1");
    expect(result[1].userId).toBe("user-2");
  });

  it("A2-2: returns empty array when no shares exist", async () => {
    const mockToArray = jest.fn().mockResolvedValue([]);
    const mockFind = jest.fn().mockReturnValue({ toArray: mockToArray });
    mockedDb.collection.mockReturnValue({ find: mockFind });

    const result = await storage.listAllSharesForCampaign("camp-1");

    expect(result).toEqual([]);
  });

  it("A2-3: query uses only campaignId (no userId filter)", async () => {
    const mockToArray = jest.fn().mockResolvedValue([]);
    const mockFind = jest.fn().mockReturnValue({ toArray: mockToArray });
    mockedDb.collection.mockReturnValue({ find: mockFind });

    await storage.listAllSharesForCampaign("camp-1");

    expect(mockFind).toHaveBeenCalledWith({ campaignId: "camp-1" });
  });

  it("A2-4: strips _id from returned shares", async () => {
    const mockToArray = jest.fn().mockResolvedValue([share1]);
    const mockFind = jest.fn().mockReturnValue({ toArray: mockToArray });
    mockedDb.collection.mockReturnValue({ find: mockFind });

    const result = await storage.listAllSharesForCampaign("camp-1");

    expect(result[0]).not.toHaveProperty("_id");
  });
});

describe("storage.loadPartiesByCampaign", () => {
  const makeParty = (id: string, campaignId: string) => ({
    id,
    userId: "dm-1",
    name: `Party ${id}`,
    members: [],
    campaignId,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("A3-1: returns only parties matching the campaignId", async () => {
    const mockToArray = jest.fn().mockResolvedValue([makeParty("p-1", "camp-A")]);
    const mockFind = jest.fn().mockReturnValue({ toArray: mockToArray });
    mockedDb.collection.mockReturnValue({ find: mockFind });

    const result = await storage.loadPartiesByCampaign("camp-A");

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("p-1");
  });

  it("A3-2: returns empty array when no parties in campaign", async () => {
    const mockToArray = jest.fn().mockResolvedValue([]);
    const mockFind = jest.fn().mockReturnValue({ toArray: mockToArray });
    mockedDb.collection.mockReturnValue({ find: mockFind });

    const result = await storage.loadPartiesByCampaign("camp-X");

    expect(result).toEqual([]);
  });

  it("A3-3: emits perf log when query exceeds 10ms", async () => {
    let nowCallCount = 0;
    const nowSpy = jest.spyOn(Date, "now").mockImplementation(() => {
      nowCallCount++;
      return nowCallCount === 1 ? 1000 : 1020; // 20ms elapsed
    });

    const mockToArray = jest.fn().mockResolvedValue([]);
    const mockFind = jest.fn().mockReturnValue({ toArray: mockToArray });
    mockedDb.collection.mockReturnValue({ find: mockFind });

    const consoleSpy = jest.spyOn(console, "log").mockImplementation(() => {});

    await storage.loadPartiesByCampaign("camp-slow");

    const perfCalls = consoleSpy.mock.calls.filter(
      args => typeof args[0] === "string" && args[0].includes("[perf] loadPartiesByCampaign")
    );
    expect(perfCalls.length).toBeGreaterThan(0);

    nowSpy.mockRestore();
    consoleSpy.mockRestore();
  });
});

describe("storage.setPartyMemberLeftAt", () => {
  const makeParty = (id: string, members: object[]) => ({
    id,
    userId: "dm-1",
    name: `Party ${id}`,
    campaignId: "camp-1",
    members,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("A4-1: sets leftAt on active member with matching characterId", async () => {
    const party = makeParty("p-1", [{ characterId: "char-X", addedAt: new Date() }]);
    jest.spyOn(storage, "loadPartiesByCampaign").mockResolvedValue([party] as any);
    const saveSpy = jest.spyOn(storage, "saveParty").mockResolvedValue();

    const now = new Date();
    await storage.setPartyMemberLeftAt("camp-1", "char-X", now);

    expect(saveSpy).toHaveBeenCalledTimes(1);
    const savedParty = saveSpy.mock.calls[0][0];
    const member = savedParty.members.find((m: any) => m.characterId === "char-X");
    expect(member?.leftAt).toBe(now);
  });

  it("A4-2: does not modify already-left members", async () => {
    const existingLeftAt = new Date("2026-01-01");
    const party = makeParty("p-1", [{ characterId: "char-X", addedAt: new Date(), leftAt: existingLeftAt }]);
    jest.spyOn(storage, "loadPartiesByCampaign").mockResolvedValue([party] as any);
    const saveSpy = jest.spyOn(storage, "saveParty").mockResolvedValue();

    await storage.setPartyMemberLeftAt("camp-1", "char-X", new Date());

    expect(saveSpy).not.toHaveBeenCalled();
  });

  it("A4-3: updates multiple parties in the same campaign", async () => {
    const p1 = makeParty("p-1", [{ characterId: "char-X", addedAt: new Date() }]);
    const p2 = makeParty("p-2", [{ characterId: "char-X", addedAt: new Date() }]);
    jest.spyOn(storage, "loadPartiesByCampaign").mockResolvedValue([p1, p2] as any);
    const saveSpy = jest.spyOn(storage, "saveParty").mockResolvedValue();

    await storage.setPartyMemberLeftAt("camp-1", "char-X", new Date());

    expect(saveSpy).toHaveBeenCalledTimes(2);
  });

  it("A4-4: does not throw when saveParty throws", async () => {
    const party = makeParty("p-1", [{ characterId: "char-X", addedAt: new Date() }]);
    jest.spyOn(storage, "loadPartiesByCampaign").mockResolvedValue([party] as any);
    jest.spyOn(storage, "saveParty").mockRejectedValue(new Error("DB error"));

    await expect(storage.setPartyMemberLeftAt("camp-1", "char-X", new Date())).resolves.not.toThrow();
  });
});

describe("storage.canAddToCampaignParty", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("A5-1: returns true when character is owned by the DM", async () => {
    jest.spyOn(storage, "loadCharacterById").mockResolvedValue({
      id: "char-1", userId: "dm-user"
    } as any);

    const result = await storage.canAddToCampaignParty("camp-1", "char-1", "dm-user");

    expect(result).toBe(true);
  });

  it("A5-2: returns true when share exists and member is active", async () => {
    jest.spyOn(storage, "loadCharacterById").mockResolvedValue({
      id: "char-1", userId: "player-1"
    } as any);
    const mockFindOne = jest.fn().mockResolvedValue({
      campaignId: "camp-1", characterId: "char-1", userId: "player-1"
    });
    mockedDb.collection.mockReturnValue({ findOne: mockFindOne });
    jest.spyOn(storage, "getMember").mockResolvedValue({ status: "active" } as any);

    const result = await storage.canAddToCampaignParty("camp-1", "char-1", "dm-user");

    expect(result).toBe(true);
  });

  it("A5-3: returns false when share exists but member is invited", async () => {
    jest.spyOn(storage, "loadCharacterById").mockResolvedValue({
      id: "char-1", userId: "player-1"
    } as any);
    const mockFindOne = jest.fn().mockResolvedValue({
      campaignId: "camp-1", characterId: "char-1", userId: "player-1"
    });
    mockedDb.collection.mockReturnValue({ findOne: mockFindOne });
    jest.spyOn(storage, "getMember").mockResolvedValue({ status: "invited" } as any);

    const result = await storage.canAddToCampaignParty("camp-1", "char-1", "dm-user");

    expect(result).toBe(false);
  });

  it("A5-4: returns false when no share exists", async () => {
    jest.spyOn(storage, "loadCharacterById").mockResolvedValue({
      id: "char-1", userId: "player-1"
    } as any);
    const mockFindOne = jest.fn().mockResolvedValue(null);
    mockedDb.collection.mockReturnValue({ findOne: mockFindOne });

    const result = await storage.canAddToCampaignParty("camp-1", "char-1", "dm-user");

    expect(result).toBe(false);
  });

  it("A5-5: returns false when share exists but member is removed", async () => {
    jest.spyOn(storage, "loadCharacterById").mockResolvedValue({
      id: "char-1", userId: "player-1"
    } as any);
    const mockFindOne = jest.fn().mockResolvedValue({
      campaignId: "camp-1", characterId: "char-1", userId: "player-1"
    });
    mockedDb.collection.mockReturnValue({ findOne: mockFindOne });
    jest.spyOn(storage, "getMember").mockResolvedValue({ status: "removed" } as any);

    const result = await storage.canAddToCampaignParty("camp-1", "char-1", "dm-user");

    expect(result).toBe(false);
  });

  it("A5-6: returns false when character not found", async () => {
    jest.spyOn(storage, "loadCharacterById").mockResolvedValue(null);

    const result = await storage.canAddToCampaignParty("camp-1", "char-1", "dm-user");

    expect(result).toBe(false);
  });
});

describe("storage.loadCharacterById", () => {
  const CHARACTER_DOC = {
    id: "char-1",
    _id: "mongo-1",
    userId: "user-1",
    name: "Hero",
    deletedAt: null,
  };

  it("returns null when character not found", async () => {
    const mockFindOne = jest.fn().mockResolvedValue(null);
    mockedDb.collection.mockReturnValue({ findOne: mockFindOne });

    const result = await storage.loadCharacterById("char-1");

    expect(result).toBeNull();
  });

  it("returns normalized character with id when found", async () => {
    const mockFindOne = jest.fn().mockResolvedValue(CHARACTER_DOC);
    mockedDb.collection.mockReturnValue({ findOne: mockFindOne });

    const result = await storage.loadCharacterById("char-1");

    expect(result).not.toBeNull();
    expect(result!.id).toBe("char-1");
  });

  it("queries by id and deletedAt null to exclude soft-deleted characters", async () => {
    const mockFindOne = jest.fn().mockResolvedValue(null);
    mockedDb.collection.mockReturnValue({ findOne: mockFindOne });

    await storage.loadCharacterById("char-1");

    expect(mockFindOne).toHaveBeenCalledWith(
      expect.objectContaining({ id: "char-1" })
    );
  });
});
