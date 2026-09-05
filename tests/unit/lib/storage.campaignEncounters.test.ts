/**
 * @jest-environment node
 */
import { storage } from "@/lib/storage";
import { Encounter } from "@/lib/types";

jest.mock("@/lib/db", () => ({
  getDatabase: jest.fn(),
}));

import { getDatabase } from "@/lib/db";

const mockedDb = {
  collection: jest.fn(),
};

const mockedCollection = {
  findOne: jest.fn(),
  find: jest.fn(),
  updateOne: jest.fn(),
  toArray: jest.fn(),
};

jest.mocked(getDatabase).mockResolvedValue(mockedDb as any);
jest.mocked(mockedDb.collection).mockReturnValue(mockedCollection as any);

beforeEach(() => {
  jest.clearAllMocks();
  mockedCollection.find.mockReturnValue({ toArray: mockedCollection.toArray });
});

describe("storage.loadEncountersByIds", () => {
  const OWNER = "dm-user";

  it("returns matching Encounter[] for ids owned by the given ownerUserId", async () => {
    const encounters: Encounter[] = [
      { id: "e1", userId: OWNER, name: "A", description: "", monsters: [], createdAt: new Date(), updatedAt: new Date() },
      { id: "e2", userId: OWNER, name: "B", description: "", monsters: [], createdAt: new Date(), updatedAt: new Date() },
    ];
    mockedCollection.toArray.mockResolvedValue(encounters);

    const result = await storage.loadEncountersByIds(["e1", "e2"], OWNER);

    expect(mockedCollection.find).toHaveBeenCalledWith({ id: { $in: ["e1", "e2"] }, userId: OWNER });
    expect(result).toHaveLength(2);
    expect(result.map((e) => e.id)).toEqual(["e1", "e2"]);
  });

  it("excludes encounters owned by a different userId even if their id is in the list", async () => {
    // The find() query itself is scoped by userId, so the driver would never return
    // a foreign-owned encounter — assert the mock reflects that scoping.
    mockedCollection.toArray.mockResolvedValue([]);

    const result = await storage.loadEncountersByIds(["e9"], OWNER);

    expect(mockedCollection.find).toHaveBeenCalledWith({ id: { $in: ["e9"] }, userId: OWNER });
    expect(result).toEqual([]);
  });

  it("returns [] without issuing a find() call when ids is empty", async () => {
    const result = await storage.loadEncountersByIds([], OWNER);

    expect(result).toEqual([]);
    expect(mockedCollection.find).not.toHaveBeenCalled();
  });

  it("issues exactly one find() call regardless of id-list size", async () => {
    const ids = Array.from({ length: 20 }, (_, i) => `e${i}`);
    mockedCollection.toArray.mockResolvedValue([]);

    await storage.loadEncountersByIds(ids, OWNER);

    expect(mockedCollection.find).toHaveBeenCalledTimes(1);
  });

  it("rejects with a StorageError wrapping the failure, rather than returning []", async () => {
    mockedCollection.toArray.mockRejectedValue(new Error("connection reset"));

    await expect(storage.loadEncountersByIds(["e1"], OWNER)).rejects.toMatchObject({
      name: "StorageError",
      cause: new Error("connection reset"),
    });
  });
});

describe("storage.addEncounterToCampaign", () => {
  it("performs $addToSet scoped to { id: campaignId, userId: dmUserId }", async () => {
    mockedCollection.updateOne.mockResolvedValue({} as any);

    await storage.addEncounterToCampaign("camp-1", "e3", "dm-user");

    expect(mockedCollection.updateOne).toHaveBeenCalledWith(
      { id: "camp-1", userId: "dm-user" },
      { $addToSet: { encounterIds: "e3" } }
    );
  });

  it("rejects with a StorageError wrapping the failure", async () => {
    mockedCollection.updateOne.mockRejectedValue(new Error("connection reset"));

    await expect(storage.addEncounterToCampaign("camp-1", "e3", "dm-user")).rejects.toMatchObject({
      name: "StorageError",
      cause: new Error("connection reset"),
    });
  });
});

describe("storage.removeEncounterFromCampaign", () => {
  it("performs $pull scoped to { id: campaignId, userId: dmUserId }", async () => {
    mockedCollection.updateOne.mockResolvedValue({} as any);

    await storage.removeEncounterFromCampaign("camp-1", "e3", "dm-user");

    expect(mockedCollection.updateOne).toHaveBeenCalledWith(
      { id: "camp-1", userId: "dm-user" },
      { $pull: { encounterIds: "e3" } }
    );
  });

  it("on an id not present in encounterIds completes without error", async () => {
    mockedCollection.updateOne.mockResolvedValue({} as any);

    await expect(
      storage.removeEncounterFromCampaign("camp-1", "e7", "dm-user")
    ).resolves.toBeUndefined();
  });

  it("rejects with a StorageError wrapping the failure", async () => {
    mockedCollection.updateOne.mockRejectedValue(new Error("connection reset"));

    await expect(storage.removeEncounterFromCampaign("camp-1", "e3", "dm-user")).rejects.toMatchObject({
      name: "StorageError",
      cause: new Error("connection reset"),
    });
  });
});
