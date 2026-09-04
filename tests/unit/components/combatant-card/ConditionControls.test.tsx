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

function setup(overrides: Partial<CombatantState> = {}, extra: Partial<React.ComponentProps<typeof ConditionControls>> = {}) {
  const onUpdate = jest.fn();
  const onModalClose = jest.fn();
  render(
    <ConditionControls
      combatant={{ ...BASE, ...overrides }}
      onUpdate={onUpdate}
      modalOpen={false}
      onModalClose={onModalClose}
      {...extra}
    />
  );
  return { onUpdate, onModalClose, user: userEvent.setup() };
}

describe('ConditionControls', () => {
  test('renders the ConditionFormModal (not window.prompt) when modalOpen is true', () => {
    const promptSpy = jest.spyOn(window, 'prompt');
    setup({}, { modalOpen: true });
    expect(screen.getByTestId('condition-form-modal')).toBeInTheDocument();
    expect(promptSpy).not.toHaveBeenCalled();
    promptSpy.mockRestore();
  });

  test('submitting the modal adds a validated condition', async () => {
    const { onUpdate, user } = setup({}, { modalOpen: true });
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

  test('nothing renders when there are no conditions and the modal is closed', () => {
    setup();
    expect(screen.queryByTestId('condition-form-modal')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Conditions/ })).not.toBeInTheDocument();
  });
});
