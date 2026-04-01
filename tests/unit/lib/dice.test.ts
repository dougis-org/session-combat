import { rollDie } from "@/lib/utils/dice";

// ---------------------------------------------------------------------------
// Supported die sizes and default count behaviour
// ---------------------------------------------------------------------------
describe("rollDie – supported die sizes and default count", () => {
  const supportedSides = [4, 6, 8, 10, 12, 20, 100] as const;

  it.each(supportedSides)(
    "returns a one-element array with a value in range for d%i",
    (sides) => {
      const result = rollDie(sides);
      expect(result).toHaveLength(1);
      expect(result[0]).toBeGreaterThanOrEqual(1);
      expect(result[0]).toBeLessThanOrEqual(sides);
    }
  );

  it("default count of 1 produces the same result as explicit count 1", () => {
    const defaultResult = rollDie(20);
    const explicitResult = rollDie(20, 1);
    expect(defaultResult).toHaveLength(1);
    expect(explicitResult).toHaveLength(1);
  });

  it("always returns an array even for a single-die roll", () => {
    const result = rollDie(6, 1);
    expect(Array.isArray(result)).toBe(true);
    expect(result).toHaveLength(1);
  });

  it("returns integers within range across many rolls", () => {
    for (let i = 0; i < 200; i++) {
      const [value] = rollDie(20);
      expect(Number.isInteger(value)).toBe(true);
      expect(value).toBeGreaterThanOrEqual(1);
      expect(value).toBeLessThanOrEqual(20);
    }
  });
});

// ---------------------------------------------------------------------------
// Multi-die rolls
// ---------------------------------------------------------------------------
describe("rollDie – multi-die rolls", () => {
  it("returns the correct number of entries for count > 1", () => {
    const result = rollDie(4, 2);
    expect(result).toHaveLength(2);
  });

  it("each entry is within range for the requested die size", () => {
    const result = rollDie(4, 2);
    for (const value of result) {
      expect(value).toBeGreaterThanOrEqual(1);
      expect(value).toBeLessThanOrEqual(4);
    }
  });

  it("handles large counts", () => {
    const count = 10;
    const result = rollDie(6, count);
    expect(result).toHaveLength(count);
    for (const value of result) {
      expect(value).toBeGreaterThanOrEqual(1);
      expect(value).toBeLessThanOrEqual(6);
    }
  });
});

// ---------------------------------------------------------------------------
// Validation – invalid die sizes
// ---------------------------------------------------------------------------
describe("rollDie – invalid die size", () => {
  it("throws for an unsupported die size", () => {
    expect(() => rollDie(7)).toThrow("Unsupported die size");
  });

  it("throws for sides = 0", () => {
    expect(() => rollDie(0)).toThrow("Unsupported die size");
  });

  it("throws for a negative die size", () => {
    expect(() => rollDie(-6)).toThrow("Unsupported die size");
  });

  it("throws for a non-integer die size like 6.5", () => {
    expect(() => rollDie(6.5)).toThrow("Unsupported die size");
  });
});

// ---------------------------------------------------------------------------
// Validation – invalid counts
// ---------------------------------------------------------------------------
describe("rollDie – invalid count", () => {
  it("throws for count = 0", () => {
    expect(() => rollDie(6, 0)).toThrow("Invalid count");
  });

  it("throws for a negative count", () => {
    expect(() => rollDie(6, -1)).toThrow("Invalid count");
  });

  it("throws for a non-integer count like 1.5", () => {
    expect(() => rollDie(6, 1.5)).toThrow("Invalid count");
  });
});

// ---------------------------------------------------------------------------
// Crypto / rejection-sampling failure path
// ---------------------------------------------------------------------------
describe("rollDie – crypto unavailable", () => {
  it("throws when crypto is unavailable", () => {
    const originalCrypto = global.crypto;
    try {
      Object.defineProperty(global, "crypto", {
        value: undefined,
        configurable: true,
      });

      expect(() => rollDie(20)).toThrow(
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
