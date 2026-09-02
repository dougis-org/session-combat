/**
 * @jest-environment node
 */
import * as repo from "@/lib/storage/monsterTemplateRepo";
import { storage } from "@/lib/storage";
import { GLOBAL_USER_ID } from "@/lib/constants";

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
const TEMPLATE = { id: "m1", userId: "u1", name: "Orc" } as never;

describe("monsterTemplateRepo", () => {
  describe("loadMonsterTemplates", () => {
    it("returns id-normalized templates and logs success", async () => {
      mockCollection({ findResult: [{ _id: "507f1f77bcf86cd799439011", name: "Goblin", userId: "u1" }] });
      const res = await repo.loadMonsterTemplates("u1");
      expect(res[0].id).toBe("507f1f77bcf86cd799439011");
      expectLoggedOutcome(getLogSpy(), "success");
    });

    it("empty collection resolves to [] and logs not_found", async () => {
      mockCollection({ findResult: [] });
      await expect(repo.loadMonsterTemplates("u1")).resolves.toEqual([]);
      expectLoggedOutcome(getLogSpy(), "not_found");
    });

    it("DB failure rejects with StorageError and logs error (was: [])", async () => {
      mockCollection({ findResult: DB_DOWN() });
      await expectStorageError(repo.loadMonsterTemplates("u1"), {
        op: "loadMonsterTemplates",
        collection: "monsterTemplates",
      });
      expectLoggedOutcome(getLogSpy(), "error");
    });
  });

  describe("loadGlobalMonsterTemplates", () => {
    it("queries with GLOBAL_USER_ID via direct sibling call", async () => {
      const col = mockCollection({ findResult: [] });
      await repo.loadGlobalMonsterTemplates();
      expect(col.find).toHaveBeenCalledWith({ userId: GLOBAL_USER_ID });
    });
  });

  describe("loadAllMonsterTemplates", () => {
    // 2 callers: app/api/monsters/route.ts, app/api/monsters/[id]/duplicate/route.ts
    it("merges user + global templates (shape identical to pre-migration)", async () => {
      // both the user read and the global read hit the same mocked collection
      mockCollection({ findResult: [{ id: "m1", userId: "u1" }] });
      const res = await repo.loadAllMonsterTemplates("u1");
      expect(res.map((m) => m.id)).toEqual(["m1", "m1"]);
    });
  });

  describe("monsterExistsByNameAndSource", () => {
    it("returns true/false for present/absent", async () => {
      mockCollection({ count: 1 });
      await expect(repo.monsterExistsByNameAndSource("Dragon", "srd")).resolves.toBe(true);
      mockCollection({ count: 0 });
      await expect(repo.monsterExistsByNameAndSource("Nope", "srd")).resolves.toBe(false);
    });

    it("a false result is a normal success, never logged as not_found", async () => {
      mockCollection({ count: 0 });
      await repo.monsterExistsByNameAndSource("Nope", "srd");
      expectLoggedOutcome(getLogSpy(), "success");
      expectNotLoggedOutcome(getLogSpy(), "not_found");
    });
  });

  describe("findMonsterByNameAndSource", () => {
    it("returns the doc, or null (logged not_found) when absent", async () => {
      mockCollection({ findOne: { id: "m1" } });
      await expect(repo.findMonsterByNameAndSource("Dragon", "srd")).resolves.toMatchObject({ id: "m1" });
      mockCollection({ findOne: null });
      await expect(repo.findMonsterByNameAndSource("Nope", "srd")).resolves.toBeNull();
      expectLoggedOutcome(getLogSpy(), "not_found");
    });
  });

  describe("saveMonsterTemplate", () => {
    it("issues an upsert keyed by userId + id", async () => {
      const col = mockCollection();
      await repo.saveMonsterTemplate(TEMPLATE);
      expect(col.updateOne).toHaveBeenCalledWith(
        { userId: "u1", id: "m1" },
        expect.anything(),
        { upsert: true },
      );
    });
  });

  // Every previously-swallowing or raw-rethrowing method now rejects with
  // StorageError on a driver failure.
  describe.each<[string, () => Promise<unknown>]>([
    ["loadMonsterTemplates", () => repo.loadMonsterTemplates("u1")],
    ["loadGlobalMonsterTemplates", () => repo.loadGlobalMonsterTemplates()],
    ["loadAllMonsterTemplates", () => repo.loadAllMonsterTemplates("u1")],
    ["saveMonsterTemplate", () => repo.saveMonsterTemplate(TEMPLATE)],
    ["deleteMonsterTemplate", () => repo.deleteMonsterTemplate("m1", "u1")],
    ["monsterExistsByNameAndSource", () => repo.monsterExistsByNameAndSource("Dragon", "srd")],
    ["findMonsterByNameAndSource", () => repo.findMonsterByNameAndSource("Dragon", "srd")],
  ])("%s on driver failure", (_name, call) => {
    it("rejects with StorageError", async () => {
      mockCollection({
        findResult: DB_DOWN(),
        findOne: DB_DOWN(),
        count: DB_DOWN(),
        updateOne: DB_DOWN(),
        deleteOne: DB_DOWN(),
      });
      await expectStorageError(call());
    });
  });

  it("exposes all 7 methods on the storage facade", () => {
    expectFacadeMethods(storage as Record<string, unknown>, [
      "loadMonsterTemplates",
      "loadGlobalMonsterTemplates",
      "loadAllMonsterTemplates",
      "saveMonsterTemplate",
      "deleteMonsterTemplate",
      "monsterExistsByNameAndSource",
      "findMonsterByNameAndSource",
    ]);
  });
});
