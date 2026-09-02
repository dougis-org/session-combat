/**
 * @jest-environment node
 */
import * as repo from "@/lib/storage/monsterTemplateRepo";
import { storage } from "@/lib/storage";
import { StorageError } from "@/lib/storage/errors";
import { GLOBAL_USER_ID } from "@/lib/constants";
import * as logger from "@/lib/telemetry/logger";

jest.mock("@/lib/db", () => ({ getDatabase: jest.fn() }));
import { getDatabase } from "@/lib/db";

function makeCursor(result: unknown) {
  const cursor: Record<string, jest.Mock> = {};
  for (const m of ["find", "sort", "collation", "limit", "project"]) {
    cursor[m] = jest.fn(() => cursor);
  }
  cursor.toArray = jest.fn(() => (result instanceof Error ? Promise.reject(result) : Promise.resolve(result)));
  return cursor;
}

function mockCollection(overrides: Record<string, unknown> = {}) {
  const cursor = makeCursor(overrides.findResult ?? []);
  const collection = {
    find: jest.fn(() => cursor),
    findOne: jest.fn(() =>
      overrides.findOne instanceof Error
        ? Promise.reject(overrides.findOne)
        : Promise.resolve(overrides.findOne ?? null),
    ),
    countDocuments: jest.fn(() =>
      overrides.count instanceof Error
        ? Promise.reject(overrides.count)
        : Promise.resolve(overrides.count ?? 0),
    ),
    updateOne: jest.fn(() =>
      overrides.updateOne instanceof Error ? Promise.reject(overrides.updateOne) : Promise.resolve({}),
    ),
    deleteOne: jest.fn(() =>
      overrides.deleteOne instanceof Error ? Promise.reject(overrides.deleteOne) : Promise.resolve({ deletedCount: 1 }),
    ),
    _cursor: cursor,
  };
  jest.mocked(getDatabase).mockResolvedValue({ collection: jest.fn(() => collection) } as never);
  return collection;
}

let logSpy: jest.SpyInstance;
beforeEach(() => {
  jest.clearAllMocks();
  logSpy = jest.spyOn(logger, "logStorageEvent").mockImplementation();
});
afterEach(() => logSpy.mockRestore());

describe("monsterTemplateRepo", () => {
  describe("loadMonsterTemplates", () => {
    it("returns normalized templates on success", async () => {
      mockCollection({ findResult: [{ _id: "507f1f77bcf86cd799439011", name: "Goblin", userId: "u1" }] });
      const res = await repo.loadMonsterTemplates("u1");
      expect(res[0].id).toBe("507f1f77bcf86cd799439011");
      expect(logSpy).toHaveBeenCalledWith(expect.objectContaining({ outcome: "success" }));
    });

    it("empty collection resolves to [] and logs not_found", async () => {
      mockCollection({ findResult: [] });
      await expect(repo.loadMonsterTemplates("u1")).resolves.toEqual([]);
      expect(logSpy).toHaveBeenCalledWith(expect.objectContaining({ outcome: "not_found" }));
    });

    it("DB failure rejects with StorageError and logs error (was: [])", async () => {
      mockCollection({ findResult: new Error("db down") });
      await expect(repo.loadMonsterTemplates("u1")).rejects.toMatchObject({
        op: "loadMonsterTemplates",
        collection: "monsterTemplates",
      });
      expect(logSpy).toHaveBeenCalledWith(expect.objectContaining({ outcome: "error" }));
    });
  });

  describe("loadGlobalMonsterTemplates", () => {
    it("queries with GLOBAL_USER_ID via direct sibling call", async () => {
      const col = mockCollection({ findResult: [] });
      await repo.loadGlobalMonsterTemplates();
      expect(col.find).toHaveBeenCalledWith({ userId: GLOBAL_USER_ID });
    });

    it("DB failure rejects with StorageError", async () => {
      mockCollection({ findResult: new Error("db down") });
      await expect(repo.loadGlobalMonsterTemplates()).rejects.toBeInstanceOf(StorageError);
    });
  });

  describe("loadAllMonsterTemplates", () => {
    // 2 callers: app/api/monsters/route.ts, app/api/monsters/[id]/duplicate/route.ts
    it("merges user + global templates (shape identical to pre-migration)", async () => {
      mockCollection({ findResult: [{ id: "m1", userId: "u1" }] });
      const res = await repo.loadAllMonsterTemplates("u1");
      // user call + global call each return the same mocked array
      expect(res.map((m) => m.id)).toEqual(["m1", "m1"]);
    });

    it("DB failure in an underlying call rejects with StorageError (was: [])", async () => {
      mockCollection({ findResult: new Error("db down") });
      await expect(repo.loadAllMonsterTemplates("u1")).rejects.toBeInstanceOf(StorageError);
    });
  });

  describe("saveMonsterTemplate", () => {
    it("issues an upsert", async () => {
      const col = mockCollection();
      await repo.saveMonsterTemplate({ id: "m1", userId: "u1", name: "Orc" } as never);
      expect(col.updateOne).toHaveBeenCalledWith(
        { userId: "u1", id: "m1" },
        expect.anything(),
        { upsert: true },
      );
    });

    it("DB failure rejects with StorageError (was: rethrew raw)", async () => {
      mockCollection({ updateOne: new Error("db down") });
      await expect(
        repo.saveMonsterTemplate({ id: "m1", userId: "u1", name: "Orc" } as never),
      ).rejects.toBeInstanceOf(StorageError);
    });
  });

  describe("deleteMonsterTemplate", () => {
    it("DB failure rejects with StorageError", async () => {
      mockCollection({ deleteOne: new Error("db down") });
      await expect(repo.deleteMonsterTemplate("m1", "u1")).rejects.toBeInstanceOf(StorageError);
    });
  });

  describe("monsterExistsByNameAndSource", () => {
    it("returns true/false for present/absent", async () => {
      mockCollection({ count: 1 });
      await expect(repo.monsterExistsByNameAndSource("Dragon", "srd")).resolves.toBe(true);
      mockCollection({ count: 0 });
      await expect(repo.monsterExistsByNameAndSource("Nope", "srd")).resolves.toBe(false);
    });

    it("false result is never logged as not_found (no isEmpty)", async () => {
      mockCollection({ count: 0 });
      await repo.monsterExistsByNameAndSource("Nope", "srd");
      expect(logSpy).toHaveBeenCalledWith(expect.objectContaining({ outcome: "success" }));
      expect(logSpy).not.toHaveBeenCalledWith(expect.objectContaining({ outcome: "not_found" }));
    });

    it("DB failure rejects with StorageError (was: false)", async () => {
      mockCollection({ count: new Error("db down") });
      await expect(repo.monsterExistsByNameAndSource("Dragon", "srd")).rejects.toBeInstanceOf(StorageError);
    });
  });

  describe("findMonsterByNameAndSource", () => {
    it("returns doc or null; null logs not_found", async () => {
      mockCollection({ findOne: { id: "m1" } });
      await expect(repo.findMonsterByNameAndSource("Dragon", "srd")).resolves.toMatchObject({ id: "m1" });
      mockCollection({ findOne: null });
      await expect(repo.findMonsterByNameAndSource("Nope", "srd")).resolves.toBeNull();
      expect(logSpy).toHaveBeenCalledWith(expect.objectContaining({ outcome: "not_found" }));
    });

    it("DB failure rejects with StorageError (was: null)", async () => {
      mockCollection({ findOne: new Error("db down") });
      await expect(repo.findMonsterByNameAndSource("Dragon", "srd")).rejects.toBeInstanceOf(StorageError);
    });
  });

  describe("facade delegation", () => {
    it("every method is reachable via storage.<name>", () => {
      for (const name of [
        "loadMonsterTemplates",
        "loadGlobalMonsterTemplates",
        "loadAllMonsterTemplates",
        "saveMonsterTemplate",
        "deleteMonsterTemplate",
        "monsterExistsByNameAndSource",
        "findMonsterByNameAndSource",
      ]) {
        expect(typeof (storage as Record<string, unknown>)[name]).toBe("function");
      }
    });
  });
});
