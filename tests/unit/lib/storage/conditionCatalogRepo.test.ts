/**
 * @jest-environment node
 */
import * as repo from "@/lib/storage/conditionCatalogRepo";

jest.mock("@/lib/db", () => ({ getDatabase: jest.fn() }));
import {
  mockCollection,
  installStorageLogSpy,
  expectStorageError,
  expectLoggedOutcome,
} from "./_repoMock";

const getLogSpy = installStorageLogSpy();
const DB_DOWN = () => new Error("db down");

describe("conditionCatalogRepo", () => {
  describe("loadConditionCatalog", () => {
    it("returns the catalog shape and logs success", async () => {
      mockCollection({
        findResult: [{ name: "Poisoned", description: "The creature has disadvantage on attack rolls and ability checks." }],
      });
      const res = await repo.loadConditionCatalog();
      expect(res).toEqual([
        { name: "Poisoned", description: "The creature has disadvantage on attack rolls and ability checks." },
      ]);
      expectLoggedOutcome(getLogSpy(), "success");
    });

    it("empty collection resolves to [] and logs not_found", async () => {
      mockCollection({ findResult: [] });
      await expect(repo.loadConditionCatalog()).resolves.toEqual([]);
      expectLoggedOutcome(getLogSpy(), "not_found");
    });

    it("strips extra/unexpected fields, returning only { name, description }", async () => {
      mockCollection({
        findResult: [
          { _id: "507f1f77bcf86cd799439011", name: "Prone", description: "Prone description", extra: "should not leak" },
        ],
      });
      const res = await repo.loadConditionCatalog();
      expect(res).toEqual([{ name: "Prone", description: "Prone description" }]);
    });

    it("DB failure rejects with StorageError and logs error", async () => {
      mockCollection({ findResult: DB_DOWN() });
      await expectStorageError(repo.loadConditionCatalog(), {
        op: "loadConditionCatalog",
        collection: "conditionCatalog",
      });
      expectLoggedOutcome(getLogSpy(), "error");
    });
  });
});
