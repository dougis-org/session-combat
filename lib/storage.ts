// MongoDB persistence utilities
import { getDatabase } from "./db";
import {
  SessionData,
  Encounter,
  Character,
  CombatState,
  Party,
  PartyMember,
  Campaign,
  CampaignTemplate,
  MonsterTemplate,
  SpellTemplate,
  SessionLog,
  SessionLogInput,
} from "./types";
import { GLOBAL_USER_ID } from "./constants";
import { ObjectId, Filter, Document } from "mongodb";

interface QueryableEntity {
  _id?: string;
  id: string;
  userId: string;
}

function buildEntityQuery<T extends QueryableEntity>(entity: T): Filter<T> {
  const query: Filter<Document> = { userId: entity.userId };
  if (entity._id) {
    return { ...query, _id: new ObjectId(entity._id) } as Filter<T>;
  }
  return { ...query, id: entity.id } as Filter<T>;
}

function normalizeStoredEntityId<T extends { id?: string; _id?: string }>(
  entity: T,
): T & { id: string | undefined } {
  return {
    ...entity,
    // Preserve the app-level UUID for reads; fall back to `_id` only when deriving the returned `id` value.
    id: entity.id || entity._id?.toString(),
  };
}

function normalizeCampaign(campaign: Campaign): Campaign {
  return {
    ...campaign,
    chapters: Array.isArray(campaign.chapters) ? campaign.chapters : [],
  };
}

type LegacyPartyDoc = Omit<Party, 'members'> & { members?: PartyMember[]; characterIds?: string[] };

function migrateParty(party: LegacyPartyDoc): Party {
  if (Array.isArray(party.members)) {
    return party as Party;
  }
  const legacyIds: string[] = Array.isArray(party.characterIds) ? party.characterIds : [];
  const addedAt = party.createdAt ?? new Date(0);
  return {
    ...party,
    members: legacyIds.map(characterId => ({ characterId, addedAt })),
  } as Party;
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
        .collection<LegacyPartyDoc>("parties")
        .find({ userId })
        .toArray();
      return parties.map(normalizeStoredEntityId).map(migrateParty);
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

  // Load global campaign templates (admin-controlled)
  async loadGlobalCampaignTemplates(): Promise<CampaignTemplate[]> {
    try {
      const db = await getDatabase();
      const templates = await db
        .collection<CampaignTemplate>("campaignTemplates")
        .find({ userId: GLOBAL_USER_ID })
        .toArray();
      return templates.map(normalizeStoredEntityId);
    } catch (error) {
      console.error("Error loading global campaign templates:", error);
      return [];
    }
  },

  // Load a single global campaign template by id
  async loadGlobalCampaignTemplateById(id: string): Promise<CampaignTemplate | null> {
    try {
      const db = await getDatabase();
      const template = await db
        .collection<CampaignTemplate>("campaignTemplates")
        .findOne({ id, userId: GLOBAL_USER_ID });
      return template ? normalizeStoredEntityId(template) : null;
    } catch (error) {
      console.error("Error loading global campaign template by id:", error);
      return null;
    }
  },

  // Save campaign template (upsert)
  async saveCampaignTemplate(template: CampaignTemplate): Promise<void> {
    try {
      const db = await getDatabase();
      const { _id, ...templateData } = template;
      await db
        .collection<CampaignTemplate>("campaignTemplates")
        .updateOne(
          { id: template.id, userId: template.userId },
          { $set: templateData },
          { upsert: true }
        );
    } catch (error) {
      console.error("Error saving campaign template:", error);
      throw error;
    }
  },

  // Delete campaign template — returns true if deleted, false if not found
  async deleteCampaignTemplate(id: string): Promise<boolean> {
    try {
      const db = await getDatabase();
      const result = await db
        .collection<CampaignTemplate>("campaignTemplates")
        .deleteOne({ id, userId: GLOBAL_USER_ID });
      return result.deletedCount > 0;
    } catch (error) {
      console.error("Error deleting campaign template:", error);
      throw error;
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
      return campaigns.map(normalizeStoredEntityId).map(normalizeCampaign);
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
      return campaign ? normalizeCampaign(normalizeStoredEntityId(campaign)) : null;
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

      const query = buildEntityQuery(encounter);
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

      const query = buildEntityQuery(character);
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

      const query = buildEntityQuery(combatState);
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
      // Set leftAt on all active party memberships for the deleted character
      await db
        .collection<Party>("parties")
        .updateMany(
          { userId, "members.characterId": id, "members.leftAt": { $exists: false } },
          { $set: { "members.$[elem].leftAt": new Date() } },
          { arrayFilters: [{ "elem.characterId": id, "elem.leftAt": { $exists: false } }] }
        );
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

      const query = buildEntityQuery(template);
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

      const query = buildEntityQuery(spell);
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

  // Load session logs for a campaign, sorted by sessionNumber descending
  async loadSessionLogs(userId: string, campaignId: string): Promise<SessionLog[]> {
    try {
      const db = await getDatabase();
      const logs = await db
        .collection<SessionLog>("sessionLogs")
        .find({ userId, campaignId })
        .sort({ sessionNumber: -1 })
        .toArray();
      return logs.map(normalizeStoredEntityId);
    } catch (error) {
      console.error("Error loading session logs:", error);
      return [];
    }
  },

  // Get the next session number (MAX + 1, or 1 if none exist)
  async getNextSessionNumber(userId: string, campaignId: string): Promise<number> {
    try {
      const db = await getDatabase();
      const latest = await db
        .collection<SessionLog>("sessionLogs")
        .findOne({ userId, campaignId }, { sort: { sessionNumber: -1 } });
      return latest ? latest.sessionNumber + 1 : 1;
    } catch (error) {
      console.error("Error getting next session number:", error);
      return 1;
    }
  },

  // Save a new session log (insert)
  async saveSessionLog(log: SessionLog): Promise<void> {
    try {
      const db = await getDatabase();
      const { _id, ...logData } = log;
      await db.collection<SessionLog>("sessionLogs").insertOne(logData as SessionLog);
    } catch (error) {
      console.error("Error saving session log:", error);
      throw error;
    }
  },

  // Update an existing session log (partial update)
  async updateSessionLog(
    id: string,
    userId: string,
    campaignId: string,
    patch: Partial<SessionLogInput>
  ): Promise<SessionLog | null> {
    try {
      const db = await getDatabase();
      const result = await db
        .collection<SessionLog>("sessionLogs")
        .findOneAndUpdate(
          { id, userId, campaignId },
          { $set: { ...patch, datePlayed: patch.datePlayed ? new Date(patch.datePlayed) : undefined, updatedAt: new Date() } },
          { returnDocument: "after" }
        );
      return result ? normalizeStoredEntityId(result) : null;
    } catch (error) {
      console.error("Error updating session log:", error);
      throw error;
    }
  },

  // Delete a session log
  async deleteSessionLog(id: string, userId: string, campaignId: string): Promise<boolean> {
    try {
      const db = await getDatabase();
      const result = await db
        .collection<SessionLog>("sessionLogs")
        .deleteOne({ id, userId, campaignId });
      return result.deletedCount > 0;
    } catch (error) {
      console.error("Error deleting session log:", error);
      throw error;
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
