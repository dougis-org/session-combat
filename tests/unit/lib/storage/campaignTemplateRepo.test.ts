/**
 * @jest-environment node
 */
import * as repo from "@/lib/storage/campaignTemplateRepo";
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

describe("campaignTemplateRepo", () => {
  describe("loadGlobalCampaignTemplates", () => {
    it("returns sorted templates with collation applied", async () => {
      const col = mockCollection({ findResult: [{ id: "t1", name: "A" }] });
      const res = await repo.loadGlobalCampaignTemplates();
      expect(res.map((t) => t.id)).toEqual(["t1"]);
      expect(col._cursor.sort).toHaveBeenCalledWith({ name: 1 });
      expect(col._cursor.collation).toHaveBeenCalledWith({ locale: "en", strength: 2 });
    });

    it("empty → [] no throw; DB failure → StorageError (was: [])", async () => {
      mockCollection({ findResult: [] });
      await expect(repo.loadGlobalCampaignTemplates()).resolves.toEqual([]);
      expect(logSpy).toHaveBeenCalledWith(expect.objectContaining({ outcome: "not_found" }));

      mockCollection({ findResult: new Error("db down") });
      await expect(repo.loadGlobalCampaignTemplates()).rejects.toBeInstanceOf(StorageError);
    });
  });

  describe("loadGlobalCampaignTemplateById", () => {
    it("returns null for a non-string / oversized id without querying", async () => {
      const col = mockCollection();
      await expect(repo.loadGlobalCampaignTemplateById("")).resolves.toBeNull();
      await expect(
        repo.loadGlobalCampaignTemplateById("x".repeat(65)),
      ).resolves.toBeNull();
      expect(col.findOne).not.toHaveBeenCalled();
    });

    it("hit → normalized doc; miss → null (not_found); DB failure → StorageError (was: null)", async () => {
      mockCollection({ findOne: { id: "t1", name: "A" } });
      await expect(repo.loadGlobalCampaignTemplateById("t1")).resolves.toMatchObject({ id: "t1" });

      mockCollection({ findOne: null });
      await expect(repo.loadGlobalCampaignTemplateById("x")).resolves.toBeNull();
      expect(logSpy).toHaveBeenCalledWith(expect.objectContaining({ outcome: "not_found" }));

      mockCollection({ findOne: new Error("db down") });
      await expect(repo.loadGlobalCampaignTemplateById("t1")).rejects.toBeInstanceOf(StorageError);
    });
  });

  describe("saveCampaignTemplate", () => {
    it("upsert filter {id, userId}; DB failure → StorageError", async () => {
      const col = mockCollection();
      await repo.saveCampaignTemplate({ id: "t1", userId: "u1", name: "A" } as never);
      expect(col.updateOne).toHaveBeenCalledWith(
        { id: "t1", userId: "u1" },
        expect.anything(),
        { upsert: true },
      );

      mockCollection({ updateOne: new Error("db down") });
      await expect(
        repo.saveCampaignTemplate({ id: "t1", userId: "u1", name: "A" } as never),
      ).rejects.toBeInstanceOf(StorageError);
    });
  });

  describe("deleteCampaignTemplate", () => {
    it("returns true/false by deletedCount; false never logged not_found; DB failure → StorageError", async () => {
      mockCollection({ deleteOne: { deletedCount: 1 } });
      await expect(repo.deleteCampaignTemplate("t1")).resolves.toBe(true);

      mockCollection({ deleteOne: { deletedCount: 0 } });
      await expect(repo.deleteCampaignTemplate("t1")).resolves.toBe(false);
      expect(logSpy).not.toHaveBeenCalledWith(expect.objectContaining({ outcome: "not_found" }));

      mockCollection({ deleteOne: new Error("db down") });
      await expect(repo.deleteCampaignTemplate("t1")).rejects.toBeInstanceOf(StorageError);
    });
  });

  it("facade exposes all 4 methods", () => {
    for (const n of [
      "loadGlobalCampaignTemplates",
      "loadGlobalCampaignTemplateById",
      "saveCampaignTemplate",
      "deleteCampaignTemplate",
    ]) {
      expect(typeof (storage as Record<string, unknown>)[n]).toBe("function");
    }
  });
});
