/**
 * Script to import Leowarin character from D&D Beyond
 * Usage: npx ts-node scripts/import-leowarin.ts <userId>
 */

import { getDatabase, closeDatabase } from '../lib/db';
import { Character } from '../lib/types';
import crypto from 'crypto';

const GLOBAL_USER_ID = 'global-admin';

async function importLeowarin() {
  const userId = process.argv[2] || GLOBAL_USER_ID;

  if (!userId) {
    console.error('User ID is required');
    process.exit(1);
  }

  try {
    const db = await getDatabase();

    const characterData: Character = {
      id: crypto.randomUUID(),
      userId,
      name: 'Leowarin',
      race: 'Human',
      classes: [{ class: 'Bard', level: 3 }],
      background: 'Unknown',
      alignment: 'Unknown',
      hp: 24,
      maxHp: 24,
      ac: 13,
      acNote: undefined,
      abilityScores: {
        strength: 14,
        dexterity: 15,
        constitution: 14,
        intelligence: 9,
        wisdom: 16,
        charisma: 16,
      },
      savingThrows: {
        strength: 2,
        dexterity: 4,
        constitution: 2,
        intelligence: -1,
        wisdom: 3,
        charisma: 5,
      },
      skills: {
        acrobatics: 3,
        'animal handling': 4,
        arcana: 0,
        athletics: 4,
        deception: 5,
        history: 0,
        insight: 4,
        intimidation: 4,
        investigation: 1,
        medicine: 4,
        nature: 1,
        perception: 5,
        performance: 7,
        persuasion: 4,
        religion: 1,
        'sleight of hand': 6,
        stealth: 3,
        survival: 4,
      },
      damageResistances: [],
      damageImmunities: [],
      damageVulnerabilities: [],
      conditionImmunities: [],
      senses: {},
      languages: ['Common', 'Elvish'],
      traits: [],
      actions: [],
      bonusActions: [],
      reactions: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Insert or update the character
    const result = await db
      .collection<Character>('characters')
      .updateOne(
        { id: characterData.id, userId: characterData.userId },
        { $set: characterData },
        { upsert: true }
      );

    console.log(`✓ Character '${characterData.name}' imported successfully`);
    console.log(`  ID: ${characterData.id}`);
    console.log(`  User ID: ${userId}`);
    console.log(`  Matched: ${result.matchedCount}, Upserted: ${result.upsertedCount}`);

    await closeDatabase();
  } catch (error) {
    console.error('Error importing character:', error);
    await closeDatabase();
    process.exit(1);
  }
}

importLeowarin();
