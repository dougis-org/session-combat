import { NextRequest, NextResponse } from "next/server";

/** Shared auth payload used across route unit tests */
export const MOCK_AUTH = { userId: "user-123", email: "user@example.com" };

/** Configure a mocked requireAuth/verifyAuth to return a 401 Unauthorized response */
export function mockUnauthorized(mockedFn: jest.Mock): void {
  mockedFn.mockReturnValue(
    NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  );
}

/**
 * Configure a mocked getDatabase to return a collection with the given methods.
 * Used by route handlers that access MongoDB directly.
 */
export function mockDbCollection(
  mockedGetDatabase: jest.Mock,
  methods: Record<string, jest.Mock>
): void {
  mockedGetDatabase.mockResolvedValue({
    collection: jest.fn().mockReturnValue(methods),
  } as any);
}

/**
 * Build a NextRequest for route unit tests.
 * Includes the standard JSON content-type and auth cookie headers.
 */
export function makeRouteRequest(
  url: string,
  method: string,
  body?: unknown
): NextRequest {
  return new NextRequest(url, {
    method,
    headers: { "Content-Type": "application/json", cookie: "auth-token=t" },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
}
