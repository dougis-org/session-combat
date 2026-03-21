/**
 * Test utilities for auth integration tests
 * Centralizes common patterns, test data, and helper functions to reduce duplication
 */

import fetch, { RequestInit, Response } from "node-fetch";

// ============================================================================
// Test Data Constants
// ============================================================================

/**
 * Weak passwords that fail validation - used across multiple test suites
 */
export const WEAK_PASSWORDS = [
  "short",
  "nouppercase123",
  "NOLOWERCASE123",
  "NoNumbers",
];

/**
 * Invalid email formats that fail validation
 */
export const INVALID_EMAILS = [
  "notanemail",
  "@example.com",
  "user@",
  "user@example",
  "user @example.com",
  "user name@example.com",
];

/**
 * Valid strong password for testing
 */
export const VALID_PASSWORD = "ValidPassword123!";

// ============================================================================
// Client Functions
// ============================================================================

/**
 * Create a unique test email with timestamp and random component
 * Ensures no collision even in rapid parallel execution
 */
export function createTestEmail(prefix = "user"): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).slice(2, 11);
  return `${prefix}-${timestamp}-${random}@example.com`;
}

/**
 * Make an HTTP API request for integration tests
 */
export async function apiCall(
  baseUrl: string,
  endpoint: string,
  options: {
    method?: string;
    body?: unknown;
    cookie?: string;
    headers?: Record<string, string>;
  } = {},
) {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  if (options.cookie) {
    headers.Cookie = options.cookie;
  }

  const fetchOptions: RequestInit = {
    method: options.method || "POST",
    headers,
  };

  if (options.body) {
    fetchOptions.body = JSON.stringify(options.body);
  }

  return fetch(`${baseUrl}${endpoint}`, fetchOptions);
}

/**
 * Extract and validate response JSON with TypeScript type safety
 */
export async function parseJsonResponse<T>(response: Response): Promise<T> {
  const contentType = response.headers.get("content-type");
  if (!contentType?.includes("application/json")) {
    throw new Error(
      `Expected JSON response, got ${contentType}. Body: ${await response.text()}`,
    );
  }
  return response.json() as Promise<T>;
}

// ============================================================================
// Common Auth Flows
// ============================================================================

/**
 * Register a new user with email and password
 * Returns the API response for assertion
 */
export async function registerUser(
  baseUrl: string,
  email: string = createTestEmail(),
  password: string = VALID_PASSWORD,
) {
  return apiCall(baseUrl, "/api/auth/register", {
    body: { email, password },
  });
}

/**
 * Login a user with email and password
 * Returns the API response for assertion
 */
export async function loginUser(
  baseUrl: string,
  email: string,
  password: string = VALID_PASSWORD,
) {
  return apiCall(baseUrl, "/api/auth/login", {
    body: { email, password },
  });
}

/**
 * Register and login a user in sequence
 * Returns both responses for assertions
 */
export async function registerAndLogin(
  baseUrl: string,
  email: string = createTestEmail(),
  password: string = VALID_PASSWORD,
) {
  const registerResponse = await registerUser(baseUrl, email, password);
  const loginResponse = await loginUser(baseUrl, email, password);
  return { registerResponse, loginResponse };
}

/**
 * Logout the user
 * Returns the API response for assertion
 */
export async function logoutUser(baseUrl: string, cookie?: string) {
  return apiCall(baseUrl, "/api/auth/logout", {
    cookie,
  });
}

// ============================================================================
// Response Extraction Helpers
// ============================================================================

/**
 * Extract auth cookie from Set-Cookie header
 * Handles both array and single cookie formats
 */
export function extractAuthCookie(response: Response): string | null {
  const setCookieHeaders: string[] | undefined =
    response.headers.raw()["set-cookie"];

  const cookies = Array.isArray(setCookieHeaders)
    ? setCookieHeaders
    : response.headers.get("set-cookie")
    ? [response.headers.get("set-cookie")!]
    : [];

  // Find the auth-token cookie value specifically (avoid splitting on commas inside Expires)
  for (const cookie of cookies) {
    const match = cookie.match(/(^|;\s*)auth-token=[^;]+/i);
    if (match) {
      return match[0].trim();
    }
  }

  return null;
}

// ============================================================================
// Assertion Helpers - Bundle Common Patterns
// ============================================================================

async function assertStatus(
  response: Response,
  expectedStatus: number,
): Promise<void> {
  if (response.status !== expectedStatus) {
    const body = await response.text();
    throw new Error(
      `Expected status ${expectedStatus}, got ${response.status}. Body: ${body}`,
    );
  }
}

/**
 * Assert successful response and extract data
 * Used for responses that should succeed (200/201)
 */
export async function assertSuccessResponse<T>(
  response: Response,
  expectedStatus: number = 200,
): Promise<T> {
  await assertStatus(response, expectedStatus);
  return parseJsonResponse<T>(response);
}

/**
 * Assert error response - checks status and optionally validates error content
 * Combines status check + JSON parsing + optional error field assertion
 */
export async function assertErrorResponse<
  T extends { error?: string } = { error?: string },
>(
  response: Response,
  expectedStatus: number,
  options: { errorContains?: string } = {},
): Promise<T> {
  await assertStatus(response, expectedStatus);
  const data = await parseJsonResponse<T>(response);

  if (options.errorContains) {
    if (!data.error) {
      throw new Error(
        `Expected response to have an "error" field containing "${options.errorContains}", but "error" was absent`,
      );
    }
    if (!data.error.includes(options.errorContains)) {
      throw new Error(
        `Expected error to contain "${options.errorContains}", got: "${data.error}"`,
      );
    }
  }

  return data;
}

/**
 * Assert response has expected status code only
 * Minimal assertion for tests that only care about status
 */
export function assertResponseStatus(
  response: Response,
  expectedStatus: number,
): void {
  if (response.status !== expectedStatus) {
    throw new Error(
      `Expected status ${expectedStatus}, got ${response.status}`,
    );
  }
}

// ============================================================================
// Test Context Helpers
// ============================================================================

/**
 * Create test user with email and password
 * Useful for test data generation
 */
export function createTestUser(
  prefix: string = "user",
  password: string = VALID_PASSWORD,
) {
  return {
    email: createTestEmail(prefix),
    password,
  };
}

/**
 * Create multiple test users for parallel testing
 */
