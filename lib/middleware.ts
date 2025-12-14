import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, AuthPayload } from './auth';

const COOKIE_NAME = 'auth-token';

/**
 * Extract auth token from request
 */
export function extractToken(request: NextRequest): string | null {
  const authHeader = request.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }

  const cookies = request.cookies.get(COOKIE_NAME);
  return cookies?.value || null;
}

/**
 * Verify auth and extract user payload
 */
export function verifyAuth(request: NextRequest): AuthPayload | null {
  const token = extractToken(request);
  if (!token) {
    return null;
  }

  return verifyToken(token);
}

/**
 * Create a response with auth token in HTTP-only cookie
 */
export function setAuthCookie(response: NextResponse, token: string): void {
  response.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60, // 7 days
    path: '/',
  });
}

/**
 * Create a response that clears the auth cookie
 */
export function clearAuthCookie(response: NextResponse): void {
  response.cookies.delete(COOKIE_NAME);
}

/**
 * Middleware to protect API routes
 * Returns 401 if user is not authenticated
 */
export function requireAuth(request: NextRequest) {
  const auth = verifyAuth(request);

  if (!auth) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  return auth;
}
