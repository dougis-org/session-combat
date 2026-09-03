import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { CombatantState } from '@/lib/types';
import { ConditionControls } from '@/lib/components/combatant-card/ConditionControls';

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

function setup(overrides: Partial<CombatantState> = {}) {
  const onUpdate = jest.fn();
  render(<ConditionControls combatant={{ ...BASE, ...overrides }} onUpdate={onUpdate} />);
  return { onUpdate, user: userEvent.setup() };
}

describe('ConditionControls', () => {
  test('Add Condition opens a modal and does not call window.prompt', async () => {
    const promptSpy = jest.spyOn(window, 'prompt');
    const { user } = setup();
    await user.click(screen.getByRole('button', { name: 'Add Condition' }));
    expect(screen.getByTestId('condition-form-modal')).toBeInTheDocument();
    expect(promptSpy).not.toHaveBeenCalled();
    promptSpy.mockRestore();
  });

  test('submitting the modal adds a validated condition', async () => {
    const { onUpdate, user } = setup();
    await user.click(screen.getByRole('button', { name: 'Add Condition' }));
    await user.type(screen.getByTestId('condition-name-input'), 'Prone');
    await user.click(screen.getByTestId('condition-form-add'));
    expect(onUpdate).toHaveBeenCalledWith({
      conditions: [expect.objectContaining({ name: 'Prone', duration: undefined })],
    });
  });

  test('existing conditions expand and per-item remove filters the list', async () => {
    const { onUpdate, user } = setup({
      conditions: [
        { id: 'x1', name: 'Poisoned', description: '' },
        { id: 'x2', name: 'Prone', description: '' },
      ],
    });
    await user.click(screen.getByRole('button', { name: /Conditions \(2\)/ }));
    const removeButtons = screen.getAllByRole('button', { name: 'Remove' });
    await user.click(removeButtons[0]);
    expect(onUpdate).toHaveBeenCalledWith({ conditions: [{ id: 'x2', name: 'Prone', description: '' }] });
  });
});
