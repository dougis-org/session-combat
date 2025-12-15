import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/middleware';
import { getDatabase } from '@/lib/db';
import { CombatState } from '@/lib/types';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = requireAuth(request);

  if (auth instanceof NextResponse) {
    return auth;
  }

  try {
    const db = await getDatabase();
    const combatState = await db
      .collection<CombatState>('combatStates')
      .findOne({ id: params.id, userId: auth.userId });

    if (!combatState) {
      return NextResponse.json(
        { error: 'Combat state not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(combatState);
  } catch (error) {
    console.error('Error fetching combat state:', error);
    return NextResponse.json(
      { error: 'Failed to fetch combat state' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = requireAuth(request);

  if (auth instanceof NextResponse) {
    return auth;
  }

  try {
    const body = await request.json();
    const { combatants, currentRound, currentTurnIndex, isActive } = body;

    const db = await getDatabase();
    const existingCombatState = await db
      .collection<CombatState>('combatStates')
      .findOne({ id: params.id, userId: auth.userId });

    if (!existingCombatState) {
      return NextResponse.json(
        { error: 'Combat state not found' },
        { status: 404 }
      );
    }

    const updatedCombatState: CombatState = {
      ...existingCombatState,
      combatants: combatants !== undefined ? combatants : existingCombatState.combatants,
      currentRound: currentRound !== undefined ? currentRound : existingCombatState.currentRound,
      currentTurnIndex: currentTurnIndex !== undefined ? currentTurnIndex : existingCombatState.currentTurnIndex,
      isActive: isActive !== undefined ? isActive : existingCombatState.isActive,
      updatedAt: new Date(),
    };

    await db
      .collection<CombatState>('combatStates')
      .updateOne(
        { id: params.id, userId: auth.userId },
        { $set: updatedCombatState }
      );

    return NextResponse.json(updatedCombatState);
  } catch (error) {
    console.error('Error updating combat state:', error);
    return NextResponse.json(
      { error: 'Failed to update combat state' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = requireAuth(request);

  if (auth instanceof NextResponse) {
    return auth;
  }

  try {
    const db = await getDatabase();
    const combatState = await db
      .collection<CombatState>('combatStates')
      .findOne({ id: params.id, userId: auth.userId });

    if (!combatState) {
      return NextResponse.json(
        { error: 'Combat state not found' },
        { status: 404 }
      );
    }

    await db
      .collection<CombatState>('combatStates')
      .deleteOne({ id: params.id, userId: auth.userId });

    return NextResponse.json({ message: 'Combat state deleted successfully' });
  } catch (error) {
    console.error('Error deleting combat state:', error);
    return NextResponse.json(
      { error: 'Failed to delete combat state' },
      { status: 500 }
    );
  }
}
