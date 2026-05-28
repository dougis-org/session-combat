import fetch from "node-fetch";
import { MongoClient, ObjectId } from "mongodb";
import {
  createTestEmail,
  VALID_PASSWORD,
  apiCall,
} from "./auth.test.helpers";
import { registerTestUser } from "./helpers/users";
import { hashToken, generateResetToken, storeResetToken } from "@/lib/reset-tokens";

const FORGOT_URL = "/api/auth/password/forgot";
const RESET_URL = "/api/auth/password/reset";
const GENERIC_MSG =
  "If an account with that email exists, a password reset link has been sent.";

// Generate a unique fake IP per test to prevent rate-limit state from leaking between tests.
let ipCounter = 1;
function nextIp(): string {
  return `10.0.${Math.floor(ipCounter / 256)}.${ipCounter++ % 256}`;
}

function ipHeaders(ip: string): Record<string, string> {
  return { "x-forwarded-for": ip };
}

describe("Password Reset API Integration Tests", () => {
  let baseUrl: string;
  let mongoUri: string;

  beforeAll(() => {
    baseUrl = process.env.TEST_BASE_URL!;
    mongoUri = process.env.MONGODB_URI!;
    if (!baseUrl) throw new Error("TEST_BASE_URL not set");
    if (!mongoUri) throw new Error("MONGODB_URI not set");
  });

  // ============================================================
  // POST /api/auth/password/forgot
  // ============================================================

  describe("POST /api/auth/password/forgot", () => {
    it("returns 200 with generic message for unknown email", async () => {
      const ip = nextIp();
      const res = await apiCall(baseUrl, FORGOT_URL, {
        body: { email: createTestEmail("unknown") },
        headers: ipHeaders(ip),
      });
      expect(res.status).toBe(200);
      const data = (await res.json()) as { message: string };
      expect(data.message).toBe(GENERIC_MSG);
    });

    it("returns 200 with same generic message for known email; token row exists in DB", async () => {
      const ip = nextIp();
      const { email } = await registerTestUser(baseUrl, "forgot-known");

      const res = await apiCall(baseUrl, FORGOT_URL, {
        body: { email },
        headers: ipHeaders(ip),
      });
      expect(res.status).toBe(200);
      const data = (await res.json()) as { message: string };
      expect(data.message).toBe(GENERIC_MSG);

      // Poll until fire-and-forget token write completes (avoids flaky fixed-delay)
      const client = new MongoClient(mongoUri);
      try {
        await client.connect();
        const db = client.db(process.env.MONGODB_DB ?? "session-combat-test");
        const user = await db.collection("users").findOne({ email });
        expect(user).not.toBeNull();

        let tokenDoc = null;
        for (let i = 0; i < 20; i++) {
          tokenDoc = await db
            .collection("password_reset_tokens")
            .findOne({ userId: user!._id.toString() });
          if (tokenDoc) break;
          await new Promise((r) => setTimeout(r, 100));
        }
        expect(tokenDoc).not.toBeNull();
      } finally {
        await client.close();
      }
    });

    it("returns 400 for invalid email format", async () => {
      const ip = nextIp();
      const res = await apiCall(baseUrl, FORGOT_URL, {
        body: { email: "not-an-email" },
        headers: ipHeaders(ip),
      });
      expect(res.status).toBe(400);
    });

    it("returns 400 when email is missing", async () => {
      const ip = nextIp();
      const res = await apiCall(baseUrl, FORGOT_URL, {
        body: {},
        headers: ipHeaders(ip),
      });
      expect(res.status).toBe(400);
    });

    it("returns 429 when rate limit is exceeded", async () => {
      const ip = nextIp();
      const email = createTestEmail("ratelimit-forgot");
      // 5 allowed per window; 6th should be 429
      for (let i = 0; i < 5; i++) {
        await apiCall(baseUrl, FORGOT_URL, {
          body: { email },
          headers: ipHeaders(ip),
        });
      }
      const res = await apiCall(baseUrl, FORGOT_URL, {
        body: { email },
        headers: ipHeaders(ip),
      });
      expect(res.status).toBe(429);
    });
  });

  // ============================================================
  // POST /api/auth/password/reset
  // ============================================================

  describe("POST /api/auth/password/reset", () => {
    async function seedToken(
      userId: string,
    ): Promise<{ token: string; tokenHash: string }> {
      const token = generateResetToken();
      const tokenHash = hashToken(token);
      await storeResetToken(userId, tokenHash);
      return { token, tokenHash };
    }

    it("valid token + strong password → 200; passwordHash updated; token consumed", async () => {
      const ip = nextIp();
      const { userId } = await registerTestUser(baseUrl, "reset-valid");
      const { token } = await seedToken(userId);

      const newPassword = "NewStr0ng!Pass";
      const res = await apiCall(baseUrl, RESET_URL, {
        body: { token, password: newPassword },
        headers: ipHeaders(ip),
      });
      expect(res.status).toBe(200);

      const client = new MongoClient(mongoUri);
      try {
        await client.connect();
        const db = client.db(process.env.MONGODB_DB ?? "session-combat-test");
        const tokenDoc = await db
          .collection("password_reset_tokens")
          .findOne({ userId });
        expect(tokenDoc?.consumedAt).toBeDefined();
      } finally {
        await client.close();
      }
    });

    it("valid token + strong password → tokenVersion incremented in DB", async () => {
      const ip = nextIp();
      const { userId } = await registerTestUser(baseUrl, "reset-tv");
      const { token } = await seedToken(userId);

      const client = new MongoClient(mongoUri);
      try {
        await client.connect();
        const db = client.db(process.env.MONGODB_DB ?? "session-combat-test");
        const before = await db
          .collection("users")
          .findOne({ _id: new ObjectId(userId) });
        const versionBefore = before?.tokenVersion ?? 0;

        const res = await apiCall(baseUrl, RESET_URL, {
          body: { token, password: "NewStr0ng!Pass" },
          headers: ipHeaders(ip),
        });
        expect(res.status).toBe(200);

        const after = await db
          .collection("users")
          .findOne({ _id: new ObjectId(userId) });
        expect(after?.tokenVersion).toBe(versionBefore + 1);
      } finally {
        await client.close();
      }
    });

    it("old JWT rejected with 401 after successful reset", async () => {
      const ip = nextIp();
      const { cookie: oldCookie, userId } = await registerTestUser(
        baseUrl,
        "reset-jwt",
      );
      const { token } = await seedToken(userId);

      const resetRes = await apiCall(baseUrl, RESET_URL, {
        body: { token, password: "NewStr0ng!Pass" },
        headers: ipHeaders(ip),
      });
      expect(resetRes.status).toBe(200);

      // Old JWT should now be rejected
      const meRes = await fetch(`${baseUrl}/api/auth/me`, {
        headers: { Cookie: oldCookie },
      });
      expect(meRes.status).toBe(401);
    });

    it("login with new password succeeds; old password fails after reset", async () => {
      const ip = nextIp();
      const oldPassword = VALID_PASSWORD;
      const newPassword = "Br@ndN3wPass!";
      const { email, userId } = await registerTestUser(baseUrl, "reset-login");
      const { token } = await seedToken(userId);

      const resetRes = await apiCall(baseUrl, RESET_URL, {
        body: { token, password: newPassword },
        headers: ipHeaders(ip),
      });
      expect(resetRes.status).toBe(200);

      // Old password should fail
      const oldLoginRes = await apiCall(baseUrl, "/api/auth/login", {
        body: { email, password: oldPassword },
      });
      expect(oldLoginRes.status).toBe(401);

      // New password should succeed
      const newLoginRes = await apiCall(baseUrl, "/api/auth/login", {
        body: { email, password: newPassword },
      });
      expect(newLoginRes.status).toBe(200);
    });

    it("expired token → 400 with safe error message", async () => {
      const ip = nextIp();
      const { userId } = await registerTestUser(baseUrl, "reset-expired");
      const { token, tokenHash } = await seedToken(userId);

      // Manually expire the token in the DB
      const client = new MongoClient(mongoUri);
      try {
        await client.connect();
        const db = client.db(process.env.MONGODB_DB ?? "session-combat-test");
        await db
          .collection("password_reset_tokens")
          .updateOne({ tokenHash }, { $set: { expiresAt: new Date(0) } });
      } finally {
        await client.close();
      }

      const res = await apiCall(baseUrl, RESET_URL, {
        body: { token, password: "NewStr0ng!Pass" },
        headers: ipHeaders(ip),
      });
      expect(res.status).toBe(400);
      const data = (await res.json()) as { error: string };
      expect(data.error).toBeDefined();
    });

    it("consumed token (reuse) → 400 with safe error message", async () => {
      const ip = nextIp();
      const { userId } = await registerTestUser(baseUrl, "reset-consumed");
      const { token } = await seedToken(userId);

      // Use the token once successfully
      const firstRes = await apiCall(baseUrl, RESET_URL, {
        body: { token, password: "NewStr0ng!Pass" },
        headers: ipHeaders(ip),
      });
      expect(firstRes.status).toBe(200);

      // Reuse the same token — same IP, same window, still has slots left (2nd of 5)
      const secondRes = await apiCall(baseUrl, RESET_URL, {
        body: { token, password: "An0therPass!" },
        headers: ipHeaders(ip),
      });
      expect(secondRes.status).toBe(400);
    });

    it("invalid/random token → 400 with safe error message", async () => {
      const ip = nextIp();
      const res = await apiCall(baseUrl, RESET_URL, {
        body: { token: "completely-random-invalid-token-xyz", password: "NewStr0ng!Pass" },
        headers: ipHeaders(ip),
      });
      expect(res.status).toBe(400);
      const data = (await res.json()) as { error: string };
      expect(data.error).toBeDefined();
    });

    it("weak password → 400 with details array", async () => {
      const ip = nextIp();
      const { userId } = await registerTestUser(baseUrl, "reset-weakpwd");
      const { token } = await seedToken(userId);

      const res = await apiCall(baseUrl, RESET_URL, {
        body: { token, password: "weak" },
        headers: ipHeaders(ip),
      });
      expect(res.status).toBe(400);
      const data = (await res.json()) as { error: string; details?: string[] };
      expect(data.details).toBeDefined();
      expect(Array.isArray(data.details)).toBe(true);
    });

    it("missing token → 400", async () => {
      const ip = nextIp();
      const res = await apiCall(baseUrl, RESET_URL, {
        body: { password: "NewStr0ng!Pass" },
        headers: ipHeaders(ip),
      });
      expect(res.status).toBe(400);
    });

    it("missing password → 400", async () => {
      const ip = nextIp();
      const res = await apiCall(baseUrl, RESET_URL, {
        body: { token: "sometoken" },
        headers: ipHeaders(ip),
      });
      expect(res.status).toBe(400);
    });

    it("returns 429 when reset rate limit is exceeded", async () => {
      const ip = nextIp();
      const invalidToken = "rate-limit-test-invalid-token";
      // 5 allowed per window; 6th should be 429
      for (let i = 0; i < 5; i++) {
        await apiCall(baseUrl, RESET_URL, {
          body: { token: invalidToken, password: "NewStr0ng!Pass" },
          headers: ipHeaders(ip),
        });
      }
      const res = await apiCall(baseUrl, RESET_URL, {
        body: { token: invalidToken, password: "NewStr0ng!Pass" },
        headers: ipHeaders(ip),
      });
      expect(res.status).toBe(429);
    });
  });
});
