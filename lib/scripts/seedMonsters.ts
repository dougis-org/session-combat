/**
 * Seed SRD Monsters into Database
 * 
 * This script loads the standard D&D 5e SRD monsters into the database as global templates
 * available to all users. Run this once during initial setup or to refresh the monster library.
 * 
 * Usage:
 *   npx ts-node lib/scripts/seedMonsters.ts
 */

import { getDatabase } from '@/lib/db';
import { ALL_SRD_MONSTERS } from '@/lib/data/monsters';

async function seedMonsters() {
  try {
    console.log('Connecting to database...');
    const db = await getDatabase();
    const collection = db.collection('monsterTemplates');

    console.log(`Seeding ${ALL_SRD_MONSTERS.length} SRD monsters...`);

    // Delete existing global monsters to avoid duplicates
    const deleteResult = await collection.deleteMany({ userId: 'GLOBAL' });
    console.log(`Deleted ${deleteResult.deletedCount} existing global monsters`);

    // Prepare monsters with required fields, omitting _id to let MongoDB generate it
    const monstersToInsert = ALL_SRD_MONSTERS.map(monster => {
      const { _id, ...rest } = monster as any;
      return {
        ...rest,
        id: crypto.randomUUID(),
        userId: 'GLOBAL',
        isGlobal: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    });

    // Insert all monsters (MongoDB will generate _id automatically)
    const result = await collection.insertMany(monstersToInsert as any);
    const insertedCount = Object.keys(result.insertedIds).length;
    console.log(`✓ Successfully seeded ${insertedCount} monsters`);

    // List what was added
    console.log('\nSeeded Monsters:');
    monstersToInsert.forEach(m => {
      console.log(`  - ${m.name} (CR ${m.challengeRating})`);
    });

    console.log(`\n✓ Seeding complete! ${insertedCount} monsters are now available globally.`);
    process.exit(0);
  } catch (error) {
    console.error('Error seeding monsters:', error);
    process.exit(1);
  }
}

seedMonsters();
