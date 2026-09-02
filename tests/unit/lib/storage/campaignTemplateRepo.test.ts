/**
 * @jest-environment node
 */
import * as repo from "@/lib/storage/campaignTemplateRepo";
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
const TEMPLATE = { id: "t1", userId: "u1", name: "A" } as never;

describe("campaignTemplateRepo", () => {
  describe("loadGlobalCampaignTemplates", () => {
    it("returns sorted templates with collation applied; empty logs not_found", async () => {
      const col = mockCollection({ findResult: [{ id: "t1", name: "A" }] });
      expect((await repo.loadGlobalCampaignTemplates()).map((t) => t.id)).toEqual(["t1"]);
      expect(col._cursor.sort).toHaveBeenCalledWith({ name: 1 });
      expect(col._cursor.collation).toHaveBeenCalledWith({ locale: "en", strength: 2 });

      mockCollection({ findResult: [] });
      await expect(repo.loadGlobalCampaignTemplates()).resolves.toEqual([]);
      expectLoggedOutcome(getLogSpy(), "not_found");
    });
  });

  describe("loadGlobalCampaignTemplateById", () => {
    it("skips the query for a non-string / oversized id", async () => {
      const col = mockCollection();
      await expect(repo.loadGlobalCampaignTemplateById("")).resolves.toBeNull();
      await expect(repo.loadGlobalCampaignTemplateById("x".repeat(65))).resolves.toBeNull();
      expect(col.findOne).not.toHaveBeenCalled();
    });

    it("returns the doc, or null (logged not_found) when absent", async () => {
      mockCollection({ findOne: { id: "t1", name: "A" } });
      await expect(repo.loadGlobalCampaignTemplateById("t1")).resolves.toMatchObject({ id: "t1" });

      mockCollection({ findOne: null });
      await expect(repo.loadGlobalCampaignTemplateById("missing")).resolves.toBeNull();
      expectLoggedOutcome(getLogSpy(), "not_found");
    });
  });

  describe("saveCampaignTemplate", () => {
    it("upserts on the {id, userId} filter", async () => {
      const col = mockCollection();
      await repo.saveCampaignTemplate(TEMPLATE);
      expect(col.updateOne).toHaveBeenCalledWith(
        { id: "t1", userId: "u1" },
        expect.anything(),
        { upsert: true },
      );
    });
  });

  describe("deleteCampaignTemplate", () => {
    it("returns deletedCount > 0 as a boolean, never logged as not_found", async () => {
      mockCollection({ deleteOne: { deletedCount: 1 } });
      await expect(repo.deleteCampaignTemplate("t1")).resolves.toBe(true);

      mockCollection({ deleteOne: { deletedCount: 0 } });
      await expect(repo.deleteCampaignTemplate("t1")).resolves.toBe(false);
      expectNotLoggedOutcome(getLogSpy(), "not_found");
    });
  });

  // Previously-swallowing (load*) and raw-rethrowing (save/delete) methods now
  // reject with StorageError on a driver failure.
  describe.each<[string, () => Promise<unknown>]>([
    ["loadGlobalCampaignTemplates", () => repo.loadGlobalCampaignTemplates()],
    ["loadGlobalCampaignTemplateById", () => repo.loadGlobalCampaignTemplateById("t1")],
    ["saveCampaignTemplate", () => repo.saveCampaignTemplate(TEMPLATE)],
    ["deleteCampaignTemplate", () => repo.deleteCampaignTemplate("t1")],
  ])("%s on driver failure", (_name, call) => {
    it("rejects with StorageError", async () => {
      mockCollection({ findResult: DB_DOWN(), findOne: DB_DOWN(), updateOne: DB_DOWN(), deleteOne: DB_DOWN() });
      await expectStorageError(call());
    });
  });

  it("exposes all 4 methods on the storage facade", () => {
    expectFacadeMethods(storage as Record<string, unknown>, [
      "loadGlobalCampaignTemplates",
      "loadGlobalCampaignTemplateById",
      "saveCampaignTemplate",
      "deleteCampaignTemplate",
    ]);
  });
});
