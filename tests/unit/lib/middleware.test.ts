import { NextRequest, NextResponse } from "next/server";
import {
  extractToken,
  verifyAuth,
  setAuthCookie,
  clearAuthCookie,
  requireAuth,
} from "@/lib/middleware";
import { verifyToken } from "@/lib/auth";

jest.mock("@/lib/auth", () => ({
  verifyToken: jest.fn(),
}));

const mockedVerifyToken = jest.mocked(verifyToken);

function makeRequest(options: {
  cookie?: string;
  authHeader?: string;
} = {}): NextRequest {
  const headers: Record<string, string> = {};
  if (options.cookie) headers["cookie"] = options.cookie;
  if (options.authHeader) headers["authorization"] = options.authHeader;
  return new NextRequest("http://localhost/api/test", { headers });
}

const MOCK_PAYLOAD = { userId: "user-123", email: "user@example.com" };

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
});
