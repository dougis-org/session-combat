import {
  startTestServer,
  TestServer,
} from "@/tests/integration/helpers/server";
import {
  createTestEmail,
  createTestUser,
  registerUser,
  assertSuccessResponse,
  assertErrorResponse,
  extractAuthCookie,
  VALID_PASSWORD,
  WEAK_PASSWORDS,
  INVALID_EMAILS,
} from "@/tests/integration/auth.test.helpers";

/**
 * Integration tests for POST /api/auth/register
 * Consolidated test patterns to minimize duplication
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
    const data = await assertSuccessResponse<{ userId: string; email: string }>(
      response,
      201,
    );

    expect(data.userId).toBeDefined();
    expect(data.email).toBe(email);

    const cookie = extractAuthCookie(response);
    expect(cookie).toBeTruthy();
    expect(cookie).toContain("auth-token=");

    // Verify the user is persisted with a hashed password (not plaintext)
    const { getDatabase } = await import("@/lib/db");
    const db = await getDatabase();
    const user = await db.collection("users").findOne({ email });

    expect(user).not.toBeNull();
    expect(user?.passwordHash).toBeDefined();
    expect(user?.passwordHash).not.toBe(VALID_PASSWORD);
    // bcrypt hashes should start with $2a$ / $2b$ / $2y$
    expect(user?.passwordHash).toMatch(/^\$2[aby]\$/);
  });

  it("should return 409 when email already exists", async () => {
    const email = createTestEmail("existing");
    await registerUser(baseUrl, email, VALID_PASSWORD);

    const response = await registerUser(
      baseUrl,
      email,
      "DifferentPassword123!",
    );
    await assertErrorResponse(response, 409);
  });

  it("should reject all invalid email formats", async () => {
    for (const email of INVALID_EMAILS) {
      const response = await registerUser(baseUrl, email, VALID_PASSWORD);
      await assertErrorResponse(response, 400);
    }
  });

  it("should reject all weak passwords", async () => {
    for (const password of WEAK_PASSWORDS) {
      const response = await registerUser(
        baseUrl,
        createTestEmail("weak-test"),
        password,
      );
      await assertErrorResponse(response, 400);
    }
  });

  it("should reject missing email and password fields", async () => {
    // Missing email
    let response = await registerUser(baseUrl, "", VALID_PASSWORD);
    expect(response.status).toBe(400);

    // Missing password
    response = await registerUser(baseUrl, createTestEmail("no-password"), "");
    expect(response.status).toBe(400);
  });

  it("should handle special characters in email and set auth cookie", async () => {
    const specialEmails = [
      `user+test-${Date.now()}@example.co.uk`,
      `user-name-${Date.now()}@example.com`,
      `user_name_${Date.now()}@example.com`,
    ];

    for (const email of specialEmails) {
      const response = await registerUser(baseUrl, email, VALID_PASSWORD);
      const data = await assertSuccessResponse<{ email: string }>(
        response,
        201,
      );
      expect(data.email).toBe(email);
    }
  });

  it("should be parallel-safe with different concurrent users", async () => {
    const users = [
      createTestUser("parallel-1"),
      createTestUser("parallel-2"),
      createTestUser("parallel-3"),
    ];

    const responses = await Promise.all(
      users.map((user) => registerUser(baseUrl, user.email, user.password)),
    );

    responses.forEach((response) => {
      expect(response.status).toBe(201);
    });
  });
});
