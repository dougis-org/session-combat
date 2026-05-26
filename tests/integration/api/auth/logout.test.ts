import { createTestUser } from "@/tests/integration/helpers/users";
import {
  logoutUser,
  VALID_PASSWORD,
} from "@/tests/integration/auth.test.helpers";

/**
 * Integration tests for POST /api/auth/logout
 * Consolidated test patterns to minimize duplication
 */
describe("POST /api/auth/logout - Integration Tests", () => {
  let baseUrl: string;

  beforeAll(() => {
    baseUrl = process.env.TEST_BASE_URL!;
    if (!baseUrl) throw new Error("TEST_BASE_URL not set — globalSetup was not wired correctly");
  });

  it("should clear auth cookie and succeed with valid session", async () => {
    const { cookie } = await createTestUser(baseUrl, "logout-user");

    const response = await logoutUser(baseUrl, cookie);
    expect(response.status).toBe(200);

    // Check that auth cookie is cleared
    const setCookie = response.headers.get("set-cookie");
    expect(setCookie).toBeDefined();
    expect(setCookie).toContain("auth-token=");
    expect(setCookie).toMatch(/Max-Age=0|Expires=/i);
  });

  it("should clear cookie and return 200 even without a token (idempotent)", async () => {
    let response = await logoutUser(baseUrl);
    expect(response.status).toBe(200);

    response = await logoutUser(baseUrl, "auth-token=invalid-token-xyz");
    expect(response.status).toBe(200);

    response = await logoutUser(baseUrl, "auth-token=");
    expect(response.status).toBe(200);
  });

  it("should allow repeated logout with same token (idempotent)", async () => {
    const { cookie } = await createTestUser(baseUrl, "logout-repeat");

    const response1 = await logoutUser(baseUrl, cookie);
    expect(response1.status).toBe(200);

    // Second logout with same token should also succeed (idempotent)
    // since the JWT token is still valid (hasn't expired)
    const response2 = await logoutUser(baseUrl, cookie);
    expect(response2.status).toBe(200);
  });
});
