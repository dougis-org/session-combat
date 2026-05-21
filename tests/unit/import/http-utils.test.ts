import {
  calculateBackoffMs,
  handleRateLimitResponse,
} from "@/lib/import/http-utils";

describe("calculateBackoffMs", () => {
  describe("exponential backoff", () => {
    it.each([
      [0, 1000],
      [1, 2000],
      [2, 4000],
      [3, 8000],
      [4, 10000],
      [5, 10000],
    ])("attempt=%i returns %i ms", (attempt, expected) => {
      expect(calculateBackoffMs(attempt)).toBe(expected);
    });

    it("returns exponential value when retryAfterHeader is null", () => {
      expect(calculateBackoffMs(0, null)).toBe(1000);
    });

    it('returns exponential value when retryAfterHeader is empty string ""', () => {
      expect(calculateBackoffMs(0, "")).toBe(1000);
    });

    it("returns exponential value when retryAfterHeader is non-numeric", () => {
      expect(calculateBackoffMs(0, "not-a-number")).toBe(1000);
    });

    it("returns exponential value when retryAfterHeader is whitespace", () => {
      expect(calculateBackoffMs(0, "   ")).toBe(1000);
    });
  });

  describe("Retry-After header", () => {
    it('returns 5000 for "5"', () => {
      expect(calculateBackoffMs(0, "5")).toBe(5000);
    });

    it('caps at MAX_BACKOFF_MS for "30"', () => {
      expect(calculateBackoffMs(0, "30")).toBe(10000);
    });

    it('returns 0 for "0"', () => {
      expect(calculateBackoffMs(0, "0")).toBe(0);
    });
  });
});

describe("handleRateLimitResponse", () => {
  let setTimeoutSpy: jest.SpyInstance;

  beforeEach(() => {
    setTimeoutSpy = jest
      .spyOn(globalThis, "setTimeout")
      .mockImplementation((fn: TimerHandler) => {
        if (typeof fn === "function") fn();
        return 0 as unknown as ReturnType<typeof setTimeout>;
      });
  });

  afterEach(() => {
    setTimeoutSpy.mockRestore();
  });

  function makeResponse(retryAfter?: string): Response {
    const headers = new Headers();
    if (retryAfter !== undefined) {
      headers.set("Retry-After", retryAfter);
    }
    return { headers } as unknown as Response;
  }

  it("returns true and sleeps 1000 ms on attempt=0, retries=3 (no Retry-After)", async () => {
    const result = await handleRateLimitResponse(makeResponse(), 0, 3);
    expect(result).toBe(true);
    expect(setTimeoutSpy).toHaveBeenCalledWith(expect.any(Function), 1000);
  });

  it('returns true and sleeps 3000 ms on attempt=1, retries=3 (Retry-After: "3")', async () => {
    const result = await handleRateLimitResponse(makeResponse("3"), 1, 3);
    expect(result).toBe(true);
    expect(setTimeoutSpy).toHaveBeenCalledWith(expect.any(Function), 3000);
  });

  it("returns false with no sleep on final attempt (attempt=retries)", async () => {
    const result = await handleRateLimitResponse(makeResponse(), 3, 3);
    expect(result).toBe(false);
    expect(setTimeoutSpy).not.toHaveBeenCalled();
  });

  it("returns false with no sleep when attempt exceeds retries", async () => {
    const result = await handleRateLimitResponse(makeResponse(), 5, 3);
    expect(result).toBe(false);
    expect(setTimeoutSpy).not.toHaveBeenCalled();
  });
});
