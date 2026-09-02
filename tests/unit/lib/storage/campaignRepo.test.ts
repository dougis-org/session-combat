/**
 * @jest-environment node
 */
import * as repo from "@/lib/storage/campaignRepo";
import { storage } from "@/lib/storage";
import { StorageError } from "@/lib/storage/errors";
import * as logger from "@/lib/telemetry/logger";

jest.mock("@/lib/db", () => ({ getDatabase: jest.fn() }));
import { mockCollection } from "./_repoMock";

let logSpy: jest.SpyInstance;
beforeEach(() => {
  jest.clearAllMocks();
  logSpy = jest.spyOn(logger, "logStorageEvent").mockImplementation();
});
afterEach(() => logSpy.mockRestore());

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
    it("success → Campaign[]; empty → []; DB failure → StorageError (was: [])", async () => {
      mockCollection({ findResult: [{ id: "c1", name: "x" }] });
      await expect(repo.loadCampaigns("u1")).resolves.toHaveLength(1);

      mockCollection({ findResult: [] });
      await expect(repo.loadCampaigns("u1")).resolves.toEqual([]);
      expect(logSpy).toHaveBeenCalledWith(expect.objectContaining({ outcome: "not_found" }));

      mockCollection({ findResult: new Error("db down") });
      await expect(repo.loadCampaigns("u1")).rejects.toBeInstanceOf(StorageError);
    });
  });

  describe.each([
    ["loadCampaignById", (r: typeof repo) => r.loadCampaignById("c1", "u1")],
    ["loadCampaignByIdAny", (r: typeof repo) => r.loadCampaignByIdAny("c1")],
  ])("%s", (_name, call) => {
    it("hit / miss (null) / DB failure (StorageError)", async () => {
      mockCollection({ findOne: { id: "c1", name: "x" } });
      await expect(call(repo)).resolves.toMatchObject({ id: "c1" });

      mockCollection({ findOne: null });
      await expect(call(repo)).resolves.toBeNull();

      mockCollection({ findOne: new Error("db down") });
      await expect(call(repo)).rejects.toBeInstanceOf(StorageError);
    });
  });

  describe("saveCampaign / deleteCampaign / setActiveCampaignSession", () => {
    it("saveCampaign DB failure → StorageError", async () => {
      mockCollection({ updateOne: new Error("db down") });
      await expect(repo.saveCampaign({ id: "c1", userId: "u1" } as never)).rejects.toBeInstanceOf(StorageError);
    });

    it("deleteCampaign returns early when campaign not found (no cascade)", async () => {
      const col = mockCollection({ findOne: null });
      await repo.deleteCampaign("c1", "u1");
      expect(col.deleteMany).not.toHaveBeenCalled();
    });

    it("deleteCampaign cascades then deletes parent on hit", async () => {
      const col = mockCollection({ findOne: { id: "c1" } });
      await repo.deleteCampaign("c1", "u1");
      expect(col.deleteMany).toHaveBeenCalled();
      expect(col.deleteOne).toHaveBeenCalledWith({ id: "c1", userId: "u1" });
    });

    it("deleteCampaign DB failure → StorageError", async () => {
      mockCollection({ findOne: new Error("db down") });
      await expect(repo.deleteCampaign("c1", "u1")).rejects.toBeInstanceOf(StorageError);
    });

    it("setActiveCampaignSession DB failure → StorageError", async () => {
      mockCollection({ updateOne: new Error("db down") });
      await expect(
        repo.setActiveCampaignSession("c1", "u1", "s1"),
      ).rejects.toBeInstanceOf(StorageError);
    });
  });

  describe("claimActiveCampaignSession", () => {
    it("true on modifiedCount 1, false otherwise; false never logged not_found; DB failure → StorageError", async () => {
      mockCollection({ updateOne: { modifiedCount: 1 } });
      await expect(repo.claimActiveCampaignSession("c1", "u1", "s1")).resolves.toBe(true);

      mockCollection({ updateOne: { modifiedCount: 0 } });
      await expect(repo.claimActiveCampaignSession("c1", "u1", "s1")).resolves.toBe(false);
      expect(logSpy).not.toHaveBeenCalledWith(expect.objectContaining({ outcome: "not_found" }));

      mockCollection({ updateOne: new Error("db down") });
      await expect(repo.claimActiveCampaignSession("c1", "u1", "s1")).rejects.toBeInstanceOf(StorageError);
    });
  });

  describe("listCampaignsForMember", () => {
    it("no memberships → [] (non-throwing early return preserved)", async () => {
      mockCollection({ findResult: [] });
      await expect(repo.listCampaignsForMember("u1")).resolves.toEqual([]);
    });

    it("DB failure → StorageError (was: [])", async () => {
      mockCollection({ findResult: new Error("db down") });
      await expect(repo.listCampaignsForMember("u1")).rejects.toBeInstanceOf(StorageError);
    });
  });

  describe("getCampaignsByIds", () => {
    it("empty input → [] without touching the DB", async () => {
      const col = mockCollection();
      await expect(repo.getCampaignsByIds([])).resolves.toEqual([]);
      expect(col.find).not.toHaveBeenCalled();
    });

    it("DB failure → StorageError", async () => {
      mockCollection({ findResult: new Error("db down") });
      await expect(repo.getCampaignsByIds(["c1"])).rejects.toBeInstanceOf(StorageError);
    });
  });

  it("facade exposes all 9 campaign methods", () => {
    for (const n of [
      "loadCampaigns",
      "loadCampaignById",
      "saveCampaign",
      "deleteCampaign",
      "setActiveCampaignSession",
      "claimActiveCampaignSession",
      "loadCampaignByIdAny",
      "listCampaignsForMember",
      "getCampaignsByIds",
    ]) {
      expect(typeof (storage as Record<string, unknown>)[n]).toBe("function");
    }
  });
});
