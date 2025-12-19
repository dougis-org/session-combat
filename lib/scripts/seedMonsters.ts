/**
 * Seed SRD Monsters into Database
 *
 * This script loads the standard D&D 5e SRD monsters into the database as global templates
 * available to all users. Run this once during initial setup or to refresh the monster library.
 *
 * Usage:
 *   npx ts-node lib/scripts/seedMonsters.ts
 */

import { getDatabase } from "@/lib/db";
import { ALL_SRD_MONSTERS } from "@/lib/data/monsters";
import { GLOBAL_USER_ID } from "@/lib/constants";
import { randomUUID } from "crypto";

async function seedMonsters() {
  try {
    console.log("Connecting to database...");
    const db = await getDatabase();
    const collection = db.collection("monsterTemplates");

    console.log(`Seeding ${ALL_SRD_MONSTERS.length} SRD monsters...`);

    // Delete existing global monsters to avoid duplicates
    const deleteResult = await collection.deleteMany({ userId: GLOBAL_USER_ID });
    console.log(
      `Deleted ${deleteResult.deletedCount} existing global monsters`
    );

    // Prepare monsters with required fields, explicitly omitting _id for auto-generation
    const monstersToInsert = ALL_SRD_MONSTERS.map((monster) => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { _id, ...rest } = monster;
      return {
        ...rest,
        id: randomUUID(),
        userId: GLOBAL_USER_ID,
        isGlobal: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    });

    // Insert all monsters (MongoDB will auto-generate _id)
    const result = await collection.insertMany(monstersToInsert);
    const insertedCount = Object.keys(result.insertedIds).length;
    console.log(`✓ Successfully seeded ${insertedCount} monsters`);

    // List what was added
    console.log("\nSeeded Monsters:");
    monstersToInsert.forEach((m) => {
      console.log(`  - ${m.name} (CR ${m.challengeRating})`);
    });

    console.log(
      `\n✓ Seeding complete! ${insertedCount} monsters are now available globally.`
    );
    process.exit(0);
  } catch (error) {
    console.error("Error seeding monsters:", error);
    process.exit(1);
  }
}

seedMonsters();
