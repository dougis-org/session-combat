/**
 * @jest-environment jsdom
 */

jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ children, href, ...rest }: { children: React.ReactNode; href: string; [k: string]: unknown }) =>
    React.createElement('a', { href, ...rest }, children),
}));
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn(), replace: jest.fn(), back: jest.fn() }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
}));

import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LegendaryActionsPanel } from '@/lib/components/LegendaryActionsPanel';
import type { CombatantState } from '@/lib/types';

const BASE_COMBATANT: Partial<CombatantState> = {
  id: 'c1',
  name: 'Ancient Dragon',
  type: 'monster',
  initiative: 10,
  hp: 100,
  maxHp: 100,
  ac: 18,
  conditions: [],
  abilityScores: {
    strength: 10,
    dexterity: 10,
    constitution: 10,
    intelligence: 10,
    wisdom: 10,
    charisma: 10,
  },
  legendaryActions: [{ name: 'Claw', cost: 1, description: '' }],
  legendaryActionCount: 3,
  legendaryActionsRemaining: 2,
};

function renderPanel(overrides: Partial<CombatantState> = {}, onUpdate = jest.fn()) {
  const combatant = { ...BASE_COMBATANT, ...overrides } as CombatantState;
  render(<LegendaryActionsPanel combatant={combatant} onUpdate={onUpdate} />);
  return onUpdate;
}

beforeEach(() => localStorage.clear());

describe('LegendaryActionsPanel', () => {
  it('renders remaining count when legendaryActionsRemaining is 2', () => {
    renderPanel();
    expect(screen.getByText(/2 remaining/i)).toBeInTheDocument();
  });

  it('renders null when legendaryActions is empty', () => {
    render(
      <LegendaryActionsPanel
        combatant={{ ...BASE_COMBATANT, legendaryActions: [] } as CombatantState}
        onUpdate={jest.fn()}
      />
    );
    expect(screen.queryByText(/legendary actions/i)).not.toBeInTheDocument();
  });

  it('shows zero when legendaryActionsRemaining is 0', () => {
    renderPanel({ legendaryActionsRemaining: 0 });
    expect(screen.getByText(/0 remaining/i)).toBeInTheDocument();
  });

  it('spend button click calls onUpdate with decremented remaining', async () => {
    const user = userEvent.setup();
    const onUpdate = renderPanel({ legendaryActionsRemaining: 2 });
    const spendBtn = screen.getByTestId('legendary-action-use-0');
    await user.click(spendBtn);
    expect(onUpdate).toHaveBeenCalledWith(expect.objectContaining({ legendaryActionsRemaining: 1 }));
  });

  it('Restore All button calls onUpdate with full count', async () => {
    const user = userEvent.setup();
    const onUpdate = renderPanel({ legendaryActionsRemaining: 1 });
    await user.click(screen.getByTestId('legendary-action-restore'));
    expect(onUpdate).toHaveBeenCalledWith(expect.objectContaining({ legendaryActionsRemaining: 3 }));
  });
});
