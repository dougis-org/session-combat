/**
 * @jest-environment node
 */
import * as repo from "@/lib/storage/spellRepo";
import { storage } from "@/lib/storage";

jest.mock("@/lib/db", () => ({ getDatabase: jest.fn() }));
import { getDatabase } from "@/lib/db";
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
const SPELL = { id: "sp1", userId: "global", name: "Fireball", source: "open5e" } as never;
const BAD_IDS = ["", "x".repeat(65), null as unknown as string];

describe("spellRepo", () => {
  describe("loadSpells", () => {
    it("queries by userId or GLOBAL_USER_ID and applies the concentration filter", async () => {
      const col = mockCollection({ findResult: [{ id: "sp1" }] });
      await repo.loadSpells("u1", true);
      expect(col.find).toHaveBeenCalledWith({ userId: "u1", concentration: true });

      mockCollection({ findResult: [] });
      await expect(repo.loadSpells()).resolves.toEqual([]);
      expectLoggedOutcome(getLogSpy(), "not_found");
    });
  });

  describe("loadSpellById", () => {
    it("returns null without touching the DB for a malformed id", async () => {
      for (const id of BAD_IDS) {
        jest.clearAllMocks();
        await expect(repo.loadSpellById(id)).resolves.toBeNull();
        expect(getDatabase).not.toHaveBeenCalled();
        expect(getLogSpy()).not.toHaveBeenCalled();
      }
    });

    it("returns the spell, or null (logged not_found) when the doc is absent", async () => {
      mockCollection({ findOne: { id: "sp1", name: "Fireball" } });
      await expect(repo.loadSpellById("sp1")).resolves.toMatchObject({ id: "sp1" });

      mockCollection({ findOne: null });
      await expect(repo.loadSpellById("sp1")).resolves.toBeNull();
      expectLoggedOutcome(getLogSpy(), "not_found");
    });
  });

  describe("deleteSpellTemplate", () => {
    it("is a no-op with no DB call for every malformed id", async () => {
      for (const id of ["", "x".repeat(65), null as unknown as string]) {
        jest.clearAllMocks();
        await expect(repo.deleteSpellTemplate(id)).resolves.toBeUndefined();
        expect(getDatabase).not.toHaveBeenCalled();
        expect(getLogSpy()).not.toHaveBeenCalled();
      }
    });
  });

  describe("spellExistsByNameAndSource", () => {
    it("returns true/false from the document count", async () => {
      mockCollection({ count: 2 });
      await expect(repo.spellExistsByNameAndSource("Fireball", "open5e")).resolves.toBe(true);

      mockCollection({ count: 0 });
      await expect(repo.spellExistsByNameAndSource("Nope", "open5e")).resolves.toBe(false);
      expectNotLoggedOutcome(getLogSpy(), "not_found");
    });
  });

  describe.each<[string, () => Promise<unknown>]>([
    ["loadSpells", () => repo.loadSpells()],
    ["loadSpellById", () => repo.loadSpellById("sp1")],
    ["saveSpellTemplate", () => repo.saveSpellTemplate(SPELL)],
    ["deleteSpellTemplate", () => repo.deleteSpellTemplate("sp1")],
    ["spellExistsByNameAndSource", () => repo.spellExistsByNameAndSource("Fireball", "open5e")],
  ])("%s on driver failure", (name, call) => {
    it("rejects with StorageError and logs one error event", async () => {
      mockCollection({
        findResult: DB_DOWN(),
        findOne: DB_DOWN(),
        updateOne: DB_DOWN(),
        deleteOne: DB_DOWN(),
        count: DB_DOWN(),
      });
      const err = await expectStorageError(call(), { op: name, collection: "spellTemplates" });
      expect((err as unknown as { cause: unknown }).cause).toBeInstanceOf(Error);
      expectLoggedOutcome(getLogSpy(), "error");
    });
  });

  it("exposes all 5 methods on the storage facade", () => {
    expectFacadeMethods(storage as Record<string, unknown>, [
      "loadSpells",
      "loadSpellById",
      "saveSpellTemplate",
      "deleteSpellTemplate",
      "spellExistsByNameAndSource",
    ]);
  });
});
