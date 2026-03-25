import {
  startTestServer,
  registerAndGetCookie,
  TestServer,
} from "@/tests/integration/helpers/server";
import {
  createTestEmail,
  logoutUser,
  VALID_PASSWORD,
} from "@/tests/integration/auth.test.helpers";

/**
 * Integration tests for POST /api/auth/logout
 * Consolidated test patterns to minimize duplication
 */
describe("POST /api/auth/logout - Integration Tests", () => {
  let server: TestServer;
  let baseUrl: string;

  beforeAll(async () => {
    server = await startTestServer();
    baseUrl = server.baseUrl;
  }, 120000);

  afterAll(async () => {
    await server.cleanup();
  }, 30000);

  it("should clear auth cookie and succeed with valid session", async () => {
    const email = createTestEmail("user");
    const cookie = await registerAndGetCookie(baseUrl, email, VALID_PASSWORD);

    const response = await logoutUser(baseUrl, cookie);
    expect(response.status).toBe(200);

    // Check that auth cookie is cleared
    const setCookie = response.headers.get("set-cookie");
    expect(setCookie).toBeDefined();
    expect(setCookie).toContain("auth-token=");
  });

  it("should reject logout without token or with invalid tokens", async () => {
    // No session - should return 401
    let response = await logoutUser(baseUrl);
    expect(response.status).toBe(401);

    // Invalid token - should return 401
    response = await logoutUser(baseUrl, "auth-token=invalid-token-xyz");
    expect(response.status).toBe(401);

    // Empty cookie value - should return 401
    response = await logoutUser(baseUrl, "auth-token=");
    expect(response.status).toBe(401);
  });

  it("should allow repeated logout with same token (idempotent)", async () => {
    const email = createTestEmail("user");
    const cookie = await registerAndGetCookie(baseUrl, email, VALID_PASSWORD);

    const response1 = await logoutUser(baseUrl, cookie);
    expect(response1.status).toBe(200);

    // Second logout with same token should also succeed (idempotent)
    // since the JWT token is still valid (hasn't expired)
    const response2 = await logoutUser(baseUrl, cookie);
    expect(response2.status).toBe(200);
  });
});
