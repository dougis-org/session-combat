/**
 * @jest-environment node
 */
import * as repo from "@/lib/storage/monsterTemplateRepo";
import { storage } from "@/lib/storage";
import { GLOBAL_USER_ID } from "@/lib/constants";

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

  describe("saveManyMonsterTemplates", () => {
    it("issues a single insertMany call with the supplied templates, unordered", async () => {
      const col = mockCollection();
      const second = { id: "m2", userId: "u1", name: "Orc" } as never;
      await repo.saveManyMonsterTemplates([TEMPLATE, second]);
      expect(col.insertMany).toHaveBeenCalledTimes(1);
      const [docs, options] = col.insertMany.mock.calls[0] as unknown as [unknown[], unknown];
      expect(docs).toHaveLength(2);
      expect(options).toEqual({ ordered: false });
    });

    it("strips _id from each document before inserting", async () => {
      const col = mockCollection();
      const withMongoId = { id: "m1", userId: "u1", name: "Orc", _id: "mongo-oid" } as never;
      await repo.saveManyMonsterTemplates([withMongoId]);
      const [docs] = col.insertMany.mock.calls[0] as unknown as [Record<string, unknown>[]];
      expect(docs[0]._id).toBeUndefined();
    });

    it("is a no-op for an empty array (no DB call)", async () => {
      const col = mockCollection();
      await repo.saveManyMonsterTemplates([]);
      expect(col.insertMany).not.toHaveBeenCalled();
    });

    it("propagates a driver error as StorageError (does not swallow)", async () => {
      mockCollection({ insertMany: DB_DOWN() });
      await expectStorageError(repo.saveManyMonsterTemplates([TEMPLATE]), {
        op: "saveManyMonsterTemplates",
        collection: "monsterTemplates",
      });
    });
  });

  describe("deleteMonsterTemplatesByIds", () => {
    it("issues one deleteMany scoped to id $in and userId", async () => {
      const col = mockCollection();
      await repo.deleteMonsterTemplatesByIds(["m1", "m2"], "u1");
      expect(col.deleteMany).toHaveBeenCalledTimes(1);
      expect(col.deleteMany).toHaveBeenCalledWith({ id: { $in: ["m1", "m2"] }, userId: "u1" });
    });

    it("never targets a different userId than the one passed in", async () => {
      const col = mockCollection();
      await repo.deleteMonsterTemplatesByIds(["m1"], "attacker");
      expect(col.deleteMany).toHaveBeenCalledWith(
        expect.objectContaining({ userId: "attacker" }),
      );
    });

    it("is idempotent — calling twice with the same ids does not error", async () => {
      mockCollection({ deleteMany: { deletedCount: 0 } });
      await repo.deleteMonsterTemplatesByIds(["m1"], "u1");
      await expect(repo.deleteMonsterTemplatesByIds(["m1"], "u1")).resolves.toBeUndefined();
    });

    it("is a no-op for an empty ids array (no DB call)", async () => {
      const col = mockCollection();
      await repo.deleteMonsterTemplatesByIds([], "u1");
      expect(col.deleteMany).not.toHaveBeenCalled();
    });
  });

  describe("findExistingMonsterKeys", () => {
    it("queries once with userId + name $in and returns name|source keys", async () => {
      const col = mockCollection({
        findResult: [
          { name: "Goblin", source: "SRD" },
          { name: "Orc", source: "" },
        ],
      });
      const result = await repo.findExistingMonsterKeys(
        [
          { name: "Goblin", source: "SRD" },
          { name: "Orc", source: "" },
        ],
        "u1",
      );
      expect(col.find).toHaveBeenCalledTimes(1);
      expect(col.find).toHaveBeenCalledWith({ userId: "u1", name: { $in: ["Goblin", "Orc"] } });
      expect(result).toEqual(new Set(["Goblin|SRD", "Orc|"]));
    });

    it("scoping to GLOBAL_USER_ID does not match a personal monster of the same name", async () => {
      const col = mockCollection({ findResult: [] });
      const result = await repo.findExistingMonsterKeys(
        [{ name: "Goblin", source: "SRD" }],
        GLOBAL_USER_ID,
      );
      expect(col.find).toHaveBeenCalledWith({
        userId: GLOBAL_USER_ID,
        name: { $in: ["Goblin"] },
      });
      expect(result.size).toBe(0);
    });

    it("is a no-op for an empty keys array (no DB call)", async () => {
      const col = mockCollection();
      const result = await repo.findExistingMonsterKeys([], "u1");
      expect(col.find).not.toHaveBeenCalled();
      expect(result.size).toBe(0);
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
    ["deleteMonsterTemplatesByIds", () => repo.deleteMonsterTemplatesByIds(["m1"], "u1")],
    ["findExistingMonsterKeys", () => repo.findExistingMonsterKeys([{ name: "Dragon", source: "srd" }], "u1")],
  ])("%s on driver failure", (_name, call) => {
    it("rejects with StorageError", async () => {
      mockCollection({
        findResult: DB_DOWN(),
        findOne: DB_DOWN(),
        count: DB_DOWN(),
        updateOne: DB_DOWN(),
        deleteOne: DB_DOWN(),
        deleteMany: DB_DOWN(),
      });
      await expectStorageError(call());
    });
  });

  it("exposes all 10 methods on the storage facade", () => {
    expectFacadeMethods(storage as Record<string, unknown>, [
      "loadMonsterTemplates",
      "loadGlobalMonsterTemplates",
      "loadAllMonsterTemplates",
      "saveMonsterTemplate",
      "deleteMonsterTemplate",
      "monsterExistsByNameAndSource",
      "findMonsterByNameAndSource",
      "saveManyMonsterTemplates",
      "deleteMonsterTemplatesByIds",
      "findExistingMonsterKeys",
    ]);
  });
});
