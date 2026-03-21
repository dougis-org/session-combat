import { NextRequest } from "next/server";
import { POST } from "@/app/api/auth/logout/route";
import { verifyAuth, clearAuthCookie } from "@/lib/middleware";

jest.mock("@/lib/middleware", () => ({
  verifyAuth: jest.fn(),
  clearAuthCookie: jest.fn(),
}));

const mockedVerifyAuth = jest.mocked(verifyAuth);
const mockedClearAuthCookie = jest.mocked(clearAuthCookie);

function makeRequest(cookie?: string): NextRequest {
  return new NextRequest("http://localhost/api/auth/logout", {
    method: "POST",
    headers: cookie ? { cookie } : {},
  });
}

describe("POST /api/auth/logout", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns 401 when no auth token is present", async () => {
    mockedVerifyAuth.mockReturnValue(null);

    const response = await POST(makeRequest());

    expect(response.status).toBe(401);
    const body = await response.json();
    expect(body.error).toBeDefined();
    expect(mockedClearAuthCookie).not.toHaveBeenCalled();
  });

  it("returns 200 and clears cookie when auth token is valid", async () => {
    mockedVerifyAuth.mockReturnValue({
      userId: "user-123",
      email: "user@example.com",
    });

    const response = await POST(makeRequest("auth-token=valid.jwt.token"));

    expect(response.status).toBe(200);
    expect(mockedClearAuthCookie).toHaveBeenCalledTimes(1);
  });

  it("returns 500 when verifyAuth throws unexpectedly", async () => {
    mockedVerifyAuth.mockImplementation(() => {
      throw new Error("Unexpected auth error");
    });

    const response = await POST(makeRequest("auth-token=valid.jwt.token"));

    expect(response.status).toBe(500);
    const body = await response.json();
    expect(body.error).toBeDefined();
  });
});
