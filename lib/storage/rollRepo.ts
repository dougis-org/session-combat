import { getDatabase } from "@/lib/db";
import { runStorageOp } from "@/lib/storage/runOp";
import { CampaignRoll, MemberRole } from "@/lib/types";

/**
 * Campaign-roll storage (#504). Both methods previously had no try/catch at
 * all — a driver failure propagated as a raw error with no telemetry. They now
 * run inside `runStorageOp`, so a failure rejects with `StorageError` and emits
 * exactly one error event. Query, sort, limit, visibility filter and cursor
 * computation are unchanged (moved verbatim). An empty page is a legitimate
 * success, so `listCampaignRolls` has no `isEmpty`.
 */

const COLLECTION = "campaignRolls";

export async function saveCampaignRoll(roll: CampaignRoll): Promise<void> {
  return runStorageOp({ name: "saveCampaignRoll", collection: COLLECTION }, async () => {
    const db = await getDatabase();
    const { _id: _ignored, ...doc } = roll;
    void _ignored;
    await db.collection(COLLECTION).insertOne(doc);
  });
}

export async function listCampaignRolls(
  campaignId: string,
  sessionId: string,
  userId: string,
  role: MemberRole,
  opts: { limit: number; before?: Date },
): Promise<{ rolls: CampaignRoll[]; nextCursor?: string }> {
  return runStorageOp({ name: "listCampaignRolls", collection: COLLECTION }, async () => {
    const db = await getDatabase();
    const query: Record<string, unknown> = {
      campaignId,
      sessionId,
      ...(opts.before ? { createdAt: { $lt: opts.before } } : {}),
      $or: [
        { "visibility.scope": "group" },
        { rollerId: userId },
        ...(role === "dm" ? [{ "visibility.scope": "dm-only" }] : []),
      ],
    };

    const docs = await db
      .collection(COLLECTION)
      .find(query)
      .sort({ createdAt: -1 })
      .limit(opts.limit + 1)
      .toArray();

    let nextCursor: string | undefined;
    if (docs.length > opts.limit) {
      docs.pop();
      nextCursor = (docs[docs.length - 1]["createdAt"] as Date).toISOString();
    }

    const rolls = docs.map((doc) => {
      const { _id, ...rest } = doc;
      void _id;
      return rest as unknown as CampaignRoll;
    });

    return { rolls, ...(nextCursor ? { nextCursor } : {}) };
  });
}
