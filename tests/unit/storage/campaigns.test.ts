/**
 * @jest-environment node
 */
import { storage } from "@/lib/storage";
import { getDatabase } from "@/lib/db";
import type { Campaign, CampaignTemplate } from "@/lib/types";

jest.mock("@/lib/db", () => ({
  getDatabase: jest.fn(),
}));

const mockedGetDatabase = jest.mocked(getDatabase);

function makeMockCollection() {
  const toArray = jest.fn<Promise<unknown[]>, []>();
  const sort = jest.fn(() => ({ toArray }));
  const find = jest.fn(() => ({ sort, toArray }));
  const findOne = jest.fn<Promise<unknown>, []>();
  const updateOne = jest.fn<Promise<unknown>, []>();
  const deleteOne = jest.fn<Promise<unknown>, []>();
  return { find, sort, toArray, findOne, updateOne, deleteOne };
}

const baseCampaign: Campaign = {
  id: "campaign-1",
  userId: "user-1",
  name: "Test Campaign",
  moduleName: "Test Module",
  chapters: [],
  status: "active",
  notes: "",
  createdAt: new Date("2024-01-01"),
  updatedAt: new Date("2024-01-01"),
};

describe("Campaign storage functions", () => {
  let campaignsMock: ReturnType<typeof makeMockCollection>;
  let mockDb: { collection: ReturnType<typeof jest.fn> };

  beforeEach(() => {
    campaignsMock = makeMockCollection();
    mockDb = { collection: jest.fn(() => campaignsMock) };
    mockedGetDatabase.mockResolvedValue(mockDb as never);
  });

  describe("storage.loadCampaigns", () => {
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
    beforeEach(() => {
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
    beforeEach(() => {
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

  describe("storage.loadCampaigns normalizes legacy chapters", () => {
    test("defaults missing chapters to empty array", async () => {
      const legacyCampaign = { ...baseCampaign, chapters: undefined };
      campaignsMock.toArray.mockResolvedValue([legacyCampaign] as never);

      const result = await storage.loadCampaigns("user-1");

      expect(result[0].chapters).toEqual([]);
    });
  });
});

const baseTemplate: CampaignTemplate = {
  id: "template-1",
  userId: "GLOBAL",
  isGlobal: true,
  name: "Test Template",
  moduleName: "TT",
  chapters: [],
  createdAt: new Date("2024-01-01"),
  updatedAt: new Date("2024-01-01"),
};

describe("Campaign template storage functions", () => {
  let templatesMock: ReturnType<typeof makeMockCollection>;
  let mockDb: { collection: ReturnType<typeof jest.fn> };

  beforeEach(() => {
    templatesMock = makeMockCollection();
    mockDb = { collection: jest.fn(() => templatesMock) };
    mockedGetDatabase.mockResolvedValue(mockDb as never);
  });

  describe("storage.loadGlobalCampaignTemplates", () => {
    test("returns all global templates", async () => {
      templatesMock.toArray.mockResolvedValue([baseTemplate] as never);

      const result = await storage.loadGlobalCampaignTemplates();

      expect(mockDb.collection).toHaveBeenCalledWith("campaignTemplates");
      expect(templatesMock.find).toHaveBeenCalledWith({ userId: "GLOBAL" });
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe("Test Template");
    });

    test("returns empty array when no templates exist", async () => {
      templatesMock.toArray.mockResolvedValue([] as never);

      const result = await storage.loadGlobalCampaignTemplates();

      expect(result).toEqual([]);
    });

    test("returns empty array when getDatabase fails", async () => {
      mockedGetDatabase.mockRejectedValue(new Error("connection failed") as never);

      const result = await storage.loadGlobalCampaignTemplates();

      expect(result).toEqual([]);
    });
  });

  describe("storage.loadGlobalCampaignTemplateById", () => {
    test("returns template when found", async () => {
      templatesMock.findOne.mockResolvedValue(baseTemplate as never);

      const result = await storage.loadGlobalCampaignTemplateById("template-1");

      expect(templatesMock.findOne).toHaveBeenCalledWith({ id: "template-1", userId: "GLOBAL" });
      expect(result?.name).toBe("Test Template");
    });

    test("returns null when not found", async () => {
      templatesMock.findOne.mockResolvedValue(null as never);

      const result = await storage.loadGlobalCampaignTemplateById("nonexistent");

      expect(result).toBeNull();
    });

    test("returns null when getDatabase fails", async () => {
      mockedGetDatabase.mockRejectedValue(new Error("connection failed") as never);

      const result = await storage.loadGlobalCampaignTemplateById("template-1");

      expect(result).toBeNull();
    });
  });

  describe("storage.saveCampaignTemplate", () => {
    beforeEach(() => {
      templatesMock.updateOne.mockResolvedValue({} as never);
    });

    test("persists template with upsert by id and userId", async () => {
      await storage.saveCampaignTemplate(baseTemplate);

      expect(mockDb.collection).toHaveBeenCalledWith("campaignTemplates");
      expect(templatesMock.updateOne).toHaveBeenCalledWith(
        { id: baseTemplate.id, userId: baseTemplate.userId },
        expect.objectContaining({ $set: expect.any(Object) }),
        { upsert: true }
      );
    });

    test("throws when database operation fails", async () => {
      templatesMock.updateOne.mockRejectedValue(new Error("write failed") as never);

      await expect(storage.saveCampaignTemplate(baseTemplate)).rejects.toThrow("write failed");
    });
  });

  describe("storage.deleteCampaignTemplate", () => {
    test("returns true when template is deleted", async () => {
      templatesMock.deleteOne.mockResolvedValue({ deletedCount: 1 } as never);

      const result = await storage.deleteCampaignTemplate("template-1");

      expect(mockDb.collection).toHaveBeenCalledWith("campaignTemplates");
      expect(templatesMock.deleteOne).toHaveBeenCalledWith({ id: "template-1", userId: "GLOBAL" });
      expect(result).toBe(true);
    });

    test("returns false when template does not exist", async () => {
      templatesMock.deleteOne.mockResolvedValue({ deletedCount: 0 } as never);

      const result = await storage.deleteCampaignTemplate("nonexistent");

      expect(result).toBe(false);
    });

    test("throws when database operation fails", async () => {
      templatesMock.deleteOne.mockRejectedValue(new Error("delete failed") as never);

      await expect(storage.deleteCampaignTemplate("template-1")).rejects.toThrow("delete failed");
    });
  });
});
