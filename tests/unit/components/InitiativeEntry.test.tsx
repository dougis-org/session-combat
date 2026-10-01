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
  onClose = jest.fn(),
  unrolledMonsterCount?: number,
  onRollAllMonsters = jest.fn()
) {
  const combatant = { ...BASE_COMBATANT, ...overrides } as CombatantState;
  render(<InitiativeEntry combatant={combatant} unrolledMonsterCount={unrolledMonsterCount} onRollAllMonsters={onRollAllMonsters} onSet={onSet} onClose={onClose} />);
  return { onSet, onClose, onRollAllMonsters };
}

beforeEach(() => {
  localStorage.clear();
  jest.spyOn(window, 'alert').mockImplementation(() => {});
});

afterEach(() => jest.restoreAllMocks());

describe('InitiativeEntry', () => {
  it('shows Set Initiative as the modal title', () => {
    renderEntry();

    expect(screen.getByRole('heading', { name: 'Set Initiative', level: 2 })).toBeInTheDocument();
  });

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

    it('decimal value is rejected rather than silently truncated', async () => {
      const user = userEvent.setup();
      const { onSet } = renderEntry();
      await user.click(screen.getByText('Enter Dice Roll'));
      const input = screen.getByPlaceholderText('1-20');
      await user.clear(input);
      await user.type(input, '15.9');
      await user.click(screen.getByText('Set'));
      expect(window.alert).toHaveBeenCalled();
      expect(onSet).not.toHaveBeenCalled();
    });

    it('blank value is rejected rather than silently treated as 0', async () => {
      const user = userEvent.setup();
      const { onSet } = renderEntry();
      await user.click(screen.getByText('Enter Dice Roll'));
      const input = screen.getByPlaceholderText('1-20');
      await user.clear(input);
      await user.click(screen.getByText('Set'));
      expect(window.alert).toHaveBeenCalled();
      expect(onSet).not.toHaveBeenCalled();
    });

    it('negative value is rejected rather than silently truncated', async () => {
      const user = userEvent.setup();
      const { onSet } = renderEntry();
      await user.click(screen.getByText('Enter Dice Roll'));
      const input = screen.getByPlaceholderText('1-20');
      await user.clear(input);
      await user.type(input, '-5');
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

    it('decimal value is rejected rather than silently truncated', async () => {
      const user = userEvent.setup();
      const { onSet } = renderEntry();
      await user.click(screen.getByText('Enter Total'));
      const input = screen.getByPlaceholderText('Total initiative');
      await user.clear(input);
      await user.type(input, '15.9');
      await user.click(screen.getByText('Set'));
      expect(window.alert).toHaveBeenCalled();
      expect(onSet).not.toHaveBeenCalled();
    });

    it('blank value is rejected rather than silently treated as 0', async () => {
      const user = userEvent.setup();
      const { onSet } = renderEntry();
      await user.click(screen.getByText('Enter Total'));
      const input = screen.getByPlaceholderText('Total initiative');
      await user.clear(input);
      await user.click(screen.getByText('Set'));
      expect(window.alert).toHaveBeenCalled();
      expect(onSet).not.toHaveBeenCalled();
    });

    it('negative value is rejected rather than silently truncated', async () => {
      const user = userEvent.setup();
      const { onSet } = renderEntry();
      await user.click(screen.getByText('Enter Total'));
      const input = screen.getByPlaceholderText('Total initiative');
      await user.clear(input);
      await user.type(input, '-5');
      await user.click(screen.getByText('Set'));
      expect(window.alert).toHaveBeenCalled();
      expect(onSet).not.toHaveBeenCalled();
    });

    it('0 is accepted as a valid total (the lower boundary, not rejected like negative values)', async () => {
      const user = userEvent.setup();
      const { onSet } = renderEntry();
      await user.click(screen.getByText('Enter Total'));
      const input = screen.getByPlaceholderText('Total initiative');
      await user.clear(input);
      await user.type(input, '0');
      await user.click(screen.getByText('Set'));
      expect(window.alert).not.toHaveBeenCalled();
      expect(onSet).toHaveBeenCalledWith(expect.objectContaining({ total: 0 }));
    });
  });

  describe('close button', () => {
    it('does not embed the combatant name in its accessible name, to avoid colliding with role-based button queries elsewhere on the page', () => {
      renderEntry({ name: 'Test Fighter [temp-hp-absorbs-damage-correctly]' });
      expect(screen.getByRole('button', { name: 'Close initiative editor' })).toBeInTheDocument();
    });
  });

  describe('click-outside behavior', () => {
    it('mousedown outside the modal calls onClose', () => {
      const { onClose } = renderEntry();
      const outside = document.createElement('div');
      document.body.appendChild(outside);
      outside.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
      expect(onClose).toHaveBeenCalledTimes(1);
      document.body.removeChild(outside);
    });

    it('mousedown inside the modal does not call onClose', async () => {
      const user = userEvent.setup();
      const { onClose } = renderEntry();
      await user.click(screen.getByText('Roll d20'));
      expect(onClose).not.toHaveBeenCalled();
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

    it('Escape key calls onClose even when no initiativeRoll', async () => {
      const user = userEvent.setup();
      const { onClose } = renderEntry({ initiativeRoll: undefined });
      await user.keyboard('{Escape}');
      expect(onClose).toHaveBeenCalledTimes(1);
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


  describe('batch roll button', () => {
    it('appears when the combatant is a monster and there are multiple unrolled monsters', () => {
      renderEntry({ type: 'monster' }, undefined, undefined, 3);
      expect(screen.getByRole('button', { name: 'Roll d20 for all 3 unrolled Monsters' })).toBeInTheDocument();
    });

    it('does not appear if there is only 1 unrolled monster', () => {
      renderEntry({ type: 'monster' }, undefined, undefined, 1);
      expect(screen.queryByRole('button', { name: /Roll d20 for all/ })).not.toBeInTheDocument();
    });

    it('does not appear if the combatant is a player, even if there are multiple unrolled monsters', () => {
      renderEntry({ type: 'player' }, undefined, undefined, 3);
      expect(screen.queryByRole('button', { name: /Roll d20 for all/ })).not.toBeInTheDocument();
    });

    it('calls onRollAllMonsters with advantage and flat bonus when clicked', async () => {
      const user = userEvent.setup();
      const { onRollAllMonsters } = renderEntry({ type: 'monster' }, undefined, undefined, 3);
      
      // Set advantage
      await user.click(screen.getByLabelText('Advantage'));
      
      // Set flat bonus
      const input = screen.getByLabelText('Flat initiative bonus');
      await user.clear(input);
      await user.type(input, '2');
      await user.keyboard('{Enter}');
      
      // Click batch roll
      await user.click(screen.getByRole('button', { name: 'Roll d20 for all 3 unrolled Monsters' }));
      
      expect(onRollAllMonsters).toHaveBeenCalledWith(true, 2);
    });
  });

describe('layout structure', () => {
  const FOLLOWING = Node.DOCUMENT_POSITION_FOLLOWING;

  // The controls column is the shared parent of the mode buttons, bonus row and entry div.
  function getControlsColumn() {
    return screen.getByRole('button', { name: 'Roll d20' }).parentElement!.parentElement!;
  }

  it('places dice input and Set below the mode buttons in the controls column', async () => {
    renderEntry();
    await userEvent.click(screen.getByRole('button', { name: 'Enter Dice Roll' }));

    const column = getControlsColumn();
    const buttonRow = screen.getByRole('button', { name: 'Roll d20' }).parentElement!;
    const input = screen.getByPlaceholderText('1-20');
    const setButton = screen.getByRole('button', { name: 'Set' });
    const nameBlock = column.parentElement!.firstElementChild!;
    expect(nameBlock.contains(screen.getByRole('heading', { name: 'Gandalf' }))).toBe(true);

    expect(column.contains(input)).toBe(true);
    expect(column.contains(setButton)).toBe(true);
    expect(buttonRow.compareDocumentPosition(input) & FOLLOWING).toBeTruthy();
    expect(buttonRow.compareDocumentPosition(setButton) & FOLLOWING).toBeTruthy();
    expect(nameBlock.contains(input)).toBe(false);
    expect(nameBlock.contains(setButton)).toBe(false);
  });

  it('keeps the bonus row and entry div in the same column as the mode buttons', () => {
    renderEntry();

    const column = getControlsColumn();
    expect(column.contains(screen.getByLabelText('Advantage'))).toBe(true);
    expect(column.contains(screen.getByLabelText('Flat initiative bonus'))).toBe(true);
  });

  it('places total input and Set in the controls column after the mode buttons', async () => {
    renderEntry();
    await userEvent.click(screen.getByRole('button', { name: 'Enter Total' }));

    const column = getControlsColumn();
    const buttonRow = screen.getByRole('button', { name: 'Roll d20' }).parentElement!;
    const input = screen.getByPlaceholderText('Total initiative');
    const setButton = screen.getByRole('button', { name: 'Set' });

    expect(column.contains(input)).toBe(true);
    expect(column.contains(setButton)).toBe(true);
    expect(buttonRow.compareDocumentPosition(input) & FOLLOWING).toBeTruthy();
  });

  it('uses a single-column grid with the two-column template only at md+', () => {
    renderEntry();

    const grid = getControlsColumn().parentElement!;
    expect(grid).toHaveClass('grid', 'grid-cols-1', 'md:grid-cols-[auto_1fr]');
  });

  it('renders the result readout in the controls column below the buttons', () => {
    renderEntry({
      initiativeRoll: { roll: 12, bonus: 2, total: 14, method: 'rolled' },
    } as Partial<CombatantState>);

    const column = getControlsColumn();
    const buttonRow = screen.getByRole('button', { name: 'Roll d20' }).parentElement!;
    const readout = screen.getByText('14');

    expect(column.contains(readout)).toBe(true);
    expect(buttonRow.compareDocumentPosition(readout) & FOLLOWING).toBeTruthy();
  });
});
