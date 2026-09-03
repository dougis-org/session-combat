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
    <CombatantCardHeader combatant={{ ...BASE, ...overrides }} isActive={false} {...props} />
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

  test('remove button calls onShowRemoveConfirm with id and a position', async () => {
    const onShowRemoveConfirm = jest.fn();
    render(<CombatantCardHeader combatant={BASE} isActive={false} onShowRemoveConfirm={onShowRemoveConfirm} />);
    await userEvent.setup().click(screen.getByTitle('Remove combatant'));
    expect(onShowRemoveConfirm).toHaveBeenCalledWith('c1', expect.objectContaining({ top: expect.any(Number), left: expect.any(Number) }));
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

  test('InitiativeControl renders a rolled roll with advantage and a dropped die', () => {
    render(
      <InitiativeControl
        combatant={{
          ...BASE,
          initiative: 18,
          initiativeRoll: { method: 'rolled', roll: 17, altRoll: 4, advantage: true, bonus: 1, flatBonus: 2, total: 20 },
        }}
      />
    );
    expect(screen.getByText(/d20:17↑/)).toBeInTheDocument();
    expect(screen.getByText(/dropped:4/)).toBeInTheDocument();
  });

  test('InitiativeControl renders a plain rolled roll and a manual roll', () => {
    const { rerender } = render(
      <InitiativeControl
        combatant={{ ...BASE, initiativeRoll: { method: 'rolled', roll: 12, advantage: false, bonus: 3, total: 15 } }}
      />
    );
    expect(screen.getByText(/d20:12\+3/)).toBeInTheDocument();
    rerender(
      <InitiativeControl
        combatant={{ ...BASE, initiativeRoll: { method: 'manual', roll: 9, bonus: 2, flatBonus: 1, total: 12 } }}
      />
    );
    expect(screen.getByText(/9\+2\+1/)).toBeInTheDocument();
  });

  test('header HP readout shows temp HP and the low-HP red tint', () => {
    render(<CombatantCardHeader combatant={{ ...BASE, hp: 3, maxHp: 20, tempHp: 4 }} isActive={false} />);
    expect(screen.getByText(/\+4 tmp/)).toBeInTheDocument();
  });
});
