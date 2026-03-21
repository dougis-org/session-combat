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

// ─── Test factory helpers ────────────────────────────────────────────────────
// These call it() synchronously, so Jest registers them in the enclosing
// describe() block. Use them to avoid repeating the identical 401/404/500
// boilerplate in every describe block.

type RouteHandler = (req: NextRequest) => Promise<Response> | Response;
type ContextHandler = (
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) => Promise<Response> | Response;

/** Register: returns 401 when requireAuth returns Unauthorized (no route params) */
export function itReturns401(
  handler: RouteHandler,
  makeReq: () => NextRequest,
  mockedRequireAuth: jest.Mock
): void {
  it("returns 401 when not authenticated", async () => {
    mockUnauthorized(mockedRequireAuth);
    const response = await handler(makeReq());
    expect(response.status).toBe(401);
  });
}

/** Register: returns 500 when setupError configures the mock to throw (no route params) */
export function itReturns500(
  handler: RouteHandler,
  makeReq: () => NextRequest,
  setupError: () => void,
  mockedRequireAuth: jest.Mock
): void {
  it("returns 500 on error", async () => {
    mockedRequireAuth.mockReturnValue(MOCK_AUTH);
    setupError();
    const response = await handler(makeReq());
    expect(response.status).toBe(500);
  });
}

/** Register: returns 401 when requireAuth returns Unauthorized (with route params) */
export function itReturns401WithParams(
  handler: ContextHandler,
  makeReq: () => NextRequest,
  params: Promise<{ id: string }>,
  mockedRequireAuth: jest.Mock
): void {
  it("returns 401 when not authenticated", async () => {
    mockUnauthorized(mockedRequireAuth);
    const response = await handler(makeReq(), { params });
    expect(response.status).toBe(401);
  });
}

/** Register: returns 404 when setupNotFound configures mock to return no result (with route params) */
export function itReturns404WithParams(
  handler: ContextHandler,
  makeReq: () => NextRequest,
  params: Promise<{ id: string }>,
  setupNotFound: () => void,
  mockedRequireAuth: jest.Mock
): void {
  it("returns 404 when not found", async () => {
    mockedRequireAuth.mockReturnValue(MOCK_AUTH);
    setupNotFound();
    const response = await handler(makeReq(), { params });
    expect(response.status).toBe(404);
  });
}

/** Register: returns 500 when setupError configures the mock to throw (with route params) */
export function itReturns500WithParams(
  handler: ContextHandler,
  makeReq: () => NextRequest,
  params: Promise<{ id: string }>,
  setupError: () => void,
  mockedRequireAuth: jest.Mock
): void {
  it("returns 500 on error", async () => {
    mockedRequireAuth.mockReturnValue(MOCK_AUTH);
    setupError();
    const response = await handler(makeReq(), { params });
    expect(response.status).toBe(500);
  });
}
