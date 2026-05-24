import { NextRequest } from "next/server";
import { GET } from "@/app/api/auth/me/route";
import { verifyToken } from "@/lib/auth";
import { getDatabase } from "@/lib/db";

jest.mock("@/lib/auth", () => ({ verifyToken: jest.fn() }));
jest.mock("@/lib/db", () => ({ getDatabase: jest.fn() }));

const mockedVerifyToken = jest.mocked(verifyToken);
const mockedGetDatabase = jest.mocked(getDatabase);

const MOCK_AUTH = {
  userId: "507f1f77bcf86cd799439011",
  email: "user@example.com",
  tokenVersion: 0,
};

function setupDb(firstUser: Record<string, unknown> | null, secondUser?: Record<string, unknown> | null) {
  const findOne = jest.fn();
  findOne.mockResolvedValueOnce(firstUser);
  if (secondUser !== undefined) findOne.mockResolvedValueOnce(secondUser);
  mockedGetDatabase.mockResolvedValue({
    collection: jest.fn().mockReturnValue({ findOne }),
  } as any);
}

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

  it("returns 401 when not authenticated (no token)", async () => {
    mockedVerifyToken.mockReturnValue(null);
    const response = await GET(makeRequest());
    expect(response.status).toBe(401);
  });

  it("returns 401 when tokenVersion does not match DB (stale token)", async () => {
    mockedVerifyToken.mockReturnValue(MOCK_AUTH);
    setupDb({ tokenVersion: 99, isAdmin: false });

    const response = await GET(makeRequest("auth-token=valid.token"));
    expect(response.status).toBe(401);
  });

  it("returns 200 with user info and isAdmin=false for regular user", async () => {
    mockedVerifyToken.mockReturnValue(MOCK_AUTH);
    setupDb({ tokenVersion: 0, isAdmin: false }, { tokenVersion: 0, isAdmin: false });

    const response = await GET(makeRequest("auth-token=valid.token"));

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.authenticated).toBe(true);
    expect(body.email).toBe("user@example.com");
    expect(body.isAdmin).toBe(false);
  });

  it("returns 200 with isAdmin=true for admin user", async () => {
    mockedVerifyToken.mockReturnValue({ ...MOCK_AUTH, email: "admin@example.com" });
    setupDb({ tokenVersion: 0, isAdmin: true }, { tokenVersion: 0, isAdmin: true });

    const response = await GET(makeRequest("auth-token=admin.token"));

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.isAdmin).toBe(true);
  });

  it("returns 200 with isAdmin=false when admin DB lookup fails but tokenVersion check passes", async () => {
    mockedVerifyToken.mockReturnValue(MOCK_AUTH);
    const findOne = jest.fn()
      .mockResolvedValueOnce({ tokenVersion: 0 })
      .mockRejectedValueOnce(new Error("DB error"));
    mockedGetDatabase.mockResolvedValue({
      collection: jest.fn().mockReturnValue({ findOne }),
    } as any);

    const response = await GET(makeRequest("auth-token=valid.token"));

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.authenticated).toBe(true);
    expect(body.isAdmin).toBe(false);
  });

  it("sets Cache-Control: no-store on response", async () => {
    mockedVerifyToken.mockReturnValue(MOCK_AUTH);
    setupDb({ tokenVersion: 0, isAdmin: false }, { tokenVersion: 0, isAdmin: false });

    const response = await GET(makeRequest("auth-token=valid.token"));

    expect(response.headers.get("Cache-Control")).toBe("no-store");
  });
});
