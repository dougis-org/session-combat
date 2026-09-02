/**
 * @jest-environment node
 */
import * as repo from "@/lib/storage/sessionLogRepo";
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
const LOG = { id: "s1", userId: "u1", campaignId: "c1", sessionNumber: 3 } as never;

describe("sessionLogRepo", () => {
  describe("loadSessionLogs", () => {
    it("returns logs sorted by sessionNumber desc", async () => {
      const col = mockCollection({ findResult: [{ id: "s1", sessionNumber: 3 }] });
      expect((await repo.loadSessionLogs("u1", "c1")).map((l) => l.id)).toEqual(["s1"]);
      expect(col._cursor.sort).toHaveBeenCalledWith({ sessionNumber: -1 });
    });

    it("resolves to [] and logs not_found when empty", async () => {
      mockCollection({ findResult: [] });
      await expect(repo.loadSessionLogs("u1", "c1")).resolves.toEqual([]);
      expectLoggedOutcome(getLogSpy(), "not_found");
    });
  });

  describe("getNextSessionNumber", () => {
    it("returns latest + 1, or 1 when none exist", async () => {
      mockCollection({ findOne: { sessionNumber: 7 } });
      await expect(repo.getNextSessionNumber("u1", "c1")).resolves.toBe(8);

      mockCollection({ findOne: null });
      await expect(repo.getNextSessionNumber("u1", "c1")).resolves.toBe(1);
    });
  });

  describe("updateSessionLog", () => {
    it("returns the updated doc, or null when no row matched", async () => {
      mockCollection({ findOneAndUpdate: { id: "s1", title: "x" } });
      await expect(repo.updateSessionLog("s1", "u1", "c1", { title: "x" } as never)).resolves.toMatchObject({ id: "s1" });

      mockCollection({ findOneAndUpdate: null });
      await expect(repo.updateSessionLog("s1", "u1", "c1", {})).resolves.toBeNull();
    });
  });

  describe("deleteSessionLog", () => {
    it("returns a boolean from deletedCount", async () => {
      mockCollection({ deleteOne: { deletedCount: 1 } });
      await expect(repo.deleteSessionLog("s1", "u1", "c1")).resolves.toBe(true);

      mockCollection({ deleteOne: { deletedCount: 0 } });
      await expect(repo.deleteSessionLog("s1", "u1", "c1")).resolves.toBe(false);
      expectNotLoggedOutcome(getLogSpy(), "not_found");
    });
  });

  describe.each<[string, () => Promise<unknown>]>([
    ["loadSessionLogs", () => repo.loadSessionLogs("u1", "c1")],
    ["getNextSessionNumber", () => repo.getNextSessionNumber("u1", "c1")],
    ["saveSessionLog", () => repo.saveSessionLog(LOG)],
    ["updateSessionLog", () => repo.updateSessionLog("s1", "u1", "c1", {})],
    ["deleteSessionLog", () => repo.deleteSessionLog("s1", "u1", "c1")],
  ])("%s on driver failure", (name, call) => {
    it("rejects with StorageError and logs one error event", async () => {
      mockCollection({
        findResult: DB_DOWN(),
        findOne: DB_DOWN(),
        insertOne: DB_DOWN(),
        findOneAndUpdate: DB_DOWN(),
        deleteOne: DB_DOWN(),
      });
      await expectStorageError(call(), { op: name, collection: "sessionLogs" });
      expectLoggedOutcome(getLogSpy(), "error");
    });
  });

  it("exposes all 5 methods on the storage facade", () => {
    expectFacadeMethods(storage as Record<string, unknown>, [
      "loadSessionLogs",
      "getNextSessionNumber",
      "saveSessionLog",
      "updateSessionLog",
      "deleteSessionLog",
    ]);
  });
});
