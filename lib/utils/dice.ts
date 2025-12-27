/**
 * Roll a d20 (20-sided die) with cryptographically secure randomness
 * Uses rejection sampling to eliminate modulo bias
 */
export function rollD20(): number {
  const max = 20;
  const randomBytes = new Uint8Array(1);
  const limit = Math.floor(256 / max) * max; // 240
  let value: number;
  do {
    crypto.getRandomValues(randomBytes);
    value = randomBytes[0];
  } while (value >= limit);
  return (value % max) + 1;
}
