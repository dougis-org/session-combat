import { getDatabase } from "@/lib/db";
import { runStorageOp } from "@/lib/storage/runOp";
import { SavedContent } from "@/lib/types";
import { normalizeStoredEntityId } from "@/lib/storage/helpers";

/**
 * Saved-content storage (#708). Every DB operation runs inside one
 * `runStorageOp` call: a driver failure now rejects with `StorageError`
 * (previously `list` swallowed to `[]` — the exact bug pattern #504 already
 * fixed for `loadSpellById()`).
 */

const COLLECTION = "savedContent";

export async function list(campaignId: string, userId: string): Promise<SavedContent[]> {
  return runStorageOp(
    { name: "savedContent.list", collection: COLLECTION, isEmpty: (r) => r.length === 0 },
    async () => {
      const db = await getDatabase();
      const items = await db
        .collection<SavedContent>(COLLECTION)
        .find({ campaignId, userId })
        .sort({ createdAt: -1 })
        .toArray();
      return items.map(normalizeStoredEntityId);
    },
  );
}

export async function create(
  item: Omit<SavedContent, "id" | "_id" | "createdAt" | "updatedAt">,
): Promise<SavedContent> {
  return runStorageOp({ name: "savedContent.create", collection: COLLECTION }, async () => {
    const db = await getDatabase();
    const now = new Date();
    const doc: SavedContent = {
      ...item,
      id: crypto.randomUUID(),
      createdAt: now,
      updatedAt: now,
    };
    const { _id, ...insertData } = doc;
    await db.collection<SavedContent>(COLLECTION).insertOne(insertData as SavedContent);
    return doc;
  });
}

export async function update(
  id: string,
  userId: string,
  patch: Pick<SavedContent, "result" | "notes">,
): Promise<boolean> {
  return runStorageOp({ name: "savedContent.update", collection: COLLECTION }, async () => {
    const db = await getDatabase();
    const updateData: Record<string, unknown> = { updatedAt: new Date() };
    if (patch.result !== undefined) updateData.result = patch.result;
    if (patch.notes !== undefined) updateData.notes = patch.notes;
    const result = await db
      .collection<SavedContent>(COLLECTION)
      .updateOne({ id, userId }, { $set: updateData });
    return result.matchedCount > 0;
  });
}

export async function remove(id: string, userId: string): Promise<boolean> {
  return runStorageOp({ name: "savedContent.remove", collection: COLLECTION }, async () => {
    const db = await getDatabase();
    const result = await db.collection<SavedContent>(COLLECTION).deleteOne({ id, userId });
    return result.deletedCount > 0;
  });
}
