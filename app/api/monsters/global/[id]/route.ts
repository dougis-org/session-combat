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
    const { name, hp, maxHp, ac, initiativeBonus, dexterity } = body;

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
      initiativeBonus: initiativeBonus !== undefined ? initiativeBonus : existingTemplate.initiativeBonus,
      dexterity: dexterity !== undefined ? dexterity : existingTemplate.dexterity,
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
