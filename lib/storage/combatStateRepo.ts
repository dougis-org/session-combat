import { getDatabase } from "@/lib/db";
import { runStorageOp } from "@/lib/storage/runOp";
import { CombatState } from "@/lib/types";
import { buildEntityQuery } from "@/lib/storage/helpers";

export async function loadCombatState(userId: string): Promise<CombatState | null> {
  return runStorageOp(
    { name: "loadCombatState", collection: "combatStates", isEmpty: (res) => !res },
    async () => {
      const db = await getDatabase();
      const combatState = await db
        .collection<CombatState>("combatStates")
        .findOne({ userId });
      return combatState || null;
    }
  );
}

export async function saveCombatState(combatState: CombatState | undefined): Promise<void> {
  if (!combatState) {
    return;
  }
  return runStorageOp(
    { name: "saveCombatState", collection: "combatStates" },
    async () => {
      const db = await getDatabase();
      const { _id, ...combatStateData } = combatState;
      const query = buildEntityQuery(combatState);
      await db
        .collection<CombatState>("combatStates")
        .updateOne(query, { $set: combatStateData }, { upsert: true });
    }
  );
}
