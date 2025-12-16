import { NextRequest, NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import { requireAuth } from '@/lib/middleware';
import { storage } from '@/lib/storage';
import { MonsterTemplate } from '@/lib/types';
import { getDatabase } from '@/lib/db';
import { ALL_SRD_MONSTERS } from '@/lib/data/monsters';
import { randomUUID } from 'crypto';

// Helper to check if user is admin
async function isUserAdmin(userId: string): Promise<boolean> {
  try {
    const db = await getDatabase();
    const user = await db.collection('users').findOne({ _id: new ObjectId(userId) });
    return user?.isAdmin === true;
  } catch (error) {
    console.error('Error checking admin status:', error);
    return false;
  }
}

export async function GET(request: NextRequest) {
  try {
    const templates = await storage.loadGlobalMonsterTemplates();
    return NextResponse.json(templates);
  } catch (error) {
    console.error('Error fetching global monster templates:', error);
    return NextResponse.json(
      { error: 'Failed to fetch global monster templates' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const auth = requireAuth(request);

  if (auth instanceof NextResponse) {
    return auth;
  }

  // Check if user is admin
  const admin = await isUserAdmin(auth.userId);
  if (!admin) {
    return NextResponse.json(
      { error: 'Only administrators can create global monster templates' },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();
    const {
      name,
      hp,
      maxHp,
      ac,
      acNote,
      abilityScores,
      savingThrows,
      skills,
      damageResistances,
      damageImmunities,
      damageVulnerabilities,
      conditionImmunities,
      senses,
      languages,
      traits,
      actions,
      bonusActions,
      reactions,
      size,
      type,
      alignment,
      speed,
      challengeRating,
      experiencePoints,
      lairActions,
      legendaryActions,
      source,
      description,
    } = body;

    if (!name || name.trim() === '') {
      return NextResponse.json(
        { error: 'Monster name is required' },
        { status: 400 }
      );
    }

    if (maxHp === undefined || maxHp <= 0) {
      return NextResponse.json(
        { error: 'Max HP must be greater than 0' },
        { status: 400 }
      );
    }

    const template: MonsterTemplate = {
      id: randomUUID(),
      userId: 'GLOBAL',
      isGlobal: true,
      name: name.trim(),
      hp: Math.min(hp || maxHp, maxHp),
      maxHp,
      ac: ac ?? 10,
      acNote: acNote || undefined,
      abilityScores: abilityScores || { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 },
      savingThrows: savingThrows || {},
      skills: skills || {},
      damageResistances: damageResistances || [],
      damageImmunities: damageImmunities || [],
      damageVulnerabilities: damageVulnerabilities || [],
      conditionImmunities: conditionImmunities || [],
      senses: senses || [],
      languages: languages || [],
      traits: traits || [],
      actions: actions || [],
      bonusActions: bonusActions || [],
      reactions: reactions || [],
      size: size || 'Medium',
      type: type || 'humanoid',
      alignment: alignment || undefined,
      speed: speed || undefined,
      challengeRating: challengeRating || 0,
      experiencePoints: experiencePoints || 0,
      lairActions: lairActions || [],
      legendaryActions: legendaryActions || [],
      source: source || undefined,
      description: description || undefined,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await storage.saveMonsterTemplate(template);

    return NextResponse.json(template, { status: 201 });
  } catch (error) {
    console.error('Error creating global monster template:', error);
    return NextResponse.json(
      { error: 'Failed to create global monster template' },
      { status: 500 }
    );
  }
}

/**
 * Seed SRD monsters into the database
 * POST /api/monsters/global/seed
 * Admin only
 */
export async function PUT(request: NextRequest) {
  const auth = requireAuth(request);

  if (auth instanceof NextResponse) {
    return auth;
  }

  // Check if user is admin
  const admin = await isUserAdmin(auth.userId);
  if (!admin) {
    return NextResponse.json(
      { error: 'Only administrators can seed the monster library' },
      { status: 403 }
    );
  }

  try {
    const db = await getDatabase();
    const collection = db.collection<MonsterTemplate>('monsterTemplates');

    // Delete existing global monsters
    await collection.deleteMany({ userId: 'GLOBAL' });

    // Prepare monsters with required fields
    const monstersToInsert = ALL_SRD_MONSTERS.map(monster => ({
      ...monster,
      id: randomUUID(),
      userId: 'GLOBAL',
      isGlobal: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    }));

    // Validate all monsters have required fields
    const invalidMonsters = monstersToInsert.filter(m => !m.name || m.name.trim() === '');
    if (invalidMonsters.length > 0) {
      console.error(`Found ${invalidMonsters.length} monsters without names:`, invalidMonsters.slice(0, 5));
      return NextResponse.json({
        error: 'Failed to seed monsters',
        details: `${invalidMonsters.length} monsters missing required 'name' field`,
      }, { status: 400 });
    }

    // Insert all monsters
    const result = await collection.insertMany(monstersToInsert);
    const insertedCount = Object.keys(result.insertedIds).length;

    return NextResponse.json({
      success: true,
      message: `Seeded ${insertedCount} SRD monsters`,
      count: insertedCount,
      monsters: monstersToInsert.map(m => ({ id: m.id, name: m.name, cr: m.challengeRating })),
    }, { status: 200 });
  } catch (error) {
    console.error('Error seeding monsters:', error);
    return NextResponse.json(
      { error: 'Failed to seed monsters', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
