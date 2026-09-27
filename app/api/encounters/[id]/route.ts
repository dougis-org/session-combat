import { NextRequest, NextResponse } from 'next/server';
import { withAuthAndParams } from '@/lib/middleware';
import { loadEncounters, saveEncounter, deleteEncounter } from '@/lib/storage/encounterRepo';
import { Encounter } from '@/lib/types';
import { validateString } from '@/lib/validation/core';

export const GET = withAuthAndParams<{ id: string }>(async (request, auth, { id }) => {
  try {
    const idResult = validateString(id, 'id', { required: true, minLength: 1 });
    if (!idResult.valid) {
      return NextResponse.json({ error: idResult.error.message }, { status: 400 });
    }

    const encounters = await loadEncounters(auth.userId);
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
});

export const PUT = withAuthAndParams<{ id: string }>(async (request, auth, { id }) => {
  try {
    const idResult = validateString(id, 'id', { required: true, minLength: 1 });
    if (!idResult.valid) {
      return NextResponse.json({ error: idResult.error.message }, { status: 400 });
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }
    if (typeof body !== 'object' || body === null || Array.isArray(body)) {
      return NextResponse.json({ error: 'Request body must be an object' }, { status: 400 });
    }

    const { name, description, monsters } = body as Record<string, unknown>;

    // Get the existing encounter to verify ownership
    const encounters = await loadEncounters(auth.userId);
    const existingEncounter = encounters.find((e) => e.id === id);

    if (!existingEncounter) {
      return NextResponse.json(
        { error: 'Encounter not found' },
        { status: 404 }
      );
    }

    const nameResult = validateString(name, 'name', { required: true, minLength: 1 });
    if (!nameResult.valid) {
      return NextResponse.json({ error: 'Encounter name is required' }, { status: 400 });
    }

    const descriptionResult = validateString(description, 'description');
    if (!descriptionResult.valid) {
      return NextResponse.json({ error: descriptionResult.error.message }, { status: 400 });
    }

    if (monsters !== undefined && !Array.isArray(monsters)) {
      return NextResponse.json({ error: 'monsters must be an array' }, { status: 400 });
    }

    const updatedEncounter: Encounter = {
      ...existingEncounter,
      name: nameResult.value,
      description: description !== undefined ? descriptionResult.value : existingEncounter.description,
      monsters: (monsters as Encounter['monsters']) ?? existingEncounter.monsters,
      updatedAt: new Date(),
    };

    await saveEncounter(updatedEncounter);

    return NextResponse.json(updatedEncounter);
  } catch (error) {
    console.error('Error updating encounter:', error);
    return NextResponse.json(
      { error: 'Failed to update encounter' },
      { status: 500 }
    );
  }
});

export const DELETE = withAuthAndParams<{ id: string }>(async (request, auth, { id }) => {
  try {
    const idResult = validateString(id, 'id', { required: true, minLength: 1 });
    if (!idResult.valid) {
      return NextResponse.json({ error: idResult.error.message }, { status: 400 });
    }

    // Verify ownership before deleting
    const encounters = await loadEncounters(auth.userId);
    const encounter = encounters.find((e) => e.id === id);

    if (!encounter) {
      return NextResponse.json(
        { error: 'Encounter not found' },
        { status: 404 }
      );
    }

    await deleteEncounter(id, auth.userId);

    return NextResponse.json({ message: 'Encounter deleted successfully' });
  } catch (error) {
    console.error('Error deleting encounter:', error);
    return NextResponse.json(
      { error: 'Failed to delete encounter' },
      { status: 500 }
    );
  }
});
