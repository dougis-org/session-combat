// MongoDB persistence utilities
import { getDatabase } from "./db";
import {
  SessionData,
  Encounter,
  Character,
  CombatState,
  Party,
  Campaign,
  MonsterTemplate,
  SpellTemplate,
} from "./types";
import { GLOBAL_USER_ID } from "./constants";
import { ObjectId } from "mongodb";

function normalizeStoredEntityId<T extends { id?: string; _id?: string }>(
  entity: T,
): T & { id: string | undefined } {
  return {
    ...entity,
    // Preserve the app-level UUID for reads; fall back to `_id` only when deriving the returned `id` value.
    id: entity.id || entity._id?.toString(),
  };
}

/**
 * Server-side storage functions for MongoDB
 * Note: Use API routes for client-side data fetching
 */
export const storage = {
  // Load encounters for a user
  async loadEncounters(userId: string): Promise<Encounter[]> {
    try {
      const db = await getDatabase();
      const encounters = await db
        .collection<Encounter>("encounters")
        .find({ userId })
        .toArray();
      return encounters.map(normalizeStoredEntityId);
    } catch (error) {
      console.error("Error loading encounters:", error);
      return [];
    }
  },

  /**
   * Load all active characters for a user.
   *
   * This function queries the `characters_active` MongoDB view, which automatically
   * filters out soft-deleted characters (those with a deletedAt timestamp set).
   * The view is created during database initialization and uses a pipeline that matches
   * characters where deletedAt is null or does not exist.
   *
   * @param userId - The user ID to load characters for
   * @returns Promise resolving to array of active Character objects
   *
   * @remarks
   * - Soft-deleted characters (with deletedAt != null) are automatically excluded by the view
   * - The explicit 'id' field is preserved; MongoDB's '_id' is used as fallback only
   * - Returns empty array on error (logged to console)
   */
  async loadCharacters(userId: string): Promise<Character[]> {
    try {
      const db = await getDatabase();
      try {
        const characters = await db
          .collection<Character>("characters_active")
          .find({ userId })
          .toArray();
        return characters.map(normalizeStoredEntityId);
      } catch (viewError) {
        // Fall back to querying the underlying collection with an explicit filter
        // when the view is unavailable (e.g., initialization failed or missing privileges).
        console.warn(
          "characters_active view unavailable, falling back to direct query:",
          viewError,
        );
        const characters = await db
          .collection<Character>("characters")
          .find({ userId, deletedAt: null as unknown as Date })
          .toArray();
        return characters.map(normalizeStoredEntityId);
      }
    } catch (error) {
      console.error("Error loading characters:", error);
      return [];
    }
  },

  // Load combat state for a user
  async loadCombatState(userId: string): Promise<CombatState | null> {
    try {
      const db = await getDatabase();
      const combatState = await db
        .collection<CombatState>("combatStates")
        .findOne({ userId });
      return combatState || null;
    } catch (error) {
      console.error("Error loading combat state:", error);
      return null;
    }
  },

  // Load parties for a user
  async loadParties(userId: string): Promise<Party[]> {
    try {
      const db = await getDatabase();
      const parties = await db
        .collection<Party>("parties")
        .find({ userId })
        .toArray();
      return parties.map(normalizeStoredEntityId);
    } catch (error) {
      console.error("Error loading parties:", error);
      return [];
    }
  },

  // Load monster templates for a user
  async loadMonsterTemplates(userId: string): Promise<MonsterTemplate[]> {
    try {
      const db = await getDatabase();
      const templates = await db
        .collection<MonsterTemplate>("monsterTemplates")
        .find({ userId })
        .toArray();
      return templates.map(normalizeStoredEntityId);
    } catch (error) {
      console.error("Error loading monster templates:", error);
      return [];
    }
  },

  // Load global monster templates (admin-controlled)
  async loadGlobalMonsterTemplates(): Promise<MonsterTemplate[]> {
    return this.loadMonsterTemplates(GLOBAL_USER_ID);
  },

  // Load all monster templates (user + global)
  async loadAllMonsterTemplates(userId: string): Promise<MonsterTemplate[]> {
    try {
      const [userTemplates, globalTemplates] = await Promise.all([
        this.loadMonsterTemplates(userId),
        this.loadGlobalMonsterTemplates(),
      ]);
      return [...userTemplates, globalTemplates].flat();
    } catch (error) {
      console.error("Error loading all monster templates:", error);
      return [];
    }
  },

  // Load campaigns for a user
  async loadCampaigns(userId: string): Promise<Campaign[]> {
    try {
      const db = await getDatabase();
      const campaigns = await db
        .collection<Campaign>("campaigns")
        .find({ userId })
        .toArray();
      return campaigns.map(normalizeStoredEntityId);
    } catch (error) {
      console.error("Error loading campaigns:", error);
      return [];
    }
  },

  // Load single campaign by ID
  async loadCampaignById(id: string, userId: string): Promise<Campaign | null> {
    try {
      const db = await getDatabase();
      const campaign = await db
        .collection<Campaign>("campaigns")
        .findOne({ id, userId });
      return campaign ? normalizeStoredEntityId(campaign) : null;
    } catch (error) {
      console.error("Error loading campaign by ID:", error);
      return null;
    }
  },

  // Save campaign (upsert)
  async saveCampaign(campaign: Campaign): Promise<void> {
    try {
      const db = await getDatabase();
      const { _id, ...campaignData } = campaign;
      await db
        .collection<Campaign>("campaigns")
        .updateOne(
          { id: campaign.id, userId: campaign.userId },
          { $set: campaignData },
          { upsert: true }
        );
    } catch (error) {
      console.error("Error saving campaign:", error);
      throw error;
    }
  },

  // Delete campaign
  async deleteCampaign(id: string, userId: string): Promise<void> {
    try {
      const db = await getDatabase();
      await db.collection<Campaign>("campaigns").deleteOne({ id, userId });
    } catch (error) {
      console.error("Error deleting campaign:", error);
      throw error;
    }
  },

  // Load all session data for a user
  async load(userId: string): Promise<SessionData> {
    try {
      const [encounters, characters, parties, campaigns, combatState] = await Promise.all([
        this.loadEncounters(userId),
        this.loadCharacters(userId),
        this.loadParties(userId),
        this.loadCampaigns(userId),
        this.loadCombatState(userId),
      ]);

      return {
        encounters,
        characters,
        parties,
        campaigns,
        combatState: combatState || undefined,
      };
    } catch (error) {
      console.error("Error loading session data:", error);
      return { encounters: [], characters: [], parties: [], campaigns: [] };
    }
  },

  // Save encounter
  async saveEncounter(encounter: Encounter): Promise<void> {
    try {
      const db = await getDatabase();
      const { _id, ...encounterData } = encounter;
      console.log("saveEncounter called with:", {
        id: encounter.id,
        _id: encounter._id,
        name: encounter.name,
        userId: encounter.userId,
      });

      // Build the query: if we have a MongoDB _id, use that; otherwise use the custom id field
      let query: any = { userId: encounter.userId };
      if (encounter._id) {
        query._id = new ObjectId(encounter._id);
      } else {
        query.id = encounter.id;
      }

      console.log("Query for updateOne:", query);

      const result = await db
        .collection<Encounter>("encounters")
        .updateOne(query, { $set: encounterData }, { upsert: true });
      console.log("updateOne result:", {
        matchedCount: result.matchedCount,
        modifiedCount: result.modifiedCount,
        upsertedId: result.upsertedId,
      });
    } catch (error) {
      console.error("Error saving encounter:", error);
      throw error;
    }
  },

  // Save multiple encounters
  async saveEncounters(encounters: Encounter[]): Promise<void> {
    try {
      const db = await getDatabase();
      for (const encounter of encounters) {
        await this.saveEncounter(encounter);
      }
    } catch (error) {
      console.error("Error saving encounters:", error);
      throw error;
    }
  },

  // Save character
  async saveCharacter(character: Character): Promise<void> {
    try {
      const db = await getDatabase();
      const { _id, ...characterData } = character;

      // Build the query: if we have a MongoDB _id, use that; otherwise use the custom id field
      let query: any = { userId: character.userId };
      if (character._id) {
        query._id = new ObjectId(character._id);
      } else {
        query.id = character.id;
      }

      await db
        .collection<Character>("characters")
        .updateOne(query, { $set: characterData }, { upsert: true });
    } catch (error) {
      console.error("Error saving character:", error);
      throw error;
    }
  },

  // Save multiple characters
  async saveCharacters(characters: Character[]): Promise<void> {
    try {
      const db = await getDatabase();
      for (const character of characters) {
        await this.saveCharacter(character);
      }
    } catch (error) {
      console.error("Error saving characters:", error);
      throw error;
    }
  },

  // Save combat state
  async saveCombatState(combatState: CombatState | undefined): Promise<void> {
    if (!combatState) {
      return;
    }
    try {
      const db = await getDatabase();
      const { _id, ...combatStateData } = combatState;

      // Build the query: if we have a MongoDB _id, use that; otherwise use the custom id field
      let query: any = { userId: combatState.userId };
      if (combatState._id) {
        query._id = new ObjectId(combatState._id);
      } else {
        query.id = combatState.id;
      }

      await db
        .collection<CombatState>("combatStates")
        .updateOne(query, { $set: combatStateData }, { upsert: true });
    } catch (error) {
      console.error("Error saving combat state:", error);
      throw error;
    }
  },

  // Delete encounter
  async deleteEncounter(id: string, userId: string): Promise<void> {
    try {
      const db = await getDatabase();
      await db.collection<Encounter>("encounters").deleteOne({ id, userId });
    } catch (error) {
      console.error("Error deleting encounter:", error);
      throw error;
    }
  },

  /**
   * Soft delete a character by marking it with a deletedAt timestamp.
   *
   * This function performs a soft delete, marking the character as deleted without
   * removing the underlying document. This preserves the character data for audit trails,
   * recovery, or future reference. Soft-deleted characters are automatically excluded
   * from queries via the characters_active view.
   *
   * The function also maintains referential integrity by removing the character ID from
   * all parties that reference it, ensuring the character doesn't appear in party listings
   * or combat scenarios. Note: the soft delete and party cleanup are separate operations
   * and are not atomic; party cleanup is best-effort.
   *
   * @param id - The character ID to soft delete
   * @param userId - The user ID (for ownership verification)
   * @returns Promise that resolves when the soft delete is complete
   *
   * @remarks
   * - Sets deletedAt timestamp, then performs best-effort cleanup to remove from all parties
   * - Character data remains intact; deletedAt field is the only modification
   * - Soft-deleted characters return 404 on GET detail requests
   * - Soft-deleted characters are excluded from GET list via the characters_active view
   *
   * @throws Error if database operation fails
   */
  async deleteCharacter(id: string, userId: string): Promise<void> {
    try {
      const db = await getDatabase();
      // Soft delete: mark with deletedAt timestamp
      await db
        .collection<Character>("characters")
        .updateOne({ id, userId }, { $set: { deletedAt: new Date() } });
      // Also remove character from all parties to ensure referential integrity
      await db
        .collection<Party>("parties")
        .updateMany({ userId }, { $pull: { characterIds: id } });
    } catch (error) {
      console.error("Error deleting character:", error);
      throw error;
    }
  },

  // Save party
  async saveParty(party: Party): Promise<void> {
    try {
      const db = await getDatabase();
      const { _id, ...partyData } = party;

      // Parties are persisted by app-level id plus userId, not MongoDB _id.
      await db
        .collection<Party>("parties")
        .updateOne(
          { id: party.id, userId: party.userId },
          { $set: partyData },
          { upsert: true }
        );
    } catch (error) {
      console.error("Error saving party:", error);
      throw error;
    }
  },

  // Save multiple parties
  async saveParties(parties: Party[]): Promise<void> {
    try {
      const db = await getDatabase();
      for (const party of parties) {
        await this.saveParty(party);
      }
    } catch (error) {
      console.error("Error saving parties:", error);
      throw error;
    }
  },

  // Delete party
  async deleteParty(id: string, userId: string): Promise<void> {
    try {
      const db = await getDatabase();
      await db.collection<Party>("parties").deleteOne({ id, userId });
    } catch (error) {
      console.error("Error deleting party:", error);
      throw error;
    }
  },

  // Save monster template
  async saveMonsterTemplate(template: MonsterTemplate): Promise<void> {
    try {
      const db = await getDatabase();
      const { _id, ...templateData } = template;

      // Build the query: if we have a MongoDB _id, use that; otherwise use the custom id field
      let query: any = { userId: template.userId };
      if (template._id) {
        query._id = new ObjectId(template._id);
      } else {
        query.id = template.id;
      }

      await db
        .collection<MonsterTemplate>("monsterTemplates")
        .updateOne(query, { $set: templateData }, { upsert: true });
    } catch (error) {
      console.error("Error saving monster template:", error);
      throw error;
    }
  },

  // Delete monster template
  async deleteMonsterTemplate(id: string, userId: string): Promise<void> {
    try {
      const db = await getDatabase();
      await db
        .collection<MonsterTemplate>("monsterTemplates")
        .deleteOne({ id, userId });
    } catch (error) {
      console.error("Error deleting monster template:", error);
      throw error;
    }
  },

  // Load spells - load all global spells if no userId, or load user spells
  async loadSpells(userId?: string, concentration?: boolean): Promise<SpellTemplate[]> {
    try {
      const db = await getDatabase();
      const query: Record<string, unknown> = userId
        ? { userId }
        : { userId: GLOBAL_USER_ID };
      if (concentration !== undefined) {
        query.concentration = concentration;
      }
      const spells = await db
        .collection<SpellTemplate>("spellTemplates")
        .find(query)
        .toArray();
      return spells.map(normalizeStoredEntityId);
    } catch (error) {
      console.error("Error loading spells:", error);
      return [];
    }
  },

  // Load single spell by ID
  async loadSpellById(id: string): Promise<SpellTemplate | null> {
    if (!id || typeof id !== "string" || id.length > 64) {
      return null;
    }
    try {
      const db = await getDatabase();
      const spell = await db
        .collection<SpellTemplate>("spellTemplates")
        .findOne({ id, userId: GLOBAL_USER_ID });
      return spell ? normalizeStoredEntityId(spell) : null;
    } catch (error) {
      console.error("Error loading spell by ID:", error);
      return null;
    }
  },

  // Save spell template (upsert)
  async saveSpellTemplate(spell: SpellTemplate): Promise<void> {
    try {
      const db = await getDatabase();
      const { _id, ...spellData } = spell;

      const query: Record<string, unknown> = { userId: spell.userId };
      if (spell._id) {
        query._id = new ObjectId(spell._id);
      } else {
        query.id = spell.id;
      }

      await db
        .collection<SpellTemplate>("spellTemplates")
        .updateOne(query, { $set: spellData }, { upsert: true });
    } catch (error) {
      console.error("Error saving spell template:", error);
      throw error;
    }
  },

  // Delete spell template
  async deleteSpellTemplate(id: string): Promise<void> {
    if (!id || typeof id !== "string" || id.length > 64) {
      return;
    }
    try {
      const db = await getDatabase();
      await db
        .collection<SpellTemplate>("spellTemplates")
        .deleteOne({ id, userId: GLOBAL_USER_ID });
    } catch (error) {
      console.error("Error deleting spell template:", error);
      throw error;
    }
  },

  // Check if spell exists by name and source (for dedupe)
  async spellExistsByNameAndSource(
    name: string,
    source: string
  ): Promise<boolean> {
    try {
      const db = await getDatabase();
      const count = await db
        .collection<SpellTemplate>("spellTemplates")
        .countDocuments({ name, source });
      return count > 0;
    } catch (error) {
      console.error("Error checking spell existence:", error);
      return false;
    }
  },

  // Check if monster exists by name and source (for dedupe)
  async monsterExistsByNameAndSource(
    name: string,
    source: string
  ): Promise<boolean> {
    try {
      const db = await getDatabase();
      const count = await db
        .collection<MonsterTemplate>("monsterTemplates")
        .countDocuments({ name, source: source || "" });
      return count > 0;
    } catch (error) {
      console.error("Error checking monster existence:", error);
      return false;
    }
  },

  async findMonsterByNameAndSource(
    name: string,
    source: string
  ): Promise<MonsterTemplate | null> {
    try {
      const db = await getDatabase();
      return await db
        .collection<MonsterTemplate>("monsterTemplates")
        .findOne({ name, source: source || "" }) as MonsterTemplate | null;
    } catch (error) {
      console.error("Error finding monster:", error);
      return null;
    }
  },

  // Clear all data for a user
  async clear(userId: string): Promise<void> {
    try {
      const db = await getDatabase();
      await Promise.all([
        db.collection<Encounter>("encounters").deleteMany({ userId }),
        db.collection<Character>("characters").deleteMany({ userId }),
        db.collection<Party>("parties").deleteMany({ userId }),
        db.collection<CombatState>("combatStates").deleteMany({ userId }),
      ]);
    } catch (error) {
      console.error("Error clearing data:", error);
      throw error;
    }
  },
};
