import { getDatabase } from "@/lib/db";
import { runStorageOp } from "@/lib/storage/runOp";
import { Party, PartyMember, SharedCharacterEntry, CampaignCharacterShare } from "@/lib/types";
import { buildEntityQuery, normalizeStoredEntityId } from "@/lib/storage/helpers";
import { loadCharacterById } from "./characterRepo";
import { storage } from "@/lib/storage";
import { Filter } from "mongodb";

type LegacyPartyDoc = Omit<Party, 'members'> & { members?: PartyMember[]; characterIds?: string[] };

function migrateParty(party: LegacyPartyDoc): Party {
  if (Array.isArray(party.members)) {
    return party as Party;
  }
  const legacyIds: string[] = Array.isArray(party.characterIds) ? party.characterIds : [];
  const addedAt = party.createdAt ?? new Date(0);
  const { characterIds: _discarded, ...rest } = party;
  return {
    ...rest,
    members: legacyIds.map(characterId => ({ characterId, addedAt })),
  } as Party;
}

export async function loadParties(userId: string): Promise<Party[]> {
  return runStorageOp(
    { name: "loadParties", collection: "parties", isEmpty: (res) => res.length === 0 },
    async () => {
      const db = await getDatabase();
      const parties = await db
        .collection<LegacyPartyDoc>("parties")
        .find({ userId })
        .toArray();
      return parties.map(normalizeStoredEntityId).map(migrateParty);
    }
  );
}

export async function saveParty(party: Party): Promise<void> {
  return runStorageOp(
    { name: "saveParty", collection: "parties" },
    async () => {
      const db = await getDatabase();
      const { _id, ...partyData } = party;
      await db
        .collection<Party>("parties")
        .updateOne(
          { id: party.id, userId: party.userId },
          { $set: partyData },
          { upsert: true }
        );
    }
  );
}

export async function saveParties(parties: Party[]): Promise<void> {
  return runStorageOp(
    { name: "saveParties", collection: "parties" },
    async () => {
      for (const party of parties) {
        await storage.saveParty(party);
      }
    }
  );
}

export async function deleteParty(id: string, userId: string): Promise<void> {
  return runStorageOp(
    { name: "deleteParty", collection: "parties" },
    async () => {
      const db = await getDatabase();
      await db.collection<Party>("parties").deleteOne({ id, userId });
    }
  );
}

export async function loadPartiesByCampaign(campaignId: string): Promise<Party[]> {
  const start = Date.now();
  return runStorageOp(
    { name: "loadPartiesByCampaign", collection: "parties", isEmpty: (res) => res.length === 0 },
    async () => {
      const db = await getDatabase();
      
      const campaign = await db.collection("campaigns").findOne({ id: campaignId });
      let parties: LegacyPartyDoc[] = [];

      if (campaign && campaign.partyIds !== undefined) {
        if (campaign.partyIds.length > 0) {
          parties = await db
            .collection<LegacyPartyDoc>("parties")
            .find({ id: { $in: campaign.partyIds } })
            .toArray();
        }
      } else {
        parties = await db
          .collection<LegacyPartyDoc>("parties")
          .find({ campaignId } as unknown as Filter<LegacyPartyDoc>)
          .toArray();
          
        if (campaign) {
          const migratedPartyIds = parties.map(p => p.id);
          await db.collection("campaigns").updateOne(
            { id: campaignId },
            { $set: { partyIds: migratedPartyIds } }
          );
        }
      }

      const duration = Date.now() - start;
      if (duration > 10) {
        console.log(`[perf] loadPartiesByCampaign ${campaignId}: ${duration}ms`);
      }
      return parties.map(normalizeStoredEntityId).map(migrateParty);
    }
  );
}

export async function setPartyMemberLeftAt(campaignId: string, characterId: string, timestamp: Date): Promise<void> {
  return runStorageOp(
    { name: "setPartyMemberLeftAt", collection: "parties" },
    async () => {
      const parties = await storage.loadPartiesByCampaign(campaignId);
      for (const party of parties) {
        let modified = false;
        const updatedMembers = party.members.map((m) => {
          if (m.characterId === characterId && !m.leftAt) {
            modified = true;
            return { ...m, leftAt: timestamp };
          }
          return m;
        });
        if (modified) {
          try {
            await storage.saveParty({ ...party, members: updatedMembers });
          } catch (error) {
            console.error(`Error saving party ${party.id} during setPartyMemberLeftAt:`, error);
          }
        }
      }
    }
  );
}

export async function canAddToCampaignParty(campaignId: string, characterId: string, dmUserId: string): Promise<boolean> {
  return runStorageOp(
    { name: "canAddToCampaignParty", collection: "campaignCharacterShares" },
    async () => {
      const character = await storage.loadCharacterById(characterId);
      if (!character) return false;
      if (character.userId === dmUserId) return true;

      const db = await getDatabase();
      const share = await db
        .collection<CampaignCharacterShare>("campaignCharacterShares")
        .findOne({ campaignId, characterId });
      if (!share) return false;

      const member = await storage.getMember(campaignId, share.userId);
      return member?.status === 'active';
    }
  );
}

export async function buildSharedCharacterEntries(campaignId: string): Promise<SharedCharacterEntry[]> {
  return runStorageOp(
    { name: "buildSharedCharacterEntries", collection: "campaignCharacterShares" },
    async () => {
      const shares = await storage.listAllSharesForCampaign(campaignId);
      const results = await Promise.all(
        shares.map(async (share) => {
          const [member, character] = await Promise.all([
            storage.getMember(campaignId, share.userId),
            loadCharacterById(share.characterId),
          ]);
          if (!member || member.status !== 'active') return null;
          if (!character || character.deletedAt) return null;
          return { share, character };
        })
      );
      return results.filter((e): e is SharedCharacterEntry => e !== null);
    }
  );
}
