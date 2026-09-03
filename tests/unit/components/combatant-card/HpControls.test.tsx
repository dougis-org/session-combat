import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { CombatantState } from '@/lib/types';
import { CombatantCard } from '@/lib/components/CombatantCard';

const BASE: CombatantState = {
  id: 'c1',
  name: 'Aria',
  type: 'player',
  initiative: 12,
  conditions: [],
  hp: 20,
  maxHp: 20,
  ac: 15,
  abilityScores: { strength: 10, dexterity: 10, constitution: 10, intelligence: 10, wisdom: 10, charisma: 10 },
};

function renderCard(overrides: Partial<CombatantState> = {}) {
  const onUpdate = jest.fn();
  render(
    <CombatantCard combatId="combat-1" combatant={{ ...BASE, ...overrides }} isActive={false} onUpdate={onUpdate} onRemove={jest.fn()} />
  );
  return { onUpdate, user: userEvent.setup() };
}

beforeEach(() => localStorage.clear());

describe('HpControls (through CombatantCard)', () => {
  test('Damage applies through the hook and enables Undo', async () => {
    const { onUpdate, user } = renderCard({ hp: 20 });
    await user.type(screen.getByRole('spinbutton'), '5');
    await user.click(screen.getByRole('button', { name: 'Damage' }));
    expect(onUpdate).toHaveBeenCalledWith(expect.objectContaining({ hp: 15 }));
    expect(screen.getByRole('spinbutton')).toHaveValue(null);
    expect(screen.getByTestId('undo-hp-change')).not.toBeDisabled();
  });

  test('Undo restores hp and tempHp only', async () => {
    const { onUpdate, user } = renderCard({ hp: 20, tempHp: 0 });
    await user.type(screen.getByRole('spinbutton'), '5');
    await user.click(screen.getByRole('button', { name: 'Damage' }));
    onUpdate.mockClear();
    await user.click(screen.getByTestId('undo-hp-change'));
    expect(onUpdate).toHaveBeenCalledWith({ hp: 20, tempHp: 0 });
  });

  test('Temp checkbox switches Heal to Set Temp', async () => {
    const { user } = renderCard();
    await user.click(screen.getByRole('checkbox', { name: /Temp/ }));
    expect(screen.getByRole('button', { name: 'Set Temp' })).toBeInTheDocument();
  });
});
