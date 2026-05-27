// In-memory rate limiter backed by a Map. State is wiped on cold start.
// On Fly.io (auto_stop_machines = 'stop'), machines can be stopped between
// requests — rate-limit counts reset on each cold start. Acceptable at
// current single-instance scale; replace with Redis if horizontal scaling
// or stronger guarantees are required.

interface RateLimitEntry {
  count: number;
  windowStart: number;
}

const store = new Map<string, RateLimitEntry>();

/**
 * Throws a 429-ready error when `key` has exceeded `limit` calls within
 * `windowMs` milliseconds. Resets the counter automatically after the window.
 */
export function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number
): void {
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || now - entry.windowStart >= windowMs) {
    store.set(key, { count: 1, windowStart: now });
    return;
  }

  if (entry.count >= limit) {
    throw new RateLimitError("Too many requests. Please try again later.");
  }

  entry.count += 1;
}

export class RateLimitError extends Error {
  readonly status = 429;

  constructor(message: string) {
    super(message);
    this.name = "RateLimitError";
  }
}
