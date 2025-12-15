import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/middleware';
import { storage } from '@/lib/storage';
import { Encounter } from '@/lib/types';

export async function GET(request: NextRequest) {
  const auth = requireAuth(request);

  if (auth instanceof NextResponse) {
    return auth;
  }

  try {
    const encounters = await storage.loadEncounters(auth.userId);
    return NextResponse.json(encounters);
  } catch (error) {
    console.error('Error fetching encounters:', error);
    return NextResponse.json(
      { error: 'Failed to fetch encounters' },
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
    const { name, description, monsters } = body;

    if (!name || name.trim() === '') {
      return NextResponse.json(
        { error: 'Encounter name is required' },
        { status: 400 }
      );
    }

    const encounter: Encounter = {
      _id: undefined,
      id: crypto.randomUUID(),
      userId: auth.userId,
      name: name.trim(),
      description: description || '',
      monsters: monsters || [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await storage.saveEncounter(encounter);

    return NextResponse.json(encounter, { status: 201 });
  } catch (error) {
    console.error('Error creating encounter:', error);
    return NextResponse.json(
      { error: 'Failed to create encounter' },
      { status: 500 }
    );
  }
}
