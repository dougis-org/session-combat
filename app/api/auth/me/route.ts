import { NextRequest, NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import { withAuth } from '@/lib/middleware';
import { getDatabase } from '@/lib/db';

export const GET = withAuth(async (request, auth) => {
  try {
    const db = await getDatabase();
    let isAdmin = false;
    try {
      const user = await db.collection('users').findOne({ _id: new ObjectId(auth.userId) });
      isAdmin = user?.isAdmin === true;
    } catch (error) {
      console.error('Error fetching user admin status:', error);
    }

    const response = NextResponse.json(
      {
        authenticated: true,
        userId: auth.userId,
        email: auth.email,
        isAdmin
      },
      { status: 200 }
    );

    // Prevent caching — auth state changes when cookies change
    response.headers.set('Cache-Control', 'no-store');

    return response;
  } catch (error) {
    console.error('Me endpoint error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});
