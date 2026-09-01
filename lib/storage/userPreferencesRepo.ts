import { ObjectId } from "mongodb";
import { getDatabase } from "@/lib/db";
import { InvalidUserIdError } from "@/lib/permissions";
import { runStorageOp } from "@/lib/storage/runOp";
import {
  DeepPartial,
  PREFERENCES_SCHEMA_VERSION,
  PreferenceValues,
  partitionPreferenceDelta,
  resolvePreferences,
  sparseKnownValues,
} from "@/lib/preferences/schema";

export interface ResolvedPreferences {
  schemaVersion: number;
  /** Full defaults deep-merged with the user's stored deltas. */
  values: PreferenceValues;
  /** The sparse stored deltas only (no defaults) — lets the client tell "set" from "default". */
  stored: DeepPartial<PreferenceValues>;
}

const usersCollection = async () => (await getDatabase()).collection("users");

function requireValidUserId(userId: string): ObjectId {
  if (!ObjectId.isValid(userId)) throw new InvalidUserIdError(userId);
  return new ObjectId(userId);
}

async function readResolved(id: ObjectId): Promise<ResolvedPreferences> {
  const col = await usersCollection();
  const doc = await col.findOne(
    { _id: { $eq: id } },
    { projection: { preferences: 1 } },
  );
  const raw = (doc?.["preferences"] as { values?: unknown } | undefined)?.values;
  return {
    schemaVersion: PREFERENCES_SCHEMA_VERSION,
    values: resolvePreferences(raw),
    stored: sparseKnownValues(raw),
  };
}

/** Resolved preferences for a user; full defaults when the user has never set one. */
export async function getUserPreferences(
  userId: string,
): Promise<ResolvedPreferences> {
  const id = requireValidUserId(userId);
  return runStorageOp(
    { name: "getUserPreferences", collection: "users" },
    () => readResolved(id),
  );
}

/**
 * Merge a validated sparse delta into the user's stored preferences and return the
 * resolved result. Values equal to a schema default are `$unset` so the stored
 * document holds only genuine deltas. Last-write-wins per key.
 */
export async function updateUserPreferences(
  userId: string,
  patchValues: DeepPartial<PreferenceValues>,
): Promise<ResolvedPreferences> {
  const id = requireValidUserId(userId);
  return runStorageOp(
    { name: "updateUserPreferences", collection: "users" },
    async () => {
      const { set, unset } = partitionPreferenceDelta(patchValues);
      const col = await usersCollection();
      const update: Record<string, Record<string, unknown>> = {
        $set: {
          ...set,
          "preferences.schemaVersion": PREFERENCES_SCHEMA_VERSION,
          "preferences.updatedAt": new Date(),
        },
      };
      if (Object.keys(unset).length > 0) update["$unset"] = unset;
      await col.updateOne({ _id: { $eq: id } }, update);
      return readResolved(id);
    },
  );
}
