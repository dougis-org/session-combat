import { requireAdmin } from "@/lib/api-helpers";
import { requireAuth } from "@/lib/middleware";
import { isUserAdmin } from "@/lib/permissions";
import { NextResponse } from "next/server";
import { makeRouteRequest, ADMIN_AUTH, MOCK_AUTH } from "@/tests/unit/helpers/route.test.helpers";

jest.mock("@/lib/middleware", () => ({ requireAuth: jest.fn() }));
jest.mock("@/lib/permissions", () => ({ isUserAdmin: jest.fn() }));

const mockedRequireAuth = jest.mocked(requireAuth);
const mockedIsUserAdmin = jest.mocked(isUserAdmin);

describe("requireAdmin", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns null when user is authenticated and is an admin", async () => {
    mockedRequireAuth.mockReturnValue(ADMIN_AUTH);
    mockedIsUserAdmin.mockResolvedValue(true);

    const req = makeRouteRequest("http://localhost/api/test", "POST", {});
    const result = await requireAdmin(req);

    expect(result).toBeNull();
    expect(mockedRequireAuth).toHaveBeenCalledWith(req);
    expect(mockedIsUserAdmin).toHaveBeenCalledWith(ADMIN_AUTH.userId);
  });

  it("returns 401 when requireAuth returns a response", async () => {
    const authResponse = NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    mockedRequireAuth.mockReturnValue(authResponse);

    const req = makeRouteRequest("http://localhost/api/test", "POST", {});
    const result = await requireAdmin(req);

    expect(result).toBe(authResponse);
    expect(mockedIsUserAdmin).not.toHaveBeenCalled();
  });

  it("returns 500 when isUserAdmin returns null (DB error)", async () => {
    mockedRequireAuth.mockReturnValue(ADMIN_AUTH);
    mockedIsUserAdmin.mockResolvedValue(null);

    const req = makeRouteRequest("http://localhost/api/test", "POST", {});
    const result = await requireAdmin(req);

    expect(result?.status).toBe(500);
    const body = await result?.json();
    expect(body.error).toBe("Internal server error");
  });

  it("returns 403 when isUserAdmin returns false (not an admin)", async () => {
    mockedRequireAuth.mockReturnValue(MOCK_AUTH);
    mockedIsUserAdmin.mockResolvedValue(false);

    const req = makeRouteRequest("http://localhost/api/test", "POST", {});
    const result = await requireAdmin(req);

    expect(result?.status).toBe(403);
    const body = await result?.json();
    expect(body.error).toBe("Only administrators can perform this action");
  });
});