import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, AuthPayload } from './auth';
import { getUserById, InvalidUserIdError } from './permissions';

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

// Returns false for invalid/missing user or tokenVersion mismatch. Throws on DB error.
async function verifyTokenVersion(auth: AuthPayload): Promise<boolean> {
  try {
    const user = await getUserById(auth.userId);
    return user !== null && typeof auth.tokenVersion === 'number' && user['tokenVersion'] === auth.tokenVersion;
  } catch (err) {
    if (err instanceof InvalidUserIdError) return false;
    throw err;
  }
}

/** Wrap a route handler with auth — no dynamic params. */
export function withAuth(
  handler: (request: NextRequest, auth: AuthPayload) => Promise<NextResponse>
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    const auth = requireAuth(request);
    if (auth instanceof NextResponse) return auth;
    try {
      if (!await verifyTokenVersion(auth)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    } catch {
      return NextResponse.json({ error: 'Service unavailable' }, { status: 503 });
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
    const auth = requireAuth(request);
    if (auth instanceof NextResponse) return auth;
    try {
      if (!await verifyTokenVersion(auth)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    } catch {
      return NextResponse.json({ error: 'Service unavailable' }, { status: 503 });
    }
    const resolvedParams = await params;
    return handler(request, auth, resolvedParams);
  };
}
