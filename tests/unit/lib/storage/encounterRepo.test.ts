/**
 * @jest-environment node
 */
import * as repo from "@/lib/storage/encounterRepo";
import { storage } from "@/lib/storage";

jest.mock("@/lib/db", () => ({ getDatabase: jest.fn() }));
import {
  mockCollection,
  installStorageLogSpy,
  expectStorageError,
  expectLoggedOutcome,
  expectFacadeMethods,
} from "./_repoMock";

const getLogSpy = installStorageLogSpy();
const DB_DOWN = () => new Error("db down");

describe("encounterRepo — campaign-linking additions (#708)", () => {
  describe("saveEncounter", () => {
    it("resolves to void on success", async () => {
      mockCollection({ updateOne: { modifiedCount: 1 } });
      await expect(
        repo.saveEncounter({ id: "e1", userId: "u1", name: "Goblin Ambush", description: "", monsters: [], createdAt: new Date(), updatedAt: new Date() })
      ).resolves.toBeUndefined();
    });

    it("rejects with StorageError on a driver failure", async () => {
      mockCollection({ updateOne: DB_DOWN() });
      await expectStorageError(
        repo.saveEncounter({ id: "e1", userId: "u1", name: "Goblin Ambush", description: "", monsters: [], createdAt: new Date(), updatedAt: new Date() }),
        { op: "saveEncounter", collection: "encounters" }
      );
      expectLoggedOutcome(getLogSpy(), "error");
    });
  });

  describe("saveEncounters (migrate-encounter-storage-callers: calls the module-local saveEncounter directly, not through the storage facade)", () => {
    it("saves each encounter in the array via its own updateOne call", async () => {
      const db = mockCollection({ updateOne: { modifiedCount: 1 } });
      const encounters = [
        { id: "e1", userId: "u1", name: "Goblin Ambush", description: "", monsters: [], createdAt: new Date(), updatedAt: new Date() },
        { id: "e2", userId: "u1", name: "Dragon Lair", description: "", monsters: [], createdAt: new Date(), updatedAt: new Date() },
      ];
      await expect(repo.saveEncounters(encounters)).resolves.toBeUndefined();
      expect(db.updateOne).toHaveBeenCalledTimes(2);
    });

    it("rejects with StorageError (op: saveEncounters) if any item fails", async () => {
      mockCollection({ updateOne: DB_DOWN() });
      await expectStorageError(
        repo.saveEncounters([{ id: "e1", userId: "u1", name: "Goblin Ambush", description: "", monsters: [], createdAt: new Date(), updatedAt: new Date() }]),
        { op: "saveEncounters", collection: "encounters" }
      );
    });
  });

  describe("loadEncountersByIds", () => {
    it("returns [] immediately without a DB call when ids is empty", async () => {
      const db = mockCollection({ findResult: [] });
      await expect(repo.loadEncountersByIds([], "u1")).resolves.toEqual([]);
      expect(db.find).not.toHaveBeenCalled();
    });

    it("returns matching encounters scoped to the owner", async () => {
      mockCollection({ findResult: [{ id: "e1", userId: "u1" }] });
      await expect(repo.loadEncountersByIds(["e1"], "u1")).resolves.toEqual([
        expect.objectContaining({ id: "e1" }),
      ]);
    });

    it("logs not_found when the result is empty", async () => {
      mockCollection({ findResult: [] });
      await expect(repo.loadEncountersByIds(["e1"], "u1")).resolves.toEqual([]);
      expectLoggedOutcome(getLogSpy(), "not_found");
    });

    it("rejects with StorageError on a driver failure", async () => {
      mockCollection({ findResult: DB_DOWN() });
      await expectStorageError(repo.loadEncountersByIds(["e1"], "u1"), {
        op: "loadEncountersByIds",
        collection: "encounters",
      });
      expectLoggedOutcome(getLogSpy(), "error");
    });
  });

  describe("addEncounterToCampaign", () => {
    it("resolves to void on success", async () => {
      mockCollection({ updateOne: { modifiedCount: 1 } });
      await expect(repo.addEncounterToCampaign("c1", "e1", "u1")).resolves.toBeUndefined();
    });

    it("rejects with StorageError (collection: campaigns) on a driver failure", async () => {
      mockCollection({ updateOne: DB_DOWN() });
      await expectStorageError(repo.addEncounterToCampaign("c1", "e1", "u1"), {
        op: "addEncounterToCampaign",
        collection: "campaigns",
      });
      expectLoggedOutcome(getLogSpy(), "error");
    });
  });

  describe("removeEncounterFromCampaign", () => {
    it("resolves to void on success", async () => {
      mockCollection({ updateOne: { modifiedCount: 1 } });
      await expect(repo.removeEncounterFromCampaign("c1", "e1", "u1")).resolves.toBeUndefined();
    });

    it("rejects with StorageError (collection: campaigns) on a driver failure", async () => {
      mockCollection({ updateOne: DB_DOWN() });
      await expectStorageError(repo.removeEncounterFromCampaign("c1", "e1", "u1"), {
        op: "removeEncounterFromCampaign",
        collection: "campaigns",
      });
      expectLoggedOutcome(getLogSpy(), "error");
    });
  });

  it("exposes loadEncountersByIds/addEncounterToCampaign/removeEncounterFromCampaign on the storage facade", () => {
    expectFacadeMethods(storage as Record<string, unknown>, [
      "loadEncountersByIds",
      "addEncounterToCampaign",
      "removeEncounterFromCampaign",
    ]);
  });
});
