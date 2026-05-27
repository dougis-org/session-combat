/**
 * @jest-environment node
 */
import { NextRequest } from "next/server";
import { POST } from "@/app/api/auth/logout/route";
import { clearAuthCookie } from "@/lib/middleware";

jest.mock("@/lib/middleware", () => ({
  clearAuthCookie: jest.fn(),
}));

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

  it("returns 200 and clears cookie even when no auth token is present (idempotent)", async () => {
    const response = await POST(makeRequest());

    expect(response.status).toBe(200);
    expect(mockedClearAuthCookie).toHaveBeenCalledTimes(1);
  });

  it("returns 200 and clears cookie when auth token is valid", async () => {
    const response = await POST(makeRequest("auth-token=valid.jwt.token"));

    expect(response.status).toBe(200);
    expect(mockedClearAuthCookie).toHaveBeenCalledTimes(1);
  });

  it("returns 500 when clearAuthCookie throws unexpectedly", async () => {
    mockedClearAuthCookie.mockImplementation(() => {
      throw new Error("Unexpected cookie error");
    });

    const response = await POST(makeRequest("auth-token=valid.jwt.token"));

    expect(response.status).toBe(500);
    const body = await response.json();
    expect(body.error).toBeDefined();
  });
});
