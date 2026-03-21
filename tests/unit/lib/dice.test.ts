import { rollD20 } from "@/lib/utils/dice";

describe("rollD20", () => {
  it("returns a number between 1 and 20 inclusive", () => {
    for (let i = 0; i < 100; i++) {
      const result = rollD20();
      expect(result).toBeGreaterThanOrEqual(1);
      expect(result).toBeLessThanOrEqual(20);
    }
  });

  it("returns an integer", () => {
    const result = rollD20();
    expect(Number.isInteger(result)).toBe(true);
  });

  it("throws when crypto is unavailable", () => {
    const originalCrypto = global.crypto;
    try {
      Object.defineProperty(global, "crypto", {
        value: undefined,
        configurable: true,
      });

      expect(() => rollD20()).toThrow(
        "Secure random number generation is not available"
      );
    } finally {
      Object.defineProperty(global, "crypto", {
        value: originalCrypto,
        configurable: true,
      });
    }
  });
});
