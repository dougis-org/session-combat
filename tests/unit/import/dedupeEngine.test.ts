import { shouldImport } from "@/lib/import/dedupeEngine";
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
      expect(mockedStorage.spellExistsByNameAndSource).toHaveBeenCalledWith(
        "Fireball",
        "open5e"
      );
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
});