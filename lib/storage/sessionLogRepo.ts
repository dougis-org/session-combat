import { getDatabase } from "@/lib/db";
import { runStorageOp } from "@/lib/storage/runOp";
import { SessionLog, SessionLogInput } from "@/lib/types";
import { normalizeStoredEntityId } from "@/lib/storage/helpers";

/**
 * The only `SessionLogInput` fields a PATCH may mutate. `campaignId` is
 * immutable and `datePlayed` is coerced to a `Date` separately, so neither
 * appears here. Anything outside this list is dropped rather than spread into
 * the Mongo `$set` (no mass assignment from an untrusted patch body).
 */
const MUTABLE_SESSION_LOG_FIELDS = [
  "sessionNumber",
  "title",
  "summary",
  "events",
  "milestone",
  "newLevel",
] as const satisfies readonly (keyof SessionLogInput)[];

/**
 * Session-log storage (#504). Every DB operation runs inside one
 * `runStorageOp` call: a driver failure now rejects with `StorageError`
 * (previously `loadSessionLogs` swallowed to `[]` and `getNextSessionNumber`
 * to `1`). Genuine not-found paths stay non-throwing — an empty list, a
 * `findOneAndUpdate` that matched nothing (`null`), and a `deleteOne` that
 * removed nothing (`false`).
 */

const COLLECTION = "sessionLogs";

export async function loadSessionLogs(userId: string, campaignId: string): Promise<SessionLog[]> {
  return runStorageOp(
    { name: "loadSessionLogs", collection: COLLECTION, isEmpty: (r) => r.length === 0 },
    async () => {
      const db = await getDatabase();
      const logs = await db
        .collection<SessionLog>(COLLECTION)
        .find({ userId, campaignId })
        .sort({ sessionNumber: -1 })
        .toArray();
      return logs.map(normalizeStoredEntityId);
    },
  );
}

export async function getNextSessionNumber(userId: string, campaignId: string): Promise<number> {
  return runStorageOp({ name: "getNextSessionNumber", collection: COLLECTION }, async () => {
    const db = await getDatabase();
    const latest = await db
      .collection<SessionLog>(COLLECTION)
      .findOne({ userId, campaignId }, { sort: { sessionNumber: -1 } });
    return latest ? latest.sessionNumber + 1 : 1;
  });
}

export async function saveSessionLog(log: SessionLog): Promise<void> {
  return runStorageOp({ name: "saveSessionLog", collection: COLLECTION }, async () => {
    const db = await getDatabase();
    const { _id, ...logData } = log;
    await db.collection<SessionLog>(COLLECTION).insertOne(logData as SessionLog);
  });
}

export async function updateSessionLog(
  id: string,
  userId: string,
  campaignId: string,
  patch: Partial<SessionLogInput>,
): Promise<SessionLog | null> {
  return runStorageOp(
    { name: "updateSessionLog", collection: COLLECTION },
    async () => {
      const db = await getDatabase();
      const updateData: Record<string, unknown> = { updatedAt: new Date() };
      for (const key of MUTABLE_SESSION_LOG_FIELDS) {
        const value = patch[key];
        if (value !== undefined) updateData[key] = value;
      }
      if (typeof patch.datePlayed !== "undefined") {
        updateData.datePlayed = new Date(patch.datePlayed);
      }
      const result = await db
        .collection<SessionLog>(COLLECTION)
        .findOneAndUpdate(
          { id, userId, campaignId },
          { $set: updateData },
          { returnDocument: "after" },
        );
      return result ? normalizeStoredEntityId(result as SessionLog) : null;
    },
  );
}

export async function deleteSessionLog(id: string, userId: string, campaignId: string): Promise<boolean> {
  return runStorageOp(
    { name: "deleteSessionLog", collection: COLLECTION },
    async () => {
      const db = await getDatabase();
      const result = await db
        .collection<SessionLog>(COLLECTION)
        .deleteOne({ id, userId, campaignId });
      return result.deletedCount > 0;
    },
  );
}
