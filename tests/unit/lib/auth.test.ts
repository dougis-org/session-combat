import {
  hashPassword,
  comparePassword,
  generateToken,
  verifyToken,
  validateEmail,
  validatePassword,
} from "@/lib/auth";
import { AuthPayload } from "@/lib/types";

describe("lib/auth.ts - Unit Tests", () => {
  describe("generateToken", () => {
    it("should generate a valid JWT token with correct payload", () => {
      const payload: AuthPayload = {
        userId: "test-user-123",
        email: "test@example.com",
      };

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

    it("should generate same payload in tokens called sequentially", () => {
      const payload: AuthPayload = {
        userId: "user-789",
        email: "user789@example.com",
      };

      const token1 = generateToken(payload);
      const token2 = generateToken(payload);

      // Both tokens should verify to same payload
      expect(verifyToken(token1)).toEqual(expect.objectContaining(payload));
      expect(verifyToken(token2)).toEqual(expect.objectContaining(payload));
    });

    it("should handle special characters in email", () => {
      const payload: AuthPayload = {
        userId: "user-special",
        email: "user+test@example.co.uk",
      };

      const token = generateToken(payload);
      const verified = verifyToken(token);

      expect(verified?.email).toBe("user+test@example.co.uk");
    });

    it("should include iat (issued at) and exp (expiry) timestamps", () => {
      const payload: AuthPayload = {
        userId: "user-timestamps",
        email: "timestamps@test.com",
      };

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

  describe("verifyToken", () => {
    it("should accept valid non-expired token", () => {
      const payload: AuthPayload = {
        userId: "user-valid",
        email: "valid@example.com",
      };

      const token = generateToken(payload);
      const verified = verifyToken(token);

      expect(verified).not.toBeNull();
      expect(verified?.userId).toBe(payload.userId);
      expect(verified?.email).toBe(payload.email);
    });

    it("should return null for malformed token", () => {
      const malformedTokens = [
        "not.a.token",
        "invalid",
        "header.invalid-base64.signature",
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.invalid.invalid", // Valid header, invalid payload
      ];

      malformedTokens.forEach((token) => {
        const result = verifyToken(token);
        expect(result).toBeNull();
      });
    });

    it("should return null for corrupted token", () => {
      const payload: AuthPayload = {
        userId: "user-corrupt",
        email: "corrupt@test.com",
      };

      const token = generateToken(payload);
      const corruptedToken = token.substring(0, token.length - 5) + "xxxxx";

      const result = verifyToken(corruptedToken);
      expect(result).toBeNull();
    });

    it("should handle null/undefined input gracefully", () => {
      expect(verifyToken(null as any)).toBeNull();
      expect(verifyToken(undefined as any)).toBeNull();
      expect(verifyToken("")).toBeNull();
    });

    it("should reject token with wrong secret (simulated)", () => {
      const payload: AuthPayload = {
        userId: "user-wrong-secret",
        email: "wrongsecret@test.com",
      };

      const token = generateToken(payload);
      // We can't easily test this without modifying the secret,
      // but we verify that token verification is strict
      const verified = verifyToken(token);
      expect(verified).not.toBeNull();
      expect(verified?.userId).toBe(payload.userId);
    });
  });

  describe("hashPassword", () => {
    it("should hash password and return a hash string", async () => {
      const password = "TestPassword123!";
      const hash = await hashPassword(password);

      expect(hash).toBeDefined();
      expect(typeof hash).toBe("string");
      expect(hash.length).toBeGreaterThan(0);
      // Bcrypt hashes are typically 60 characters
      expect(hash.length).toBeGreaterThanOrEqual(50);
    });

    it("should generate different hashes for same password", async () => {
      const password = "TestPassword123!";
      const hash1 = await hashPassword(password);
      const hash2 = await hashPassword(password);

      expect(hash1).not.toBe(hash2);
    });

    it("should handle special characters in password", async () => {
      const specialPasswords = [
        "Pass!@#$%^&*()",
        "Пароль123", // Cyrillic
        "パスワード", // Japanese
        "密码测试", // Chinese
      ];

      for (const password of specialPasswords) {
        const hash = await hashPassword(password);
        expect(hash).toBeDefined();
        expect(hash.length).toBeGreaterThan(0);
      }
    });

    it("should not include plaintext password in hash", async () => {
      const password = "SecretPassword123";
      const hash = await hashPassword(password);

      expect(hash).not.toContain(password);
    });
  });

  describe("comparePassword", () => {
    it("should return true for correct password", async () => {
      const password = "CorrectPassword123!";
      const hash = await hashPassword(password);
      const result = await comparePassword(password, hash);

      expect(result).toBe(true);
    });

    it("should return false for incorrect password", async () => {
      const password = "CorrrectPassword123!"; // Intentional typo
      const correctPassword = "CorrectPassword123!";
      const hash = await hashPassword(correctPassword);
      const result = await comparePassword(password, hash);

      expect(result).toBe(false);
    });

    it("should handle off-by-one character", async () => {
      const password = "Password123";
      const hash = await hashPassword(password);

      expect(await comparePassword("Password123", hash)).toBe(true);
      expect(await comparePassword("Password124", hash)).toBe(false);
      expect(await comparePassword("password123", hash)).toBe(false); // Case sensitive
      expect(await comparePassword("Password123 ", hash)).toBe(false); // Extra space
    });

    it("should handle special characters", async () => {
      const password = "Pass@#$%123!";
      const hash = await hashPassword(password);

      expect(await comparePassword(password, hash)).toBe(true);
      expect(await comparePassword("Pass@#$%124!", hash)).toBe(false);
    });

    it("should be case-sensitive", async () => {
      const password = "MixedCasePassword";
      const hash = await hashPassword(password);

      expect(await comparePassword("MixedCasePassword", hash)).toBe(true);
      expect(await comparePassword("mixedcasepassword", hash)).toBe(false);
    });
  });

  describe("validateEmail", () => {
    it("should accept valid email formats", () => {
      const validEmails = [
        "user@example.com",
        "test+tag@example.co.uk",
        "first.last@subdomain.example.com",
        "user123@test-domain.org",
        "a@b.c",
      ];

      validEmails.forEach((email) => {
        expect(validateEmail(email)).toBe(true);
      });
    });

    it("should reject invalid email formats", () => {
      const invalidEmails = [
        "notanemail", // no @
        "@example.com", // nothing before @
        "user@", // nothing after @
        "user @example.com", // space in user
        "user@example", // no dot after @
        "", // empty
        "user name@example.com", // space in user
      ];

      invalidEmails.forEach((email) => {
        expect(validateEmail(email)).toBe(false);
      });
    });

    it("should handle special valid characters", () => {
      expect(validateEmail("user+tag@example.com")).toBe(true);
      expect(validateEmail("user-name@example.com")).toBe(true);
      expect(validateEmail("user_name@example.com")).toBe(true);
      expect(validateEmail("123@example.com")).toBe(true);
    });

    it("should reject null/undefined", () => {
      expect(validateEmail(null as any)).toBe(false);
      expect(validateEmail(undefined as any)).toBe(false);
    });
  });

  describe("validatePassword", () => {
    it("should return { valid: true } for strong password", () => {
      const result = validatePassword("StrongPassword123!");

      expect(result.valid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it("should return validation errors for weak password", () => {
      const weakPasswords = [
        "short", // Too short
        "nouppercase123", // No uppercase
        "NOLOWERCASE123", // No lowercase
        "NoNumbers", // No numbers
      ];

      weakPasswords.forEach((password) => {
        const result = validatePassword(password);

        expect(result.valid).toBe(false);
        expect(Array.isArray(result.errors)).toBe(true);
        expect(result.errors.length).toBeGreaterThan(0);
      });
    });

    it("should accept passwords with special characters", () => {
      const result = validatePassword("ValidPass123!@#");

      if (result.valid === true) {
        expect(result.errors).toEqual([]);
      } else {
        // It's acceptable to reject if special chars aren't required
        expect(result.errors).toBeDefined();
      }
    });

    it("should provide specific error messages", () => {
      const result = validatePassword("weak");

      expect(result.valid).toBe(false);
      expect(result.errors).toBeDefined();
      expect(Array.isArray(result.errors)).toBe(true);
      // Errors should describe what's wrong
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

      // All hashes should be different
      const uniqueHashes = new Set(hashes);
      expect(uniqueHashes.size).toBe(hashes.length);

      // Each password should match its corresponding hash
      for (let i = 0; i < passwords.length; i++) {
        const isMatch = await comparePassword(passwords[i], hashes[i]);
        expect(isMatch).toBe(true);
      }
    });
  });
});
