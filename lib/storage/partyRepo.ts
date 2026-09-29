import { getDatabase } from "@/lib/db";
import { runStorageOp } from "@/lib/storage/runOp";
import { Party, PartyMember, SharedCharacterEntry, CampaignCharacterShare } from "@/lib/types";
import { buildEntityQuery, normalizeStoredEntityId } from "@/lib/storage/helpers";
import { loadCharacterById } from "./characterRepo";
import { getMember } from "./membershipRepo";
import { PartyCampaignAuthorizationError } from "./errors";
import { parseCampaignIdInput } from "@/lib/validation/core";
import { storage } from "@/lib/storage";
import { Filter } from "mongodb";

async function assertActiveDm(campaignId: string, callerId: string): Promise<void> {
  const member = await getMember(campaignId, callerId);
  if (!member || member.role !== 'dm' || member.status !== 'active') {
    throw new PartyCampaignAuthorizationError(campaignId, callerId);
  }
}

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
          try {
            const migratedPartyIds = parties.map(p => p.id);
            await db.collection("campaigns").updateOne(
              { id: campaignId },
              { $set: { partyIds: migratedPartyIds } }
            );
          } catch (e) {
            console.warn(`[migration] Failed to save migrated partyIds for campaign ${campaignId}:`, e);
          }
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

      const member = await getMember(campaignId, share.userId);
      return member?.status === 'active';
    }
  );
}

export async function addPartyToCampaign(campaignId: string, partyId: string, callerId: string): Promise<void> {
  return runStorageOp({
    name: "addPartyToCampaign",
    collection: "campaigns",
    rethrowAsIs: (error) => error instanceof PartyCampaignAuthorizationError,
  }, async () => {
    await assertActiveDm(campaignId, callerId);
    const db = await getDatabase();
    const campaign = await db.collection("campaigns").findOne({ id: campaignId });
    if (campaign && campaign.partyIds === undefined) {
      const legacyParties = await db
        .collection<LegacyPartyDoc>("parties")
        .find({ campaignId } as unknown as Filter<LegacyPartyDoc>)
        .toArray();
      const migratedIds = legacyParties.map((p) => p.id);
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
}

export async function removePartyFromCampaign(campaignId: string, partyId: string): Promise<void> {
  return runStorageOp({ name: "removePartyFromCampaign", collection: "campaigns" }, async () => {
    const db = await getDatabase();
    const campaign = await db.collection("campaigns").findOne({ id: campaignId });
    if (campaign && campaign.partyIds === undefined) {
      const legacyParties = await db
        .collection<LegacyPartyDoc>("parties")
        .find({ campaignId } as unknown as Filter<LegacyPartyDoc>)
        .toArray();
      const migratedIds = legacyParties.map((p) => p.id).filter((id: string) => id !== partyId);
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
}

export async function reassignPartyCampaign(
  updatedParty: Party,
  campaignId: unknown,
  existingCampaignId: string | undefined,
  callerId: string
): Promise<void> {
  return runStorageOp({
    name: "reassignPartyCampaign",
    collection: "campaigns",
    rethrowAsIs: (error) => error instanceof PartyCampaignAuthorizationError,
  }, async () => {
    const parsed = parseCampaignIdInput(campaignId);
    if (parsed.kind === 'omit') return;
    if (parsed.kind === 'invalid') {
      throw new Error('Invalid campaignId: expected a string or undefined');
    }

    if (existingCampaignId) {
      await assertActiveDm(existingCampaignId, callerId);
      // Remove only from the campaign we just authorized — never a blanket
      // removal, which could silently strip links from campaigns the caller
      // has no authority over.
      await removePartyFromCampaign(existingCampaignId, updatedParty.id);
    }

    if (parsed.value) {
      try {
        await addPartyToCampaign(parsed.value, updatedParty.id, callerId);
      } catch (err) {
        if (existingCampaignId) {
          await addPartyToCampaign(existingCampaignId, updatedParty.id, callerId).catch(() => {});
        }
        throw err;
      }
    }

    // Ensure field stays decoupled
    delete updatedParty.campaignId;
  });
}

export async function removePartyFromAllCampaigns(partyId: string): Promise<void> {
  return runStorageOp({ name: "removePartyFromAllCampaigns", collection: "campaigns" }, async () => {
    const db = await getDatabase();
    await db.collection("campaigns").updateMany(
      { partyIds: partyId },
      { $pull: { partyIds: partyId } as any }
    );
  });
}

export async function buildSharedCharacterEntries(campaignId: string): Promise<SharedCharacterEntry[]> {
  return runStorageOp(
    { name: "buildSharedCharacterEntries", collection: "campaignCharacterShares" },
    async () => {
      const shares = await storage.listAllSharesForCampaign(campaignId);
      const results = await Promise.all(
        shares.map(async (share) => {
          const [member, character] = await Promise.all([
            getMember(campaignId, share.userId),
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
