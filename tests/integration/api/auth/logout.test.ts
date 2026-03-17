import fetch from "node-fetch";
import {
  startTestServer,
  registerAndGetCookie,
  TestServer,
} from "@/tests/integration/helpers/server";
import { createTestEmail, apiCall } from "@/tests/integration/auth.test.helpers";

/**
 * Integration tests for POST /api/auth/logout
 * Uses real MongoDB test container and Next.js server
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

  it("should logout and clear auth cookie", async () => {
    const email = createTestEmail("user");
    const password = "ValidPassword123!";

    // Register and get cookie
    const cookie = await registerAndGetCookie(baseUrl, email, password);

    const response = await apiCall(baseUrl, "/api/auth/logout", {
      cookie,
    });

    expect(response.status).toBe(200);
    const data = (await response.json()) as any;
    expect(data.message).toContain("Logout successful");

    // Check that auth cookie is cleared
    const setCookie = response.headers.get("set-cookie");
    expect(setCookie).toBeDefined();
    expect(setCookie).toContain("auth");
  });

  it("should succeed even without auth token", async () => {
    const response = await apiCall(baseUrl, "/api/auth/logout");

    expect(response.status).toBe(200);
    const data = (await response.json()) as any;
    expect(data.message).toContain("Logout successful");
  });

  it("should succeed with invalid token", async () => {
    const response = await apiCall(baseUrl, "/api/auth/logout", {
      cookie: "auth=invalid-token-xyz",
    });

    expect(response.status).toBe(200);
  });

  it("should clear cookie even with malformed header", async () => {
    const response = await apiCall(baseUrl, "/api/auth/logout", {
      cookie: "auth=",
    });

    expect(response.status).toBe(200);
    const setCookie = response.headers.get("set-cookie");
    expect(setCookie).toContain("auth");
  });

  it("should be idempotent - logout twice should both succeed", async () => {
    const email = createTestEmail("user");
    const password = "ValidPassword123!";

    // Register and get cookie
    const cookie = await registerAndGetCookie(baseUrl, email, password);

    const response1 = await apiCall(baseUrl, "/api/auth/logout", {
      cookie,
    });

    const response2 = await apiCall(baseUrl, "/api/auth/logout");

    expect(response1.status).toBe(200);
    expect(response2.status).toBe(200);
  });

  it("should return success message", async () => {
    const response = await apiCall(baseUrl, "/api/auth/logout");

    const data = (await response.json()) as any;
    expect(data.message).toBeDefined();
    expect(typeof data.message).toBe("string");
    expect(data.message.length).toBeGreaterThan(0);
  });

  it("should be parallel-safe with concurrent logouts", async () => {
    const logoutRequests = Array.from({ length: 3 }, () =>
      apiCall(baseUrl, "/api/auth/logout")
    );

    const responses = await Promise.all(logoutRequests);

    // All should succeed
    responses.forEach((response) => {
      expect(response.status).toBe(200);
    });
  });
});
