/**
 * Roll a d20 (20-sided die) with cryptographically secure randomness
 * Uses rejection sampling to eliminate modulo bias
 */
export function rollD20(): number {
  const max = 20;
  const randomBytes = new Uint8Array(1);
  // 256 is the size of a single byte range (0-255); limit is the largest multiple
  // of `max` less than 256, i.e. Math.floor(256 / max) * max, to avoid modulo bias.
  const limit = Math.floor(256 / max) * max;

  const cryptoObj =
    (typeof crypto !== "undefined"
      ? crypto
      : typeof globalThis !== "undefined"
      ? (globalThis as any).crypto
      : undefined) as Crypto | undefined;

  if (!cryptoObj || typeof cryptoObj.getRandomValues !== "function") {
    throw new Error("Secure random number generation is not available in this environment.");
  }

  let value: number;
  do {
    cryptoObj.getRandomValues(randomBytes);
    value = randomBytes[0];
  } while (value >= limit);
  return (value % max) + 1;
}
