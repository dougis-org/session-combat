import { checkRateLimit, RateLimitError } from "@/lib/rate-limit";

// Re-import the module fresh for each test so the in-memory Map is clean
jest.resetModules();

describe("lib/rate-limit.ts", () => {
  // Use a unique key prefix per test to avoid cross-test state
  let keyCounter = 0;
  function uniqueKey(): string {
    return `test-key-${Date.now()}-${keyCounter++}`;
  }

  describe("checkRateLimit", () => {
    it("allows requests under the threshold", () => {
      const key = uniqueKey();
      expect(() => checkRateLimit(key, 3, 60_000)).not.toThrow();
      expect(() => checkRateLimit(key, 3, 60_000)).not.toThrow();
      expect(() => checkRateLimit(key, 3, 60_000)).not.toThrow();
    });

    it("throws RateLimitError at the threshold", () => {
      const key = uniqueKey();
      checkRateLimit(key, 2, 60_000);
      checkRateLimit(key, 2, 60_000);
      expect(() => checkRateLimit(key, 2, 60_000)).toThrow(RateLimitError);
    });

    it("throws with status 429", () => {
      const key = uniqueKey();
      checkRateLimit(key, 1, 60_000);
      try {
        checkRateLimit(key, 1, 60_000);
        fail("should have thrown");
      } catch (err) {
        expect(err).toBeInstanceOf(RateLimitError);
        expect((err as RateLimitError).status).toBe(429);
      }
    });

    it("separate keys do not share counts", () => {
      const key1 = uniqueKey();
      const key2 = uniqueKey();
      checkRateLimit(key1, 1, 60_000);
      expect(() => checkRateLimit(key2, 1, 60_000)).not.toThrow();
    });

    it("resets counter after TTL window expires", async () => {
      const key = uniqueKey();
      const windowMs = 50; // very short window for testing
      checkRateLimit(key, 1, windowMs);
      // At threshold now — would throw if window not expired
      await new Promise((r) => setTimeout(r, windowMs + 10));
      // Window has expired; counter should reset
      expect(() => checkRateLimit(key, 1, windowMs)).not.toThrow();
    });
  });
});
