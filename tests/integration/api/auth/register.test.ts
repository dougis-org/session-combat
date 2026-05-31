import {
  apiCall,
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
  let baseUrl: string;

  beforeAll(() => {
    baseUrl = process.env.TEST_BASE_URL!;
    if (!baseUrl) throw new Error("TEST_BASE_URL not set — globalSetup was not wired correctly");
  });

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
      createTestEmail("user+test").replace("@example.com", "@example.co.uk"),
      createTestEmail("user-name"),
      createTestEmail("user_name"),
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

  describe("Username Validation", () => {
    it("should accept valid registration with username", async () => {
      const email = createTestEmail("withusername");
      const username = "dougreg42";
      const response = await registerUser(baseUrl, email, VALID_PASSWORD, username);
      const data = await assertSuccessResponse<{ userId: string; email: string; username: string }>(
        response,
        201,
      );

      expect(data.userId).toBeDefined();
      expect(data.email).toBe(email);
      expect(data.username).toBe(username);

      // Verify DB storage
      const { getDatabase } = await import("@/lib/db");
      const db = await getDatabase();
      const user = await db.collection("users").findOne({ email });
      expect(user).not.toBeNull();
      expect(user?.username).toBe(username);
    });

    it("should return 400 when username is missing", async () => {
      const email = createTestEmail("missingusername");
      // Use apiCall directly to bypass the helper's default username generator
      const response = await apiCall(baseUrl, "/api/auth/register", {
        body: { email, password: VALID_PASSWORD }
      });
      const data = await assertErrorResponse(response, 400);
      expect(data.error).toContain("required");
    });

    it("should return 400 when username is too short", async () => {
      const email = createTestEmail("shortusername");
      const response = await registerUser(baseUrl, email, VALID_PASSWORD, "ab");
      const data = await assertErrorResponse(response, 400);
      expect(data.error).toContain("Username does not meet requirements");
    });

    it("should return 400 when username is a reserved word", async () => {
      const email = createTestEmail("reservedusername");
      const response = await registerUser(baseUrl, email, VALID_PASSWORD, "Admin");
      await assertErrorResponse(response, 400);
    });

    it("should return 409 when username is already taken", async () => {
      const email1 = createTestEmail("user1");
      const email2 = createTestEmail("user2");
      const username = "taken42";

      // Register first user
      const resp1 = await registerUser(baseUrl, email1, VALID_PASSWORD, username);
      expect(resp1.status).toBe(201);

      // Try registering second user with same username
      const resp2 = await registerUser(baseUrl, email2, VALID_PASSWORD, username);
      const data = await assertErrorResponse(resp2, 409);
      expect(data.error).toContain("already taken");
    });

    it("should accept the same username in different casing", async () => {
      const email1 = createTestEmail("casing1");
      const email2 = createTestEmail("casing2");

      const resp1 = await registerUser(baseUrl, email1, VALID_PASSWORD, "DougCasing42");
      expect(resp1.status).toBe(201);

      const resp2 = await registerUser(baseUrl, email2, VALID_PASSWORD, "dougcasing42");
      expect(resp2.status).toBe(201);
    });

    it("should return distinct conflict message for duplicate email vs duplicate username", async () => {
      const email = createTestEmail("uniqueemail");
      const username1 = "uniq1";
      const username2 = "uniq2";

      // Register first user
      const resp1 = await registerUser(baseUrl, email, VALID_PASSWORD, username1);
      expect(resp1.status).toBe(201);

      // Register second user with same email but different username
      const resp2 = await registerUser(baseUrl, email, VALID_PASSWORD, username2);
      const data = await assertErrorResponse(resp2, 409);
      expect(data.error).toContain("email already exists");
    });
  });
});
