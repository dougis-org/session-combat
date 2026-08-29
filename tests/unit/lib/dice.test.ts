import {
  rollDie,
  rollDicePool,
  rollPercentile,
  PERCENTILE_FORMULA,
} from "@/lib/utils/dice";

// ---------------------------------------------------------------------------
// rollPercentile – two-d10 decode
// ---------------------------------------------------------------------------
describe("rollPercentile", () => {
  // Queue raw bytes for getRandomValues so we can force specific d10 faces.
  // rollOneDie(10) returns (byte % 10) + 1, so byte `f - 1` yields face `f`.
  function stubFaces(faces: number[]) {
    const bytes = faces.map((f) => f - 1);
    let i = 0;
    return jest
      .spyOn(crypto, "getRandomValues")
      .mockImplementation((arr) => {
        (arr as Uint8Array)[0] = bytes[i++];
        return arr as Uint8Array;
      });
  }

  afterEach(() => jest.restoreAllMocks());

  it("returns { tensFace, onesFace, value } with faces in 1..10 and value in 1..100", () => {
    const spy = stubFaces([3, 7]);
    const r = rollPercentile();
    expect(r).toEqual({ tensFace: 3, onesFace: 7, value: 37 });
    spy.mockRestore();
  });

  it.each([
    [[10, 10], 100],
    [[10, 9], 9],
    [[9, 7], 97],
    [[10, 1], 1],
    [[1, 10], 10],
  ])("decodes faces %j to %i", (faces, expected) => {
    stubFaces(faces as number[]);
    expect(rollPercentile().value).toBe(expected);
  });

  it("over many real iterations every face 1..10 appears for both dice and every value 1..100 is reachable", () => {
    const tens = new Set<number>();
    const ones = new Set<number>();
    const values = new Set<number>();
    for (let i = 0; i < 5000; i++) {
      const r = rollPercentile();
      expect(r.tensFace).toBeGreaterThanOrEqual(1);
      expect(r.tensFace).toBeLessThanOrEqual(10);
      expect(r.onesFace).toBeGreaterThanOrEqual(1);
      expect(r.onesFace).toBeLessThanOrEqual(10);
      expect(r.value).toBeGreaterThanOrEqual(1);
      expect(r.value).toBeLessThanOrEqual(100);
      tens.add(r.tensFace);
      ones.add(r.onesFace);
      values.add(r.value);
    }
    expect(tens.size).toBe(10);
    expect(ones.size).toBe(10);
    expect(values.size).toBe(100);
  });

  it("exposes the persisted formula string", () => {
    expect(PERCENTILE_FORMULA).toBe("d%");
  });
});

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

  it("default count of 1 and explicit count 1 both return a one-element array", () => {
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

// ---------------------------------------------------------------------------
// rollDicePool – multi-group dice pool
// ---------------------------------------------------------------------------
describe("rollDicePool – single-group pool", () => {
  it("returns tagged results for a single group", () => {
    const result = rollDicePool([{ sides: 6, count: 2 }]);
    expect(result).toHaveLength(2);
    for (const entry of result) {
      expect(entry.sides).toBe(6);
      expect(entry.value).toBeGreaterThanOrEqual(1);
      expect(entry.value).toBeLessThanOrEqual(6);
    }
  });
});

describe("rollDicePool – mixed-group pool", () => {
  it("returns results tagged by their own group's sides, in group order", () => {
    const result = rollDicePool([
      { sides: 6, count: 2 },
      { sides: 8, count: 2 },
    ]);
    expect(result).toHaveLength(4);
    expect(result[0].sides).toBe(6);
    expect(result[1].sides).toBe(6);
    expect(result[2].sides).toBe(8);
    expect(result[3].sides).toBe(8);
    expect(result[0].value).toBeGreaterThanOrEqual(1);
    expect(result[0].value).toBeLessThanOrEqual(6);
    expect(result[2].value).toBeGreaterThanOrEqual(1);
    expect(result[2].value).toBeLessThanOrEqual(8);
  });
});

describe("rollDicePool – empty group list", () => {
  it("returns an empty array without error", () => {
    expect(rollDicePool([])).toEqual([]);
  });
});

describe("rollDicePool – validation", () => {
  it("rejects the whole call when any group has an unsupported die size", () => {
    expect(() =>
      rollDicePool([
        { sides: 6, count: 1 },
        { sides: 7, count: 1 },
      ])
    ).toThrow("Unsupported die size");
  });

  it("rejects the whole call when any group has an invalid count", () => {
    expect(() => rollDicePool([{ sides: 6, count: 0 }])).toThrow("Invalid count");
  });
});

describe("rollDicePool – unbiased randomness smoke check", () => {
  it("produces values across the full 1..sides range with no out-of-range values", () => {
    const seen = new Set<number>();
    for (let i = 0; i < 200; i++) {
      const [{ sides, value }] = rollDicePool([{ sides: 6, count: 1 }]);
      expect(sides).toBe(6);
      expect(value).toBeGreaterThanOrEqual(1);
      expect(value).toBeLessThanOrEqual(6);
      seen.add(value);
    }
    expect(seen.size).toBe(6);
  });
});
