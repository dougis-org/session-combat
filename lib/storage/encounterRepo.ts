import { storage } from "@/lib/storage";
import { getDatabase } from "@/lib/db";
import { runStorageOp } from "@/lib/storage/runOp";
import { Encounter } from "@/lib/types";
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
