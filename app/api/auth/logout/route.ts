import { NextRequest, NextResponse } from 'next/server';
import { clearAuthCookie, verifyAuth } from '@/lib/middleware';

export async function POST(request: NextRequest) {
  try {
    // Verify auth token exists and is valid
    const auth = verifyAuth(request);
    
    if (!auth) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Token is valid, clear it and return success
    const response = NextResponse.json(
      { message: 'Logout successful' },
      { status: 200 }
    );
    clearAuthCookie(response);
    return response;
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
