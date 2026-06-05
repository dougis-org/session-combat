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
import { InitiativeEntry } from '@/lib/components/InitiativeEntry';
import type { CombatantState } from '@/lib/types';

const BASE_COMBATANT: Partial<CombatantState> = {
  id: 'init1',
  name: 'Gandalf',
  type: 'player',
  initiative: 0,
  hp: 40,
  maxHp: 40,
  ac: 12,
  conditions: [],
  abilityScores: {
    strength: 10,
    dexterity: 14,
    constitution: 10,
    intelligence: 10,
    wisdom: 10,
    charisma: 10,
  },
};

function renderEntry(
  overrides: Partial<CombatantState> = {},
  onSet = jest.fn(),
  onClose = jest.fn()
) {
  const combatant = { ...BASE_COMBATANT, ...overrides } as CombatantState;
  render(<InitiativeEntry combatant={combatant} onSet={onSet} onClose={onClose} />);
  return { onSet, onClose };
}

beforeEach(() => {
  localStorage.clear();
  jest.spyOn(window, 'alert').mockImplementation(() => {});
});

afterEach(() => jest.restoreAllMocks());

describe('InitiativeEntry', () => {
  describe('roll mode', () => {
    it('clicking Roll d20 calls onSet with { roll, bonus, total, method: "rolled" } in valid range', async () => {
      const user = userEvent.setup();
      const { onSet } = renderEntry();
      await user.click(screen.getByText('Roll d20'));
      expect(onSet).toHaveBeenCalledTimes(1);
      const arg = onSet.mock.calls[0][0];
      expect(arg.method).toBe('rolled');
      expect(arg.bonus).toBe(2); // dex 14 → +2
      expect(arg.roll).toBeGreaterThanOrEqual(1);
      expect(arg.roll).toBeLessThanOrEqual(20);
      expect(arg.total).toBe(arg.roll + arg.bonus);
    });

    it('dex modifier +2 is applied to rolled initiative', async () => {
      const user = userEvent.setup();
      const { onSet } = renderEntry();
      await user.click(screen.getByText('Roll d20'));
      expect(onSet.mock.calls[0][0].bonus).toBe(2);
    });

    it('advantage toggle changes UI state', async () => {
      const user = userEvent.setup();
      renderEntry();
      const checkbox = screen.getByRole('checkbox', { name: /advantage/i });
      expect(checkbox).not.toBeChecked();
      await user.click(checkbox);
      expect(checkbox).toBeChecked();
    });
  });

  describe('dice mode', () => {
    it('entering valid value 12 calls onSet with roll: 12', async () => {
      const user = userEvent.setup();
      const { onSet } = renderEntry();
      await user.click(screen.getByText('Enter Dice Roll'));
      const input = screen.getByPlaceholderText('1-20');
      await user.clear(input);
      await user.type(input, '12');
      await user.click(screen.getByText('Set'));
      expect(onSet).toHaveBeenCalledWith(expect.objectContaining({ roll: 12 }));
    });

    it('value 0 triggers alert and onSet not called', async () => {
      const user = userEvent.setup();
      const { onSet } = renderEntry();
      await user.click(screen.getByText('Enter Dice Roll'));
      const input = screen.getByPlaceholderText('1-20');
      await user.clear(input);
      await user.type(input, '0');
      await user.click(screen.getByText('Set'));
      expect(window.alert).toHaveBeenCalled();
      expect(onSet).not.toHaveBeenCalled();
    });

    it('value 21 triggers alert and onSet not called', async () => {
      const user = userEvent.setup();
      const { onSet } = renderEntry();
      await user.click(screen.getByText('Enter Dice Roll'));
      const input = screen.getByPlaceholderText('1-20');
      await user.clear(input);
      await user.type(input, '21');
      await user.click(screen.getByText('Set'));
      expect(window.alert).toHaveBeenCalled();
      expect(onSet).not.toHaveBeenCalled();
    });
  });

  describe('total mode', () => {
    it('entering 15 calls onSet with total: 15', async () => {
      const user = userEvent.setup();
      const { onSet } = renderEntry();
      await user.click(screen.getByText('Enter Total'));
      const input = screen.getByPlaceholderText('Total initiative');
      await user.clear(input);
      await user.type(input, '15');
      await user.click(screen.getByText('Set'));
      expect(onSet).toHaveBeenCalledWith(expect.objectContaining({ total: 15 }));
    });
  });

  describe('Escape key behavior', () => {
    it('Escape key calls onClose when initiativeRoll is set', async () => {
      const user = userEvent.setup();
      const { onClose } = renderEntry({
        initiativeRoll: { roll: 10, bonus: 2, total: 12, method: 'rolled' },
      });
      await user.keyboard('{Escape}');
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('Escape key does NOT call onClose when no initiativeRoll', async () => {
      const user = userEvent.setup();
      const { onClose } = renderEntry({ initiativeRoll: undefined });
      await user.keyboard('{Escape}');
      expect(onClose).not.toHaveBeenCalled();
    });
  });

  describe('dex modifier display', () => {
    it('negative modifier (dexterity: 8) is applied to the rolled initiative callback', async () => {
      const user = userEvent.setup();
      const { onSet } = renderEntry({
        abilityScores: {
          strength: 10,
          dexterity: 8,
          constitution: 10,
          intelligence: 10,
          wisdom: 10,
          charisma: 10,
        },
      });
      await user.click(screen.getByText('Roll d20'));
      const arg = onSet.mock.calls[0][0];
      expect(arg.bonus).toBe(-1); // dex 8 → -1
    });
  });
});
