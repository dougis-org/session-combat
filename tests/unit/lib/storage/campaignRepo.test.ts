/**
 * @jest-environment node
 */
import * as repo from "@/lib/storage/campaignRepo";
import { storage } from "@/lib/storage";

jest.mock("@/lib/db", () => ({ getDatabase: jest.fn() }));
import {
  mockCollection,
  installStorageLogSpy,
  expectStorageError,
  expectLoggedOutcome,
  expectNotLoggedOutcome,
  expectFacadeMethods,
} from "./_repoMock";

const getLogSpy = installStorageLogSpy();
const DB_DOWN = () => new Error("db down");
const CAMPAIGN = { id: "c1", userId: "u1" } as never;

describe("campaignRepo", () => {
  describe("normalizeCampaign", () => {
    it("fills array/scalar defaults and is applied on read paths", async () => {
      expect(repo.normalizeCampaign({ id: "c1", name: "x" } as never)).toMatchObject({
        chapters: [],
        encounterIds: [],
        partyIds: [],
        status: "active",
        notes: "",
      });
      const col = mockCollection();
      col._cursor.toArray
        .mockResolvedValueOnce([{ campaignId: "c1", role: "dm", status: "active" }])
        .mockResolvedValueOnce([{ id: "c1", name: "x" }]);
      const [c] = await repo.loadCampaigns("u1");
      expect(c.chapters).toEqual([]);
    });
  });

  describe("loadCampaigns", () => {
    it("annotates each campaign with the caller's role/status from its membership row", async () => {
      const col = mockCollection();
      col._cursor.toArray
        .mockResolvedValueOnce([
          { campaignId: "c1", role: "dm", status: "active" },
          { campaignId: "c2", role: "player", status: "invited" },
        ])
        .mockResolvedValueOnce([
          { id: "c1", name: "Dragon Heist" },
          { id: "c2", name: "Lost Mine" },
        ]);

      await expect(repo.loadCampaigns("u1")).resolves.toEqual([
        expect.objectContaining({ id: "c1", memberRole: "dm", memberStatus: "active" }),
        expect.objectContaining({ id: "c2", memberRole: "player", memberStatus: "invited" }),
      ]);
    });

    it("queries memberships filtered to active/invited statuses only", async () => {
      const col = mockCollection({ findResult: [] });
      await repo.loadCampaigns("u1");
      expect(col.find).toHaveBeenCalledWith({
        userId: "u1",
        status: { $in: ["active", "invited"] },
      });
    });

    it("resolves [] without querying campaigns, and logs not_found, when the user has no memberships", async () => {
      const col = mockCollection({ findResult: [] });
      await expect(repo.loadCampaigns("u1")).resolves.toEqual([]);
      expect(col.find).toHaveBeenCalledTimes(1);
      expectLoggedOutcome(getLogSpy(), "not_found");
    });
  });

  describe.each<[string, () => Promise<unknown>]>([
    ["loadCampaignById", () => repo.loadCampaignById("c1", "u1")],
    ["loadCampaignByIdAny", () => repo.loadCampaignByIdAny("c1")],
  ])("%s", (_name, call) => {
    it("resolves the doc on a hit and null on a miss", async () => {
      mockCollection({ findOne: { id: "c1", name: "x" } });
      await expect(call()).resolves.toMatchObject({ id: "c1" });

      mockCollection({ findOne: null });
      await expect(call()).resolves.toBeNull();
    });
  });

  describe("deleteCampaign", () => {
    it("returns early without cascading when the campaign is not found", async () => {
      const col = mockCollection({ findOne: null });
      await repo.deleteCampaign("c1", "u1");
      expect(col.deleteMany).not.toHaveBeenCalled();
    });

    it("cascades children then deletes the parent on a hit", async () => {
      const col = mockCollection({ findOne: { id: "c1" } });
      await repo.deleteCampaign("c1", "u1");
      expect(col.deleteMany).toHaveBeenCalled();
      expect(col.deleteOne).toHaveBeenCalledWith({ id: "c1", userId: "u1" });
    });
  });

  describe("claimActiveCampaignSession", () => {
    it("returns modifiedCount === 1 as a boolean, never logged as not_found", async () => {
      mockCollection({ updateOne: { modifiedCount: 1 } });
      await expect(repo.claimActiveCampaignSession("c1", "u1", "s1")).resolves.toBe(true);

      mockCollection({ updateOne: { modifiedCount: 0 } });
      await expect(repo.claimActiveCampaignSession("c1", "u1", "s1")).resolves.toBe(false);
      expectNotLoggedOutcome(getLogSpy(), "not_found");
    });
  });

  describe("early-return paths (no DB call)", () => {
    it("getCampaignsByIds → [] for empty input, without touching the DB", async () => {
      const col = mockCollection();
      await expect(repo.getCampaignsByIds([])).resolves.toEqual([]);
      expect(col.find).not.toHaveBeenCalled();
    });
  });

  // Previously-swallowing (load*, list*) and raw-rethrowing (save/delete/set/claim)
  // methods now reject with StorageError on a driver failure.
  describe.each<[string, () => Promise<unknown>]>([
    ["loadCampaigns", () => repo.loadCampaigns("u1")],
    ["loadCampaignById", () => repo.loadCampaignById("c1", "u1")],
    ["loadCampaignByIdAny", () => repo.loadCampaignByIdAny("c1")],
    ["saveCampaign", () => repo.saveCampaign(CAMPAIGN)],
    ["deleteCampaign", () => repo.deleteCampaign("c1", "u1")],
    ["setActiveCampaignSession", () => repo.setActiveCampaignSession("c1", "u1", "s1")],
    ["claimActiveCampaignSession", () => repo.claimActiveCampaignSession("c1", "u1", "s1")],
    ["getCampaignsByIds", () => repo.getCampaignsByIds(["c1"])],
  ])("%s on driver failure", (_name, call) => {
    it("rejects with StorageError", async () => {
      mockCollection({ findResult: DB_DOWN(), findOne: DB_DOWN(), updateOne: DB_DOWN() });
      await expectStorageError(call());
    });
  });

  it("exposes all 8 campaign methods on the storage facade", () => {
    expectFacadeMethods(storage as Record<string, unknown>, [
      "loadCampaigns",
      "loadCampaignById",
      "saveCampaign",
      "deleteCampaign",
      "setActiveCampaignSession",
      "claimActiveCampaignSession",
      "loadCampaignByIdAny",
      "getCampaignsByIds",
    ]);
  });
});
