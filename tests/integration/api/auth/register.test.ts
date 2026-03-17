import {
  startTestServer,
  TestServer,
} from "@/tests/integration/helpers/server";
import {
  createTestEmail,
  registerUser,
  parseJsonResponse,
  VALID_PASSWORD,
  WEAK_PASSWORDS,
  INVALID_EMAILS,
  createTestUsers,
  extractAuthCookie,
} from "@/tests/integration/auth.test.helpers";

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
    const email = createTestEmail("newuser");

    const response = await registerUser(baseUrl, email, VALID_PASSWORD);

    expect(response.status).toBe(201);
    const data = await parseJsonResponse<{
      userId: string;
      email: string;
    }>(response);
    expect(data.userId).toBeDefined();
    expect(data.email).toBe(email);
  });

  it("should return 409 when email already exists", async () => {
    const email = createTestEmail("existing");

    // Create first user
    await registerUser(baseUrl, email, VALID_PASSWORD);

    // Try to register same email again
    const response = await registerUser(baseUrl, email, "DifferentPassword123!");

    expect(response.status).toBe(409);
    const data = await parseJsonResponse<{ error: string }>(response);
    expect(data.error).toBeDefined();
  });

  it("should return 400 when email format is invalid", async () => {
    for (const email of INVALID_EMAILS) {
      const response = await registerUser(baseUrl, email, VALID_PASSWORD);

      expect(response.status).toBe(400);
      const data = await parseJsonResponse<{ error: string }>(response);
      expect(data.error).toBeDefined();
    }
  });

  it("should return 400 when password is weak", async () => {
    for (const password of WEAK_PASSWORDS) {
      const response = await registerUser(
        baseUrl,
        createTestEmail("weak-password-test"),
        password
      );

      expect(response.status).toBe(400);
      const data = await parseJsonResponse<{ error: string }>(response);
      expect(data.error).toBeDefined();
    }
  });

  it("should return 400 when email is missing", async () => {
    const response = await registerUser(baseUrl, "", VALID_PASSWORD);

    expect(response.status).toBe(400);
    const data = await parseJsonResponse<{ error: string }>(response);
    expect(data.error).toContain("required");
  });

  it("should return 400 when password is missing", async () => {
    const response = await registerUser(baseUrl, createTestEmail("no-password"), "");

    expect(response.status).toBe(400);
    const data = await parseJsonResponse<{ error: string }>(response);
    expect(data.error).toBeDefined();
  });

  it("should set auth cookie in response", async () => {
    const email = createTestEmail("cookietest");

    const response = await registerUser(baseUrl, email, VALID_PASSWORD);

    const cookie = extractAuthCookie(response);
    expect(cookie).toBeDefined();
  });

  it("should handle special characters in email", async () => {
    const email = `user+test-${Date.now()}-${Math.random().toString(36).slice(2, 11)}@example.co.uk`;

    const response = await registerUser(baseUrl, email, VALID_PASSWORD);

    expect(response.status).toBe(201);
    const data = await parseJsonResponse<{ email: string }>(response);
    expect(data.email).toBe(email);
  });

  it("should be parallel-safe with different users", async () => {
    const users = createTestUsers(3);

    const responses = await Promise.all(
      users.map((user) => registerUser(baseUrl, user.email, user.password))
    );

    // All should succeed
    responses.forEach((response) => {
      expect(response.status).toBe(201);
    });
  });
});
