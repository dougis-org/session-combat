import { NextResponse } from 'next/server';
import { withAuthAndParams } from '@/lib/middleware';
import { loadEncounters, saveEncounter, deleteEncounter } from '@/lib/storage/encounterRepo';
import { Encounter } from '@/lib/types';
import { validateString } from '@/lib/validation/core';
import { validateEncounterFields } from '@/lib/validation/encounterFields';

async function parseEncounterBody(request: Request): Promise<Record<string, unknown> | NextResponse> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }
  if (typeof body !== 'object' || body === null || Array.isArray(body)) {
    return NextResponse.json({ error: 'Request body must be an object' }, { status: 400 });
  }
  return body as Record<string, unknown>;
}

function validateEncounterId(id: unknown): { valid: true; value: string } | NextResponse {
  const idResult = validateString(id, 'id', { required: true, minLength: 1 });
  if (!idResult.valid) {
    return NextResponse.json({ error: idResult.error.message }, { status: 400 });
  }
  return idResult;
}

export const GET = withAuthAndParams<{ id: string }>(async (_request, auth, { id }) => {
  try {
    const idResult = validateEncounterId(id);
    if (idResult instanceof NextResponse) return idResult;

    const encounters = await loadEncounters(auth.userId);
    const encounter = encounters.find((e) => e.id === idResult.value);

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
  const idResult = validateEncounterId(id);
  if (idResult instanceof NextResponse) return idResult;

  const body = await parseEncounterBody(request);
  if (body instanceof NextResponse) return body;

  try {
    const fieldsResult = validateEncounterFields(body);
    if (!fieldsResult.valid) {
      return NextResponse.json({ error: fieldsResult.error }, { status: 400 });
    }

    // Get the existing encounter to verify ownership
    const encounters = await loadEncounters(auth.userId);
    const existingEncounter = encounters.find((e) => e.id === idResult.value);

    if (!existingEncounter) {
      return NextResponse.json(
        { error: 'Encounter not found' },
        { status: 404 }
      );
    }

    const updatedEncounter: Encounter = {
      ...existingEncounter,
      name: fieldsResult.value.name,
      description: fieldsResult.value.description ?? existingEncounter.description,
      monsters: fieldsResult.value.monsters ?? existingEncounter.monsters,
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

export const DELETE = withAuthAndParams<{ id: string }>(async (_request, auth, { id }) => {
  try {
    const idResult = validateEncounterId(id);
    if (idResult instanceof NextResponse) return idResult;

    // Verify ownership before deleting
    const encounters = await loadEncounters(auth.userId);
    const encounter = encounters.find((e) => e.id === idResult.value);

    if (!encounter) {
      return NextResponse.json(
        { error: 'Encounter not found' },
        { status: 404 }
      );
    }

    await deleteEncounter(idResult.value, auth.userId);

    return NextResponse.json({ message: 'Encounter deleted successfully' });
  } catch (error) {
    console.error('Error deleting encounter:', error);
    return NextResponse.json(
      { error: 'Failed to delete encounter' },
      { status: 500 }
    );
  }
});
