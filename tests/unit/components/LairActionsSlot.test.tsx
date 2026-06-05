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
import { LairActionsSlot } from '@/lib/components/LairActionsSlot';
import type { CombatantState } from '@/lib/types';

const BASE_COMBATANT: Partial<CombatantState> = {
  id: 'lair1',
  name: 'Dungeon Dragon',
  type: 'monster',
  initiative: 20,
  hp: 200,
  maxHp: 200,
  ac: 20,
  conditions: [],
  abilityScores: {
    strength: 10,
    dexterity: 10,
    constitution: 10,
    intelligence: 10,
    wisdom: 10,
    charisma: 10,
  },
  lairActions: [
    { name: 'Stalactite Fall', description: 'Rocks fall.', cost: 1, usesRemaining: 2 },
  ],
};

function renderSlot(
  overrides: Partial<CombatantState> = {},
  props: { isActive?: boolean; onUpdate?: jest.Mock; onNextTurn?: jest.Mock } = {}
) {
  const combatant = { ...BASE_COMBATANT, ...overrides } as CombatantState;
  const onUpdate = props.onUpdate ?? jest.fn();
  const onNextTurn = props.onNextTurn ?? jest.fn();
  const isActive = props.isActive ?? false;
  render(
    <LairActionsSlot
      combatant={combatant}
      onUpdate={onUpdate}
      onNextTurn={onNextTurn}
      isActive={isActive}
    />
  );
  return { onUpdate, onNextTurn };
}

beforeEach(() => localStorage.clear());

describe('LairActionsSlot', () => {
  describe('inactive pill', () => {
    it('renders combatant name', () => {
      renderSlot({}, { isActive: false });
      expect(screen.getByText('Dungeon Dragon')).toBeInTheDocument();
    });

    it('renders initiative', () => {
      renderSlot({}, { isActive: false });
      expect(screen.getByText(/Init 20/i)).toBeInTheDocument();
    });

    it('has no Restore All button', () => {
      renderSlot({}, { isActive: false });
      expect(screen.queryByTestId('lair-action-restore-all')).not.toBeInTheDocument();
    });
  });

  describe('active panel', () => {
    it('renders combatant name in expanded panel', () => {
      renderSlot({}, { isActive: true });
      expect(screen.getByText('Dungeon Dragon')).toBeInTheDocument();
    });

    it('has lair-action-restore-all button', () => {
      renderSlot({}, { isActive: true });
      expect(screen.getByTestId('lair-action-restore-all')).toBeInTheDocument();
    });

    it('Restore All click calls onUpdate with incremented charges', async () => {
      const user = userEvent.setup();
      const { onUpdate } = renderSlot({}, { isActive: true });
      await user.click(screen.getByTestId('lair-action-restore-all'));
      expect(onUpdate).toHaveBeenCalledWith(
        expect.objectContaining({ lairActions: expect.any(Array) })
      );
      const call = onUpdate.mock.calls[0][0];
      // restoreCharge increments usesRemaining by 1 (2 → 3)
      expect(call.lairActions[0].usesRemaining).toBe(3);
    });
  });
});
