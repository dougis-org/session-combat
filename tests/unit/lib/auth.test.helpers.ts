/**
 * Test data and helpers for unit tests of auth.ts
 * Centralizes test constants to reduce duplication
 */

// ============================================================================
// Test Data Constants
// ============================================================================

/**
 * Test payloads for token generation and verification
 */
export const TEST_PAYLOADS = {
  basic: {
    userId: "test-user-123",
    email: "test@example.com",
  },
  special: {
    userId: "user-special",
    email: "user+test@example.co.uk",
  },
  timestamps: {
    userId: "user-timestamps",
    email: "timestamps@test.com",
  },
  valid: {
    userId: "user-valid",
    email: "valid@example.com",
  },
  corrupt: {
    userId: "user-corrupt",
    email: "corrupt@test.com",
  },
  wrongSecret: {
    userId: "user-wrong-secret",
    email: "wrongsecret@test.com",
  },
};

/**
 * Malformed JWT tokens for testing verifyToken error handling
 */
export const MALFORMED_TOKENS = [
  "not.a.token",
  "invalid",
  "header.invalid-base64.signature",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.invalid.invalid", // Valid header, invalid payload
];

/**
 * Passwords with special characters for testing edge cases
 */
export const SPECIAL_PASSWORDS = [
  "Pass!@#$%^&*()",
  "Пароль123", // Cyrillic
  "パスワード", // Japanese
  "密码测试", // Chinese
];

/**
 * Valid email addresses with various formats
 */
export const VALID_EMAILS = [
  "user@example.com",
  "test+tag@example.co.uk",
  "first.last@subdomain.example.com",
  "user123@test-domain.org",
  "a@b.c",
];

/**
 * Invalid email formats that should fail validation
 */
export const INVALID_EMAILS = [
  "notanemail", // no @
  "@example.com", // nothing before @
  "user@", // nothing after @
  "user @example.com", // space in user
  "user@example", // no dot after @
  "", // empty
  "user name@example.com", // space in user
];

/**
 * Weak passwords that fail validation
 */
export const WEAK_PASSWORDS = [
  "short", // Too short
  "nouppercase123", // No uppercase
  "NOLOWERCASE123", // No lowercase
  "NoNumbers", // No numbers
];

/**
 * Valid strong password for testing
 */
export const STRONG_PASSWORD = "StrongPassword123!";

/**
 * Valid passwords with special characters
 */
export const SPECIAL_CHARACTER_PASSWORDS = [
  "ValidPass123!@#",
  "Pass@#$%123!",
  "MixedCasePassword",
];

/**
 * Passwords for testing case sensitivity
 */
export const CASE_SENSITIVE_TESTS = [
  { password: "Password123", variations: ["Password123", "password123", "PASSWORD123"] },
  { password: "MixedCasePassword", variations: ["MixedCasePassword", "mixedcasepassword"] },
];

/**
 * Passwords for testing character precision
 */
export const CHARACTER_PRECISION_TESTS = [
  { password: "Password123", variations: ["Password124", "Password123 "] }, // Off-by-one and extra space
  { password: "CorrectPassword123!", variations: ["CorrrectPassword123!"] }, // Typo
  { password: "Pass@#$%123!", variations: ["Pass@#$%124!"] }, // Special char typo
];
