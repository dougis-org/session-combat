import { formatInitiativeRoll } from '@/lib/components/combatant-card/formatInitiativeRoll';

describe('formatInitiativeRoll', () => {
  test('rolled without advantage: die + bonus', () => {
    expect(formatInitiativeRoll({ method: 'rolled', roll: 12, advantage: false, bonus: 3, total: 15 }))
      .toBe('d20:12+3');
  });

  test('rolled with advantage and a dropped die, plus a flat bonus', () => {
    expect(
      formatInitiativeRoll({ method: 'rolled', roll: 17, altRoll: 4, advantage: true, bonus: 1, flatBonus: 2, total: 20 })
    ).toBe('d20:17↑ (dropped:4)+1+2');
  });

  test('rolled with advantage but no altRoll', () => {
    expect(formatInitiativeRoll({ method: 'rolled', roll: 15, advantage: true, bonus: 2, total: 17 }))
      .toBe('d20:15↑+2');
  });

  test('manual with roll and bonuses', () => {
    expect(formatInitiativeRoll({ method: 'manual', roll: 9, bonus: 2, flatBonus: 1, total: 12 }))
      .toBe('9+2+1');
  });

  test('manual with a negative bonus', () => {
    expect(formatInitiativeRoll({ method: 'manual', roll: 10, bonus: -1, total: 9 }))
      .toBe('10-1');
  });

  test('manual with nothing to show falls back to "Manual"', () => {
    expect(formatInitiativeRoll({ method: 'manual', roll: null as unknown as number, bonus: 0, total: 0 }))
      .toBe('Manual');
  });
});
