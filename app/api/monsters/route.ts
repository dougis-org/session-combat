import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/middleware';
import { storage } from '@/lib/storage';
import { MonsterTemplate } from '@/lib/types';
import { getDatabase } from '@/lib/db';

export async function GET(request: NextRequest) {
  const auth = requireAuth(request);

  if (auth instanceof NextResponse) {
    return auth;
  }

  try {
    // Return all templates (user's private + global)
    const templates = await storage.loadAllMonsterTemplates(auth.userId);
    return NextResponse.json(templates);
  } catch (error) {
    console.error('Error fetching monster templates:', error);
    return NextResponse.json(
      { error: 'Failed to fetch monster templates' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const auth = requireAuth(request);

  if (auth instanceof NextResponse) {
    return auth;
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
      userId: auth.userId,
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
      isGlobal: false,
      source: source || undefined,
      description: description || undefined,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await storage.saveMonsterTemplate(template);

    return NextResponse.json(template, { status: 201 });
  } catch (error) {
    console.error('Error creating monster template:', error);
    return NextResponse.json(
      { error: 'Failed to create monster template' },
      { status: 500 }
    );
  }
}
