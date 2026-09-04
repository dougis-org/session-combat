import type { InitiativeRoll } from '@/lib/types';

const signed = (n: number): string => `${n > 0 ? '+' : ''}${n}`;

/**
 * Render the small grey initiative-roll breakdown shown next to a combatant's
 * initiative value. Extracted verbatim from the old inline JSX so the header
 * component stays simple and this branchy formatting is unit-testable.
 */
export function formatInitiativeRoll(roll: InitiativeRoll): string {
  if (roll.method === 'rolled') {
    const die = roll.advantage
      ? `d20:${roll.roll}↑${roll.altRoll != null ? ` (dropped:${roll.altRoll})` : ''}`
      : `d20:${roll.roll}`;
    return [
      die,
      `+${roll.bonus}`,
      roll.flatBonus ? signed(roll.flatBonus) : null,
    ]
      .filter(Boolean)
      .join('');
  }

  return (
    [
      roll.roll != null ? String(roll.roll) : null,
      roll.bonus !== 0 ? signed(roll.bonus) : null,
      roll.flatBonus ? signed(roll.flatBonus) : null,
    ]
      .filter((part): part is string => part != null)
      .join('') || 'Manual'
  );
}
