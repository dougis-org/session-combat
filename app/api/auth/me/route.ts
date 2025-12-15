import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/middleware';

export async function GET(request: NextRequest) {
  try {
    const auth = verifyAuth(request);
    
    if (!auth) {
      return NextResponse.json(
        { authenticated: false },
        { status: 401 }
      );
    }

    // Get user info including admin status
    const db = require('@/lib/db').getDatabase;
    let isAdmin = false;
    try {
      const database = await db();
      const user = await database.collection('users').findOne({ id: auth.userId });
      isAdmin = user?.isAdmin === true;
    } catch (error) {
      console.error('Error fetching user admin status:', error);
    }

    return NextResponse.json(
      { 
        authenticated: true,
        userId: auth.userId,
        email: auth.email,
        isAdmin
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Me endpoint error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
