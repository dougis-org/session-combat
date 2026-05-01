import { Open5ESpell } from "@/lib/import/open5eAdapter";
import {
  shouldImport,
  importMonstersFromOpen5E,
  importSpellsFromOpen5E,
} from "@/lib/import/dedupeEngine";
import { storage } from "@/lib/storage";
import {
  createMockClient,
  createTestCreature,
  createTestSpell,
  SAMPLE_CREATURE,
} from "./open5e.mockHelpers";

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

  describe("importMonstersFromOpen5E", () => {
    it("inserts monster when not duplicate and valid", async () => {
      mockedStorage.spellExistsByNameAndSource.mockResolvedValue(false);
      mockedStorage.saveMonsterTemplate.mockResolvedValue(undefined);

      const creature = createTestCreature({ key: "goblin", name: "Goblin" });
      const client = createMockClient([creature], []);

      const result = await importMonstersFromOpen5E(client);

      expect(result.inserted).toBe(1);
      expect(result.skipped).toBe(0);
      expect(result.errors).toBe(0);
      expect(mockedStorage.saveMonsterTemplate).toHaveBeenCalledTimes(1);
    });

    it("inserts monster even when storage check would return exists (monsters have no dedup)", async () => {
      mockedStorage.spellExistsByNameAndSource.mockResolvedValue(true);
      mockedStorage.saveMonsterTemplate.mockResolvedValue(undefined);

      const creature = createTestCreature({ key: "goblin", name: "Goblin" });
      const client = createMockClient([creature], []);

      const result = await importMonstersFromOpen5E(client);

      expect(result.inserted).toBe(1);
      expect(result.skipped).toBe(0);
      expect(result.errors).toBe(0);
      expect(mockedStorage.saveMonsterTemplate).toHaveBeenCalledTimes(1);
    });

    it("counts error when monster transform is invalid", async () => {
      const invalidCreature = createTestCreature({ name: "" });
      const client = createMockClient([invalidCreature], []);

      const result = await importMonstersFromOpen5E(client);

      expect(result.inserted).toBe(0);
      expect(result.skipped).toBe(0);
      expect(result.errors).toBe(1);
      expect(mockedStorage.saveMonsterTemplate).not.toHaveBeenCalled();
    });

    it("processes multiple monsters", async () => {
      mockedStorage.spellExistsByNameAndSource.mockResolvedValue(false);
      mockedStorage.saveMonsterTemplate.mockResolvedValue(undefined);

      const goblin = createTestCreature({
        key: "goblin",
        name: "Goblin",
        ability_scores: {
          strength: 8,
          dexterity: 14,
          constitution: 12,
          intelligence: 10,
          wisdom: 8,
          charisma: 8,
        },
      });
      const orc = createTestCreature({
        key: "orc",
        name: "Orc",
        size: { Name: "Medium", key: "medium" },
        type: { Name: "Humanoid", key: "humanoid" },
        alignment: "chaotic evil",
        ability_scores: {
          strength: 16,
          dexterity: 12,
          constitution: 16,
          intelligence: 7,
          wisdom: 11,
          charisma: 10,
        },
      });

      const client = createMockClient([goblin, orc], []);

      const result = await importMonstersFromOpen5E(client);

      expect(result.inserted).toBe(2);
      expect(result.skipped).toBe(0);
      expect(result.errors).toBe(0);
      expect(mockedStorage.saveMonsterTemplate).toHaveBeenCalledTimes(2);
    });
  });

  describe("importSpellsFromOpen5E", () => {
    it("inserts spell when not duplicate and valid", async () => {
      mockedStorage.spellExistsByNameAndSource.mockResolvedValue(false);
      mockedStorage.saveSpellTemplate.mockResolvedValue(undefined);

      const spell = createTestSpell({ key: "fireball", name: "Fireball", level: 3 });
      const client = createMockClient([], [spell]);

      const result = await importSpellsFromOpen5E(client);

      expect(result.inserted).toBe(1);
      expect(result.skipped).toBe(0);
      expect(result.errors).toBe(0);
      expect(mockedStorage.saveSpellTemplate).toHaveBeenCalledTimes(1);
    });

    it("skips spell when storage returns exists=true", async () => {
      mockedStorage.spellExistsByNameAndSource.mockResolvedValue(true);

      const spell = createTestSpell({ key: "fireball", name: "Fireball", level: 3 });
      const client = createMockClient([], [spell]);

      const result = await importSpellsFromOpen5E(client);

      expect(result.inserted).toBe(0);
      expect(result.skipped).toBe(1);
      expect(result.errors).toBe(0);
      expect(mockedStorage.saveSpellTemplate).not.toHaveBeenCalled();
    });

    it("counts error when spell transform is invalid", async () => {
      mockedStorage.spellExistsByNameAndSource.mockResolvedValue(false);

      const invalidSpell: Open5ESpell = {
        key: "bad",
        name: "",
        level: 1,
        school: { Name: "Evocation", key: "evocation" },
        concentration: false,
        casting_time: "1 action",
        range: 0,
        range_text: "Self",
        duration: "Instantaneous",
        desc: "",
      };

      const client = createMockClient([], [invalidSpell]);

      const result = await importSpellsFromOpen5E(client);

      expect(result.inserted).toBe(0);
      expect(result.skipped).toBe(0);
      expect(result.errors).toBe(1);
      expect(mockedStorage.saveSpellTemplate).not.toHaveBeenCalled();
    });
  });
});