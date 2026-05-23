import { NextRequest, NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import { verifyToken, AuthPayload } from './auth';
import { getDatabase } from './db';

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
 * @deprecated Use `withAuth` or `withAuthAndParams` which also verify tokenVersion against the DB.
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
 * @deprecated Use `withAuth` or `withAuthAndParams` which also verify tokenVersion against the DB.
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

async function verifyTokenVersion(auth: AuthPayload): Promise<boolean> {
  if (!ObjectId.isValid(auth.userId)) return false;
  try {
    const db = await getDatabase();
    const user = await db.collection('users').findOne({ _id: new ObjectId(auth.userId) });
    return user !== null && user['tokenVersion'] === auth.tokenVersion;
  } catch {
    return false;
  }
}

/** Wrap a route handler with auth — no dynamic params. */
export function withAuth(
  handler: (request: NextRequest, auth: AuthPayload) => Promise<NextResponse>
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    const auth = requireAuth(request);
    if (auth instanceof NextResponse) return auth;
    if (!await verifyTokenVersion(auth)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return handler(request, auth);
  };
}

/** Wrap a route handler with auth — with dynamic params (e.g. [id]). */
export function withAuthAndParams<P extends Record<string, string>>(
  handler: (request: NextRequest, auth: AuthPayload, params: P) => Promise<NextResponse>
) {
  return async (
    request: NextRequest,
    { params }: { params: Promise<P> }
  ): Promise<NextResponse> => {
    const resolvedParams = await params;
    const auth = requireAuth(request);
    if (auth instanceof NextResponse) return auth;
    if (!await verifyTokenVersion(auth)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return handler(request, auth, resolvedParams);
  };
}
