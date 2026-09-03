import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { CombatantState } from '@/lib/types';
import { CombatantCardHeader, InitiativeControl } from '@/lib/components/combatant-card/CombatantCardHeader';

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

const renderHeader = (overrides: Partial<CombatantState> = {}, props: Record<string, unknown> = {}) =>
  render(
    <CombatantCardHeader combatant={{ ...BASE, ...overrides }} isActive={false} onRemove={jest.fn()} {...props} />
  );

describe('CombatantCardHeader', () => {
  test('renders the dying life-state badge', () => {
    renderHeader({ lifeState: 'dying', deathSaves: { successes: 0, failures: 0 } });
    expect(screen.getByTestId('life-state-badge')).toHaveTextContent('Dying');
  });

  test('info button calls onShowDetails with id and a position', async () => {
    const onShowDetails = jest.fn();
    renderHeader({}, { onShowDetails });
    await userEvent.setup().click(screen.getByTestId('combatant-detail-toggle'));
    expect(onShowDetails).toHaveBeenCalledWith('c1', expect.objectContaining({ top: expect.any(Number), left: expect.any(Number) }));
  });

  test('remove button falls back to onRemove when onShowRemoveConfirm is absent', async () => {
    const onRemove = jest.fn();
    render(<CombatantCardHeader combatant={BASE} isActive={false} onRemove={onRemove} />);
    await userEvent.setup().click(screen.getByTitle('Remove combatant'));
    expect(onRemove).toHaveBeenCalledTimes(1);
  });

  test('remove button prefers onShowRemoveConfirm when provided', async () => {
    const onRemove = jest.fn();
    const onShowRemoveConfirm = jest.fn();
    render(<CombatantCardHeader combatant={BASE} isActive={false} onRemove={onRemove} onShowRemoveConfirm={onShowRemoveConfirm} />);
    await userEvent.setup().click(screen.getByTitle('Remove combatant'));
    expect(onShowRemoveConfirm).toHaveBeenCalledTimes(1);
    expect(onRemove).not.toHaveBeenCalled();
  });

  test('renders the legendary-action badge when the pool is set', () => {
    renderHeader({ legendaryActionCount: 3, legendaryActionsRemaining: 2 });
    expect(screen.getByTestId('legendary-action-badge')).toHaveTextContent('⚡ 2/3');
  });

  test('InitiativeControl click calls onSetInitiative with the id', async () => {
    const onSetInitiative = jest.fn();
    render(<InitiativeControl combatant={BASE} onSetInitiative={onSetInitiative} />);
    await userEvent.setup().click(screen.getByRole('button'));
    expect(onSetInitiative).toHaveBeenCalledWith('c1');
  });
});
