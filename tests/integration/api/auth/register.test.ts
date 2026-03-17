import fetch from "node-fetch";
import {
  startTestServer,
  TestServer,
} from "@/tests/integration/helpers/server";
import { createTestEmail, apiCall } from "@/tests/integration/auth.test.helpers";

/**
 * Integration tests for POST /api/auth/register
 * Uses real MongoDB test container and Next.js server
 */
describe("POST /api/auth/register - Integration Tests", () => {
  let server: TestServer;
  let baseUrl: string;

  beforeAll(async () => {
    server = await startTestServer();
    baseUrl = server.baseUrl;
  }, 120000);

  afterAll(async () => {
    await server.cleanup();
  }, 30000);

  it("should register new user with valid email and password", async () => {
    const payload = {
      email: createTestEmail("newuser"),
      password: "ValidPassword123!",
    };

    const response = await apiCall(baseUrl, "/api/auth/register", {
      body: payload,
    });

    expect(response.status).toBe(201);
    const data = (await response.json()) as any;
    expect(data.userId).toBeDefined();
    expect(data.email).toBe(payload.email);
    expect(data.message).toContain("User registered successfully");
  });

  it("should return 409 when email already exists", async () => {
    const email = createTestEmail("existing");
    const password = "ValidPassword123!";

    // Create first user
    const firstPayload = { email, password };
    await apiCall(baseUrl, "/api/auth/register", {
      body: firstPayload,
    });

    // Try to register same email again
    const secondPayload = { email, password: "DifferentPassword123!" };
    const response = await apiCall(baseUrl, "/api/auth/register", {
      body: secondPayload,
    });

    expect(response.status).toBe(409);
    const data = (await response.json()) as any;
    expect(data.error).toContain("already exists");
  });

  it("should return 400 when email format is invalid", async () => {
    const invalidEmails = [
      "notanemail",
      "@example.com",
      "user@",
      "user@example",
    ];

    for (const email of invalidEmails) {
      const payload = { email, password: "ValidPassword123!" };
      const response = await apiCall(baseUrl, "/api/auth/register", {
        body: payload,
      });

      expect(response.status).toBe(400);
      const data = (await response.json()) as any;
      expect(data.error).toContain("Invalid email");
    }
  });

  it("should return 400 when password is weak", async () => {
    const weakPasswords = [
      "short",
      "nouppercase123",
      "NOLOWERCASE123",
      "NoNumbers",
    ];

    for (const password of weakPasswords) {
      const payload = {
        email: createTestEmail("weak-password-test"),
        password,
      };
      const response = await apiCall(baseUrl, "/api/auth/register", {
        body: payload,
      });

      expect(response.status).toBe(400);
      const data = (await response.json()) as any;
      expect(data.error).toContain("Password");
    }
  });

  it("should return 400 when email is missing", async () => {
    const payload = { password: "ValidPassword123!" };
    const response = await apiCall(baseUrl, "/api/auth/register", {
      body: payload,
    });

    expect(response.status).toBe(400);
    const data = (await response.json()) as any;
    expect(data.error).toContain("required");
  });

  it("should return 400 when password is missing", async () => {
    const payload = { email: createTestEmail("no-password") };
    const response = await apiCall(baseUrl, "/api/auth/register", {
      body: payload,
    });

    expect(response.status).toBe(400);
    const data = (await response.json()) as any;
    expect(data.error).toContain("required");
  });

  it("should set auth cookie in response", async () => {
    const payload = {
      email: createTestEmail("cookietest"),
      password: "ValidPassword123!",
    };

    const response = await apiCall(baseUrl, "/api/auth/register", {
      body: payload,
    });

    const setCookie = response.headers.get("set-cookie");
    expect(setCookie).toBeDefined();
    expect(setCookie).toContain("auth");
  });

  it("should handle special characters in email", async () => {
    const payload = {
      email: `user+test-${Date.now()}-${Math.random().toString(36).slice(2, 11)}@example.co.uk`,
      password: "ValidPassword123!",
    };

    const response = await apiCall(baseUrl, "/api/auth/register", {
      body: payload,
    });

    expect(response.status).toBe(201);
    const data = (await response.json()) as any;
    expect(data.email).toBe(payload.email);
  });

  it("should be parallel-safe with different users", async () => {
    const users = [
      {
        email: createTestEmail("parallel-user1"),
        password: "ValidPassword123!",
      },
      {
        email: createTestEmail("parallel-user2"),
        password: "ValidPassword456!",
      },
      {
        email: createTestEmail("parallel-user3"),
        password: "ValidPassword789!",
      },
    ];

    const responses = await Promise.all(
      users.map((user) =>
        apiCall(baseUrl, "/api/auth/register", {
          body: user,
        })
      )
    );

    // All should succeed
    responses.forEach((response) => {
      expect(response.status).toBe(201);
    });
  });
});
