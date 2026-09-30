/* eslint-disable complexity */
import { getDatabase } from "@/lib/db";
import { runStorageOp } from "@/lib/storage/runOp";
import { Party, PartyMember, SharedCharacterEntry, CampaignCharacterShare } from "@/lib/types";
import { normalizeStoredEntityId } from "@/lib/storage/helpers";
import { loadCharacterById } from "./characterRepo";
import { getMember } from "./membershipRepo";
import { PartyCampaignAuthorizationError } from "./errors";
import { CampaignIdInput } from "@/lib/validation/core";
import { storage } from "@/lib/storage";
import { Filter } from "mongodb";

export async function isActiveDm(campaignId: string, callerId: string): Promise<boolean> {
  const member = await getMember(campaignId, callerId);
  return !!member && member.role === 'dm' && member.status === 'active';
}

async function assertActiveDm(campaignId: string, callerId: string): Promise<void> {
  if (!(await isActiveDm(campaignId, callerId))) {
    throw new PartyCampaignAuthorizationError(campaignId, callerId);
  }
}

type LegacyPartyDoc = Omit<Party, 'members'> & { members?: PartyMember[]; characterIds?: string[] };
type CampaignPartyDoc = { id: string; partyIds?: string[] };

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
      const { _id, campaignId, ...rest } = party;
      // A plain `$set` never removes a field the caller's in-memory object
      // no longer has (e.g. after `delete party.campaignId`) — Mongo simply
      // leaves the previously-stored value in place. When campaignId is
      // absent, explicitly $unset it so the deprecated field is actually
      // cleared rather than merely omitted from this write.
      const update = campaignId !== undefined
        ? { $set: { ...rest, campaignId } }
        : { $set: rest, $unset: { campaignId: "" as const } };
      await db
        .collection<Party>("parties")
        .updateOne(
          { id: party.id, userId: party.userId },
          update,
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
    const campaign = await db.collection<CampaignPartyDoc>("campaigns").findOne({ id: campaignId });
    if (campaign && campaign.partyIds === undefined) {
      const legacyParties = await db
        .collection<LegacyPartyDoc>("parties")
        .find({ campaignId } as unknown as Filter<LegacyPartyDoc>)
        .toArray();
      const migratedIds = legacyParties.map((p) => p.id);
      migratedIds.push(partyId);
      await db.collection<CampaignPartyDoc>("campaigns").updateOne(
        { id: campaignId },
        { $set: { partyIds: migratedIds } }
      );
    } else {
      await db.collection<CampaignPartyDoc>("campaigns").updateOne(
        { id: campaignId },
        { $addToSet: { partyIds: partyId } }
      );
    }
  });
}

export async function removePartyFromCampaign(campaignId: string, partyId: string, callerId: string): Promise<void> {
  return runStorageOp({
    name: "removePartyFromCampaign",
    collection: "campaigns",
    rethrowAsIs: (error) => error instanceof PartyCampaignAuthorizationError,
  }, async () => {
    await assertActiveDm(campaignId, callerId);
    const db = await getDatabase();
    const campaign = await db.collection<CampaignPartyDoc>("campaigns").findOne({ id: campaignId });
    if (campaign && campaign.partyIds === undefined) {
      const legacyParties = await db
        .collection<LegacyPartyDoc>("parties")
        .find({ campaignId } as unknown as Filter<LegacyPartyDoc>)
        .toArray();
      const migratedIds = legacyParties.map((p) => p.id).filter((id: string) => id !== partyId);
      await db.collection<CampaignPartyDoc>("campaigns").updateOne(
        { id: campaignId },
        { $set: { partyIds: migratedIds } }
      );
    } else {
      await db.collection<CampaignPartyDoc>("campaigns").updateOne(
        { id: campaignId },
        { $pull: { partyIds: partyId } }
      );
    }
  });
}

async function legacyCampaignStillLinked(campaignId: string, partyId: string): Promise<boolean> {
  const db = await getDatabase();
  const campaign = await db.collection<CampaignPartyDoc>("campaigns").findOne({ id: campaignId });
  if (!campaign) {
    // The campaign no longer exists; the legacy pointer is stale and must
    // not be treated as a real link (it would otherwise permanently 403
    // every future reassignment for this party).
    return false;
  }
  if (campaign.partyIds === undefined) {
    // Not yet migrated to the live partyIds array — the legacy field is
    // still the authoritative pointer.
    return true;
  }
  // Already migrated: only count it if the party is actually still there.
  return campaign.partyIds.includes(partyId);
}

async function findLinkedCampaignIds(partyId: string, legacyCampaignId: string | undefined): Promise<string[]> {
  const db = await getDatabase();
  const linked = await db
    .collection<CampaignPartyDoc>("campaigns")
    .find({ partyIds: partyId })
    .toArray();
  const ids = new Set<string>(linked.map((c) => c.id));
  // The deprecated Party.campaignId field is the only pointer into
  // legacy campaigns whose partyIds array hasn't been migrated yet, so it
  // must be included as a candidate alongside the live partyIds lookup —
  // but only if it still points at a real, live link.
  if (legacyCampaignId && !ids.has(legacyCampaignId) && (await legacyCampaignStillLinked(legacyCampaignId, partyId))) {
    ids.add(legacyCampaignId);
  }
  return Array.from(ids);
}

/**
 * Resolves every campaign a party is actually linked to right now, live —
 * never trust the deprecated Party.campaignId field directly, since it is
 * deleted on every successful reassignment once a party has migrated to
 * campaign.partyIds. Callers that need "what campaign(s) is this party in
 * today" (e.g. to decide whether a campaign move is happening, or which
 * campaign's sharing rules apply) must use this instead of reading
 * party.campaignId off a loaded Party.
 *
 * Returns an array, not a single id: although a party is normally linked to
 * at most one campaign, nothing prevents more than one from referencing the
 * same partyId (e.g. a not-yet-cleaned-up stray link), and callers must
 * authorize/validate against every one of them, not just the first.
 */
export async function getLinkedCampaignIds(partyId: string, legacyCampaignId: string | undefined): Promise<string[]> {
  return findLinkedCampaignIds(partyId, legacyCampaignId);
}

export async function reassignPartyCampaign(
  updatedParty: Party,
  campaignIdInput: CampaignIdInput,
  existingCampaignId: string | undefined,
  callerId: string
): Promise<void> {
  return runStorageOp({
    name: "reassignPartyCampaign",
    collection: "campaigns",
    rethrowAsIs: (error) => error instanceof PartyCampaignAuthorizationError,
  }, async () => {
    if (campaignIdInput.kind === 'omit') return;
    if (campaignIdInput.kind === 'invalid') {
      // Defensive only: every caller validates the raw request body with
      // parseCampaignIdInput before this point, so 'invalid' should never
      // actually reach here.
      throw new Error('Invalid campaignId: expected a string or undefined');
    }

    const linkedCampaignIds = await findLinkedCampaignIds(updatedParty.id, existingCampaignId);

    // Authorize every campaign this party is actually linked to before
    // removing it from any of them — never trust a single caller-supplied
    // "existing" campaign id, and never remove from a campaign the caller
    // hasn't been verified as an active DM of.
    for (const linkedId of linkedCampaignIds) {
      await assertActiveDm(linkedId, callerId);
    }
    const removedFrom: string[] = [];
    try {
      for (const linkedId of linkedCampaignIds) {
        await removePartyFromCampaign(linkedId, updatedParty.id, callerId);
        removedFrom.push(linkedId);
      }
    } catch (err) {
      await Promise.all(
        removedFrom.map(cid => addPartyToCampaign(cid, updatedParty.id, callerId).catch((rollbackErr) => {
          console.error(`[reassignPartyCampaign] rollback failed: could not restore party ${updatedParty.id} to campaign ${cid} after a removal error:`, rollbackErr);
        }))
      );
      throw err;
    }

    if (campaignIdInput.value) {
      try {
        await addPartyToCampaign(campaignIdInput.value, updatedParty.id, callerId);
      } catch (err) {
        for (const linkedId of linkedCampaignIds) {
          await addPartyToCampaign(linkedId, updatedParty.id, callerId).catch((rollbackErr) => {
            console.error(`[reassignPartyCampaign] rollback failed: could not restore party ${updatedParty.id} to campaign ${linkedId} after a failed link to ${campaignIdInput.value}:`, rollbackErr);
          });
        }
        throw err;
      }
    }

    // Ensure field stays decoupled
    delete updatedParty.campaignId;
  });
}

// Deliberately not DM-gated: this is a bulk, party-scoped cleanup operation
// (invoked after a party itself is deleted, see DELETE /api/parties/[id])
// that isn't tied to any single campaign a caller could be authorized
// against. Any caller MUST perform its own authorization (e.g. verify the
// requesting user owns the party) before invoking this — it does not check
// on its own.
export async function removePartyFromAllCampaigns(partyId: string): Promise<void> {
  return runStorageOp({ name: "removePartyFromAllCampaigns", collection: "campaigns" }, async () => {
    const db = await getDatabase();
    await db.collection<CampaignPartyDoc>("campaigns").updateMany(
      { partyIds: partyId },
      { $pull: { partyIds: partyId } }
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
