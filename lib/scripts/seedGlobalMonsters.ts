import { getDatabase } from "../db";
import { MonsterTemplate } from "../types";
import { CUSTOM_MONSTERS } from "../data/customMonsters";

export async function seedGlobalMonsters(): Promise<{ inserted: number; updated: number }> {
  const db = await getDatabase();
  const collection = db.collection<MonsterTemplate>("monsterTemplates");

  console.log(`Seeding ${CUSTOM_MONSTERS.length} custom global monsters...`);

  let inserted = 0;
  let updated = 0;
  const now = new Date();

  for (const monster of CUSTOM_MONSTERS) {
    const existing = await collection.findOne({
      id: monster.id,
      userId: monster.userId,
    });

    if (existing) {
      await collection.updateOne(
        { id: monster.id },
        {
          $set: {
            ...monster,
            updatedAt: now,
          }
        }
      );
      console.log(`  Updated: ${monster.name}`);
      updated++;
    } else {
      await collection.insertOne({
        ...monster,
        createdAt: now,
        updatedAt: now,
      } as MonsterTemplate & { _id?: unknown });
      console.log(`  Inserted: ${monster.name}`);
      inserted++;
    }
  }

  console.log(`\nDone. Inserted: ${inserted}, Updated: ${updated}`);
  return { inserted, updated };
}

export async function runCli(): Promise<void> {
  await seedGlobalMonsters();
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
