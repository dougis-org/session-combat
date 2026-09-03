import React, { useState } from 'react';
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

const ENEMY: CombatantState = { ...BASE, id: 'e1', name: 'Goblin', type: 'monster' };

function renderCard(overrides: Partial<CombatantState> = {}, extra: Record<string, unknown> = {}) {
  const onUpdate = jest.fn();
  render(
    <CombatantCard
      combatId="combat-1"
      combatant={{ ...BASE, ...overrides }}
      isActive={false}
      onUpdate={onUpdate}
      onRemove={jest.fn()}
      {...extra}
    />
  );
  return { onUpdate, user: userEvent.setup() };
}

beforeEach(() => localStorage.clear());

describe('CombatantCard composition — action column', () => {
  test('the action column keeps Add Target(s) and Add Condition triggers', () => {
    renderCard();
    expect(screen.getByRole('button', { name: 'Add Target(s)' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Add Condition' })).toBeInTheDocument();
  });

  test('Add Target(s) toggles the targeting panel', async () => {
    const { user } = renderCard({}, { allCombatants: [BASE, ENEMY], onUpdateCombatant: jest.fn() });
    await user.click(screen.getByRole('button', { name: 'Add Target(s)' }));
    expect(screen.getByText(/Select targets for Aria/)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Add Target(s)' }));
    expect(screen.queryByText(/Select targets for Aria/)).not.toBeInTheDocument();
  });

  test('Add Condition opens the modal and a submitted condition reaches onUpdate', async () => {
    const { onUpdate, user } = renderCard();
    await user.click(screen.getByRole('button', { name: 'Add Condition' }));
    await user.type(screen.getByTestId('condition-name-input'), 'Prone');
    await user.click(screen.getByTestId('condition-form-add'));
    expect(onUpdate).toHaveBeenCalledWith({
      conditions: [expect.objectContaining({ name: 'Prone' })],
    });
  });

  test('re-entering dying after a revive clears the stale death-save note', async () => {
    function Harness() {
      const [c, setC] = useState<CombatantState>({
        ...BASE, hp: 0, maxHp: 20, lifeState: 'dying', deathSaves: { successes: 0, failures: 0 },
      });
      return (
        <CombatantCard
          combatId="combat-1"
          combatant={c}
          isActive={false}
          onUpdate={(u) => setC(prev => ({ ...prev, ...u }))}
          onRemove={jest.fn()}
        />
      );
    }
    const rollSpy = jest.spyOn(require('@/lib/utils/dice'), 'rollDie').mockReturnValue([20]);
    render(<Harness />);
    const user = userEvent.setup();

    await user.click(screen.getByRole('button', { name: /roll/i }));
    expect(screen.getByTestId('death-save-note')).toBeInTheDocument(); // "revived at 1 HP"
    rollSpy.mockRestore();

    // combatant is now hp 1, no lifeState — take it back to 0
    await user.type(screen.getByRole('spinbutton'), '9');
    await user.click(screen.getByRole('button', { name: 'Damage' }));
    expect(screen.queryByTestId('death-save-note')).not.toBeInTheDocument();
  });
});
