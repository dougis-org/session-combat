/** Fallback label + accessible name when the user has no usable username. */
export const USER_MENU_FALLBACK_LABEL = 'Account';

/** Usernames at or below this length are shown in full; longer ones collapse to initials. */
export const MAX_INLINE_USERNAME_LENGTH = 8;

export interface UserMenuDisplay {
  /** Text shown inside the trigger badge: the full username, or its initials. */
  label: string;
  /** 1–2 uppercased code points, first + last whitespace token (for a future avatar). */
  initials: string;
  /** Full accessible name for `aria-label` / `title`; the fallback label when absent. */
  accessibleName: string;
}

/**
 * Derives the account-trigger display strings from a username. Single owner of
 * these rules (design.md Decision 3); never throws.
 *
 * - Empty/undefined/whitespace-only → the `"Account"` fallback (label `AC` initials).
 * - `initials` = first code point of the first token + first code point of the
 *   last token (single token → just its first), uppercased, ≤ 2 code points.
 * - `label` = the trimmed username when ≤ 8 characters, otherwise `initials`.
 */
export function deriveUserMenuDisplay(username?: string): UserMenuDisplay {
  const trimmed = (username ?? '').trim();

  if (trimmed === '') {
    return {
      label: USER_MENU_FALLBACK_LABEL,
      initials: 'AC',
      accessibleName: USER_MENU_FALLBACK_LABEL,
    };
  }

  const tokens = trimmed.split(/\s+/);
  const firstChar = [...tokens[0]][0] ?? '';
  const lastChar = [...tokens[tokens.length - 1]][0] ?? '';
  const initials = (
    tokens.length === 1 ? firstChar : firstChar + lastChar
  ).toUpperCase();

  const label =
    trimmed.length <= MAX_INLINE_USERNAME_LENGTH ? trimmed : initials;

  return { label, initials, accessibleName: trimmed };
}
