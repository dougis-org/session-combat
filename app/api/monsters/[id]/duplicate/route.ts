import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '../../../../../lib/middleware';
import { storage } from '../../../../../lib/storage';
import { MonsterTemplate } from '../../../../../lib/types';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = requireAuth(request);

  if (auth instanceof NextResponse) {
    return auth;
  }

  try {
    const { id } = await params;

    const templates = await storage.loadAllMonsterTemplates(auth.userId);
    const original = templates.find((t: MonsterTemplate) => t.id === id);

    if (!original) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    }

    const duplicated: MonsterTemplate = {
      ...original,
      id: crypto.randomUUID(),
      userId: auth.userId,
      isGlobal: false,
      name: original.name && original.name.includes('(copy)') ? original.name : `${original.name} (copy)`,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await storage.saveMonsterTemplate(duplicated);

    return NextResponse.json(duplicated, { status: 201 });
  } catch (error) {
    console.error('Error duplicating monster template:', error);
    return NextResponse.json({ error: 'Failed to duplicate monster' }, { status: 500 });
  }
}