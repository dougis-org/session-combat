/**
 * @jest-environment node
 */
import { storage } from "@/lib/storage";
import { Character, CombatState, Encounter, SpellTemplate } from "@/lib/types";
import { GLOBAL_USER_ID } from "@/lib/constants";

const ABILITY_SCORES = {
  strength: 10, dexterity: 10, constitution: 10,
  intelligence: 10, wisdom: 10, charisma: 10,
};

jest.mock("@/lib/db", () => ({
  getDatabase: jest.fn(),
}));

import { getDatabase } from "@/lib/db";

const mockedDb = {
  collection: jest.fn(),
};

const mockedCollection = {
  findOne: jest.fn(),
  find: jest.fn(),
  updateOne: jest.fn(),
  deleteOne: jest.fn(),
  countDocuments: jest.fn(),
  toArray: jest.fn(),
};

jest.mocked(getDatabase).mockResolvedValue(mockedDb as any);
jest.mocked(mockedDb.collection).mockReturnValue(mockedCollection as any);

describe("storage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("saveEncounter", () => {
    const base: Encounter = {
      id: "enc-123",
      userId: "user-456",
      name: "Cave Encounter",
      description: "A dark cave",
      monsters: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it("upserts by id when _id not present", async () => {
      mockedCollection.updateOne.mockResolvedValue({} as any);

      await storage.saveEncounter(base);

      expect(mockedCollection.updateOne).toHaveBeenCalledWith(
        { userId: "user-456", id: "enc-123" },
        expect.anything(),
        { upsert: true }
      );
    });

    it("upserts by _id when _id present", async () => {
      mockedCollection.updateOne.mockResolvedValue({} as any);

      await storage.saveEncounter({ ...base, _id: "507f1f77bcf86cd799439011" });

      const filter = mockedCollection.updateOne.mock.calls[0][0];
      expect(filter).toHaveProperty("_id");
      expect(filter).toHaveProperty("userId", "user-456");
    });
  });

  describe("saveCharacter", () => {
    const base: Character = {
      id: "char-123",
      userId: "user-456",
      name: "Hero",
      classes: [],
      abilityScores: ABILITY_SCORES,
      ac: 10,
      hp: 10,
      maxHp: 10,
    };

    it("upserts by id when _id not present", async () => {
      mockedCollection.updateOne.mockResolvedValue({} as any);

      await storage.saveCharacter(base);

      expect(mockedCollection.updateOne).toHaveBeenCalledWith(
        { userId: "user-456", id: "char-123" },
        expect.anything(),
        { upsert: true }
      );
    });

    it("upserts by _id when _id present", async () => {
      mockedCollection.updateOne.mockResolvedValue({} as any);

      await storage.saveCharacter({ ...base, _id: "507f1f77bcf86cd799439011" });

      const filter = mockedCollection.updateOne.mock.calls[0][0];
      expect(filter).toHaveProperty("_id");
      expect(filter).toHaveProperty("userId", "user-456");
    });
  });

  describe("saveCombatState", () => {
    const base: CombatState = {
      id: "cs-123",
      userId: "user-456",
      campaignId: "campaign-1",
      combatants: [],
      currentRound: 1,
      currentTurnIndex: 0,
      isActive: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it("upserts by id when _id not present", async () => {
      mockedCollection.updateOne.mockResolvedValue({} as any);

      await storage.saveCombatState(base);

      expect(mockedCollection.updateOne).toHaveBeenCalledWith(
        { userId: "user-456", id: "cs-123" },
        expect.anything(),
        { upsert: true }
      );
    });

    it("upserts by _id when _id present", async () => {
      mockedCollection.updateOne.mockResolvedValue({} as any);

      await storage.saveCombatState({ ...base, _id: "507f1f77bcf86cd799439011" });

      const filter = mockedCollection.updateOne.mock.calls[0][0];
      expect(filter).toHaveProperty("_id");
      expect(filter).toHaveProperty("userId", "user-456");
    });

    it("returns early when combatState is undefined", async () => {
      await storage.saveCombatState(undefined);

      expect(mockedCollection.updateOne).not.toHaveBeenCalled();
    });
  });

  describe("normalizeCampaign (via loadCampaignById)", () => {
    const BASE_CAMPAIGN = {
      id: "campaign-1",
      userId: "user-123",
      name: "Test Campaign",
      moduleName: "Module",
      chapters: [],
      status: "active" as const,
      notes: "",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it("passes through absent activeSessionId (field remains absent)", async () => {
      mockedCollection.findOne.mockResolvedValue(BASE_CAMPAIGN);

      const result = await storage.loadCampaignById("campaign-1", "user-123");

      expect(result).not.toBeNull();
      expect(Object.prototype.hasOwnProperty.call(result, "activeSessionId")).toBe(false);
    });

    it("passes through null activeSessionId (field is null in result)", async () => {
      mockedCollection.findOne.mockResolvedValue({ ...BASE_CAMPAIGN, activeSessionId: null });

      const result = await storage.loadCampaignById("campaign-1", "user-123");

      expect(result).not.toBeNull();
      expect(result!.activeSessionId).toBeNull();
    });
  });

  describe("loadSpellById", () => {
    it("returns normalized spell when found", async () => {
      const spell = {
        _id: "mongo-id" as any,
        id: "spell-123",
        userId: GLOBAL_USER_ID,
        name: "Fireball",
        level: 3,
        school: "Evocation" as const,
        concentration: false,
        description: "Boom",
        castingTime: "1 action",
        range: "120 feet",
        duration: "Instantaneous",
        components: { verbal: true, somatic: true, material: false },
        higherLevel: null,
        damageType: null,
        saveDc: null,
        saveType: null,
        attackRoll: false,
        isGlobal: true,
        source: "open5e",
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockedCollection.findOne.mockResolvedValue(spell);

      const result = await storage.loadSpellById("spell-123");

      expect(mockedCollection.findOne).toHaveBeenCalledWith({ id: "spell-123", userId: "GLOBAL" });
      expect(result?.id).toBe("spell-123");
    });

    it("returns null when spell not found", async () => {
      mockedCollection.findOne.mockResolvedValue(null);

      const result = await storage.loadSpellById("nonexistent");

      expect(result).toBeNull();
    });

    it("returns null on database error", async () => {
      mockedCollection.findOne.mockRejectedValue(new Error("DB error"));

      const result = await storage.loadSpellById("spell-123");

      expect(result).toBeNull();
    });
  });

  describe("loadSpells", () => {
    it("loads global spells when no userId provided", async () => {
      const spells = [
        { id: "s1", name: "Fireball", userId: GLOBAL_USER_ID },
        { id: "s2", name: "Magic Missile", userId: GLOBAL_USER_ID },
      ];
      mockedCollection.find.mockReturnValue({ toArray: jest.fn().mockResolvedValue(spells) } as any);

      const result = await storage.loadSpells();

      expect(mockedCollection.find).toHaveBeenCalledWith({ userId: GLOBAL_USER_ID });
      expect(result).toHaveLength(2);
    });

    it("loads user spells when userId provided", async () => {
      const userId = "user-456";
      const spells = [{ id: "s1", name: "Custom Spell", userId }];
      mockedCollection.find.mockReturnValue({ toArray: jest.fn().mockResolvedValue(spells) } as any);

      const result = await storage.loadSpells(userId);

      expect(mockedCollection.find).toHaveBeenCalledWith({ userId });
      expect(result).toHaveLength(1);
    });

    it("returns empty array on error", async () => {
      mockedCollection.find.mockReturnValue({ toArray: jest.fn().mockRejectedValue(new Error("DB error")) } as any);

      const result = await storage.loadSpells();

      expect(result).toEqual([]);
    });
  });

  describe("saveSpellTemplate", () => {
    it("upserts spell by id when _id not present", async () => {
      mockedCollection.updateOne.mockResolvedValue({} as any);

      const spell: SpellTemplate = {
        id: "new-spell-id",
        userId: GLOBAL_USER_ID,
        name: "New Spell",
        level: 1,
        school: "Conjuration",
        concentration: false,
        description: "Desc",
        castingTime: "1 action",
        range: "Self",
        duration: "Instantaneous",
        components: { verbal: true, somatic: false, material: false },
        higherLevel: null,
        damageType: null,
        saveDc: null,
        saveType: null,
        attackRoll: false,
        isGlobal: true,
        source: "manual",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await storage.saveSpellTemplate(spell);

      expect(mockedCollection.updateOne).toHaveBeenCalledWith(
        { id: "new-spell-id", userId: GLOBAL_USER_ID },
        { $set: spell },
        { upsert: true }
      );
    });

    it("upserts spell by _id when _id present", async () => {
      mockedCollection.updateOne.mockResolvedValue({} as any);

      const spell: SpellTemplate = {
        _id: "507f1f77bcf86cd799439011" as any,
        id: "spell-123",
        userId: GLOBAL_USER_ID,
        name: "Updated Spell",
        level: 2,
        school: "Evocation",
        concentration: true,
        description: "Updated",
        castingTime: "1 bonus action",
        range: "Touch",
        duration: "Concentration, up to 1 minute",
        components: { verbal: false, somatic: true, material: false },
        higherLevel: null,
        damageType: null,
        saveDc: null,
        saveType: null,
        attackRoll: false,
        isGlobal: true,
        source: "manual",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await storage.saveSpellTemplate(spell);

      const call = mockedCollection.updateOne.mock.calls[0];
      expect(call[0]).toHaveProperty("_id");
    });

    it("throws on database error", async () => {
      mockedCollection.updateOne.mockRejectedValue(new Error("DB error"));

      const spell: SpellTemplate = {
        id: "spell-fail",
        userId: GLOBAL_USER_ID,
        name: "Fail Spell",
        level: 0,
        school: "Transmutation",
        concentration: false,
        description: "",
        castingTime: "1 action",
        range: "Self",
        duration: "Instantaneous",
        components: { verbal: false, somatic: false, material: false },
        higherLevel: null,
        damageType: null,
        saveDc: null,
        saveType: null,
        attackRoll: false,
        isGlobal: true,
        source: "manual",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await expect(storage.saveSpellTemplate(spell)).rejects.toThrow("DB error");
    });
  });

  describe("deleteSpellTemplate", () => {
    it("deletes spell by id", async () => {
      mockedCollection.deleteOne.mockResolvedValue({} as any);

      await storage.deleteSpellTemplate("spell-to-delete");

      expect(mockedCollection.deleteOne).toHaveBeenCalledWith({ id: "spell-to-delete", userId: "GLOBAL" });
    });

    it("throws on database error", async () => {
      mockedCollection.deleteOne.mockRejectedValue(new Error("DB error"));

      await expect(storage.deleteSpellTemplate("spell-fail")).rejects.toThrow("DB error");
    });
  });

  describe("spellExistsByNameAndSource", () => {
    it("returns true when spell exists", async () => {
      mockedCollection.countDocuments.mockResolvedValue(1);

      const result = await storage.spellExistsByNameAndSource("Fireball", "open5e");

      expect(result).toBe(true);
      expect(mockedCollection.countDocuments).toHaveBeenCalledWith({ name: "Fireball", source: "open5e" });
    });

    it("returns false when spell does not exist", async () => {
      mockedCollection.countDocuments.mockResolvedValue(0);

      const result = await storage.spellExistsByNameAndSource("Unknown Spell", "open5e");

      expect(result).toBe(false);
    });

    it("returns false on database error", async () => {
      mockedCollection.countDocuments.mockRejectedValue(new Error("DB error"));

      const result = await storage.spellExistsByNameAndSource("Fireball", "open5e");

      expect(result).toBe(false);
    });
  });

  describe("monsterExistsByNameAndSource", () => {
    it("returns true when monster exists", async () => {
      mockedCollection.countDocuments.mockResolvedValue(1);

      const result = await storage.monsterExistsByNameAndSource("Dragon", "open5e");

      expect(result).toBe(true);
      expect(mockedCollection.countDocuments).toHaveBeenCalledWith({ name: "Dragon", source: "open5e" });
    });

    it("returns false when monster does not exist", async () => {
      mockedCollection.countDocuments.mockResolvedValue(0);

      const result = await storage.monsterExistsByNameAndSource("Unknown Monster", "open5e");

      expect(result).toBe(false);
    });

    it("returns false on database error", async () => {
      mockedCollection.countDocuments.mockRejectedValue(new Error("DB error"));

      const result = await storage.monsterExistsByNameAndSource("Dragon", "open5e");

      expect(result).toBe(false);
    });
  });

  describe("setActiveCampaignSession", () => {
    const CAMPAIGN_ID = "campaign-abc";
    const USER_ID = "user-123";
    const SESSION_ID = "session-xyz";

    it("updates activeSessionId with the given string", async () => {
      mockedCollection.updateOne.mockResolvedValue({} as any);

      await storage.setActiveCampaignSession(CAMPAIGN_ID, USER_ID, SESSION_ID);

      const [filter, update] = mockedCollection.updateOne.mock.calls[0];
      expect(filter).toEqual({ id: CAMPAIGN_ID, userId: USER_ID });
      expect(update.$set.activeSessionId).toBe(SESSION_ID);
    });

    it("sets activeSessionId to null when null is passed", async () => {
      mockedCollection.updateOne.mockResolvedValue({} as any);

      await storage.setActiveCampaignSession(CAMPAIGN_ID, USER_ID, null);

      const [filter, update] = mockedCollection.updateOne.mock.calls[0];
      expect(filter).toEqual({ id: CAMPAIGN_ID, userId: USER_ID });
      expect(update.$set.activeSessionId).toBeNull();
    });

    it("updates updatedAt on every call", async () => {
      mockedCollection.updateOne.mockResolvedValue({} as any);
      const before = new Date();

      await storage.setActiveCampaignSession(CAMPAIGN_ID, USER_ID, SESSION_ID);

      const update = mockedCollection.updateOne.mock.calls[0][1];
      expect(update.$set.updatedAt).toBeInstanceOf(Date);
      expect(update.$set.updatedAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
    });

    it("uses updateOne (not upsert)", async () => {
      mockedCollection.updateOne.mockResolvedValue({} as any);

      await storage.setActiveCampaignSession(CAMPAIGN_ID, USER_ID, SESSION_ID);

      expect(mockedCollection.updateOne).toHaveBeenCalledTimes(1);
      const callArgs = mockedCollection.updateOne.mock.calls[0];
      expect(callArgs[2]).toBeUndefined();
    });

    it("throws on database error", async () => {
      mockedCollection.updateOne.mockRejectedValue(new Error("DB error"));

      await expect(storage.setActiveCampaignSession(CAMPAIGN_ID, USER_ID, SESSION_ID)).rejects.toThrow("DB error");
    });
  });

  describe("claimActiveCampaignSession", () => {
    const CAMPAIGN_ID = "campaign-abc";
    const USER_ID = "user-123";
    const SESSION_ID = "session-xyz";

    it("returns true when updateOne modifies the document (no existing active session)", async () => {
      mockedCollection.updateOne.mockResolvedValue({ modifiedCount: 1 } as any);

      const result = await storage.claimActiveCampaignSession(CAMPAIGN_ID, USER_ID, SESSION_ID);

      expect(result).toBe(true);
    });

    it("returns false when updateOne modifies nothing (active session already set)", async () => {
      mockedCollection.updateOne.mockResolvedValue({ modifiedCount: 0 } as any);

      const result = await storage.claimActiveCampaignSession(CAMPAIGN_ID, USER_ID, SESSION_ID);

      expect(result).toBe(false);
    });

    it("filters on id, userId, and null/absent activeSessionId", async () => {
      mockedCollection.updateOne.mockResolvedValue({ modifiedCount: 1 } as any);

      await storage.claimActiveCampaignSession(CAMPAIGN_ID, USER_ID, SESSION_ID);

      const [filter] = mockedCollection.updateOne.mock.calls[0];
      expect(filter.id).toBe(CAMPAIGN_ID);
      expect(filter.userId).toBe(USER_ID);
      expect(filter.$or).toEqual([
        { activeSessionId: null },
        { activeSessionId: { $exists: false } },
      ]);
    });

    it("sets activeSessionId and updatedAt", async () => {
      mockedCollection.updateOne.mockResolvedValue({ modifiedCount: 1 } as any);
      const before = new Date();

      await storage.claimActiveCampaignSession(CAMPAIGN_ID, USER_ID, SESSION_ID);

      const update = mockedCollection.updateOne.mock.calls[0][1];
      expect(update.$set.activeSessionId).toBe(SESSION_ID);
      expect(update.$set.updatedAt).toBeInstanceOf(Date);
      expect(update.$set.updatedAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
    });

    it("throws on database error", async () => {
      mockedCollection.updateOne.mockRejectedValue(new Error("DB error"));

      await expect(storage.claimActiveCampaignSession(CAMPAIGN_ID, USER_ID, SESSION_ID)).rejects.toThrow("DB error");
    });
  });
});
