/**
 * @jest-environment node
 */
import { Open5ESpell } from "@/lib/import/open5eAdapter";
import {
  shouldImport,
  importMonstersFromOpen5E,
  importSpellsFromOpen5E,
} from "@/lib/import/dedupeEngine";
import { storage } from "@/lib/storage";
import { transformMonster } from "@/lib/import/transformMonster";
import {
  createMockClient,
  createTestCreature,
  createTestSpell,
} from "@/tests/helpers/importTestHelpers";

jest.mock("@/lib/storage");
jest.mock("@/lib/import/transformMonster");

const mockedStorage = jest.mocked(storage);
const mockedTransformMonster = jest.mocked(transformMonster);

describe("dedupeEngine", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedTransformMonster.mockImplementation((raw) => {
      const name = (raw as { name?: string }).name ?? "";
      if (!name) {
        return { monster: {} as any, valid: false, errors: ["Missing required field: name"] };
      }
      return {
        monster: { name, source: "open5e" } as any,
        valid: true,
        errors: [],
      };
    });
  });

  describe("shouldImport", () => {
    it("returns should=false for spells that exist by name and source", async () => {
      mockedStorage.spellExistsByNameAndSource.mockResolvedValue(true);

      const result = await shouldImport("spells", "Fireball", "open5e");

      expect(result.should).toBe(false);
      expect(mockedStorage.spellExistsByNameAndSource).toHaveBeenCalledWith(
        "Fireball",
        "open5e"
      );
    });

    it("returns should=true for spells that do not exist", async () => {
      mockedStorage.spellExistsByNameAndSource.mockResolvedValue(false);

      const result = await shouldImport("spells", "New Spell", "open5e");

      expect(result.should).toBe(true);
    });

    it("returns should=true and no existingId for new monsters", async () => {
      mockedStorage.findMonsterByNameAndSource.mockResolvedValue(null);

      const result = await shouldImport("monsters", "Goblin", "open5e");

      expect(result.should).toBe(true);
      expect(result.existingId).toBeUndefined();
      expect(mockedStorage.findMonsterByNameAndSource).toHaveBeenCalledWith("Goblin", "open5e");
    });

    it("returns should=false and existingId for existing monsters", async () => {
      mockedStorage.findMonsterByNameAndSource.mockResolvedValue({ id: "existing-id-123" } as any);

      const result = await shouldImport("monsters", "Goblin", "open5e");

      expect(result.should).toBe(false);
      expect(result.existingId).toBe("existing-id-123");
    });
  });

  describe("importMonstersFromOpen5E", () => {
    it("inserts monster when not duplicate and valid", async () => {
      mockedStorage.findMonsterByNameAndSource.mockResolvedValue(null);
      mockedStorage.saveMonsterTemplate.mockResolvedValue(undefined);

      const creature = createTestCreature({ key: "goblin", name: "Goblin" });
      const client = createMockClient([creature], []);

      const result = await importMonstersFromOpen5E(client);

      expect(result.inserted).toBe(1);
      expect(result.skipped).toBe(0);
      expect(result.errors).toBe(0);
      expect(mockedStorage.saveMonsterTemplate).toHaveBeenCalledTimes(1);
    });

    it("skips monster when it already exists", async () => {
      mockedStorage.findMonsterByNameAndSource.mockResolvedValue({ id: "existing-id" } as any);

      const creature = createTestCreature({ key: "goblin", name: "Goblin" });
      const client = createMockClient([creature], []);

      const result = await importMonstersFromOpen5E(client);

      expect(result.inserted).toBe(0);
      expect(result.skipped).toBe(1);
      expect(result.errors).toBe(0);
      expect(mockedStorage.saveMonsterTemplate).not.toHaveBeenCalled();
    });

    it("does not call transformMonster when duplicate is detected", async () => {
      mockedStorage.findMonsterByNameAndSource.mockResolvedValue({ id: "existing-id" } as any);

      const creature = createTestCreature({ key: "goblin", name: "Goblin" });
      const client = createMockClient([creature], []);

      await importMonstersFromOpen5E(client);

      expect(mockedTransformMonster).not.toHaveBeenCalled();
    });

    it("returns skipped (not error) for invalid+duplicate monster", async () => {
      mockedStorage.findMonsterByNameAndSource.mockResolvedValue({ id: "existing-id" } as any);
      mockedTransformMonster.mockReturnValue({
        monster: {} as any,
        valid: false,
        errors: ["Missing required field: name"],
      });

      const creature = createTestCreature({ key: "goblin", name: "Goblin" });
      const client = createMockClient([creature], []);

      const result = await importMonstersFromOpen5E(client);

      expect(result.inserted).toBe(0);
      expect(result.skipped).toBe(1);
      expect(result.errors).toBe(0);
      expect(mockedTransformMonster).not.toHaveBeenCalled();
    });

    it("counts error when monster transform is invalid", async () => {
      mockedStorage.findMonsterByNameAndSource.mockResolvedValue(null);
      const invalidCreature = createTestCreature({ name: "" });
      const client = createMockClient([invalidCreature], []);

      const result = await importMonstersFromOpen5E(client);

      expect(result.inserted).toBe(0);
      expect(result.skipped).toBe(0);
      expect(result.errors).toBe(1);
      expect(mockedStorage.saveMonsterTemplate).not.toHaveBeenCalled();
    });

    it("processes multiple monsters", async () => {
      mockedStorage.findMonsterByNameAndSource.mockResolvedValue(null);
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