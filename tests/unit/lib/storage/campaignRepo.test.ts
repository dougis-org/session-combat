/**
 * @jest-environment node
 */
import * as repo from "@/lib/storage/campaignRepo";
import { storage } from "@/lib/storage";

jest.mock("@/lib/db", () => ({ getDatabase: jest.fn() }));
import {
  mockCollection,
  useStorageLogSpy,
  expectStorageError,
  expectLoggedOutcome,
  expectNotLoggedOutcome,
  expectFacadeMethods,
} from "./_repoMock";

const getLogSpy = useStorageLogSpy();
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
      mockCollection({ findResult: [{ id: "c1", name: "x" }] });
      const [c] = await repo.loadCampaigns("u1");
      expect(c.chapters).toEqual([]);
    });
  });

  describe("loadCampaigns", () => {
    it("resolves the list, and logs not_found on an empty result", async () => {
      mockCollection({ findResult: [{ id: "c1", name: "x" }] });
      await expect(repo.loadCampaigns("u1")).resolves.toHaveLength(1);

      mockCollection({ findResult: [] });
      await expect(repo.loadCampaigns("u1")).resolves.toEqual([]);
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
    it("listCampaignsForMember → [] when the member has no memberships", async () => {
      mockCollection({ findResult: [] });
      await expect(repo.listCampaignsForMember("u1")).resolves.toEqual([]);
    });

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
    ["listCampaignsForMember", () => repo.listCampaignsForMember("u1")],
    ["getCampaignsByIds", () => repo.getCampaignsByIds(["c1"])],
  ])("%s on driver failure", (_name, call) => {
    it("rejects with StorageError", async () => {
      mockCollection({ findResult: DB_DOWN(), findOne: DB_DOWN(), updateOne: DB_DOWN() });
      await expectStorageError(call());
    });
  });

  it("exposes all 9 campaign methods on the storage facade", () => {
    expectFacadeMethods(storage as Record<string, unknown>, [
      "loadCampaigns",
      "loadCampaignById",
      "saveCampaign",
      "deleteCampaign",
      "setActiveCampaignSession",
      "claimActiveCampaignSession",
      "loadCampaignByIdAny",
      "listCampaignsForMember",
      "getCampaignsByIds",
    ]);
  });
});
