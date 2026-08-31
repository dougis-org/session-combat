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
  SavedContent,
  CampaignMember,
  CampaignMemberSummary,
  CampaignCharacterShare,
  CampaignRoll,
  MemberRole,
  MemberStatus,
  MemberHistoryEntry,
  PublicUser,
  SharedCharacterEntry,
} from "./types";
import { DuplicateMemberError, DuplicateShareError } from "./errors";
import { GLOBAL_USER_ID } from "./constants";
import { InvalidUserIdError } from "./permissions";
import { runStorageOp } from "@/lib/storage/runOp";
import { ObjectId, Filter, Document } from "mongodb";

import { buildEntityQuery, normalizeStoredEntityId, QueryableEntity } from "./storage/helpers";

function normalizeCampaign(campaign: Campaign): Campaign {
  return {
    ...campaign,
    chapters: Array.isArray(campaign.chapters) ? campaign.chapters : [],
    encounterIds: Array.isArray(campaign.encounterIds) ? campaign.encounterIds : [],
    status: campaign.status ?? 'active',
    notes: campaign.notes ?? '',
  };
}


/**
 * Server-side storage functions for MongoDB
 * Note: Use API routes for client-side data fetching
 */

import * as encounterRepo from "./storage/encounterRepo";
import * as characterRepo from "./storage/characterRepo";
import * as combatStateRepo from "./storage/combatStateRepo";
import * as partyRepo from "./storage/partyRepo";

export const storage = {
  // Load encounters for a user
  async loadEncounters(userId: string): Promise<Encounter[]> { return encounterRepo.loadEncounters(userId); },

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
  async loadCharacters(userId: string): Promise<Character[]> { return characterRepo.loadCharacters(userId); },

  // Load combat state for a user
  async loadCombatState(userId: string): Promise<CombatState | null> { return combatStateRepo.loadCombatState(userId); },

  // Load parties for a user
  async loadParties(userId: string): Promise<Party[]> { return partyRepo.loadParties(userId); },

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
        .sort({ name: 1 })
        .collation({ locale: 'en', strength: 2 })
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

  async addPartyToCampaign(campaignId: string, partyId: string): Promise<void> {
    const db = await getDatabase();
    await db.collection("campaigns").updateOne(
      { id: campaignId },
      { $addToSet: { partyIds: partyId } }
    );
  },

  async removePartyFromCampaign(campaignId: string, partyId: string): Promise<void> {
    const db = await getDatabase();
    await db.collection("campaigns").updateOne(
      { id: campaignId },
      { $pull: { partyIds: partyId } }
    );
  },

  // Delete campaign
  async deleteCampaign(id: string, userId: string): Promise<void> {
    try {
      const db = await getDatabase();

      // Verify campaign exists and belongs to the user before deleting anything
      const campaign = await db
        .collection<Campaign>("campaigns")
        .findOne({ id, userId }, { projection: { id: 1 } });
      if (!campaign) {
        return;
      }

      // Cascade delete children first
      await Promise.all([
        db.collection("campaignMembers").deleteMany({ campaignId: id }),
        db.collection<SessionLog>("sessionLogs").deleteMany({ campaignId: id }),
        db.collection("campaignRolls").deleteMany({ campaignId: id }),
        db.collection<CampaignCharacterShare>("campaignCharacterShares").deleteMany({ campaignId: id }),
        db.collection<SavedContent>("savedContent").deleteMany({ campaignId: id }),
        db.collection("campaignMessages").deleteMany({ campaignId: id }),
      ]);

      // Delete the parent campaign document last
      await db.collection<Campaign>("campaigns").deleteOne({ id, userId });
    } catch (error) {
      console.error("Error deleting campaign:", error);
      throw error;
    }
  },

  async setActiveCampaignSession(campaignId: string, userId: string, sessionId: string | null): Promise<void> {
    try {
      const db = await getDatabase();
      await db
        .collection<Campaign>("campaigns")
        .updateOne(
          { id: campaignId, userId },
          { $set: { activeSessionId: sessionId, updatedAt: new Date() } }
        );
    } catch (error) {
      console.error("Error setting active campaign session:", error);
      throw error;
    }
  },

  async claimActiveCampaignSession(campaignId: string, userId: string, sessionId: string): Promise<boolean> {
    try {
      const db = await getDatabase();
      const result = await db
        .collection<Campaign>("campaigns")
        .updateOne(
          { id: campaignId, userId, $or: [{ activeSessionId: null }, { activeSessionId: { $exists: false } }] },
          { $set: { activeSessionId: sessionId, updatedAt: new Date() } }
        );
      return result.modifiedCount === 1;
    } catch (error) {
      console.error("Error claiming active campaign session:", error);
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

  // Load encounters by id, scoped to their owner
  async loadEncountersByIds(ids: string[], ownerUserId: string): Promise<Encounter[]> {
    if (ids.length === 0) return [];
    try {
      const db = await getDatabase();
      const encounters = await db
        .collection<Encounter>("encounters")
        .find({ id: { $in: ids }, userId: ownerUserId })
        .toArray();
      return encounters.map(normalizeStoredEntityId);
    } catch (error) {
      console.error("Error loading encounters by ids:", error);
      throw error;
    }
  },

  // Link an encounter to a campaign (idempotent)
  async addEncounterToCampaign(campaignId: string, encounterId: string, dmUserId: string): Promise<void> {
    try {
      const db = await getDatabase();
      await db
        .collection<Campaign>("campaigns")
        .updateOne({ id: campaignId, userId: dmUserId }, { $addToSet: { encounterIds: encounterId } });
    } catch (error) {
      console.error("Error adding encounter to campaign:", error);
      throw error;
    }
  },

  // Unlink an encounter from a campaign (idempotent)
  async removeEncounterFromCampaign(campaignId: string, encounterId: string, dmUserId: string): Promise<void> {
    try {
      const db = await getDatabase();
      await db
        .collection<Campaign>("campaigns")
        .updateOne({ id: campaignId, userId: dmUserId }, { $pull: { encounterIds: encounterId } });
    } catch (error) {
      console.error("Error removing encounter from campaign:", error);
      throw error;
    }
  },

  // Save encounter
  async saveEncounter(encounter: Encounter): Promise<void> { return encounterRepo.saveEncounter(encounter); },

  // Save multiple encounters
  async saveEncounters(encounters: Encounter[]): Promise<void> { return encounterRepo.saveEncounters(encounters); },

  // Save character
  async saveCharacter(character: Character): Promise<void> { return characterRepo.saveCharacter(character); },

  // Save multiple characters
  async saveCharacters(characters: Character[]): Promise<void> { return characterRepo.saveCharacters(characters); },

  // Save combat state
  async saveCombatState(combatState: CombatState | undefined): Promise<void> { return combatStateRepo.saveCombatState(combatState); },

  // Delete encounter
  async deleteEncounter(id: string, userId: string): Promise<void> { return encounterRepo.deleteEncounter(id, userId); },

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
  async deleteCharacter(id: string, userId: string): Promise<void> { return characterRepo.deleteCharacter(id, userId); },

  // Save party
  async saveParty(party: Party): Promise<void> { return partyRepo.saveParty(party); },

  // Save multiple parties
  async saveParties(parties: Party[]): Promise<void> { return partyRepo.saveParties(parties); },

  // Delete party
  async deleteParty(id: string, userId: string): Promise<void> { return partyRepo.deleteParty(id, userId); },

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
    return runStorageOp({ name: "getNextSessionNumber", collection: "sessionLogs" }, async () => {
      const db = await getDatabase();
      const latest = await db
        .collection<SessionLog>("sessionLogs")
        .findOne({ userId, campaignId }, { sort: { sessionNumber: -1 } });
      return latest ? latest.sessionNumber + 1 : 1;
    });
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
      const { datePlayed, campaignId: _ignored, ...restPatch } = patch;
      const updateData: Record<string, unknown> = { updatedAt: new Date() };
      for (const [key, value] of Object.entries(restPatch)) {
        if (value !== undefined) updateData[key] = value;
      }
      if (typeof datePlayed !== 'undefined') {
        updateData.datePlayed = new Date(datePlayed);
      }
      const result = await db
        .collection<SessionLog>("sessionLogs")
        .findOneAndUpdate(
          { id, userId, campaignId },
          { $set: updateData },
          { returnDocument: "after" }
        );
      return result ? normalizeStoredEntityId(result as SessionLog) : null;
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

  savedContent: {
    async list(campaignId: string, userId: string): Promise<SavedContent[]> {
      try {
        const db = await getDatabase();
        const items = await db
          .collection<SavedContent>("savedContent")
          .find({ campaignId, userId })
          .sort({ createdAt: -1 })
          .toArray();
        return items.map(normalizeStoredEntityId);
      } catch (error) {
        console.error("Error listing saved content:", error);
        return [];
      }
    },

    async create(item: Omit<SavedContent, 'id' | '_id' | 'createdAt' | 'updatedAt'>): Promise<SavedContent> {
      try {
        const db = await getDatabase();
        const now = new Date();
        const doc: SavedContent = {
          ...item,
          id: crypto.randomUUID(),
          createdAt: now,
          updatedAt: now,
        };
        const { _id, ...insertData } = doc;
        await db.collection<SavedContent>("savedContent").insertOne(insertData as SavedContent);
        return doc;
      } catch (error) {
        console.error("Error creating saved content:", error);
        throw error;
      }
    },

    async update(id: string, userId: string, patch: Pick<SavedContent, 'result' | 'notes'>): Promise<boolean> {
      try {
        const db = await getDatabase();
        const updateData: Record<string, unknown> = { updatedAt: new Date() };
        if (patch.result !== undefined) updateData.result = patch.result;
        if (patch.notes !== undefined) updateData.notes = patch.notes;
        const result = await db
          .collection<SavedContent>("savedContent")
          .updateOne({ id, userId }, { $set: updateData });
        return result.matchedCount > 0;
      } catch (error) {
        console.error("Error updating saved content:", error);
        throw error;
      }
    },

    async remove(id: string, userId: string): Promise<boolean> {
      try {
        const db = await getDatabase();
        const result = await db
          .collection<SavedContent>("savedContent")
          .deleteOne({ id, userId });
        return result.deletedCount > 0;
      } catch (error) {
        console.error("Error removing saved content:", error);
        throw error;
      }
    },
  },

  async addMember(member: CampaignMember): Promise<void> {
    try {
      const db = await getDatabase();
      const { _id, ...insertData } = member;
      await db
        .collection<CampaignMember>("campaignMembers")
        .insertOne(insertData as CampaignMember);
    } catch (error) {
      if (error && typeof error === "object" && "code" in error && error.code === 11000) {
        throw new DuplicateMemberError(member.campaignId, member.userId);
      }
      console.error("Error adding campaign member:", error);
      throw error;
    }
  },

  async updateMemberStatus(
    campaignId: string,
    userId: string,
    status: MemberStatus,
    actorId: string,
    role?: MemberRole,
  ): Promise<void> {
    try {
      const db = await getDatabase();
      const historyEntry: MemberHistoryEntry = { action: status, by: actorId, at: new Date() };
      const setFields = role !== undefined ? { status, role } : { status };
      await db
        .collection<CampaignMember>("campaignMembers")
        .updateOne(
          { campaignId, userId },
          { $set: setFields, $push: { history: historyEntry } as any },
        );
    } catch (error) {
      console.error("Error updating campaign member status:", error);
      throw error;
    }
  },

  async listMembersForCampaign(campaignId: string): Promise<CampaignMember[]> {
    try {
      const db = await getDatabase();
      const members = await db
        .collection<CampaignMember>("campaignMembers")
        .find({ campaignId })
        .toArray();
      return members.map((m) => {
        const normalized = normalizeStoredEntityId(m);
        const { _id, ...rest } = normalized;
        return rest as CampaignMember;
      });
    } catch (error) {
      console.error("Error listing campaign members:", error);
      return [];
    }
  },

  async getMember(campaignId: string, userId: string): Promise<CampaignMember | null> {
    try {
      const db = await getDatabase();
      const doc = await db
        .collection<CampaignMember>("campaignMembers")
        .findOne({ campaignId, userId });
      if (!doc) return null;
      const normalized = normalizeStoredEntityId(doc);
      const { _id, ...rest } = normalized;
      return rest as CampaignMember;
    } catch (error) {
      console.error("Error getting campaign member:", error);
      throw error;
    }
  },

  async loadCampaignByIdAny(id: string): Promise<Campaign | null> {
    try {
      const db = await getDatabase();
      const campaign = await db
        .collection<Campaign>("campaigns")
        .findOne({ id });
      return campaign ? normalizeCampaign(normalizeStoredEntityId(campaign)) : null;
    } catch (error) {
      console.error("Error loading campaign by ID (any):", error);
      throw error;
    }
  },

  async listCampaignsForMember(userId: string): Promise<CampaignMemberSummary[]> {
    try {
      const db = await getDatabase();
      const memberships = await db
        .collection<{ campaignId: string }>("campaignMembers")
        .find({ userId })
        .toArray();
      if (memberships.length === 0) {
        return [];
      }
      const campaignIds = memberships.map((m) => m.campaignId);
      const campaigns = await db
        .collection<Campaign>("campaigns")
        .find({ id: { $in: campaignIds } }, { projection: { id: 1, name: 1 } })
        .toArray();
      return campaigns.map((c) => ({
        id: c.id,
        name: c.name,
      }));
    } catch (error) {
      console.error("Error listing campaigns for member:", error);
      return [];
    }
  },

  async getUserById(userId: string): Promise<PublicUser | null> {
    if (!ObjectId.isValid(userId)) throw new InvalidUserIdError(userId);
    const db = await getDatabase();
    const doc = await db
      .collection("users")
      .findOne({ _id: { $eq: new ObjectId(userId) } }, { projection: { username: 1 } });
    if (!doc || !doc['username']) return null;
    return { id: userId, username: doc['username'] as string };
  },

  async getUsersByIds(userIds: string[]): Promise<Record<string, string>> {
    if (userIds.length === 0) return {};
    const validObjectIds = userIds
      .filter((id) => ObjectId.isValid(id))
      .map((id) => new ObjectId(id));
    if (validObjectIds.length === 0) return {};
    const db = await getDatabase();
    const docs = await db
      .collection("users")
      .find({ _id: { $in: validObjectIds } }, { projection: { username: 1 } })
      .toArray();
    const result: Record<string, string> = {};
    for (const doc of docs) {
      if (doc['username']) {
        result[doc._id.toString()] = doc['username'] as string;
      }
    }
    return result;
  },

  async listInvitationsForUser(userId: string): Promise<CampaignMember[]> {
    const db = await getDatabase();
    const members = await db
      .collection<CampaignMember>("campaignMembers")
      .find({ userId, status: "invited" })
      .toArray();
    return members.map((m) => {
      const normalized = normalizeStoredEntityId(m);
      const { _id, ...rest } = normalized;
      return rest as CampaignMember;
    });
  },

  async getCampaignsByIds(campaignIds: string[]): Promise<Pick<Campaign, "id" | "name">[]> {
    if (campaignIds.length === 0) return [];
    const db = await getDatabase();
    const docs = await db
      .collection<Campaign>("campaigns")
      .find({ id: { $in: campaignIds } }, { projection: { id: 1, name: 1, _id: 0 } })
      .toArray();
    return docs as Pick<Campaign, "id" | "name">[];
  },

  async addShare(share: CampaignCharacterShare): Promise<void> {
    try {
      const db = await getDatabase();
      const { _id, ...insertData } = share;
      await db
        .collection<CampaignCharacterShare>("campaignCharacterShares")
        .insertOne(insertData as CampaignCharacterShare);
    } catch (error) {
      if (error && typeof error === "object" && "code" in error && error.code === 11000) {
        throw new DuplicateShareError(share.campaignId, share.characterId);
      }
      console.error("Error adding campaign character share:", error);
      throw error;
    }
  },

  async removeShare(campaignId: string, characterId: string, userId: string): Promise<boolean> {
    try {
      const db = await getDatabase();
      const result = await db
        .collection<CampaignCharacterShare>("campaignCharacterShares")
        .deleteOne({ campaignId, characterId, userId });
      return result.deletedCount > 0;
    } catch (error) {
      console.error("Error removing campaign character share:", error);
      throw error;
    }
  },

  async listSharesForCampaign(campaignId: string, userId: string): Promise<CampaignCharacterShare[]> {
    try {
      const db = await getDatabase();
      const shares = await db
        .collection<CampaignCharacterShare>("campaignCharacterShares")
        .find({ campaignId, userId })
        .toArray();
      return shares.map((s) => {
        const normalized = normalizeStoredEntityId(s);
        const { _id, ...rest } = normalized;
        return rest as CampaignCharacterShare;
      });
    } catch (error) {
      console.error("Error listing campaign character shares:", error);
      return [];
    }
  },

  async listAllSharesForCampaign(campaignId: string): Promise<CampaignCharacterShare[]> {
    try {
      const db = await getDatabase();
      const shares = await db
        .collection<CampaignCharacterShare>("campaignCharacterShares")
        .find({ campaignId })
        .toArray();
      return shares.map((s) => {
        const normalized = normalizeStoredEntityId(s);
        const { _id, ...rest } = normalized;
        return rest as CampaignCharacterShare;
      });
    } catch (error) {
      console.error("Error listing all campaign character shares:", error);
      return [];
    }
  },

  async loadPartiesByCampaign(campaignId: string): Promise<Party[]> { return partyRepo.loadPartiesByCampaign(campaignId); },

  async setPartyMemberLeftAt(campaignId: string, characterId: string, timestamp: Date): Promise<void> { return partyRepo.setPartyMemberLeftAt(campaignId, characterId, timestamp); },

  async canAddToCampaignParty(campaignId: string, characterId: string, dmUserId: string): Promise<boolean> { return partyRepo.canAddToCampaignParty(campaignId, characterId, dmUserId); },

  async buildSharedCharacterEntries(campaignId: string): Promise<SharedCharacterEntry[]> { return partyRepo.buildSharedCharacterEntries(campaignId); },

  async loadCharacterById(id: string): Promise<Character | null> { return characterRepo.loadCharacterById(id); },

  async saveCampaignRoll(roll: CampaignRoll): Promise<void> {
    const db = await getDatabase();
    const { _id: _ignored, ...doc } = roll;
    void _ignored;
    await db.collection('campaignRolls').insertOne(doc);
  },

  async listCampaignRolls(
    campaignId: string,
    sessionId: string,
    userId: string,
    role: MemberRole,
    opts: { limit: number; before?: Date }
  ): Promise<{ rolls: CampaignRoll[]; nextCursor?: string }> {
    const db = await getDatabase();
    const query: Record<string, unknown> = {
      campaignId,
      sessionId,
      ...(opts.before ? { createdAt: { $lt: opts.before } } : {}),
      $or: [
        { 'visibility.scope': 'group' },
        { rollerId: userId },
        ...(role === 'dm' ? [{ 'visibility.scope': 'dm-only' }] : []),
      ],
    };

    const docs = await db
      .collection('campaignRolls')
      .find(query)
      .sort({ createdAt: -1 })
      .limit(opts.limit + 1)
      .toArray();

    let nextCursor: string | undefined;
    if (docs.length > opts.limit) {
      docs.pop();
      nextCursor = (docs[docs.length - 1]['createdAt'] as Date).toISOString();
    }

    const rolls = docs.map((doc) => {
      const { _id, ...rest } = doc;
      void _id;
      return rest as unknown as CampaignRoll;
    });

    return { rolls, ...(nextCursor ? { nextCursor } : {}) };
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
        db.collection<SavedContent>("savedContent").deleteMany({ userId }),
        db.collection("campaignMembers").deleteMany({ userId }),
        db.collection("campaignCharacterShares").deleteMany({ userId }),
      ]);
    } catch (error) {
      console.error("Error clearing data:", error);
      throw error;
    }
  },
};
