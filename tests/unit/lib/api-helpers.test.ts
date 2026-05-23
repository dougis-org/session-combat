import { requireAdmin } from "@/lib/api-helpers";
import { requireAuth } from "@/lib/middleware";
import { getUserById, InvalidUserIdError } from "@/lib/permissions";
import { NextResponse } from "next/server";
import { makeRouteRequest, ADMIN_AUTH } from "@/tests/unit/helpers/route.test.helpers";

jest.mock("@/lib/middleware", () => ({ requireAuth: jest.fn() }));
jest.mock("@/lib/permissions", () => ({
  getUserById: jest.fn(),
  InvalidUserIdError: class InvalidUserIdError extends Error {
    constructor(userId: string) {
      super(`Invalid userId: ${userId}`);
      this.name = "InvalidUserIdError";
    }
  },
}));

const mockedRequireAuth = jest.mocked(requireAuth);
const mockedGetUserById = jest.mocked(getUserById);

describe("requireAdmin", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns null when user is authenticated and is an admin", async () => {
    mockedRequireAuth.mockReturnValue(ADMIN_AUTH);
    mockedGetUserById.mockResolvedValue({ tokenVersion: ADMIN_AUTH.tokenVersion, isAdmin: true });

    const req = makeRouteRequest("http://localhost/api/test", "POST", {});
    const result = await requireAdmin(req);

    expect(result).toBeNull();
    expect(mockedRequireAuth).toHaveBeenCalledWith(req);
    expect(mockedGetUserById).toHaveBeenCalledWith(ADMIN_AUTH.userId);
  });

  it("returns 401 when requireAuth returns a response", async () => {
    const authResponse = NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    mockedRequireAuth.mockReturnValue(authResponse);

    const req = makeRouteRequest("http://localhost/api/test", "POST", {});
    const result = await requireAdmin(req);

    expect(result).toBe(authResponse);
    expect(mockedGetUserById).not.toHaveBeenCalled();
  });

  it("returns 401 when tokenVersion does not match DB", async () => {
    mockedRequireAuth.mockReturnValue(ADMIN_AUTH);
    mockedGetUserById.mockResolvedValue({ tokenVersion: 99, isAdmin: true });

    const req = makeRouteRequest("http://localhost/api/test", "POST", {});
    const result = await requireAdmin(req);

    expect(result?.status).toBe(401);
  });

  it("allows legacy user with no tokenVersion in DB when JWT tokenVersion is 0", async () => {
    const legacyAuth = { ...ADMIN_AUTH, tokenVersion: 0 };
    mockedRequireAuth.mockReturnValue(legacyAuth);
    mockedGetUserById.mockResolvedValue({ isAdmin: true });

    const req = makeRouteRequest("http://localhost/api/test", "POST", {});
    const result = await requireAdmin(req);

    expect(result).toBeNull();
  });

  it("returns 401 when userId is invalid", async () => {
    mockedRequireAuth.mockReturnValue(ADMIN_AUTH);
    const { InvalidUserIdError: MockInvalidUserIdError } = jest.requireMock("@/lib/permissions");
    mockedGetUserById.mockRejectedValue(new MockInvalidUserIdError(ADMIN_AUTH.userId));

    const req = makeRouteRequest("http://localhost/api/test", "POST", {});
    const result = await requireAdmin(req);

    expect(result?.status).toBe(401);
  });

  it("returns 500 when getUserById throws a DB error", async () => {
    mockedRequireAuth.mockReturnValue(ADMIN_AUTH);
    mockedGetUserById.mockRejectedValue(new Error("DB connection failed"));

    const req = makeRouteRequest("http://localhost/api/test", "POST", {});
    const result = await requireAdmin(req);

    expect(result?.status).toBe(500);
    const body = await result?.json();
    expect(body.error).toBe("Internal server error");
  });

  it("returns 403 when user is not an admin", async () => {
    mockedRequireAuth.mockReturnValue(ADMIN_AUTH);
    mockedGetUserById.mockResolvedValue({ tokenVersion: ADMIN_AUTH.tokenVersion, isAdmin: false });

    const req = makeRouteRequest("http://localhost/api/test", "POST", {});
    const result = await requireAdmin(req);

    expect(result?.status).toBe(403);
    const body = await result?.json();
    expect(body.error).toBe("Only administrators can perform this action");
  });
});
