import { getDatabase } from "../db";
import { MonsterTemplate } from "../types";
import { GLOBAL_USER_ID } from "../constants";

export async function migrateGlobalMonsters() {
  const db = await getDatabase();
  const collection = db.collection<MonsterTemplate>("monsterTemplates");

  console.log("Starting migration: tagging existing global monsters with source 'SRD'...");

  const result = await collection.updateMany(
    {
      userId: GLOBAL_USER_ID,
      isGlobal: true,
      $or: [
        { source: { $exists: false } },
        { source: { $type: "null" } },
        { source: "" },
      ],
    },
    {
      $set: {
        source: "SRD",
        updatedAt: new Date(),
      },
    }
  );

  console.log(`Migration complete: ${result.modifiedCount} documents updated`);
  return result.modifiedCount;
}

if (require.main === module) {
  migrateGlobalMonsters()
    .then((count) => {
      console.log(`Successfully updated ${count} global monsters`);
      process.exit(0);
    })
    .catch((error) => {
      console.error("Migration failed:", error);
      process.exit(1);
    });
}
