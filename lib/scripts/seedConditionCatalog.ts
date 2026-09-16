import { getDatabase } from "../db";
import { StatusConditionCatalogEntry } from "../types";
import { CONDITION_CATALOG } from "../data/conditionCatalog";

export async function seedConditionCatalog(): Promise<{ inserted: number; updated: number }> {
  const db = await getDatabase();
  const collection = db.collection<StatusConditionCatalogEntry>("conditionCatalog");

  console.log(`Seeding ${CONDITION_CATALOG.length} default conditions...`);

  let inserted = 0;
  let updated = 0;

  for (const condition of CONDITION_CATALOG) {
    const existing = await collection.findOne({ name: condition.name });

    await collection.updateOne(
      { name: condition.name },
      { $set: condition },
      { upsert: true },
    );

    if (existing) {
      console.log(`  Updated: ${condition.name}`);
      updated++;
    } else {
      console.log(`  Inserted: ${condition.name}`);
      inserted++;
    }
  }

  console.log(`\nDone. Inserted: ${inserted}, Updated: ${updated}`);
  return { inserted, updated };
}

export async function runCli(): Promise<void> {
  await seedConditionCatalog();
  process.exit(0);
}

export function handleCliError(error: unknown): never {
  console.error("Seed failed:", error);
  process.exit(1);
}

/* istanbul ignore next */
if (require.main === module) {
  runCli().catch(handleCliError);
}
