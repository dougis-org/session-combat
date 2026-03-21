import { NextRequest } from "next/server";
import { GET } from "@/app/api/auth/me/route";
import { verifyAuth } from "@/lib/middleware";

jest.mock("@/lib/middleware", () => ({ verifyAuth: jest.fn() }));

const mockedVerifyAuth = jest.mocked(verifyAuth);

// me/route.ts uses require('@/lib/db').getDatabase at runtime
const mockFindOne = jest.fn();
jest.mock("@/lib/db", () => ({
  getDatabase: jest.fn().mockResolvedValue({
    collection: jest.fn().mockReturnValue({ findOne: mockFindOne }),
  }),
}));

function makeRequest(cookie?: string): NextRequest {
  return new NextRequest("http://localhost/api/auth/me", {
    method: "GET",
    headers: cookie ? { cookie } : {},
  });
}

describe("GET /api/auth/me", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns 401 when not authenticated", async () => {
    mockedVerifyAuth.mockReturnValue(null);
    const response = await GET(makeRequest());
    expect(response.status).toBe(401);
    const body = await response.json();
    expect(body.authenticated).toBe(false);
  });

  it("returns 200 with user info and isAdmin=false for regular user", async () => {
    mockedVerifyAuth.mockReturnValue({
      userId: "507f1f77bcf86cd799439011",
      email: "user@example.com",
    });
    mockFindOne.mockResolvedValue({ isAdmin: false });

    const response = await GET(makeRequest("auth-token=valid.token"));

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.authenticated).toBe(true);
    expect(body.email).toBe("user@example.com");
    expect(body.isAdmin).toBe(false);
  });

  it("returns 200 with isAdmin=true for admin user", async () => {
    mockedVerifyAuth.mockReturnValue({
      userId: "507f1f77bcf86cd799439011",
      email: "admin@example.com",
    });
    mockFindOne.mockResolvedValue({ isAdmin: true });

    const response = await GET(makeRequest("auth-token=admin.token"));

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.isAdmin).toBe(true);
  });

  it("returns 200 with isAdmin=false when DB lookup fails", async () => {
    mockedVerifyAuth.mockReturnValue({
      userId: "507f1f77bcf86cd799439011",
      email: "user@example.com",
    });
    mockFindOne.mockRejectedValue(new Error("DB error"));

    const response = await GET(makeRequest("auth-token=valid.token"));

    // Still authenticated even if admin check fails
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.authenticated).toBe(true);
    expect(body.isAdmin).toBe(false);
  });

  it("sets Cache-Control: no-store on response", async () => {
    mockedVerifyAuth.mockReturnValue({
      userId: "507f1f77bcf86cd799439011",
      email: "user@example.com",
    });
    mockFindOne.mockResolvedValue({});

    const response = await GET(makeRequest("auth-token=valid.token"));

    expect(response.headers.get("Cache-Control")).toBe("no-store");
  });
});
