import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/middleware';
import { storage } from '@/lib/storage';
import { Party } from '@/lib/types';

export async function GET(request: NextRequest) {
  const auth = requireAuth(request);

  if (auth instanceof NextResponse) {
    return auth;
  }

  try {
    const parties = await storage.loadParties(auth.userId);
    return NextResponse.json(parties);
  } catch (error) {
    console.error('Error fetching parties:', error);
    return NextResponse.json(
      { error: 'Failed to fetch parties' },
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
    const { name, description, characterIds } = body;

    if (!name || name.trim() === '') {
      return NextResponse.json(
        { error: 'Party name is required' },
        { status: 400 }
      );
    }

    const party: Party = {
      _id: undefined,
      id: crypto.randomUUID(),
      userId: auth.userId,
      name: name.trim(),
      description: description?.trim() || '',
      characterIds: Array.isArray(characterIds) ? characterIds : [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await storage.saveParty(party);

    return NextResponse.json(party, { status: 201 });
  } catch (error) {
    console.error('Error creating party:', error);
    return NextResponse.json(
      { error: 'Failed to create party' },
      { status: 500 }
    );
  }
}
