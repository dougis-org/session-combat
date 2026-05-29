/**
 * @jest-environment jsdom
 */

import { jest, describe, test, expect } from '@jest/globals';
import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TargetActionModal } from '@/lib/components/TargetActionModal';
import type { CombatantState } from '@/lib/types';

const TARGET: CombatantState = {
  id: 't1',
  name: 'Goblin Target',
  type: 'monster',
  initiative: 12,
  conditions: [],
  hp: 7,
  maxHp: 7,
  ac: 13,
  abilityScores: { strength: 8, dexterity: 14, constitution: 10, intelligence: 10, wisdom: 8, charisma: 8 },
};

function renderModal(overrides: Partial<{
  onClose: jest.Mock;
  onApplyDamage: jest.Mock;
  onAddCondition: jest.Mock;
}> = {}) {
  const onClose = overrides.onClose ?? jest.fn();
  const onApplyDamage = overrides.onApplyDamage ?? jest.fn();
  const onAddCondition = overrides.onAddCondition ?? jest.fn();
  render(
    <TargetActionModal
      target={TARGET}
      onClose={onClose as any}
      onApplyDamage={onApplyDamage as any}
      onAddCondition={onAddCondition as any}
    />
  );
  return { onClose, onApplyDamage, onAddCondition };
}

describe('TargetActionModal', () => {
  test('renders target info and buttons', () => {
    renderModal();
    screen.getByText('Goblin Target');
    screen.getByText(/HP: 7\/7/);
    screen.getByText(/AC: 13/);
    screen.getByRole('button', { name: /apply damage/i });
    screen.getByRole('button', { name: /add condition/i });
    screen.getByRole('button', { name: /cancel/i });
  });

  test('calls onClose when Cancel is clicked', async () => {
    const { onClose } = renderModal();
    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: /cancel/i }));
    expect(onClose).toHaveBeenCalled();
  });

  test('transitions to damage screen and fires onApplyDamage', async () => {
    const { onApplyDamage } = renderModal();
    const user = userEvent.setup();

    await user.click(screen.getByRole('button', { name: /apply damage/i }));
    expect(screen.queryByRole('button', { name: /apply damage/i })).not.toBeInTheDocument();

    await user.type(screen.getByPlaceholderText('Damage amount'), '5');
    await user.selectOptions(screen.getByRole('combobox', { name: /damage type/i }), 'fire');

    await user.click(screen.getByRole('button', { name: /apply \(fire\)/i }));
    expect(onApplyDamage).toHaveBeenCalledWith(5, 'fire');
  });

  test('transitions to condition screen and fires onAddCondition', async () => {
    const { onAddCondition } = renderModal();
    const user = userEvent.setup();

    await user.click(screen.getByRole('button', { name: /add condition/i }));
    expect(screen.queryByRole('button', { name: /add condition/i })).not.toBeInTheDocument();

    await user.type(screen.getByPlaceholderText('Condition name'), 'Stunned');
    await user.type(screen.getByPlaceholderText('Duration in rounds (optional)'), '3');

    await user.click(screen.getByRole('button', { name: /^add$/i }));
    expect(onAddCondition).toHaveBeenCalledWith('Stunned', 3);
  });
});
