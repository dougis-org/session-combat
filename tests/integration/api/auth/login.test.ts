import fetch from "node-fetch";
import { startTestServer, TestServer } from "@/tests/integration/helpers/server";
import { createTestEmail, apiCall } from "@/tests/integration/auth.test.helpers";

/**
 * Integration tests for POST /api/auth/login
 * Uses real MongoDB test container and Next.js server
 */
describe("POST /api/auth/login - Integration Tests", () => {
  let server: TestServer;
  let baseUrl: string;

  beforeAll(async () => {
    server = await startTestServer();
    baseUrl = server.baseUrl;
  }, 120000);

  afterAll(async () => {
    await server.cleanup();
  }, 30000);

  it("should login with valid email and password", async () => {
    const email = createTestEmail("user");
    const password = "ValidPassword123!";

    // Register first
    await apiCall(baseUrl, "/api/auth/register", {
      body: { email, password },
    });

    // Then login
    const response = await apiCall(baseUrl, "/api/auth/login", {
      body: { email, password },
    });

    expect(response.status).toBe(200);
    const data = (await response.json()) as any;
    expect(data.userId).toBeDefined();
    expect(data.email).toBe(email);
    expect(data.message).toContain("Login successful");
  });

  it("should return 401 when password is wrong", async () => {
    const email = createTestEmail("wrong-password-test");
    const password = "ValidPassword123!";

    // Register first
    await apiCall(baseUrl, "/api/auth/register", {
      body: { email, password },
    });

    // Try to login with wrong password
    const response = await apiCall(baseUrl, "/api/auth/login", {
      body: { email, password: "WrongPassword456!" },
    });

    expect(response.status).toBe(401);
    const data = (await response.json()) as any;
    expect(data.error).toContain("Invalid email or password");
  });

  it("should return 401 when user does not exist", async () => {
    const payload = {
      email: createTestEmail("nonexistent"),
      password: "ValidPassword123!",
    };

    const response = await apiCall(baseUrl, "/api/auth/login", {
      body: payload,
    });

    expect(response.status).toBe(401);
    const data = (await response.json()) as any;
    expect(data.error).toContain("Invalid email or password");
  });

  it("should return 400 when email is missing", async () => {
    const payload = { password: "ValidPassword123!" };

    const response = await apiCall(baseUrl, "/api/auth/login", {
      body: payload,
    });

    expect(response.status).toBe(400);
    const data = (await response.json()) as any;
    expect(data.error).toContain("required");
  });

  it("should return 400 when password is missing", async () => {
    const payload = { email: createTestEmail("no-password") };

    const response = await apiCall(baseUrl, "/api/auth/login", {
      body: payload,
    });

    expect(response.status).toBe(400);
    const data = (await response.json()) as any;
    expect(data.error).toContain("required");
  });

  it("should return 400 when email format is invalid", async () => {
    const payload = { email: "notanemail", password: "ValidPassword123!" };

    const response = await apiCall(baseUrl, "/api/auth/login", {
      body: payload,
    });

    expect(response.status).toBe(400);
    const data = (await response.json()) as any;
    expect(data.error).toContain("Invalid email");
  });

  it("should set auth cookie in response on success", async () => {
    const email = createTestEmail("cookietest");
    const password = "ValidPassword123!";

    // Register first
    await apiCall(baseUrl, "/api/auth/register", {
      body: { email, password },
    });

    // Login
    const response = await apiCall(baseUrl, "/api/auth/login", {
      body: { email, password },
    });

    expect(response.status).toBe(200);
    const setCookie = response.headers.get("set-cookie");
    expect(setCookie).toBeDefined();
    expect(setCookie).toContain("auth");
  });

  it("should be parallel-safe with different users", async () => {
    const users = [
      { email: createTestEmail("parallel-user1"), password: "ValidPassword123!" },
      { email: createTestEmail("parallel-user2"), password: "ValidPassword456!" },
      { email: createTestEmail("parallel-user3"), password: "ValidPassword789!" },
    ];

    // Register all users
    for (const user of users) {
      await apiCall(baseUrl, "/api/auth/register", {
        body: user,
      });
    }

    // Login all users in parallel
    const responses = await Promise.all(
      users.map((user) =>
        apiCall(baseUrl, "/api/auth/login", {
          body: user,
        })
      )
    );

    // All should succeed
    responses.forEach((response) => {
      expect(response.status).toBe(200);
    });
  });

  it("should not expose password hash in response", async () => {
    const email = createTestEmail("hash-test");
    const password = "ValidPassword123!";

    // Register first
    await apiCall(baseUrl, "/api/auth/register", {
      body: { email, password },
    });

    // Login
    const response = await apiCall(baseUrl, "/api/auth/login", {
      body: { email, password },
    });

    const data = (await response.json()) as any;
    expect(data.passwordHash).toBeUndefined();
    expect(Object.keys(data)).not.toContain("passwordHash");
  });
});
