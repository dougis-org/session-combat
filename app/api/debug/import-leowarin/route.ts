import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/db';
import crypto from 'crypto';

/**
 * DEBUG ENDPOINT: Import Leowarin character from D&D Beyond
 * POST /api/debug/import-leowarin
 * Body: { userId: string }
 * 
 * WARNING: This is a debug endpoint. Remove in production.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const userId = body.userId || 'test-user-123';

    const db = await getDatabase();

    const characterData = {
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

    const result = await db
      .collection('characters')
      .updateOne(
        { id: characterData.id, userId: characterData.userId },
        { $set: characterData },
        { upsert: true }
      );

    return NextResponse.json(
      {
        success: true,
        message: `Character '${characterData.name}' imported successfully`,
        character: characterData,
        result: {
          matchedCount: result.matchedCount,
          upsertedCount: result.upsertedCount,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error importing character:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
