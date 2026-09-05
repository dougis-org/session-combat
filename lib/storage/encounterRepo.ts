import { storage } from "@/lib/storage";
import { getDatabase } from "@/lib/db";
import { runStorageOp } from "@/lib/storage/runOp";
import { Campaign, Encounter } from "@/lib/types";
import { buildEntityQuery, normalizeStoredEntityId } from "@/lib/storage/helpers";

export async function loadEncounters(userId: string): Promise<Encounter[]> {
  return runStorageOp(
    { name: "loadEncounters", collection: "encounters" },
    async () => {
      const db = await getDatabase();
      const encounters = await db
        .collection<Encounter>("encounters")
        .find({ userId })
        .toArray();
      return encounters.map(normalizeStoredEntityId);
    }
  );
}

export async function saveEncounter(encounter: Encounter): Promise<void> {
  return runStorageOp(
    { name: "saveEncounter", collection: "encounters" },
    async () => {
      const db = await getDatabase();
      const { _id, ...encounterData } = encounter;
      const query = buildEntityQuery(encounter);
      await db
        .collection<Encounter>("encounters")
        .updateOne(query, { $set: encounterData }, { upsert: true });
    }
  );
}

export async function saveEncounters(encounters: Encounter[]): Promise<void> {
  return runStorageOp(
    { name: "saveEncounters", collection: "encounters" },
    async () => {
      for (const encounter of encounters) {
        await storage.saveEncounter(encounter);
      }
    }
  );
}

export async function deleteEncounter(id: string, userId: string): Promise<void> {
  return runStorageOp(
    { name: "deleteEncounter", collection: "encounters" },
    async () => {
      const db = await getDatabase();
      await db.collection<Encounter>("encounters").deleteOne({ id, userId });
    }
  );
}

export async function loadEncountersByIds(ids: string[], ownerUserId: string): Promise<Encounter[]> {
  if (ids.length === 0) return [];
  return runStorageOp(
    { name: "loadEncountersByIds", collection: "encounters", isEmpty: (r) => r.length === 0 },
    async () => {
      const db = await getDatabase();
      const encounters = await db
        .collection<Encounter>("encounters")
        .find({ id: { $in: ids }, userId: ownerUserId })
        .toArray();
      return encounters.map(normalizeStoredEntityId);
    }
  );
}

// Link/unlink an encounter to a campaign. These two touch the `campaigns`
// collection rather than `encounters`, but live here because they're
// encounter-domain (attach/detach) operations, not campaign-lifecycle CRUD
// (see design.md Decision 2).

export async function addEncounterToCampaign(campaignId: string, encounterId: string, dmUserId: string): Promise<void> {
  return runStorageOp(
    { name: "addEncounterToCampaign", collection: "campaigns" },
    async () => {
      const db = await getDatabase();
      await db
        .collection<Campaign>("campaigns")
        .updateOne({ id: campaignId, userId: dmUserId }, { $addToSet: { encounterIds: encounterId } });
    }
  );
}

export async function removeEncounterFromCampaign(campaignId: string, encounterId: string, dmUserId: string): Promise<void> {
  return runStorageOp(
    { name: "removeEncounterFromCampaign", collection: "campaigns" },
    async () => {
      const db = await getDatabase();
      await db
        .collection<Campaign>("campaigns")
        .updateOne({ id: campaignId, userId: dmUserId }, { $pull: { encounterIds: encounterId } });
    }
  );
}
