import { shouldImport, importWithDedup, DedupeResult } from "@/lib/import/dedupeEngine";
import { storage } from "@/lib/storage";

jest.mock("@/lib/storage");

const mockedStorage = jest.mocked(storage);

describe("dedupeEngine", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("shouldImport", () => {
    it("returns false for spells that exist by name and source", async () => {
      mockedStorage.spellExistsByNameAndSource.mockResolvedValue(true);

      const result = await shouldImport("spells", "Fireball", "open5e");

      expect(result).toBe(false);
      expect(mockedStorage.spellExistsByNameAndSource).toHaveBeenCalledWith("Fireball", "open5e");
    });

    it("returns true for spells that do not exist", async () => {
      mockedStorage.spellExistsByNameAndSource.mockResolvedValue(false);

      const result = await shouldImport("spells", "New Spell", "open5e");

      expect(result).toBe(true);
    });

    it("returns true for monsters (not checked against dedup)", async () => {
      const result = await shouldImport("monsters", "Goblin", "open5e");

      expect(result).toBe(true);
      expect(mockedStorage.spellExistsByNameAndSource).not.toHaveBeenCalled();
    });
  });

  describe("importWithDedup", () => {
    it("inserts items that should be imported", async () => {
      mockedStorage.spellExistsByNameAndSource.mockResolvedValue(false);
      const saveFn = jest.fn().mockResolvedValue(undefined);

      const items = [
        { name: "Spell A", source: "open5e", id: "1" },
        { name: "Spell B", source: "open5e", id: "2" },
      ];

      const result = await importWithDedup("spells", items, saveFn);

      expect(result.inserted).toBe(2);
      expect(result.skipped).toBe(0);
      expect(result.errors).toHaveLength(0);
      expect(saveFn).toHaveBeenCalledTimes(2);
    });

    it("skips items that already exist", async () => {
      mockedStorage.spellExistsByNameAndSource
        .mockResolvedValueOnce(true)
        .mockResolvedValueOnce(false);
      const saveFn = jest.fn().mockResolvedValue(undefined);

      const items = [
        { name: "Existing Spell", source: "open5e", id: "1" },
        { name: "New Spell", source: "open5e", id: "2" },
      ];

      const result = await importWithDedup("spells", items, saveFn);

      expect(result.inserted).toBe(1);
      expect(result.skipped).toBe(1);
      expect(result.errors).toHaveLength(0);
    });

    it("collects errors from save failures", async () => {
      mockedStorage.spellExistsByNameAndSource.mockResolvedValue(false);
      const saveFn = jest.fn().mockRejectedValue(new Error("DB error"));

      const items = [{ name: "Failing Spell", source: "open5e", id: "1" }];

      const result = await importWithDedup("spells", items, saveFn);

      expect(result.inserted).toBe(0);
      expect(result.skipped).toBe(0);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toContain("Failing Spell");
      expect(result.errors[0]).toContain("DB error");
    });

    it("handles empty item list", async () => {
      const saveFn = jest.fn().mockResolvedValue(undefined);

      const result = await importWithDedup("spells", [], saveFn);

      expect(result.inserted).toBe(0);
      expect(result.skipped).toBe(0);
      expect(result.errors).toHaveLength(0);
    });

    it("processes mixed new and existing spells", async () => {
      mockedStorage.spellExistsByNameAndSource
        .mockResolvedValueOnce(false)
        .mockResolvedValueOnce(true)
        .mockResolvedValueOnce(false);
      const saveFn = jest.fn().mockResolvedValue(undefined);

      const items = [
        { name: "New1", source: "open5e", id: "1" },
        { name: "Existing", source: "open5e", id: "2" },
        { name: "New2", source: "open5e", id: "3" },
      ];

      const result = await importWithDedup("spells", items, saveFn);

      expect(result.inserted).toBe(2);
      expect(result.skipped).toBe(1);
      expect(result.errors).toHaveLength(0);
      expect(saveFn).toHaveBeenCalledTimes(2);
    });

    it("handles monsters without dedup check", async () => {
      const saveFn = jest.fn().mockResolvedValue(undefined);

      const items = [
        { name: "Goblin", source: "open5e", id: "1" },
        { name: "Orc", source: "open5e", id: "2" },
      ];

      const result = await importWithDedup("monsters", items, saveFn);

      expect(result.inserted).toBe(2);
      expect(result.skipped).toBe(0);
      expect(result.errors).toHaveLength(0);
      expect(mockedStorage.spellExistsByNameAndSource).not.toHaveBeenCalled();
    });

    it("handles non-Error exceptions in save", async () => {
      mockedStorage.spellExistsByNameAndSource.mockResolvedValue(false);
      const saveFn = jest.fn().mockRejectedValue("string error");

      const items = [{ name: "Bad", source: "open5e", id: "1" }];

      const result = await importWithDedup("spells", items, saveFn);

      expect(result.inserted).toBe(0);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toContain("Bad");
      expect(result.errors[0]).toContain("string error");
    });
  });
});