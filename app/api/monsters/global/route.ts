import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/middleware';
import { storage } from '@/lib/storage';
import { MonsterTemplate } from '@/lib/types';
import { getDatabase } from '@/lib/db';

// Helper to check if user is admin
async function isUserAdmin(userId: string): Promise<boolean> {
  try {
    const db = await getDatabase();
    const user = await db.collection('users').findOne({ id: userId });
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
      id: crypto.randomUUID(),
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
