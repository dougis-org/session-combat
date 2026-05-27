// In-memory rate limiter backed by a Map. State is wiped on cold start.
// On Fly.io (auto_stop_machines = 'stop'), machines can be stopped between
// requests — rate-limit counts reset on each cold start. Acceptable at
// current single-instance scale; replace with Redis if horizontal scaling
// or stronger guarantees are required.

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const store = new Map<string, RateLimitEntry>();

// Periodically clean up expired entries to prevent memory leaks.
// .unref() allows Node to exit even if this timer is still pending (not available in jsdom).
(setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of store.entries()) {
    if (now >= entry.resetAt) {
      store.delete(key);
    }
  }
}, 60_000) as unknown as { unref?: () => void }).unref?.();

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

  if (!entry || now >= entry.resetAt) {
    store.set(key, { count: 1, resetAt: now + windowMs });
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
