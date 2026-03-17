import { startTestServer, TestServer } from "@/tests/integration/helpers/server";
import {
  createTestEmail,
  registerUser,
  loginUser,
  parseJsonResponse,
  VALID_PASSWORD,
  createTestUsers,
  extractAuthCookie,
} from "@/tests/integration/auth.test.helpers";

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

    // Register first
    await registerUser(baseUrl, email, VALID_PASSWORD);

    // Then login
    const response = await loginUser(baseUrl, email, VALID_PASSWORD);

    expect(response.status).toBe(200);
    const data = await parseJsonResponse<{
      userId: string;
      email: string;
      message: string;
    }>(response);
    expect(data.userId).toBeDefined();
    expect(data.email).toBe(email);
    expect(data.message).toContain("Login successful");
  });

  it("should return 401 when password is wrong", async () => {
    const email = createTestEmail("wrong-password-test");

    // Register first
    await registerUser(baseUrl, email, VALID_PASSWORD);

    // Try to login with wrong password
    const response = await loginUser(baseUrl, email, "WrongPassword456!");

    expect(response.status).toBe(401);
    const data = await parseJsonResponse<{ error: string }>(response);
    expect(data.error).toContain("Invalid email or password");
  });

  it("should return 401 when user does not exist", async () => {
    const email = createTestEmail("nonexistent");

    const response = await loginUser(baseUrl, email, VALID_PASSWORD);

    expect(response.status).toBe(401);
    const data = await parseJsonResponse<{ error: string }>(response);
    expect(data.error).toContain("Invalid email or password");
  });

  it("should return 400 when email is missing", async () => {
    const response = await loginUser(baseUrl, "", VALID_PASSWORD);

    expect(response.status).toBe(400);
    const data = await parseJsonResponse<{ error: string }>(response);
    expect(data.error).toContain("required");
  });

  it("should return 400 when password is missing", async () => {
    const response = await loginUser(baseUrl, createTestEmail("no-password"), "");

    expect(response.status).toBe(400);
    const data = await parseJsonResponse<{ error: string }>(response);
    expect(data.error).toContain("required");
  });

  it("should return 400 when email format is invalid", async () => {
    const response = await loginUser(baseUrl, "notanemail", VALID_PASSWORD);

    expect(response.status).toBe(400);
    const data = await parseJsonResponse<{ error: string }>(response);
    expect(data.error).toContain("Invalid email");
  });

  it("should set auth cookie in response on success", async () => {
    const email = createTestEmail("cookietest");

    // Register first
    await registerUser(baseUrl, email, VALID_PASSWORD);

    // Login
    const response = await loginUser(baseUrl, email, VALID_PASSWORD);

    expect(response.status).toBe(200);
    const cookie = extractAuthCookie(response);
    expect(cookie).toBeDefined();
  });

  it("should be parallel-safe with different users", async () => {
    const users = createTestUsers(3);

    // Register all users
    for (const user of users) {
      await registerUser(baseUrl, user.email, user.password);
    }

    // Login all users in parallel
    const responses = await Promise.all(
      users.map((user) => loginUser(baseUrl, user.email, user.password))
    );

    // All should succeed
    responses.forEach((response) => {
      expect(response.status).toBe(200);
    });
  });

  it("should not expose password hash in response", async () => {
    const email = createTestEmail("hash-test");

    // Register first
    await registerUser(baseUrl, email, VALID_PASSWORD);

    // Login
    const response = await loginUser(baseUrl, email, VALID_PASSWORD);

    const data = await parseJsonResponse<Record<string, unknown>>(response);
    expect(data.passwordHash).toBeUndefined();
    expect(Object.keys(data)).not.toContain("passwordHash");
  });
});
