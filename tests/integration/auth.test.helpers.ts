/**
 * Test utilities for auth integration tests
 */

/**
 * Create a unique test email with timestamp and random component
 * Ensures no collision even in rapid parallel execution
 */
export function createTestEmail(prefix = 'user'): string {
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
  } = {}
) {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (options.cookie) {
    headers.Cookie = options.cookie;
  }

  const fetchOptions: RequestInit = {
    method: options.method || 'POST',
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
  const contentType = response.headers.get('content-type');
  if (!contentType?.includes('application/json')) {
    throw new Error(
      `Expected JSON response, got ${contentType}. Body: ${await response.text()}`
    );
  }
  return response.json() as Promise<T>;
}
