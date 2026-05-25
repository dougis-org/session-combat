import { NextRequest, NextResponse } from 'next/server';
import { withAuthAndParams } from '@/lib/middleware';
import { storage } from '@/lib/storage';

type Params = { id: string };

export const PUT = withAuthAndParams<Params>(async (request: NextRequest, auth, { id }) => {
  try {
    const body = await request.json();
    const { result, notes } = body;

    if (result !== undefined && typeof result !== 'string') {
      return NextResponse.json({ error: 'result must be a string' }, { status: 400 });
    }
    if (notes !== undefined && typeof notes !== 'string') {
      return NextResponse.json({ error: 'notes must be a string' }, { status: 400 });
    }

    await storage.savedContent.update(id, auth.userId, { result, notes });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating saved content:', error);
    return NextResponse.json({ error: 'Failed to update saved content' }, { status: 500 });
  }
});

export const DELETE = withAuthAndParams<Params>(async (_request: NextRequest, auth, { id }) => {
  try {
    await storage.savedContent.remove(id, auth.userId);
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('Error deleting saved content:', error);
    return NextResponse.json({ error: 'Failed to delete saved content' }, { status: 500 });
  }
});
