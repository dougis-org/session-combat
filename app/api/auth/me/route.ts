import { NextRequest, NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
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
      const user = await database.collection('users').findOne({ _id: new ObjectId(auth.userId) });
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
    
    // Cache auth data for 1 hour
    response.headers.set('Cache-Control', 'private, max-age=3600');
    
    return response;
  } catch (error) {
    console.error('Me endpoint error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
