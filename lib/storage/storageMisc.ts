import { getDatabase } from "@/lib/db";
import { runStorageOp } from "@/lib/storage/runOp";
import { Encounter, Character, Party, CombatState, SavedContent } from "@/lib/types";

/**
 * Cross-cutting storage housekeeping (#504). `clear` wipes every collection
 * scoped to a single user; it now runs inside `runStorageOp` so a failed
 * `deleteMany` rejects with `StorageError` and emits one error event, matching
 * every other migrated method. `storage.load()` was removed in the same change
 * (zero non-test callers, dead degradation path post #502/#503).
 */

export async function clear(userId: string): Promise<void> {
  return runStorageOp({ name: "clear", collection: "storageMisc" }, async () => {
    const db = await getDatabase();
    await Promise.all([
      db.collection<Encounter>("encounters").deleteMany({ userId }),
      db.collection<Character>("characters").deleteMany({ userId }),
      db.collection<Party>("parties").deleteMany({ userId }),
      db.collection<CombatState>("combatStates").deleteMany({ userId }),
      db.collection<SavedContent>("savedContent").deleteMany({ userId }),
      db.collection("campaignMembers").deleteMany({ userId }),
      db.collection("campaignCharacterShares").deleteMany({ userId }),
    ]);
  });
}
