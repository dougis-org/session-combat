const SUPPORTED_SIDES = [4, 6, 8, 10, 12, 20, 100] as const;
type SupportedSides = (typeof SUPPORTED_SIDES)[number];

function getCrypto(): Crypto {
  const cryptoObj =
    typeof crypto !== "undefined"
      ? crypto
      : (globalThis as { crypto?: Crypto }).crypto;

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

/**
 * Roll a mixed pool of dice across multiple die sizes using cryptographically
 * secure randomness. Each group is validated the same way `rollDie` validates
 * its `sides`/`count` arguments; if any group is invalid, no dice are rolled.
 *
 * @param groups - Array of `{ sides, count }` groups to roll
 * @returns Flat array of `{ sides, value }` results, one entry per individual
 *   die, in the same group order the groups were supplied in
 * @throws Error if any group's sides is not a supported value or count is invalid
 */
export function rollDicePool(
  groups: { sides: number; count: number }[]
): { sides: number; value: number }[] {
  for (const { sides, count } of groups) {
    if (!SUPPORTED_SIDES.includes(sides as SupportedSides)) {
      throw new Error(
        `Unsupported die size: ${sides}. Must be one of ${SUPPORTED_SIDES.join(", ")}.`
      );
    }
    if (!Number.isInteger(count) || count < 1) {
      throw new Error(`Invalid count: ${count}. Must be a positive integer.`);
    }
  }

  if (groups.length === 0) return [];

  const cryptoObj = getCrypto();
  const results: { sides: number; value: number }[] = [];
  for (const { sides, count } of groups) {
    for (let i = 0; i < count; i++) {
      results.push({ sides, value: rollOneDie(sides as SupportedSides, cryptoObj) });
    }
  }
  return results;
}

/** Die sizes offered by the standalone dice-pool builder UI (in-chat and global FAB). */
export const DIE_SIDES = [4, 6, 8, 10, 12, 20] as const;

/** A dice pool with every offered die size zeroed out. Frozen — always spread before mutating. */
export const EMPTY_POOL: Readonly<Record<number, number>> = Object.freeze({ 4: 0, 6: 0, 8: 0, 10: 0, 12: 0, 20: 0 });

/**
 * Shared bounds on user-controlled pool inputs (in-chat and standalone FAB builders alike),
 * so a pool can't be grown/modified into excessive client-side computation or an outsized
 * payload. Defense-in-depth only — the server route is the real trust boundary.
 */
export const MAX_PER_DIE = 20;
export const MAX_MODIFIER = 999;

/** Reduce a dice pool to the `{ sides, count }` groups that have at least one die selected. */
export function getActiveDiceGroups(
  pool: Record<number, number>
): { sides: number; count: number }[] {
  return DIE_SIDES.filter((sides) => pool[sides] > 0).map((sides) => ({
    sides,
    count: pool[sides],
  }));
}

/** Render a dice-pool formula string (e.g. `2d6+1d20+3`) from groups and a flat modifier. */
export function buildPoolFormula(
  groups: { sides: number; count: number }[],
  modifier: number
): string {
  let formula = groups.map(({ sides, count }) => `${count}d${sides}`).join("+");
  if (modifier !== 0) formula += modifier > 0 ? `+${modifier}` : `${modifier}`;
  return formula;
}
