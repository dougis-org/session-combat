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
import { fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CombatantCard } from '@/lib/components/CombatantCard';
import type { CombatantState } from '@/lib/types';
import { renderCard, BASE } from './CombatantCard.test-helpers';
import * as dice from '@/lib/utils/dice';

beforeEach(() => {
  localStorage.clear();
});

function getQuickRollSection() {
  return document.querySelector('[data-card-section="quick-rolls"]') as HTMLElement;
}

describe('CombatantCard — quick d20 roll', () => {
  test('renders the quick-roll button for a monster combatant', () => {
    renderCard({ type: 'monster' });
    const section = getQuickRollSection();
    expect(within(section).getByRole('button', { name: /roll/i })).toBeInTheDocument();
  });

  test('does not render the quick-roll button for a player combatant', () => {
    renderCard({ type: 'player' });
    const section = getQuickRollSection();
    expect(within(section).queryByRole('button')).not.toBeInTheDocument();
  });

  test('does not render the quick-roll button for a lair combatant', () => {
    renderCard({ type: 'lair' });
    const section = getQuickRollSection();
    expect(within(section).queryByRole('button')).not.toBeInTheDocument();
  });

  test('clicking the button rolls and immediately shows an unmodified d20 result', async () => {
    const rollSpy = jest.spyOn(dice, 'rollDie').mockReturnValue([14]);
    try {
      const user = userEvent.setup();
      renderCard({ type: 'monster' });
      await user.click(within(getQuickRollSection()).getByRole('button', { name: /roll/i }));

      const dialog = screen.getByRole('dialog', { name: 'Dice roll result' });
      expect(within(dialog).getByText('1d20')).toBeInTheDocument();
      expect(dialog.querySelector('#dice-roll-result-total')).toHaveTextContent('14');
      expect(screen.queryByTestId('dice-roll-canvas')).not.toBeInTheDocument();
    } finally {
      rollSpy.mockRestore();
    }
  });

  test('does not trigger a network call or roll submission', async () => {
    const rollSpy = jest.spyOn(dice, 'rollDie').mockReturnValue([9]);
    const originalFetch = global.fetch;
    const fetchSpy = jest.fn();
    global.fetch = fetchSpy as unknown as typeof global.fetch;
    try {
      const user = userEvent.setup();
      renderCard({ type: 'monster' });
      await user.click(within(getQuickRollSection()).getByRole('button', { name: /roll/i }));
      expect(fetchSpy).not.toHaveBeenCalled();
    } finally {
      rollSpy.mockRestore();
      global.fetch = originalFetch;
    }
  });

  test('repeated clicks replace rather than stack the result', async () => {
    const rollSpy = jest.spyOn(dice, 'rollDie').mockReturnValueOnce([3]).mockReturnValueOnce([17]);
    try {
      const user = userEvent.setup();
      renderCard({ type: 'monster' });
      const button = within(getQuickRollSection()).getByRole('button', { name: /roll/i });
      await user.click(button);
      await user.click(button);

      const dialogs = screen.getAllByRole('dialog', { name: 'Dice roll result' });
      expect(dialogs).toHaveLength(1);
      expect(dialogs[0].querySelector('#dice-roll-result-total')).toHaveTextContent('17');
    } finally {
      rollSpy.mockRestore();
    }
  });

  test('leaves HP, conditions, and targeting state untouched', async () => {
    const rollSpy = jest.spyOn(dice, 'rollDie').mockReturnValue([10]);
    try {
      const user = userEvent.setup();
      const onUpdate = renderCard({
        type: 'monster',
        hp: 15,
        maxHp: 20,
        conditions: [{ name: 'poisoned' } as CombatantState['conditions'][number]],
      });
      await user.click(within(getQuickRollSection()).getByRole('button', { name: /roll/i }));
      expect(onUpdate).not.toHaveBeenCalled();
    } finally {
      rollSpy.mockRestore();
    }
  });

  test('two sibling monster cards have independent quick-roll state', async () => {
    const rollSpy = jest.spyOn(dice, 'rollDie').mockReturnValue([6]);
    try {
      const user = userEvent.setup();
      const first: CombatantState = { ...BASE, id: 'm1', type: 'monster' };
      const second: CombatantState = { ...BASE, id: 'm2', type: 'monster' };
      render(
        React.createElement(React.Fragment, null,
          React.createElement(CombatantCard, {
            combatId: 'test-combat',
            combatant: first,
            isActive: false,
            onUpdate: jest.fn(),
            onRemove: jest.fn(),
          }),
          React.createElement(CombatantCard, {
            combatId: 'test-combat',
            combatant: second,
            isActive: false,
            onUpdate: jest.fn(),
            onRemove: jest.fn(),
          }),
        ),
      );

      const sections = screen.getAllByTestId('combatant-card').map((card) =>
        card.querySelector('[data-card-section="quick-rolls"]') as HTMLElement,
      );

      // Roll on the first card only; its own overlay must appear without affecting the second.
      await user.click(within(sections[0]).getByRole('button', { name: /roll/i }));
      expect(screen.getAllByRole('dialog', { name: 'Dice roll result' })).toHaveLength(1);

      // Rolling the second card too, without dismissing the first, must produce a second,
      // independent overlay — proving each card holds its own `activeRoll` state rather than
      // a single shared slot. (Uses fireEvent, not userEvent, to isolate this from
      // DiceRollOverlay's own "click outside closes it" behavior, which is unrelated to
      // per-card state independence and is exercised by the overlay's own tests.)
      fireEvent.click(within(sections[1]).getByRole('button', { name: /roll/i }));
      expect(screen.getAllByRole('dialog', { name: 'Dice roll result' })).toHaveLength(2);
    } finally {
      rollSpy.mockRestore();
    }
  });
});
