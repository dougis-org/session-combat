import { setupTestServer } from "@/tests/integration/helpers/server";
import {
  apiCall,
  createTestEmail,
  registerUser,
  loginUser,
  assertSuccessResponse,
  assertErrorResponse,
  extractAuthCookie,
  parseJsonResponse,
  VALID_PASSWORD,
  INVALID_EMAILS,
} from "@/tests/integration/auth.test.helpers";

/**
 * Integration tests for POST /api/auth/login
 * Consolidated test patterns to minimize duplication
 */
describe("POST /api/auth/login - Integration Tests", () => {
  const ctx = setupTestServer();

  it("should login with valid email and password", async () => {
    const email = createTestEmail("user");
    await registerUser(ctx.baseUrl, email, VALID_PASSWORD);

    const response = await loginUser(ctx.baseUrl, email, VALID_PASSWORD);
    const data = await assertSuccessResponse<{
      userId: string;
      email: string;
    }>(response, 200);

    expect(data.userId).toBeDefined();
    expect(data.email).toBe(email);

    const cookie = extractAuthCookie(response);
    expect(cookie).toBeTruthy();
    expect(cookie).toContain("auth-token=");

    // Ensure the issued cookie can be used for authenticated requests
    const meResponse = await apiCall(ctx.baseUrl, "/api/auth/me", {
      method: "GET",
      cookie: cookie ?? undefined,
    });
    const meData = await parseJsonResponse<{
      authenticated: boolean;
      userId: string;
      email: string;
    }>(meResponse);

    expect(meData.authenticated).toBe(true);
    expect(meData.email).toBe(email);
  });

  it("should return 401 for authentication failures", async () => {
    // Wrong password
    const email1 = createTestEmail("wrong-password-test");
    await registerUser(ctx.baseUrl, email1, VALID_PASSWORD);
    let response = await loginUser(ctx.baseUrl, email1, "WrongPassword456!");
    expect(response.status).toBe(401);

    // Non-existent user
    const nonexistentEmail = createTestEmail("nonexistent");
    response = await loginUser(ctx.baseUrl, nonexistentEmail, VALID_PASSWORD);
    expect(response.status).toBe(401);
  });

  it("should reject all invalid email formats", async () => {
    for (const email of INVALID_EMAILS) {
      const response = await loginUser(ctx.baseUrl, email, VALID_PASSWORD);
      await assertErrorResponse(response, 400);
    }
  });

  it("should reject missing email and password fields", async () => {
    // Missing email
    let response = await loginUser(ctx.baseUrl, "", VALID_PASSWORD);
    expect(response.status).toBe(400);

    // Missing password
    const email = createTestEmail("missing-password");
    response = await loginUser(ctx.baseUrl, email, "");
    expect(response.status).toBe(400);
  });
});
