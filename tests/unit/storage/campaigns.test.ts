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
  const collation = jest.fn(() => ({ toArray }));
  const sort = jest.fn(() => ({ collation, toArray }));
  const find = jest.fn(() => ({ sort, toArray }));
  const findOne = jest.fn<Promise<unknown>, []>();
  const updateOne = jest.fn<Promise<unknown>, []>();
  const deleteOne = jest.fn<Promise<unknown>, []>();
  const deleteMany = jest.fn<Promise<unknown>, [Record<string, unknown>?]>().mockResolvedValue({ deletedCount: 0 } as never);
  return { find, sort, collation, toArray, findOne, updateOne, deleteOne, deleteMany };
}

const baseCampaign: Campaign = {
  id: "campaign-1",
  userId: "user-1",
  name: "Test Campaign",
  moduleName: "Test Module",
  chapters: [],
  encounterIds: [],
    partyIds: [],
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
    let partiesMock: ReturnType<typeof makeMockCollection>;
    let campaignMembersMock: ReturnType<typeof makeMockCollection>;
    let sessionLogsMock: ReturnType<typeof makeMockCollection>;
    let campaignRollsMock: ReturnType<typeof makeMockCollection>;
    let campaignCharacterSharesMock: ReturnType<typeof makeMockCollection>;
    let savedContentMock: ReturnType<typeof makeMockCollection>;
    let campaignMessagesMock: ReturnType<typeof makeMockCollection>;

    beforeEach(() => {
      campaignsMock.findOne.mockResolvedValue(baseCampaign as never);
      campaignsMock.deleteOne.mockResolvedValue({ deletedCount: 1 } as never);
      partiesMock = makeMockCollection();
      campaignMembersMock = makeMockCollection();
      sessionLogsMock = makeMockCollection();
      campaignRollsMock = makeMockCollection();
      campaignCharacterSharesMock = makeMockCollection();
      savedContentMock = makeMockCollection();
      campaignMessagesMock = makeMockCollection();

      const mocks: Record<string, any> = {
        campaigns: campaignsMock,
        parties: partiesMock,
        campaignMembers: campaignMembersMock,
        sessionLogs: sessionLogsMock,
        campaignRolls: campaignRollsMock,
        campaignCharacterShares: campaignCharacterSharesMock,
        savedContent: savedContentMock,
        campaignMessages: campaignMessagesMock,
      };

      mockDb.collection = jest.fn((name: string) => mocks[name] || makeMockCollection());
    });

    test("deletes campaign by id and userId", async () => {
      await storage.deleteCampaign("campaign-1", "user-1");

      expect(mockDb.collection).toHaveBeenCalledWith("campaigns");
      expect(campaignsMock.deleteOne).toHaveBeenCalledWith({ id: "campaign-1", userId: "user-1" });
    });

    test("does not cascade delete parties", async () => {
      await storage.deleteCampaign("campaign-1", "user-1");
      expect(partiesMock.deleteMany).not.toHaveBeenCalled();
    });

    test("cascade deletes CampaignMember rows for the campaign", async () => {
      await storage.deleteCampaign("campaign-1", "user-1");

      expect(mockDb.collection).toHaveBeenCalledWith("campaignMembers");
      expect(campaignMembersMock.deleteMany).toHaveBeenCalledWith({ campaignId: "campaign-1" });
    });

    test("cascade deletes session logs, rolls, character shares, saved content, and messages", async () => {
      await storage.deleteCampaign("campaign-1", "user-1");

      expect(mockDb.collection).toHaveBeenCalledWith("sessionLogs");
      expect(sessionLogsMock.deleteMany).toHaveBeenCalledWith({ campaignId: "campaign-1" });

      expect(mockDb.collection).toHaveBeenCalledWith("campaignRolls");
      expect(campaignRollsMock.deleteMany).toHaveBeenCalledWith({ campaignId: "campaign-1" });

      expect(mockDb.collection).toHaveBeenCalledWith("campaignCharacterShares");
      expect(campaignCharacterSharesMock.deleteMany).toHaveBeenCalledWith({ campaignId: "campaign-1" });

      expect(mockDb.collection).toHaveBeenCalledWith("savedContent");
      expect(savedContentMock.deleteMany).toHaveBeenCalledWith({ campaignId: "campaign-1" });

      expect(mockDb.collection).toHaveBeenCalledWith("campaignMessages");
      expect(campaignMessagesMock.deleteMany).toHaveBeenCalledWith({ campaignId: "campaign-1" });
    });

    test("deletes children first, then campaign document last (ordering check)", async () => {
      const callSequence: string[] = [];
      campaignMembersMock.deleteMany.mockImplementation(async () => { callSequence.push("campaignMembers"); return { deletedCount: 0 }; });
      sessionLogsMock.deleteMany.mockImplementation(async () => { callSequence.push("sessionLogs"); return { deletedCount: 0 }; });
      campaignRollsMock.deleteMany.mockImplementation(async () => { callSequence.push("campaignRolls"); return { deletedCount: 0 }; });
      campaignCharacterSharesMock.deleteMany.mockImplementation(async () => { callSequence.push("campaignCharacterShares"); return { deletedCount: 0 }; });
      savedContentMock.deleteMany.mockImplementation(async () => { callSequence.push("savedContent"); return { deletedCount: 0 }; });
      campaignMessagesMock.deleteMany.mockImplementation(async () => { callSequence.push("campaignMessages"); return { deletedCount: 0 }; });
      campaignsMock.deleteOne.mockImplementation(async () => { callSequence.push("campaigns"); return { deletedCount: 1 }; });

      await storage.deleteCampaign("campaign-1", "user-1");

      expect(callSequence).toHaveLength(7);
      expect(callSequence[6]).toBe("campaigns");
      expect(callSequence.slice(0, 6)).toContain("campaignMembers");
      expect(callSequence.slice(0, 6)).toContain("sessionLogs");
      expect(callSequence.slice(0, 6)).toContain("campaignRolls");
      expect(callSequence.slice(0, 6)).toContain("campaignCharacterShares");
      expect(callSequence.slice(0, 6)).toContain("savedContent");
      expect(callSequence.slice(0, 6)).toContain("campaignMessages");
    });

    test("does not cascade delete if campaign does not exist or does not belong to user", async () => {
      campaignsMock.findOne.mockResolvedValue(null as never);
      await storage.deleteCampaign("campaign-1", "user-1");

      expect(partiesMock.deleteMany).not.toHaveBeenCalled();
      expect(campaignMembersMock.deleteMany).not.toHaveBeenCalled();
      expect(sessionLogsMock.deleteMany).not.toHaveBeenCalled();
      expect(campaignRollsMock.deleteMany).not.toHaveBeenCalled();
      expect(campaignCharacterSharesMock.deleteMany).not.toHaveBeenCalled();
      expect(savedContentMock.deleteMany).not.toHaveBeenCalled();
      expect(campaignMessagesMock.deleteMany).not.toHaveBeenCalled();
      expect(campaignsMock.deleteOne).not.toHaveBeenCalled();
    });

    test("does not throw when campaign does not exist (early return before deleteOne)", async () => {
      campaignsMock.findOne.mockResolvedValue(null as never);
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

    test("queries with sort({ name: 1 }) and case-insensitive collation", async () => {
      templatesMock.toArray.mockResolvedValue([] as never);

      await storage.loadGlobalCampaignTemplates();

      expect(templatesMock.sort).toHaveBeenCalledWith({ name: 1 });
      expect(templatesMock.collation).toHaveBeenCalledWith({ locale: 'en', strength: 2 });
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
