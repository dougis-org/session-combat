import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/middleware';
import { getDatabase } from '@/lib/db';

interface Item {
  _id?: string;
  id: string;
  userId: string;
  name: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

export const GET = withAuth(async (request, auth) => {
  try {
    const db = await getDatabase();
    const items = await db
      .collection<Item>('items')
      .find({ userId: auth.userId })
      .toArray();
    return NextResponse.json(items);
  } catch (error) {
    console.error('Error fetching items:', error);
    return NextResponse.json(
      { error: 'Failed to fetch items' },
      { status: 500 }
    );
  }
});

export const POST = withAuth(async (request, auth) => {
  try {
    const body = await request.json();
    const { name, description } = body;

    if (!name || name.trim() === '') {
      return NextResponse.json(
        { error: 'Item name is required' },
        { status: 400 }
      );
    }

    const item: Item = {
      id: crypto.randomUUID(),
      userId: auth.userId,
      name: name.trim(),
      description: description || '',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const db = await getDatabase();
    await db.collection<Item>('items').insertOne(item);

    return NextResponse.json(item, { status: 201 });
  } catch (error) {
    console.error('Error creating item:', error);
    return NextResponse.json(
      { error: 'Failed to create item' },
      { status: 500 }
    );
  }
});
