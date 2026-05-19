import { describe, test, expect, jest, beforeEach } from "@jest/globals";
import { storage } from "@/lib/storage";
import { getDatabase } from "@/lib/db";
import type { Campaign } from "@/lib/types";

jest.mock("@/lib/db", () => ({
  getDatabase: jest.fn(),
}));

const mockedGetDatabase = jest.mocked(getDatabase);

function makeMockCollection() {
  const toArray = jest.fn<() => Promise<unknown[]>>();
  const find = jest.fn(() => ({ toArray }));
  const findOne = jest.fn<() => Promise<unknown>>();
  const updateOne = jest.fn<() => Promise<unknown>>();
  const deleteOne = jest.fn<() => Promise<unknown>>();
  return { find, toArray, findOne, updateOne, deleteOne };
}

const baseCampaign: Campaign = {
  id: "campaign-1",
  userId: "user-1",
  name: "Test Campaign",
  moduleName: "Test Module",
  currentChapter: "Chapter 1",
  currentChapterOrder: 1,
  active: true,
  createdAt: new Date("2024-01-01"),
  updatedAt: new Date("2024-01-01"),
};

describe("storage.loadCampaigns", () => {
  let campaignsMock: ReturnType<typeof makeMockCollection>;
  let mockDb: any;

  beforeEach(() => {
    campaignsMock = makeMockCollection();
    mockDb = {
      collection: jest.fn(() => campaignsMock),
    };
    mockedGetDatabase.mockResolvedValue(mockDb as never);
  });

  test("returns all campaigns for the given userId", async () => {
    const campaigns = [baseCampaign];
    campaignsMock.toArray.mockResolvedValue(campaigns as never);

    const result = await storage.loadCampaigns("user-1");

    expect(mockDb.collection).toHaveBeenCalledWith("campaigns");
    expect(campaignsMock.find).toHaveBeenCalledWith({ userId: "user-1" });
    expect(result).toEqual(campaigns);
  });

  test("returns empty array when no campaigns exist for user", async () => {
    campaignsMock.toArray.mockResolvedValue([] as never);

    const result = await storage.loadCampaigns("user-1");

    expect(result).toEqual([]);
  });

  test("returns empty array when getDatabase fails", async () => {
    mockedGetDatabase.mockRejectedValue(new Error("connection failed") as never);

    const result = await storage.loadCampaigns("user-1");

    expect(result).toEqual([]);
  });
});

describe("storage.loadCampaignById", () => {
  let campaignsMock: ReturnType<typeof makeMockCollection>;
  let mockDb: any;

  beforeEach(() => {
    campaignsMock = makeMockCollection();
    mockDb = {
      collection: jest.fn(() => campaignsMock),
    };
    mockedGetDatabase.mockResolvedValue(mockDb as never);
  });

  test("returns campaign when id and userId match", async () => {
    campaignsMock.findOne.mockResolvedValue(baseCampaign as never);

    const result = await storage.loadCampaignById("campaign-1", "user-1");

    expect(campaignsMock.findOne).toHaveBeenCalledWith({ id: "campaign-1", userId: "user-1" });
    expect(result).toEqual(baseCampaign);
  });

  test("returns null when id exists but userId does not match", async () => {
    campaignsMock.findOne.mockResolvedValue(null as never);

    const result = await storage.loadCampaignById("campaign-1", "other-user");

    expect(result).toBeNull();
  });

  test("returns null when id does not exist", async () => {
    campaignsMock.findOne.mockResolvedValue(null as never);

    const result = await storage.loadCampaignById("nonexistent", "user-1");

    expect(result).toBeNull();
  });

  test("returns null when getDatabase fails", async () => {
    mockedGetDatabase.mockRejectedValue(new Error("connection failed") as never);

    const result = await storage.loadCampaignById("campaign-1", "user-1");

    expect(result).toBeNull();
  });
});

describe("storage.saveCampaign", () => {
  let campaignsMock: ReturnType<typeof makeMockCollection>;
  let mockDb: any;

  beforeEach(() => {
    campaignsMock = makeMockCollection();
    mockDb = {
      collection: jest.fn(() => campaignsMock),
    };
    mockedGetDatabase.mockResolvedValue(mockDb as never);
    campaignsMock.updateOne.mockResolvedValue({} as never);
  });

  test("persists campaign with upsert by id and userId", async () => {
    await storage.saveCampaign(baseCampaign);

    expect(mockDb.collection).toHaveBeenCalledWith("campaigns");
    expect(campaignsMock.updateOne).toHaveBeenCalledWith(
      { id: baseCampaign.id, userId: baseCampaign.userId },
      expect.objectContaining({ $set: expect.any(Object) }),
      { upsert: true }
    );
  });

  test("throws when database operation fails", async () => {
    campaignsMock.updateOne.mockRejectedValue(new Error("write failed") as never);

    await expect(storage.saveCampaign(baseCampaign)).rejects.toThrow("write failed");
  });
});

describe("storage.deleteCampaign", () => {
  let campaignsMock: ReturnType<typeof makeMockCollection>;
  let mockDb: any;

  beforeEach(() => {
    campaignsMock = makeMockCollection();
    mockDb = {
      collection: jest.fn(() => campaignsMock),
    };
    mockedGetDatabase.mockResolvedValue(mockDb as never);
    campaignsMock.deleteOne.mockResolvedValue({ deletedCount: 1 } as never);
  });

  test("deletes campaign by id and userId", async () => {
    await storage.deleteCampaign("campaign-1", "user-1");

    expect(mockDb.collection).toHaveBeenCalledWith("campaigns");
    expect(campaignsMock.deleteOne).toHaveBeenCalledWith({ id: "campaign-1", userId: "user-1" });
  });

  test("does not throw when campaign does not exist (deleteOne is a no-op)", async () => {
    campaignsMock.deleteOne.mockResolvedValue({ deletedCount: 0 } as never);

    await expect(storage.deleteCampaign("nonexistent", "user-1")).resolves.not.toThrow();
  });

  test("throws when database operation fails", async () => {
    campaignsMock.deleteOne.mockRejectedValue(new Error("delete failed") as never);

    await expect(storage.deleteCampaign("campaign-1", "user-1")).rejects.toThrow("delete failed");
  });
});
