import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/middleware';
import { getDatabase } from '@/lib/db';

type ItemType = 'weapon' | 'armor' | 'potion' | 'scroll' | 'wondrous' | 'ammunition' | 'gear' | 'tool' | 'other';
type ItemRarity = 'common' | 'uncommon' | 'rare' | 'very_rare' | 'legendary' | 'artifact';

const VALID_TYPES: ItemType[] = ['weapon', 'armor', 'potion', 'scroll', 'wondrous', 'ammunition', 'gear', 'tool', 'other'];
const VALID_RARITIES: ItemRarity[] = ['common', 'uncommon', 'rare', 'very_rare', 'legendary', 'artifact'];

interface Item {
  _id?: string;
  id: string;
  userId: string;
  name: string;
  type: ItemType;
  rarity: ItemRarity;
  description?: string;
  quantity: number;
  value?: number;
  weight?: number;
  attunement: boolean;
  equipped: boolean;
  properties?: string[];
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

function validateEnum<T extends string>(
  value: unknown,
  valid: T[],
  requiredMsg: string,
  invalidMsg: string,
): NextResponse | null {
  if (!value) return NextResponse.json({ error: requiredMsg }, { status: 400 });
  if (!valid.includes(value as T)) return NextResponse.json({ error: invalidMsg }, { status: 400 });
  return null;
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
    const { name, type, rarity, description, quantity, value, weight, attunement, equipped, properties, notes } = body;

    if (!name || typeof name !== 'string' || name.trim() === '') {
      return NextResponse.json(
        { error: 'Item name is required' },
        { status: 400 }
      );
    }

    const typeError = validateEnum(type, VALID_TYPES, 'Item type is required', 'Invalid item type');
    if (typeError) return typeError;

    const rarityError = validateEnum(rarity, VALID_RARITIES, 'Item rarity is required', 'Invalid item rarity');
    if (rarityError) return rarityError;

    const item: Item = {
      id: crypto.randomUUID(),
      userId: auth.userId,
      name: name.trim(),
      type,
      rarity,
      ...(description !== undefined && { description }),
      quantity: quantity ?? 1,
      ...(value !== undefined && { value }),
      ...(weight !== undefined && { weight }),
      attunement: attunement ?? false,
      equipped: equipped ?? false,
      ...(properties !== undefined && { properties }),
      ...(notes !== undefined && { notes }),
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
