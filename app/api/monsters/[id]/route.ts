import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/middleware';
import { storage } from '@/lib/storage';
import { MonsterTemplate } from '@/lib/types';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const auth = requireAuth(request);

  if (auth instanceof NextResponse) {
    return auth;
  }

  try {
    const templates = await storage.loadMonsterTemplates(auth.userId);
    const template = templates.find((t) => t.id === id);

    if (!template) {
      return NextResponse.json(
        { error: 'Monster template not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(template);
  } catch (error) {
    console.error('Error fetching monster template:', error);
    return NextResponse.json(
      { error: 'Failed to fetch monster template' },
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

  try {
    const body = await request.json();
    const { name, hp, maxHp, ac, initiativeBonus, dexterity } = body;

    // Get the existing template to verify ownership
    const templates = await storage.loadMonsterTemplates(auth.userId);
    const existingTemplate = templates.find((t) => t.id === id);

    if (!existingTemplate) {
      return NextResponse.json(
        { error: 'Monster template not found' },
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
      initiativeBonus: initiativeBonus !== undefined ? initiativeBonus : existingTemplate.initiativeBonus,
      dexterity: dexterity !== undefined ? dexterity : existingTemplate.dexterity,
      updatedAt: new Date(),
    };

    await storage.saveMonsterTemplate(updatedTemplate);

    return NextResponse.json(updatedTemplate);
  } catch (error) {
    console.error('Error updating monster template:', error);
    return NextResponse.json(
      { error: 'Failed to update monster template' },
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

  try {
    const templates = await storage.loadMonsterTemplates(auth.userId);
    const template = templates.find((t) => t.id === id);

    if (!template) {
      return NextResponse.json(
        { error: 'Monster template not found' },
        { status: 404 }
      );
    }

    await storage.deleteMonsterTemplate(id, auth.userId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting monster template:', error);
    return NextResponse.json(
      { error: 'Failed to delete monster template' },
      { status: 500 }
    );
  }
}
