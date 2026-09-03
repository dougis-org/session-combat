import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { CombatantState } from '@/lib/types';
import { TargetingPanel } from '@/lib/components/combatant-card/TargetingPanel';

const mk = (o: Partial<CombatantState> & Pick<CombatantState, 'id' | 'name'>): CombatantState => ({
  type: 'monster',
  initiative: 10,
  conditions: [],
  hp: 10,
  maxHp: 10,
  ac: 12,
  abilityScores: { strength: 10, dexterity: 10, constitution: 10, intelligence: 10, wisdom: 10, charisma: 10 },
  ...o,
});

const SELF = mk({ id: 's1', name: 'Fighter', type: 'player' });
const ENEMY = mk({ id: 'e1', name: 'Goblin' });

function setup(selfOverrides: Partial<CombatantState> = {}) {
  const onUpdate = jest.fn();
  const onUpdateCombatant = jest.fn();
  render(
    <TargetingPanel
      combatId="combat-1"
      combatant={{ ...SELF, ...selfOverrides }}
      allCombatants={[{ ...SELF, ...selfOverrides }, ENEMY]}
      onUpdate={onUpdate}
      onUpdateCombatant={onUpdateCombatant}
    />
  );
  return { onUpdate, onUpdateCombatant, user: userEvent.setup() };
}

beforeEach(() => localStorage.clear());

describe('TargetingPanel', () => {
  test('checking an enemy updates targetIds', async () => {
    const { onUpdate, user } = setup();
    await user.click(screen.getByRole('button', { name: /Add Target/ }));
    await user.click(screen.getByRole('checkbox', { name: 'Goblin' }));
    expect(onUpdate).toHaveBeenCalledWith(expect.objectContaining({ targetIds: ['e1'] }));
  });

  test('clicking a target chip opens the target action modal', async () => {
    const { user } = setup({ targetIds: ['e1'] });
    await user.click(screen.getByRole('button', { name: 'Goblin' }));
    expect(screen.getByRole('button', { name: 'Apply Damage' })).toBeInTheDocument();
  });
});
