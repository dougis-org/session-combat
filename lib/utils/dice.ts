const SUPPORTED_SIDES = [4, 6, 8, 10, 12, 20, 100] as const;
type SupportedSides = (typeof SUPPORTED_SIDES)[number];

function getCrypto(): Crypto {
  const cryptoObj =
    (typeof crypto !== "undefined"
      ? crypto
      : typeof globalThis !== "undefined"
      ? (globalThis as unknown as { crypto?: Crypto }).crypto
      : undefined);

  if (!cryptoObj || typeof cryptoObj.getRandomValues !== "function") {
    throw new Error("Secure random number generation is not available in this environment.");
  }
  return cryptoObj;
}

function rollOneDie(sides: SupportedSides, cryptoObj: Crypto): number {
  const randomBytes = new Uint8Array(1);
  const limit = Math.floor(256 / sides) * sides;
  let value: number;
  do {
    cryptoObj.getRandomValues(randomBytes);
    value = randomBytes[0];
  } while (value >= limit);
  return (value % sides) + 1;
}

/**
 * Roll one or more dice of a given size using cryptographically secure randomness.
 * Uses rejection sampling to eliminate modulo bias.
 *
 * @param sides - Die size; must be one of 4, 6, 8, 10, 12, 20, or 100
 * @param count - Number of dice to roll (default 1; must be a positive integer)
 * @returns Array of individual roll results, one entry per die
 * @throws Error if sides is not a supported value or count is invalid
 */
export function rollDie(sides: number, count = 1): number[] {
  if (!SUPPORTED_SIDES.includes(sides as SupportedSides)) {
    throw new Error(
      `Unsupported die size: ${sides}. Must be one of ${SUPPORTED_SIDES.join(", ")}.`
    );
  }
  if (!Number.isInteger(count) || count < 1) {
    throw new Error(`Invalid count: ${count}. Must be a positive integer.`);
  }

  const cryptoObj = getCrypto();
  const results: number[] = [];
  for (let i = 0; i < count; i++) {
    results.push(rollOneDie(sides as SupportedSides, cryptoObj));
  }
  return results;
}
