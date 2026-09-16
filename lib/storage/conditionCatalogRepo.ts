import { getDatabase } from "@/lib/db";
import { runStorageOp } from "@/lib/storage/runOp";
import { StatusConditionCatalogEntry } from "@/lib/types";

export async function loadConditionCatalog(): Promise<StatusConditionCatalogEntry[]> {
  return runStorageOp(
    { name: "loadConditionCatalog", collection: "conditionCatalog", isEmpty: (res) => res.length === 0 },
    async () => {
      const db = await getDatabase();
      const entries = await db
        .collection<StatusConditionCatalogEntry>("conditionCatalog")
        .find({})
        .toArray();
      return entries.map(({ name, description }) => ({ name, description }));
    },
  );
}
