import { NextRequest, NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import { requireAuth } from '@/lib/middleware';
import { storage } from '@/lib/storage';
import { MonsterTemplate } from '@/lib/types';
import { getDatabase } from '@/lib/db';

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

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const templates = await storage.loadGlobalMonsterTemplates();
    const template = templates.find((t) => t.id === id);

    if (!template) {
      return NextResponse.json(
        { error: 'Global monster template not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(template);
  } catch (error) {
    console.error('Error fetching global monster template:', error);
    return NextResponse.json(
      { error: 'Failed to fetch global monster template' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const auth = requireAuth(request);

  if (auth instanceof NextResponse) {
    return auth;
  }

  // Check if user is admin
  const admin = await isUserAdmin(auth.userId);
  if (!admin) {
    return NextResponse.json(
      { error: 'Only administrators can modify global monster templates' },
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

    // Get the existing template to verify it's global
    const templates = await storage.loadGlobalMonsterTemplates();
    const existingTemplate = templates.find((t) => t.id === id);

    if (!existingTemplate) {
      return NextResponse.json(
        { error: 'Global monster template not found' },
        { status: 404 }
      );
    }

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

    const updatedTemplate: MonsterTemplate = {
      ...existingTemplate,
      name: name.trim(),
      hp: Math.min(hp !== undefined ? hp : existingTemplate.hp, maxHp),
      maxHp,
      ac: ac !== undefined ? ac : existingTemplate.ac,
      acNote: acNote !== undefined ? acNote : existingTemplate.acNote,
      abilityScores: abilityScores !== undefined ? abilityScores : existingTemplate.abilityScores,
      savingThrows: savingThrows !== undefined ? savingThrows : existingTemplate.savingThrows,
      skills: skills !== undefined ? skills : existingTemplate.skills,
      damageResistances: damageResistances !== undefined ? damageResistances : existingTemplate.damageResistances,
      damageImmunities: damageImmunities !== undefined ? damageImmunities : existingTemplate.damageImmunities,
      damageVulnerabilities: damageVulnerabilities !== undefined ? damageVulnerabilities : existingTemplate.damageVulnerabilities,
      conditionImmunities: conditionImmunities !== undefined ? conditionImmunities : existingTemplate.conditionImmunities,
      senses: senses !== undefined ? senses : existingTemplate.senses,
      languages: languages !== undefined ? languages : existingTemplate.languages,
      traits: traits !== undefined ? traits : existingTemplate.traits,
      actions: actions !== undefined ? actions : existingTemplate.actions,
      bonusActions: bonusActions !== undefined ? bonusActions : existingTemplate.bonusActions,
      reactions: reactions !== undefined ? reactions : existingTemplate.reactions,
      size: size !== undefined ? size : existingTemplate.size,
      type: type !== undefined ? type : existingTemplate.type,
      alignment: alignment !== undefined ? alignment : existingTemplate.alignment,
      speed: speed !== undefined ? speed : existingTemplate.speed,
      challengeRating: challengeRating !== undefined ? challengeRating : existingTemplate.challengeRating,
      experiencePoints: experiencePoints !== undefined ? experiencePoints : existingTemplate.experiencePoints,
      lairActions: lairActions !== undefined ? lairActions : existingTemplate.lairActions,
      legendaryActions: legendaryActions !== undefined ? legendaryActions : existingTemplate.legendaryActions,
      source: source !== undefined ? source : existingTemplate.source,
      description: description !== undefined ? description : existingTemplate.description,
      updatedAt: new Date(),
    };

    await storage.saveMonsterTemplate(updatedTemplate);

    return NextResponse.json(updatedTemplate);
  } catch (error) {
    console.error('Error updating global monster template:', error);
    return NextResponse.json(
      { error: 'Failed to update global monster template' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const auth = requireAuth(request);

  if (auth instanceof NextResponse) {
    return auth;
  }

  // Check if user is admin
  const admin = await isUserAdmin(auth.userId);
  if (!admin) {
    return NextResponse.json(
      { error: 'Only administrators can delete global monster templates' },
      { status: 403 }
    );
  }

  try {
    const templates = await storage.loadGlobalMonsterTemplates();
    const template = templates.find((t) => t.id === id);

    if (!template) {
      return NextResponse.json(
        { error: 'Global monster template not found' },
        { status: 404 }
      );
    }

    await storage.deleteMonsterTemplate(id, 'GLOBAL');

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting global monster template:', error);
    return NextResponse.json(
      { error: 'Failed to delete global monster template' },
      { status: 500 }
    );
  }
}
