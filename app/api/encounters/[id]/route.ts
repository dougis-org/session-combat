import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/middleware';
import { storage } from '@/lib/storage';
import { Encounter } from '@/lib/types';

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
    const encounters = await storage.loadEncounters(auth.userId);
    const encounter = encounters.find((e) => e.id === id);

    if (!encounter) {
      return NextResponse.json(
        { error: 'Encounter not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(encounter);
  } catch (error) {
    console.error('Error fetching encounter:', error);
    return NextResponse.json(
      { error: 'Failed to fetch encounter' },
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
    const { name, description, monsters } = body;

    console.log('PUT /api/encounters/[id] received:', { pathId: id, bodyId: body.id, userId: auth.userId });

    // Get the existing encounter to verify ownership
    const encounters = await storage.loadEncounters(auth.userId);
    console.log('Loaded encounters:', encounters.map(e => ({ id: e.id, name: e.name })));
    const existingEncounter = encounters.find((e) => e.id === id);
    console.log('Found existing encounter:', existingEncounter ? { id: existingEncounter.id, name: existingEncounter.name } : 'NOT FOUND');

    if (!existingEncounter) {
      return NextResponse.json(
        { error: 'Encounter not found' },
        { status: 404 }
      );
    }

    if (!name || name.trim() === '') {
      return NextResponse.json(
        { error: 'Encounter name is required' },
        { status: 400 }
      );
    }

    const updatedEncounter: Encounter = {
      ...existingEncounter,
      name: name.trim(),
      description: description !== undefined ? description : existingEncounter.description,
      monsters: monsters !== undefined ? monsters : existingEncounter.monsters,
      updatedAt: new Date(),
    };

    await storage.saveEncounter(updatedEncounter);

    return NextResponse.json(updatedEncounter);
  } catch (error) {
    console.error('Error updating encounter:', error);
    return NextResponse.json(
      { error: 'Failed to update encounter' },
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
    // Verify ownership before deleting
    const encounters = await storage.loadEncounters(auth.userId);
    const encounter = encounters.find((e) => e.id === id);

    if (!encounter) {
      return NextResponse.json(
        { error: 'Encounter not found' },
        { status: 404 }
      );
    }

    await storage.deleteEncounter(id, auth.userId);

    return NextResponse.json({ message: 'Encounter deleted successfully' });
  } catch (error) {
    console.error('Error deleting encounter:', error);
    return NextResponse.json(
      { error: 'Failed to delete encounter' },
      { status: 500 }
    );
  }
}
