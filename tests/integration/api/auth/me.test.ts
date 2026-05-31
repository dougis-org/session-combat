import {
  apiCall,
  createTestEmail,
  registerUser,
  assertSuccessResponse,
  assertErrorResponse,
  extractAuthCookie,
  parseJsonResponse,
  VALID_PASSWORD,
} from "@/tests/integration/auth.test.helpers";

describe("GET /api/auth/me - Integration Tests", () => {
  let baseUrl: string;

  beforeAll(() => {
    baseUrl = process.env.TEST_BASE_URL!;
    if (!baseUrl) throw new Error("TEST_BASE_URL not set — globalSetup was not wired correctly");
  });

  it("should return the username for an authenticated user", async () => {
    const email = createTestEmail("me-auth");
    const username = "dougme42";

    // Register user with specific username
    const registerResponse = await registerUser(baseUrl, email, VALID_PASSWORD, username);
    expect(registerResponse.status).toBe(201);
    const cookie = extractAuthCookie(registerResponse);
    expect(cookie).toBeTruthy();

    // GET /api/auth/me with auth cookie
    const response = await apiCall(baseUrl, "/api/auth/me", {
      method: "GET",
      cookie: cookie ?? undefined,
    });

    const data = await assertSuccessResponse<{
      authenticated: boolean;
      userId: string;
      email: string;
      isAdmin: boolean;
      username: string;
    }>(response, 200);

    // Verify username is returned and all legacy fields are present
    expect(data.username).toBe(username);
    expect(data.authenticated).toBe(true);
    expect(data.userId).toBeDefined();
    expect(data.email).toBe(email);
    expect(data.isAdmin).toBe(false);
  });

  it("should return 401 for an unauthenticated request", async () => {
    const response = await apiCall(baseUrl, "/api/auth/me", {
      method: "GET",
    });
    await assertErrorResponse(response, 401);
  });
});
