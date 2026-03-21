import jwt from "jsonwebtoken";
import {
  hashPassword,
  comparePassword,
  generateToken,
  verifyToken,
  validateEmail,
  validatePassword,
} from "@/lib/auth";
import { AuthPayload } from "@/lib/types";
import {
  TEST_PAYLOADS,
  MALFORMED_TOKENS,
  SPECIAL_PASSWORDS,
  VALID_EMAILS,
  INVALID_EMAILS,
  WEAK_PASSWORDS,
  STRONG_PASSWORD,
} from "@/tests/unit/lib/auth.test.helpers";

describe("lib/auth.ts - Unit Tests", () => {
  describe("generateToken", () => {
    it("should generate a valid JWT token with correct payload", () => {
      const payload: AuthPayload = TEST_PAYLOADS.basic;
      const token = generateToken(payload);

      expect(token).toBeDefined();
      expect(typeof token).toBe("string");
      expect(token.split(".").length).toBe(3); // JWT format: header.payload.signature
    });

    it("should include payload in token", () => {
      const payload: AuthPayload = {
        userId: "user-456",
        email: "user456@test.org",
      };
      const token = generateToken(payload);
      const verified = verifyToken(token);

      expect(verified).not.toBeNull();
      expect(verified?.userId).toBe(payload.userId);
      expect(verified?.email).toBe(payload.email);
    });

    it("should include iat (issued at) and exp (expiry) timestamps", () => {
      const payload: AuthPayload = TEST_PAYLOADS.timestamps;
      const token = generateToken(payload);
      const verified = verifyToken(token);

      expect(verified).toBeDefined();
      expect((verified as any).iat).toBeDefined();
      expect((verified as any).exp).toBeDefined();
      expect(typeof (verified as any).iat).toBe("number");
      expect(typeof (verified as any).exp).toBe("number");
      expect((verified as any).exp).toBeGreaterThan((verified as any).iat);
    });
  });

  describe("generateToken - Parameterized payload types", () => {
    it.each([
      ["basic", TEST_PAYLOADS.basic],
      ["special email", TEST_PAYLOADS.special],
      ["timestamps", TEST_PAYLOADS.timestamps],
    ])("should generate token with %s payload", (_label, payload) => {
      const token = generateToken(payload);
      const verified = verifyToken(token);

      expect(verified).toBeDefined();
      expect(verified?.userId).toBe((payload as AuthPayload).userId);
      expect(verified?.email).toBe((payload as AuthPayload).email);
    });
  });

  describe("verifyToken", () => {
    it("should accept valid non-expired token", () => {
      const payload: AuthPayload = TEST_PAYLOADS.valid;
      const token = generateToken(payload);
      const verified = verifyToken(token);

      expect(verified).not.toBeNull();
      expect(verified?.userId).toBe(payload.userId);
      expect(verified?.email).toBe(payload.email);
    });

    it("should return null for expired token", () => {
      const payload: AuthPayload = TEST_PAYLOADS.valid;
      const secret = process.env.JWT_SECRET || "dev-secret-key-change-in-production";
      const expiredToken = jwt.sign(payload, secret, { expiresIn: "-1s" });

      expect(verifyToken(expiredToken)).toBeNull();
    });

    it.each(MALFORMED_TOKENS)(
      "should return null for malformed token: %s",
      (token) => {
        const result = verifyToken(token);
        expect(result).toBeNull();
      }
    );

    it("should return null for corrupted token", () => {
      const payload: AuthPayload = TEST_PAYLOADS.corrupt;
      const token = generateToken(payload);
      const corruptedToken = token.substring(0, token.length - 5) + "xxxxx";

      const result = verifyToken(corruptedToken);
      expect(result).toBeNull();
    });

    it.each([null, undefined, ""])(
      "should handle null/undefined/empty input gracefully",
      (input) => {
        expect(verifyToken(input as any)).toBeNull();
      }
    );

    it("should reject token with wrong secret", () => {
      const payload: AuthPayload = TEST_PAYLOADS.wrongSecret;
      const tokenWithWrongSecret = jwt.sign(payload, "a-different-secret");

      const verified = verifyToken(tokenWithWrongSecret);
      expect(verified).toBeNull();
    });
  });

  describe("hashPassword", () => {
    it("should hash password and return a hash string", async () => {
      const password = "TestPassword123!";
      const hash = await hashPassword(password);

      expect(hash).toBeDefined();
      expect(typeof hash).toBe("string");
      expect(hash.length).toBeGreaterThan(0);
      expect(hash.length).toBeGreaterThanOrEqual(50);
    });

    it("should generate different hashes for same password", async () => {
      const password = "TestPassword123!";
      const hash1 = await hashPassword(password);
      const hash2 = await hashPassword(password);

      expect(hash1).not.toBe(hash2);
    });

    it("should not include plaintext password in hash", async () => {
      const password = "SecretPassword123";
      const hash = await hashPassword(password);

      expect(hash).not.toContain(password);
    });

    it.each(SPECIAL_PASSWORDS)(
      "should handle special character password: %s",
      async (password) => {
        const hash = await hashPassword(password);
        expect(hash).toBeDefined();
        expect(hash.length).toBeGreaterThan(0);
      }
    );
  });

  describe("comparePassword", () => {
    it("should return true for correct password", async () => {
      const password = "CorrectPassword123!";
      const hash = await hashPassword(password);
      const result = await comparePassword(password, hash);

      expect(result).toBe(true);
    });

    it("should return false for incorrect password", async () => {
      const password = "CorrrectPassword123!";
      const correctPassword = "CorrectPassword123!";
      const hash = await hashPassword(correctPassword);
      const result = await comparePassword(password, hash);

      expect(result).toBe(false);
    });

    it.each([
      ["Password123", "Password123", true, "exact match"],
      ["Password123", "Password124", false, "off-by-one character"],
      ["Password123", "password123", false, "case sensitivity"],
      ["Password123", "Password123 ", false, "extra space"],
      ["Pass@#$%123!", "Pass@#$%123!", true, "special characters"],
      ["Pass@#$%123!", "Pass@#$%124!", false, "special character mismatch"],
    ])(
      "should handle case-sensitive comparison: %s vs %s (%s)",
      async (originalPassword, testPassword, expectedResult, _desc) => {
        const hash = await hashPassword(originalPassword);
        const result = await comparePassword(testPassword, hash);
        expect(result).toBe(expectedResult);
      }
    );
  });

  describe("validateEmail", () => {
    it.each(VALID_EMAILS)("should accept valid email: %s", (email) => {
      expect(validateEmail(email)).toBe(true);
    });

    it.each(INVALID_EMAILS)("should reject invalid email: %s", (email) => {
      expect(validateEmail(email)).toBe(false);
    });

    it.each([null, undefined])(
      "should reject null/undefined",
      (input) => {
        expect(validateEmail(input as any)).toBe(false);
      }
    );
  });

  describe("validatePassword", () => {
    it("should return valid for strong password", () => {
      const result = validatePassword(STRONG_PASSWORD);

      expect(result.valid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it.each(WEAK_PASSWORDS)(
      "should return validation errors for weak password: %s",
      (password) => {
        const result = validatePassword(password);

        expect(result.valid).toBe(false);
        expect(Array.isArray(result.errors)).toBe(true);
        expect(result.errors.length).toBeGreaterThan(0);
      }
    );

    it("should accept passwords with special characters", () => {
      const result = validatePassword("ValidPass123!@#");

      expect(result.valid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it("should provide specific error messages", () => {
      const result = validatePassword("weak");

      expect(result.valid).toBe(false);
      expect(result.errors).toBeDefined();
      expect(Array.isArray(result.errors)).toBe(true);
      result.errors.forEach((error) => {
        expect(typeof error).toBe("string");
        expect(error.length).toBeGreaterThan(0);
      });
    });
  });

  describe("Parallel Safety", () => {
    it("should generate different tokens in parallel", async () => {
      const payload1: AuthPayload = {
        userId: "user-parallel-1",
        email: "parallel1@test.com",
      };
      const payload2: AuthPayload = {
        userId: "user-parallel-2",
        email: "parallel2@test.com",
      };

      const [token1, token2] = await Promise.all([
        Promise.resolve(generateToken(payload1)),
        Promise.resolve(generateToken(payload2)),
      ]);

      expect(token1).not.toBe(token2);
      expect(verifyToken(token1)?.userId).toBe(payload1.userId);
      expect(verifyToken(token2)?.userId).toBe(payload2.userId);
    });

    it("should hash passwords independently in parallel", async () => {
      const passwords = [
        "Password1!",
        "Password2@",
        "Password3#",
        "Password4$",
        "Password5%",
      ];

      const hashes = await Promise.all(passwords.map((p) => hashPassword(p)));

      const uniqueHashes = new Set(hashes);
      expect(uniqueHashes.size).toBe(hashes.length);

      for (let i = 0; i < passwords.length; i++) {
        const isMatch = await comparePassword(passwords[i], hashes[i]);
        expect(isMatch).toBe(true);
      }
    });
  });
});
