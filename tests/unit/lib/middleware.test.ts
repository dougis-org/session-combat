import { NextRequest, NextResponse } from "next/server";
import {
  extractToken,
  verifyAuth,
  setAuthCookie,
  clearAuthCookie,
  requireAuth,
  withAuth,
  withAuthAndParams,
} from "@/lib/middleware";
import { verifyToken } from "@/lib/auth";
import { getDatabase } from "@/lib/db";

jest.mock("@/lib/auth", () => ({
  verifyToken: jest.fn(),
}));

jest.mock("@/lib/db", () => ({
  getDatabase: jest.fn(),
}));

const mockedVerifyToken = jest.mocked(verifyToken);
const mockedGetDatabase = jest.mocked(getDatabase);

function mockDb(user: Record<string, unknown> | null) {
  mockedGetDatabase.mockResolvedValue({
    collection: jest.fn().mockReturnValue({
      findOne: jest.fn().mockResolvedValue(user),
    }),
  } as any);
}

function makeRequest(options: {
  cookie?: string;
  authHeader?: string;
} = {}): NextRequest {
  const headers: Record<string, string> = {};
  if (options.cookie) headers["cookie"] = options.cookie;
  if (options.authHeader) headers["authorization"] = options.authHeader;
  return new NextRequest("http://localhost/api/test", { headers });
}

const MOCK_PAYLOAD = { userId: "507f1f77bcf86cd799439011", email: "user@example.com", tokenVersion: 1 };

/**
 * Registers common tokenVersion behaviour tests for both withAuth and withAuthAndParams.
 * invoke(handler, request) calls the wrapped handler and returns its response.
 * extraHandlerArgs are appended after auth in the handler's expected call args.
 */
function itBehavesLikeAuthWrapper(
  invoke: (handler: jest.Mock, request: NextRequest) => Promise<NextResponse>,
  extraHandlerArgs: unknown[] = []
) {
  it("calls handler with auth payload when token is valid and tokenVersion matches", async () => {
    mockedVerifyToken.mockReturnValue(MOCK_PAYLOAD);
    mockDb({ tokenVersion: 1 });
    const handler = jest.fn().mockResolvedValue(NextResponse.json({ ok: true }));
    const request = makeRequest({ cookie: "auth-token=valid.token" });
    const response = await invoke(handler, request);
    expect(handler).toHaveBeenCalledWith(request, MOCK_PAYLOAD, ...extraHandlerArgs);
    expect(response.status).toBe(200);
  });

  it("returns 401 when tokenVersion does not match user document (stale token)", async () => {
    mockedVerifyToken.mockReturnValue(MOCK_PAYLOAD);
    mockDb({ tokenVersion: 99 });
    const handler = jest.fn();
    const request = makeRequest({ cookie: "auth-token=valid.token" });
    const response = await invoke(handler, request);
    expect(handler).not.toHaveBeenCalled();
    expect(response.status).toBe(401);
  });

  it("returns 401 when user document is not found in DB", async () => {
    mockedVerifyToken.mockReturnValue(MOCK_PAYLOAD);
    mockDb(null);
    const handler = jest.fn();
    const request = makeRequest({ cookie: "auth-token=valid.token" });
    const response = await invoke(handler, request);
    expect(handler).not.toHaveBeenCalled();
    expect(response.status).toBe(401);
  });

  it("returns 401 and does not call handler when not authenticated", async () => {
    const handler = jest.fn();
    const request = makeRequest();
    const response = await invoke(handler, request);
    expect(handler).not.toHaveBeenCalled();
    expect(response.status).toBe(401);
  });

  it("allows legacy user with no tokenVersion in DB when JWT tokenVersion is 0", async () => {
    const legacyPayload = { ...MOCK_PAYLOAD, tokenVersion: 0 };
    mockedVerifyToken.mockReturnValue(legacyPayload);
    mockDb({});
    const handler = jest.fn().mockResolvedValue(NextResponse.json({ ok: true }));
    const request = makeRequest({ cookie: "auth-token=valid.token" });
    await invoke(handler, request);
    expect(handler).toHaveBeenCalled();
  });

  it("allows pre-rollout JWT with no tokenVersion field when DB tokenVersion is also 0", async () => {
    const preRolloutPayload = { userId: MOCK_PAYLOAD.userId, email: MOCK_PAYLOAD.email, tokenVersion: undefined as unknown as number };
    mockedVerifyToken.mockReturnValue(preRolloutPayload);
    mockDb({});
    const handler = jest.fn().mockResolvedValue(NextResponse.json({ ok: true }));
    const request = makeRequest({ cookie: "auth-token=valid.token" });
    await invoke(handler, request);
    expect(handler).toHaveBeenCalled();
  });

  it("returns 503 and logs error when DB throws during tokenVersion check", async () => {
    const dbError = new Error("DB connection failed");
    mockedVerifyToken.mockReturnValue(MOCK_PAYLOAD);
    mockedGetDatabase.mockRejectedValue(dbError);
    const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    const handler = jest.fn();
    const request = makeRequest({ cookie: "auth-token=valid.token" });
    const response = await invoke(handler, request);
    expect(handler).not.toHaveBeenCalled();
    expect(response.status).toBe(503);
    expect(consoleSpy).toHaveBeenCalledWith("tokenVersion verification failed:", dbError);
    consoleSpy.mockRestore();
  });
}

describe("lib/middleware", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("extractToken", () => {
    it("extracts token from Authorization Bearer header", () => {
      const request = makeRequest({ authHeader: "Bearer my.jwt.token" });
      expect(extractToken(request)).toBe("my.jwt.token");
    });

    it("extracts token from auth-token cookie", () => {
      const request = makeRequest({ cookie: "auth-token=cookie.jwt.token" });
      expect(extractToken(request)).toBe("cookie.jwt.token");
    });

    it("prefers Bearer header over cookie when both present", () => {
      const request = makeRequest({
        authHeader: "Bearer header.token",
        cookie: "auth-token=cookie.token",
      });
      expect(extractToken(request)).toBe("header.token");
    });

    it("returns null when no token is present", () => {
      const request = makeRequest();
      expect(extractToken(request)).toBeNull();
    });

    it("returns null when Authorization header is not Bearer", () => {
      const request = makeRequest({ authHeader: "Basic dXNlcjpwYXNz" });
      expect(extractToken(request)).toBeNull();
    });
  });

  describe("verifyAuth", () => {
    it("returns auth payload when token is valid", () => {
      mockedVerifyToken.mockReturnValue(MOCK_PAYLOAD);
      const request = makeRequest({ cookie: "auth-token=valid.token" });
      expect(verifyAuth(request)).toEqual(MOCK_PAYLOAD);
    });

    it("returns null when no token is present", () => {
      const request = makeRequest();
      expect(verifyAuth(request)).toBeNull();
      expect(mockedVerifyToken).not.toHaveBeenCalled();
    });

    it("returns null when token is invalid", () => {
      mockedVerifyToken.mockReturnValue(null);
      const request = makeRequest({ cookie: "auth-token=bad.token" });
      expect(verifyAuth(request)).toBeNull();
    });
  });

  describe("setAuthCookie", () => {
    it("sets auth-token cookie on response", () => {
      const response = new NextResponse();
      setAuthCookie(response, "my.jwt.token");
      const cookie = response.cookies.get("auth-token");
      expect(cookie?.value).toBe("my.jwt.token");
      expect(cookie?.httpOnly).toBe(true);
      expect(cookie?.path).toBe("/");
    });
  });

  describe("clearAuthCookie", () => {
    it("clears auth-token cookie value on response", () => {
      const response = new NextResponse();
      response.cookies.set("auth-token", "some.token");
      clearAuthCookie(response);
      // Next.js cookies.delete() sets an expired empty cookie rather than fully removing it
      const cookie = response.cookies.get("auth-token");
      expect(cookie?.value ?? "").toBe("");
    });
  });

  describe("requireAuth", () => {
    it("returns auth payload when authenticated", () => {
      mockedVerifyToken.mockReturnValue(MOCK_PAYLOAD);
      const request = makeRequest({ cookie: "auth-token=valid.token" });
      const result = requireAuth(request);
      expect(result).toEqual(MOCK_PAYLOAD);
    });

    it("returns 401 response when not authenticated", () => {
      const request = makeRequest();
      const result = requireAuth(request);
      expect(result).toBeInstanceOf(NextResponse);
      expect((result as NextResponse).status).toBe(401);
    });
  });

  describe("withAuth", () => {
    itBehavesLikeAuthWrapper((handler, req) => withAuth(handler)(req));
  });

  describe("withAuthAndParams", () => {
    const params = Promise.resolve({ id: "item-1" });
    itBehavesLikeAuthWrapper(
      (handler, req) => withAuthAndParams(handler)(req, { params }),
      [{ id: "item-1" }]
    );
  });
});
