/**
 * Pure helper deriving the account-trigger label and initials from a username.
 *
 * Rules (see openspec/changes/add-user-account-menu/design.md Decision 3):
 * - Trim input. Empty/undefined/whitespace-only -> { label: 'Account', initials: 'AC' }.
 * - initials = first code point of the first token + first code point of the last
 *   token (single token -> just its first code point), uppercased, at most 2 chars.
 * - label = the trimmed username when its length is <= 8, otherwise the initials.
 * - Never throws; non-ASCII tokens use their first code point as-is (uppercased).
 */
export function deriveUserMenuDisplay(username?: string): {
  label: string;
  initials: string;
} {
  const trimmed = (username ?? '').trim();

  if (trimmed === '') {
    return { label: 'Account', initials: 'AC' };
  }

  const tokens = trimmed.split(/\s+/);
  const firstChar = [...tokens[0]][0] ?? '';
  const lastChar = [...tokens[tokens.length - 1]][0] ?? '';
  const initials = (
    tokens.length === 1 ? firstChar : firstChar + lastChar
  ).toUpperCase();

  const label = trimmed.length <= 8 ? trimmed : initials;

  return { label, initials };
}
