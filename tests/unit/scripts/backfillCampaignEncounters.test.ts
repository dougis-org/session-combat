/**
 * @jest-environment node
 */
import { getDatabase } from "@/lib/db";
import { storage } from "@/lib/storage";

jest.mock("@/lib/db");
jest.mock("@/lib/storage");
jest.mock("@/lib/storage/campaignRepo");
import * as campaignRepo from "@/lib/storage/campaignRepo";

describe("backfillCampaignEncounters", () => {
  let mockDb: any;
  let mockCampaignsCol: any;
  let mockTemplatesCol: any;
  let backfillCampaignEncounters: any;

  beforeAll(async () => {
    const mod = await import("@/lib/scripts/backfillCampaignEncounters");
    backfillCampaignEncounters = mod.backfillCampaignEncounters;
  });

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockCampaignsCol = {
      find: jest.fn().mockReturnThis(),
      toArray: jest.fn().mockResolvedValue([])
    };
    
    mockTemplatesCol = {
      findOne: jest.fn()
    };
    
    mockDb = {
      collection: jest.fn((name) => {
        if (name === "campaigns") return mockCampaignsCol;
        if (name === "campaignTemplates") return mockTemplatesCol;
        return {};
      })
    };
    
    (getDatabase as jest.Mock).mockResolvedValue(mockDb);
  });

  test("returns zeroes when no campaigns match", async () => {
    mockCampaignsCol.toArray.mockResolvedValue([]);
    
    const result = await backfillCampaignEncounters();
    
    expect(result).toEqual({ migrated: 0, skipped: 0, failed: 0, encountersAdded: 0 });
    expect(mockCampaignsCol.find).toHaveBeenCalledWith({ templateId: { $exists: true, $ne: "" } });
  });

  test("skips campaigns with missing templates", async () => {
    mockCampaignsCol.toArray.mockResolvedValue([{ id: "c1", name: "C1", templateId: "t1" }]);
    mockTemplatesCol.findOne.mockResolvedValue(null);
    
    const result = await backfillCampaignEncounters();
    
    expect(result).toEqual({ migrated: 0, skipped: 1, failed: 0, encountersAdded: 0 });
  });

  test("skips templates with no encounters", async () => {
    mockCampaignsCol.toArray.mockResolvedValue([{ id: "c1", name: "C1", templateId: "t1" }]);
    mockTemplatesCol.findOne.mockResolvedValue({ id: "t1", encounters: [] });
    
    const result = await backfillCampaignEncounters();
    
    expect(result).toEqual({ migrated: 0, skipped: 1, failed: 0, encountersAdded: 0 });
  });

  test("skips if all encounters already exist", async () => {
    mockCampaignsCol.toArray.mockResolvedValue([{ id: "c1", name: "C1", templateId: "t1", userId: "u1" }]);
    mockTemplatesCol.findOne.mockResolvedValue({ id: "t1", encounters: [{ name: "Goblin Ambush" }] });
    (storage.loadEncountersByIds as jest.Mock).mockResolvedValue([{ name: "Goblin Ambush" }]);
    
    const result = await backfillCampaignEncounters();
    
    expect(result).toEqual({ migrated: 0, skipped: 1, failed: 0, encountersAdded: 0 });
  });

  test("migrates and adds new encounters", async () => {
    mockCampaignsCol.toArray.mockResolvedValue([{ id: "c1", name: "C1", templateId: "t1", userId: "u1", encounterIds: [] }]);
    mockTemplatesCol.findOne.mockResolvedValue({ id: "t1", encounters: [{ name: "Goblin Ambush" }] });
    (storage.loadEncountersByIds as jest.Mock).mockResolvedValue([]);
    
    const result = await backfillCampaignEncounters();
    
    expect(result.migrated).toBe(1);
    expect(result.encountersAdded).toBe(1);
    expect(storage.saveEncounter).toHaveBeenCalledTimes(1);
    expect(campaignRepo.saveCampaign).toHaveBeenCalledTimes(1);
  });

  test("handles failures gracefully", async () => {
    mockCampaignsCol.toArray.mockResolvedValue([{ id: "c1", name: "C1", templateId: "t1", userId: "u1" }]);
    mockTemplatesCol.findOne.mockRejectedValue(new Error("DB Error"));
    
    const result = await backfillCampaignEncounters();
    
    expect(result).toEqual({ migrated: 0, skipped: 0, failed: 1, encountersAdded: 0 });
  });
});
