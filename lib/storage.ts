// MongoDB persistence utilities
import { getDatabase } from "./db";
import {
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
  PublicUser,
  SharedCharacterEntry,
} from "./types";
import { runStorageOp } from "@/lib/storage/runOp";

import { normalizeStoredEntityId } from "./storage/helpers";
import {
  getUserPreferences as getUserPreferencesRepo,
  updateUserPreferences as updateUserPreferencesRepo,
} from "./storage/userPreferencesRepo";

/**
 * Server-side storage functions for MongoDB
 * Note: Use API routes for client-side data fetching
 */

import * as encounterRepo from "./storage/encounterRepo";
import * as characterRepo from "./storage/characterRepo";
import * as combatStateRepo from "./storage/combatStateRepo";
import * as partyRepo from "./storage/partyRepo";
import * as monsterTemplateRepo from "./storage/monsterTemplateRepo";
import * as campaignTemplateRepo from "./storage/campaignTemplateRepo";
import * as campaignRepo from "./storage/campaignRepo";
import * as membershipRepo from "./storage/membershipRepo";
import * as sessionLogRepo from "./storage/sessionLogRepo";
import * as shareRepo from "./storage/shareRepo";
import * as spellRepo from "./storage/spellRepo";
import * as rollRepo from "./storage/rollRepo";
import * as storageMisc from "./storage/storageMisc";

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
  async loadMonsterTemplates(userId: string): Promise<MonsterTemplate[]> { return monsterTemplateRepo.loadMonsterTemplates(userId); },

  // Load global monster templates (admin-controlled)
  async loadGlobalMonsterTemplates(): Promise<MonsterTemplate[]> { return monsterTemplateRepo.loadGlobalMonsterTemplates(); },

  // Load all monster templates (user + global)
  async loadAllMonsterTemplates(userId: string): Promise<MonsterTemplate[]> { return monsterTemplateRepo.loadAllMonsterTemplates(userId); },

  // Load global campaign templates (admin-controlled)
  async loadGlobalCampaignTemplates(): Promise<CampaignTemplate[]> { return campaignTemplateRepo.loadGlobalCampaignTemplates(); },

  // Load a single global campaign template by id
  async loadGlobalCampaignTemplateById(id: string): Promise<CampaignTemplate | null> { return campaignTemplateRepo.loadGlobalCampaignTemplateById(id); },

  // Save campaign template (upsert)
  async saveCampaignTemplate(template: CampaignTemplate): Promise<void> { return campaignTemplateRepo.saveCampaignTemplate(template); },

  // Delete campaign template — returns true if deleted, false if not found
  async deleteCampaignTemplate(id: string): Promise<boolean> { return campaignTemplateRepo.deleteCampaignTemplate(id); },

  // Load campaigns for a user
  async loadCampaigns(userId: string): Promise<Campaign[]> { return campaignRepo.loadCampaigns(userId); },

  // Load single campaign by ID
  async loadCampaignById(id: string, userId: string): Promise<Campaign | null> { return campaignRepo.loadCampaignById(id, userId); },

  // Save campaign (upsert)
  async saveCampaign(campaign: Campaign): Promise<void> { return campaignRepo.saveCampaign(campaign); },

  async addPartyToCampaign(campaignId: string, partyId: string): Promise<void> {
    return runStorageOp({ name: "addPartyToCampaign", collection: "campaigns" }, async () => {
      const db = await getDatabase();
      const campaign = await db.collection("campaigns").findOne({ id: campaignId });
      if (campaign && campaign.partyIds === undefined) {
        const legacyParties = await db.collection("parties").find({ campaignId } as any).toArray();
        const migratedIds = legacyParties.map((p: any) => p.id);
        migratedIds.push(partyId);
        await db.collection("campaigns").updateOne(
          { id: campaignId },
          { $set: { partyIds: migratedIds } }
        );
      } else {
        await db.collection("campaigns").updateOne(
          { id: campaignId },
          { $addToSet: { partyIds: partyId } }
        );
      }
    });
  },

  async removePartyFromCampaign(campaignId: string, partyId: string): Promise<void> {
    return runStorageOp({ name: "removePartyFromCampaign", collection: "campaigns" }, async () => {
      const db = await getDatabase();
      const campaign = await db.collection("campaigns").findOne({ id: campaignId });
      if (campaign && campaign.partyIds === undefined) {
        const legacyParties = await db.collection("parties").find({ campaignId } as any).toArray();
        const migratedIds = legacyParties.map((p: any) => p.id).filter((id: string) => id !== partyId);
        await db.collection("campaigns").updateOne(
          { id: campaignId },
          { $set: { partyIds: migratedIds } }
        );
      } else {
        await db.collection("campaigns").updateOne(
          { id: campaignId },
          { $pull: { partyIds: partyId } as any }
        );
      }
    });
  },

  async removePartyFromAllCampaigns(partyId: string): Promise<void> {
    return runStorageOp({ name: "removePartyFromAllCampaigns", collection: "campaigns" }, async () => {
      const db = await getDatabase();
      await db.collection("campaigns").updateMany(
        { partyIds: partyId },
        { $pull: { partyIds: partyId } as any }
      );
    });
  },

  // Delete campaign
  async deleteCampaign(id: string, userId: string): Promise<void> { return campaignRepo.deleteCampaign(id, userId); },

  async setActiveCampaignSession(campaignId: string, userId: string, sessionId: string | null): Promise<void> { return campaignRepo.setActiveCampaignSession(campaignId, userId, sessionId); },

  async claimActiveCampaignSession(campaignId: string, userId: string, sessionId: string): Promise<boolean> { return campaignRepo.claimActiveCampaignSession(campaignId, userId, sessionId); },

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
  async saveMonsterTemplate(template: MonsterTemplate): Promise<void> { return monsterTemplateRepo.saveMonsterTemplate(template); },

  // Delete monster template
  async deleteMonsterTemplate(id: string, userId: string): Promise<void> { return monsterTemplateRepo.deleteMonsterTemplate(id, userId); },

  // Bulk-insert monster templates (single insertMany)
  async saveManyMonsterTemplates(templates: MonsterTemplate[]): Promise<void> { return monsterTemplateRepo.saveManyMonsterTemplates(templates); },

  // Compensating delete for a bulk import, scoped to a userId
  async deleteMonsterTemplatesByIds(ids: string[], userId: string): Promise<void> { return monsterTemplateRepo.deleteMonsterTemplatesByIds(ids, userId); },

  // Duplicate detection: which name|source keys already exist for a userId
  async findExistingMonsterKeys(keys: { name: string; source: string }[], userId: string): Promise<Set<string>> { return monsterTemplateRepo.findExistingMonsterKeys(keys, userId); },

  // Load spells - load all global spells if no userId, or load user spells
  async loadSpells(userId?: string, concentration?: boolean): Promise<SpellTemplate[]> { return spellRepo.loadSpells(userId, concentration); },

  // Load single spell by ID
  async loadSpellById(id: string): Promise<SpellTemplate | null> { return spellRepo.loadSpellById(id); },

  // Save spell template (upsert)
  async saveSpellTemplate(spell: SpellTemplate): Promise<void> { return spellRepo.saveSpellTemplate(spell); },

  // Delete spell template
  async deleteSpellTemplate(id: string): Promise<void> { return spellRepo.deleteSpellTemplate(id); },

  // Check if spell exists by name and source (for dedupe)
  async spellExistsByNameAndSource(name: string, source: string): Promise<boolean> { return spellRepo.spellExistsByNameAndSource(name, source); },

  // Check if monster exists by name and source (for dedupe)
  async monsterExistsByNameAndSource(name: string, source: string): Promise<boolean> { return monsterTemplateRepo.monsterExistsByNameAndSource(name, source); },

  async findMonsterByNameAndSource(name: string, source: string): Promise<MonsterTemplate | null> { return monsterTemplateRepo.findMonsterByNameAndSource(name, source); },

  // Load session logs for a campaign, sorted by sessionNumber descending
  async loadSessionLogs(userId: string, campaignId: string): Promise<SessionLog[]> { return sessionLogRepo.loadSessionLogs(userId, campaignId); },

  // Get the next session number (MAX + 1, or 1 if none exist)
  async getNextSessionNumber(userId: string, campaignId: string): Promise<number> { return sessionLogRepo.getNextSessionNumber(userId, campaignId); },

  // Save a new session log (insert)
  async saveSessionLog(log: SessionLog): Promise<void> { return sessionLogRepo.saveSessionLog(log); },

  // Update an existing session log (partial update)
  async updateSessionLog(
    id: string,
    userId: string,
    campaignId: string,
    patch: Partial<SessionLogInput>
  ): Promise<SessionLog | null> { return sessionLogRepo.updateSessionLog(id, userId, campaignId, patch); },

  // Delete a session log
  async deleteSessionLog(id: string, userId: string, campaignId: string): Promise<boolean> { return sessionLogRepo.deleteSessionLog(id, userId, campaignId); },

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

  async addMember(member: CampaignMember): Promise<void> { return membershipRepo.addMember(member); },

  async updateMemberStatus(
    campaignId: string,
    userId: string,
    status: MemberStatus,
    actorId: string,
    role?: MemberRole,
  ): Promise<void> { return membershipRepo.updateMemberStatus(campaignId, userId, status, actorId, role); },

  async listMembersForCampaign(campaignId: string): Promise<CampaignMember[]> { return membershipRepo.listMembersForCampaign(campaignId); },

  async getMember(campaignId: string, userId: string): Promise<CampaignMember | null> { return membershipRepo.getMember(campaignId, userId); },

  async loadCampaignByIdAny(id: string): Promise<Campaign | null> { return campaignRepo.loadCampaignByIdAny(id); },

  async listCampaignsForMember(userId: string): Promise<CampaignMemberSummary[]> { return campaignRepo.listCampaignsForMember(userId); },

  async getUserById(userId: string): Promise<PublicUser | null> { return membershipRepo.getUserById(userId); },

  async getUsersByIds(userIds: string[]): Promise<Record<string, string>> { return membershipRepo.getUsersByIds(userIds); },

  async listInvitationsForUser(userId: string): Promise<CampaignMember[]> { return membershipRepo.listInvitationsForUser(userId); },

  async getCampaignsByIds(campaignIds: string[]): Promise<Pick<Campaign, "id" | "name">[]> { return campaignRepo.getCampaignsByIds(campaignIds); },

  async addShare(share: CampaignCharacterShare): Promise<void> { return shareRepo.addShare(share); },

  async removeShare(campaignId: string, characterId: string, userId: string): Promise<boolean> { return shareRepo.removeShare(campaignId, characterId, userId); },

  async listSharesForCampaign(campaignId: string, userId: string): Promise<CampaignCharacterShare[]> { return shareRepo.listSharesForCampaign(campaignId, userId); },

  async listAllSharesForCampaign(campaignId: string): Promise<CampaignCharacterShare[]> { return shareRepo.listAllSharesForCampaign(campaignId); },

  async loadPartiesByCampaign(campaignId: string): Promise<Party[]> { return partyRepo.loadPartiesByCampaign(campaignId); },

  async setPartyMemberLeftAt(campaignId: string, characterId: string, timestamp: Date): Promise<void> { return partyRepo.setPartyMemberLeftAt(campaignId, characterId, timestamp); },

  async canAddToCampaignParty(campaignId: string, characterId: string, dmUserId: string): Promise<boolean> { return partyRepo.canAddToCampaignParty(campaignId, characterId, dmUserId); },

  async buildSharedCharacterEntries(campaignId: string): Promise<SharedCharacterEntry[]> { return partyRepo.buildSharedCharacterEntries(campaignId); },

  async loadCharacterById(id: string): Promise<Character | null> { return characterRepo.loadCharacterById(id); },

  async saveCampaignRoll(roll: CampaignRoll): Promise<void> { return rollRepo.saveCampaignRoll(roll); },

  async listCampaignRolls(
    campaignId: string,
    sessionId: string,
    userId: string,
    role: MemberRole,
    opts: { limit: number; before?: Date }
  ): Promise<{ rolls: CampaignRoll[]; nextCursor?: string }> { return rollRepo.listCampaignRolls(campaignId, sessionId, userId, role, opts); },

  getUserPreferences: getUserPreferencesRepo,
  updateUserPreferences: updateUserPreferencesRepo,

  // Clear all data for a user
  async clear(userId: string): Promise<void> { return storageMisc.clear(userId); },
};
