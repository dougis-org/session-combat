/**
 * Test utilities for auth integration tests
 * Centralizes common patterns, test data, and helper functions to reduce duplication
 */

import fetch from "node-fetch";

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
 * Valid special character emails for testing edge cases
 */
export const SPECIAL_EMAILS = [
  "user+test@example.co.uk",
  "user-name@example.com",
  "user_name@example.com",
];

/**
 * Valid strong password for testing
 */
export const VALID_PASSWORD = "ValidPassword123!";

/**
 * Valid alternative passwords for parallel testing
 */
export const VALID_PASSWORDS = [
  "ValidPassword123!",
  "ValidPassword456!",
  "ValidPassword789!",
];

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

  return fetch(`${baseUrl}${endpoint}`, fetchOptions as any);
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
  const rawHeaders = (response.headers as any).raw?.();
  const setCookieHeaders: string[] | undefined = rawHeaders?.["set-cookie"];

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

/**
 * Assert successful response and extract data
 * Used for responses that should succeed (200/201)
 */
export async function assertSuccessResponse<T>(
  response: Response,
  expectedStatus: number = 200,
): Promise<T> {
  if (response.status !== expectedStatus) {
    const body = await response.text();
    throw new Error(
      `Expected status ${expectedStatus}, got ${response.status}. Body: ${body}`,
    );
  }
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
  if (response.status !== expectedStatus) {
    const body = await response.text();
    throw new Error(
      `Expected status ${expectedStatus}, got ${response.status}. Body: ${body}`,
    );
  }
  const data = await parseJsonResponse<T>(response);

  if (options.errorContains && data.error) {
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
// ============================================================================
// High-Level Test Scenarios - Consolidate Common Patterns
// ============================================================================

/**
 * Test a successful auth response with required fields
 * Consolidates: API call + status check + JSON parse + field assertions
 */
export async function testSuccessfulAuthFlow<T extends Record<string, any>>(
  response: Response,
  expectedStatus: number,
  requiredFields: (keyof T)[],
): Promise<T> {
  const data = await assertSuccessResponse<T>(response, expectedStatus);

  for (const field of requiredFields) {
    expect(data[field]).toBeDefined();
  }

  return data;
}

/**
 * Test an error auth response with optional error message validation
 * Consolidates: API call + status check + error assertion
 */
export async function testErrorAuthFlow(
  response: Response,
  expectedStatus: number,
  expectedErrorFragment?: string,
): Promise<void> {
  const data = await assertErrorResponse<{ error: string }>(
    response,
    expectedStatus,
  );

  if (expectedErrorFragment && data.error) {
    expect(data.error).toContain(expectedErrorFragment);
  }
}

/**
 * Create a unique test scenario with setup and execution
 * Parameters for different auth test cases
 */
export interface AuthTestCase {
  name: string;
  email: string;
  password: string;
  shouldRegisterFirst?: boolean;
}

/**
 * Run a batch of login test scenarios with consistent pattern
 */
export async function runLoginScenarios(
  baseUrl: string,
  scenarios: AuthTestCase[],
): Promise<void> {
  for (const scenario of scenarios) {
    if (scenario.shouldRegisterFirst) {
      await registerUser(baseUrl, scenario.email, scenario.password);
    }

    const response = await loginUser(
      baseUrl,
      scenario.email,
      scenario.password,
    );
    expect(response.status).toBeGreaterThanOrEqual(200);
  }
}

/**
 * Run a batch of register test scenarios with consistent pattern
 */
export async function runRegisterScenarios(
  baseUrl: string,
  scenarios: AuthTestCase[],
): Promise<void> {
  for (const scenario of scenarios) {
    const response = await registerUser(
      baseUrl,
      scenario.email,
      scenario.password,
    );
    expect(response.status).toBeGreaterThanOrEqual(200);
  }
}
