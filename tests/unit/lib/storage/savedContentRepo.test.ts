/**
 * @jest-environment node
 */
import * as repo from "@/lib/storage/savedContentRepo";
import { storage } from "@/lib/storage";

jest.mock("@/lib/db", () => ({ getDatabase: jest.fn() }));
import {
  mockCollection,
  installStorageLogSpy,
  expectStorageError,
  expectLoggedOutcome,
} from "./_repoMock";

const getLogSpy = installStorageLogSpy();
const DB_DOWN = () => new Error("db down");
const ITEM = { campaignId: "c1", userId: "u1", type: "npc", result: "x" } as never;

describe("savedContentRepo", () => {
  describe("list", () => {
    it("returns saved content sorted by createdAt desc", async () => {
      const col = mockCollection({ findResult: [{ id: "sc1", campaignId: "c1", userId: "u1" }] });
      expect((await repo.list("c1", "u1")).map((i) => i.id)).toEqual(["sc1"]);
      expect(col._cursor.sort).toHaveBeenCalledWith({ createdAt: -1 });
    });

    it("resolves to [] and logs not_found when empty", async () => {
      mockCollection({ findResult: [] });
      await expect(repo.list("c1", "u1")).resolves.toEqual([]);
      expectLoggedOutcome(getLogSpy(), "not_found");
    });

    it("rejects with StorageError (does not swallow to []) on a driver failure", async () => {
      mockCollection({ findResult: DB_DOWN() });
      await expectStorageError(repo.list("c1", "u1"), {
        op: "savedContent.list",
        collection: "savedContent",
      });
      expectLoggedOutcome(getLogSpy(), "error");
    });
  });

  describe("create", () => {
    it("inserts and returns the new doc with generated id/timestamps", async () => {
      mockCollection({ insertOne: { insertedId: "x" } });
      const created = await repo.create(ITEM);
      expect(created).toMatchObject(ITEM);
      expect(created.id).toEqual(expect.any(String));
      expect(created.createdAt).toBeInstanceOf(Date);
    });

    it("rejects with StorageError on a driver failure", async () => {
      mockCollection({ insertOne: DB_DOWN() });
      await expectStorageError(repo.create(ITEM), {
        op: "savedContent.create",
        collection: "savedContent",
      });
      expectLoggedOutcome(getLogSpy(), "error");
    });
  });

  describe("update", () => {
    it("returns a boolean from matchedCount", async () => {
      mockCollection({ updateOne: { matchedCount: 1 } });
      await expect(repo.update("sc1", "u1", { result: "y" } as never)).resolves.toBe(true);

      mockCollection({ updateOne: { matchedCount: 0 } });
      await expect(repo.update("sc1", "u1", {} as never)).resolves.toBe(false);
    });

    it("rejects with StorageError on a driver failure", async () => {
      mockCollection({ updateOne: DB_DOWN() });
      await expectStorageError(repo.update("sc1", "u1", {} as never), {
        op: "savedContent.update",
        collection: "savedContent",
      });
      expectLoggedOutcome(getLogSpy(), "error");
    });
  });

  describe("remove", () => {
    it("returns a boolean from deletedCount", async () => {
      mockCollection({ deleteOne: { deletedCount: 1 } });
      await expect(repo.remove("sc1", "u1")).resolves.toBe(true);

      mockCollection({ deleteOne: { deletedCount: 0 } });
      await expect(repo.remove("sc1", "u1")).resolves.toBe(false);
    });

    it("rejects with StorageError on a driver failure", async () => {
      mockCollection({ deleteOne: DB_DOWN() });
      await expectStorageError(repo.remove("sc1", "u1"), {
        op: "savedContent.remove",
        collection: "savedContent",
      });
      expectLoggedOutcome(getLogSpy(), "error");
    });
  });

  it("exposes savedContent.list/create/update/remove on the storage facade, delegating to the repo", () => {
    expect(typeof storage.savedContent.list).toBe("function");
    expect(typeof storage.savedContent.create).toBe("function");
    expect(typeof storage.savedContent.update).toBe("function");
    expect(typeof storage.savedContent.remove).toBe("function");
  });
});
