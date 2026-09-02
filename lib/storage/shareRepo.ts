import { getDatabase } from "@/lib/db";
import { runStorageOp } from "@/lib/storage/runOp";
import { CampaignCharacterShare } from "@/lib/types";
import { DuplicateShareError } from "@/lib/errors";
import { normalizeStoredEntityId } from "@/lib/storage/helpers";

/**
 * Campaign-character-share storage (#504). A driver failure now rejects with
 * `StorageError` for every method (previously the two list reads swallowed to
 * `[]`). A Mongo duplicate-key error on `addShare` still surfaces as
 * `DuplicateShareError`, routed through `runStorageOp`'s `rethrowAsIs`.
 * Genuine not-found stays non-throwing — an empty list and a `deleteOne` that
 * removed nothing (`false`).
 */

const COLLECTION = "campaignCharacterShares";

function stripShareId(doc: CampaignCharacterShare): CampaignCharacterShare {
  const normalized = normalizeStoredEntityId(doc);
  const { _id, ...rest } = normalized;
  return rest as CampaignCharacterShare;
}

export async function addShare(share: CampaignCharacterShare): Promise<void> {
  return runStorageOp(
    {
      name: "addShare",
      collection: COLLECTION,
      rethrowAsIs: (error) => error instanceof DuplicateShareError,
    },
    async () => {
      const db = await getDatabase();
      const { _id, ...insertData } = share;
      try {
        await db
          .collection<CampaignCharacterShare>(COLLECTION)
          .insertOne(insertData as CampaignCharacterShare);
      } catch (error) {
        if (
          error &&
          typeof error === "object" &&
          "code" in error &&
          error.code === 11000
        ) {
          throw new DuplicateShareError(share.campaignId, share.characterId);
        }
        throw error;
      }
    },
  );
}

export async function removeShare(
  campaignId: string,
  characterId: string,
  userId: string,
): Promise<boolean> {
  return runStorageOp({ name: "removeShare", collection: COLLECTION }, async () => {
    const db = await getDatabase();
    const result = await db
      .collection<CampaignCharacterShare>(COLLECTION)
      .deleteOne({ campaignId, characterId, userId });
    return result.deletedCount > 0;
  });
}

export async function listSharesForCampaign(
  campaignId: string,
  userId: string,
): Promise<CampaignCharacterShare[]> {
  return runStorageOp(
    { name: "listSharesForCampaign", collection: COLLECTION, isEmpty: (r) => r.length === 0 },
    async () => {
      const db = await getDatabase();
      const shares = await db
        .collection<CampaignCharacterShare>(COLLECTION)
        .find({ campaignId, userId })
        .toArray();
      return shares.map(stripShareId);
    },
  );
}

export async function listAllSharesForCampaign(
  campaignId: string,
): Promise<CampaignCharacterShare[]> {
  return runStorageOp(
    { name: "listAllSharesForCampaign", collection: COLLECTION, isEmpty: (r) => r.length === 0 },
    async () => {
      const db = await getDatabase();
      const shares = await db
        .collection<CampaignCharacterShare>(COLLECTION)
        .find({ campaignId })
        .toArray();
      return shares.map(stripShareId);
    },
  );
}
