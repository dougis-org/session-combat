/**
 * @jest-environment node
 */
import * as repo from "@/lib/storage/shareRepo";
import { storage } from "@/lib/storage";
import { DuplicateShareError } from "@/lib/errors";

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
const SHARE = { campaignId: "c1", characterId: "ch1", userId: "u1" } as never;

describe("shareRepo", () => {
  describe("addShare", () => {
    it("translates a Mongo 11000 error into DuplicateShareError (not StorageError)", async () => {
      mockCollection({ insertOne: Object.assign(new Error("dup"), { code: 11000 }) });
      await expect(repo.addShare(SHARE)).rejects.toBeInstanceOf(DuplicateShareError);
    });

    it("wraps any other insert failure in StorageError", async () => {
      mockCollection({ insertOne: DB_DOWN() });
      await expectStorageError(repo.addShare(SHARE), { op: "addShare", collection: "campaignCharacterShares" });
    });
  });

  describe("removeShare", () => {
    it("returns a boolean from deletedCount, never logged not_found", async () => {
      mockCollection({ deleteOne: { deletedCount: 1 } });
      await expect(repo.removeShare("c1", "ch1", "u1")).resolves.toBe(true);

      mockCollection({ deleteOne: { deletedCount: 0 } });
      await expect(repo.removeShare("c1", "ch1", "u1")).resolves.toBe(false);
      expectNotLoggedOutcome(getLogSpy(), "not_found");
    });
  });

  describe.each<[string, () => Promise<unknown[]>]>([
    ["listSharesForCampaign", () => repo.listSharesForCampaign("c1", "u1")],
    ["listAllSharesForCampaign", () => repo.listAllSharesForCampaign("c1")],
  ])("%s", (_name, call) => {
    it("strips _id and resolves to [] (logged not_found) when empty", async () => {
      mockCollection({ findResult: [{ _id: "x", campaignId: "c1", characterId: "ch1" }] });
      const rows = await call();
      expect(rows[0]).not.toHaveProperty("_id");

      mockCollection({ findResult: [] });
      await expect(call()).resolves.toEqual([]);
      expectLoggedOutcome(getLogSpy(), "not_found");
    });
  });

  describe.each<[string, () => Promise<unknown>]>([
    ["addShare", () => repo.addShare(SHARE)],
    ["removeShare", () => repo.removeShare("c1", "ch1", "u1")],
    ["listSharesForCampaign", () => repo.listSharesForCampaign("c1", "u1")],
    ["listAllSharesForCampaign", () => repo.listAllSharesForCampaign("c1")],
  ])("%s on driver failure", (name, call) => {
    it("rejects with StorageError and logs one error event", async () => {
      mockCollection({ findResult: DB_DOWN(), insertOne: DB_DOWN(), deleteOne: DB_DOWN() });
      await expectStorageError(call(), { op: name, collection: "campaignCharacterShares" });
      expectLoggedOutcome(getLogSpy(), "error");
    });
  });

  it("exposes all 4 methods on the storage facade", () => {
    expectFacadeMethods(storage as Record<string, unknown>, [
      "addShare",
      "removeShare",
      "listSharesForCampaign",
      "listAllSharesForCampaign",
    ]);
  });
});
