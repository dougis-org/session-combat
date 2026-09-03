/**
 * Shared validation for user-entered HP-adjustment amounts. Combat HP changes
 * are entered as free text (self path) or parsed from a modal field (target
 * path); both must reach persisted combat state only as a plain positive integer
 * within a sane range.
 */

export const MAX_HP_ADJUSTMENT = 1_000_000;

/** True when `n` is a plain integer in the inclusive range `[1, 1_000_000]`. */
export function isValidHpAmount(n: number): boolean {
  return Number.isSafeInteger(n) && n >= 1 && n <= MAX_HP_ADJUSTMENT;
}

/** Parse a free-text HP-adjustment field, returning `null` for any invalid input. */
export function parseHpAmount(raw: string): number | null {
  const trimmed = raw.trim();
  if (!/^\d+$/.test(trimmed)) return null;
  const amount = Number(trimmed);
  return isValidHpAmount(amount) ? amount : null;
}
