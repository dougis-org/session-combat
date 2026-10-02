import { NextRequest, NextResponse } from 'next/server';
import { withAuthAndParams } from '@/lib/middleware';
import * as savedContentRepo from '@/lib/storage/savedContentRepo';
import { validateIdentifier, validateSavedContentPatch } from '@/lib/validation/savedContent';

type Params = { id: string };

export const PUT = withAuthAndParams<Params>(async (request: NextRequest, auth, { id }) => {
  try {
    const contentId = validateIdentifier(id, 'id');
    if (!contentId.valid) {
      return NextResponse.json({ error: contentId.error }, { status: 400 });
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const patch = validateSavedContentPatch(body);
    if (!patch.valid) {
      return NextResponse.json({ error: patch.error }, { status: 400 });
    }

    const found = await savedContentRepo.update(contentId.value, auth.userId, patch.value);
    if (!found) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating saved content:', error);
    return NextResponse.json({ error: 'Failed to update saved content' }, { status: 500 });
  }
});

export const DELETE = withAuthAndParams<Params>(async (_request: NextRequest, auth, { id }) => {
  try {
    const contentId = validateIdentifier(id, 'id');
    if (!contentId.valid) {
      return NextResponse.json({ error: contentId.error }, { status: 400 });
    }

    const found = await savedContentRepo.remove(contentId.value, auth.userId);
    if (!found) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('Error deleting saved content:', error);
    return NextResponse.json({ error: 'Failed to delete saved content' }, { status: 500 });
  }
});
