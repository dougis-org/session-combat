/**
 * @jest-environment jsdom
 */

jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ children, href }: { children: React.ReactNode; href: string }) =>
    React.createElement('a', { href }, children),
}));

import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ActiveCombatView } from '@/lib/components/ActiveCombatView';
import { makeUseCombat } from '@/tests/unit/fixtures/useCombat';
import type { UseCombatReturn } from '@/lib/hooks/useCombat';
import type { CombatantState, CombatState } from '@/lib/types';

function makeCombatant(overrides: Partial<CombatantState> = {}): CombatantState {
  return {
    id: 'c1',
    name: 'Goblin',
    type: 'monster',
    initiative: 10,
    hp: 10,
    maxHp: 10,
    ac: 12,
    conditions: [],
    abilityScores: {
      strength: 8,
      dexterity: 14,
      constitution: 10,
      intelligence: 6,
      wisdom: 8,
      charisma: 8,
    },
    ...overrides,
  } as CombatantState;
}

function makeCombatState(overrides: Partial<CombatState> = {}): CombatState {
  return {
    id: 'combat-1',
    userId: 'user-1',
    combatants: [],
    currentRound: 1,
    currentTurnIndex: 0,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

function makeCombat(
  overrides: Partial<UseCombatReturn> = {},
  displayed: CombatantState[] = [],
) {
  return makeUseCombat({
    getDisplayCombatants: jest.fn().mockReturnValue(displayed),
    ...overrides,
  });
}

describe('ActiveCombatView', () => {
  it('renders nothing when combatState is null', () => {
    const { container } = render(<ActiveCombatView combat={makeUseCombat({ combatState: null })} user={null} />);
    expect(container.firstChild).toBeNull();
  });

  it('displays error message when error is set', () => {
    const combat = makeCombat({ combatState: makeCombatState(), error: 'Something went wrong' });
    render(<ActiveCombatView combat={combat} user={null} />);
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
  });

  it('displays toast message when toast is set', () => {
    const combat = makeCombat({ combatState: makeCombatState(), toast: { type: 'success', message: 'Combat saved!' } });
    render(<ActiveCombatView combat={combat} user={null} />);
    expect(screen.getByText('Combat saved!')).toBeInTheDocument();
  });

  it('renders player combatants in the Party section', () => {
    const fighter = makeCombatant({ id: 'p1', name: 'Aria', type: 'player' });
    const combat = makeCombat({ combatState: makeCombatState({ combatants: [fighter] }) }, [fighter]);
    render(<ActiveCombatView combat={combat} user={null} />);
    expect(screen.getByText('Aria')).toBeInTheDocument();
  });

  it('shows zero-initiative panel when combatants need initiative', () => {
    const goblin = makeCombatant({ initiative: 0 });
    const combat = makeCombat({ combatState: makeCombatState({ combatants: [goblin] }), zeroInitiative: [goblin], filteredZeroInitiative: [goblin] });
    render(<ActiveCombatView combat={combat} user={null} />);
    expect(screen.getByText('1 need initiative')).toBeInTheDocument();
  });

  it('shows "no combatants match" when filteredZeroInitiative is empty but zeroInitiative is not', () => {
    const goblin = makeCombatant({ initiative: 0 });
    const combat = makeCombat({ combatState: makeCombatState({ combatants: [goblin] }), zeroInitiative: [goblin], filteredZeroInitiative: [] });
    render(<ActiveCombatView combat={combat} user={null} />);
    expect(screen.getByText(/no combatants match/i)).toBeInTheDocument();
  });

  it('clicking "Add Party Member" calls setShowCombatantModal with true', async () => {
    const user = userEvent.setup();
    const setShowCombatantModal = jest.fn();
    const combat = makeCombat({ combatState: makeCombatState(), setShowCombatantModal });
    render(<ActiveCombatView combat={combat} user={null} />);
    const [addBtn] = screen.getAllByRole('button', { name: /add party member/i });
    await user.click(addBtn);
    expect(setShowCombatantModal).toHaveBeenCalledWith(true);
  });

  it('clicking "Add Enemy" calls setShowCombatantModal with true', async () => {
    const user = userEvent.setup();
    const setShowCombatantModal = jest.fn();
    const combat = makeCombat({ combatState: makeCombatState(), setShowCombatantModal });
    render(<ActiveCombatView combat={combat} user={null} />);
    await user.click(screen.getByRole('button', { name: /add enemy/i }));
    expect(setShowCombatantModal).toHaveBeenCalledWith(true);
  });

  it('clicking "Add Lair" calls setShowLairForm with true', async () => {
    const user = userEvent.setup();
    const setShowLairForm = jest.fn();
    const combat = makeCombat({ combatState: makeCombatState(), setShowLairForm });
    render(<ActiveCombatView combat={combat} user={null} />);
    await user.click(screen.getByRole('button', { name: /add lair/i }));
    expect(setShowLairForm).toHaveBeenCalledWith(true);
  });

  it('shows combatant detail panel when selectedDetailCombatantId and detailPosition are set', () => {
    const goblin = makeCombatant();
    const combat = makeCombat({ combatState: makeCombatState({ combatants: [goblin] }), selectedDetailCombatantId: 'c1', detailPosition: { top: 100, left: 200 } });
    render(<ActiveCombatView combat={combat} user={null} />);
    expect(screen.getByText('Goblin')).toBeInTheDocument();
  });

  it('renders combatant names from getDisplayCombatants', () => {
    const goblin = makeCombatant({ id: 'c1', name: 'Goblin', type: 'monster' });
    const orc = makeCombatant({ id: 'c2', name: 'Orc', type: 'monster' });
    const combat = makeCombat({ combatState: makeCombatState({ combatants: [goblin, orc] }) }, [goblin, orc]);
    render(<ActiveCombatView combat={combat} user={null} />);
    expect(screen.getByText('Goblin')).toBeInTheDocument();
    expect(screen.getByText('Orc')).toBeInTheDocument();
  });

  it('renders no combatant elements when getDisplayCombatants returns []', () => {
    const combat = makeCombat({ combatState: makeCombatState() });
    render(<ActiveCombatView combat={combat} user={null} />);
    expect(screen.queryByText('Goblin')).not.toBeInTheDocument();
    expect(screen.queryByText('Orc')).not.toBeInTheDocument();
  });

  it('clicking "Current Turn (done)" calls nextTurn once', async () => {
    const user = userEvent.setup();
    const goblin = makeCombatant();
    const nextTurn = jest.fn();
    const combat = makeCombat(
      { combatState: makeCombatState({ combatants: [goblin], currentTurnIndex: 0 }), hasInitiativeBeenRolled: jest.fn().mockReturnValue(true), nextTurn },
      [goblin],
    );
    render(<ActiveCombatView combat={combat} user={null} />);
    await user.click(screen.getByRole('button', { name: /current turn/i }));
    expect(nextTurn).toHaveBeenCalledTimes(1);
  });

  it('active combatant card has yellow border class', () => {
    const goblin = makeCombatant();
    const combat = makeCombat(
      { combatState: makeCombatState({ combatants: [goblin], currentTurnIndex: 0 }), hasInitiativeBeenRolled: jest.fn().mockReturnValue(true) },
      [goblin],
    );
    const { container } = render(<ActiveCombatView combat={combat} user={null} />);
    expect(container.querySelector('.border-yellow-500')).toBeInTheDocument();
  });

  it('renders lair slot in initiative order when lair combatant is active', () => {
    const lairCombatant = makeCombatant({ id: 'lair-1', name: 'Dragon Lair', type: 'lair' });
    const combat = makeCombat(
      { combatState: makeCombatState({ combatants: [lairCombatant], currentTurnIndex: 0 }), hasInitiativeBeenRolled: jest.fn().mockReturnValue(true) },
      [lairCombatant],
    );
    render(<ActiveCombatView combat={combat} user={null} />);
    expect(screen.getByTestId('lair-active')).toBeInTheDocument();
  });

  it('renders lair slot remove button when lair combatant is not active', () => {
    const goblin = makeCombatant();
    const lairCombatant = makeCombatant({ id: 'lair-1', name: 'Dragon Lair', type: 'lair' });
    const combat = makeCombat(
      { combatState: makeCombatState({ combatants: [goblin, lairCombatant], currentTurnIndex: 0 }), hasInitiativeBeenRolled: jest.fn().mockReturnValue(true) },
      [goblin, lairCombatant],
    );
    render(<ActiveCombatView combat={combat} user={null} />);
    expect(screen.getByTestId('lair-slot-remove')).toBeInTheDocument();
  });

  it('encounter description modal is visible when showEncounterDescription is true', () => {
    const combat = makeCombat({ combatState: makeCombatState({ encounterDescription: 'A dark cave' }), showEncounterDescription: true });
    render(<ActiveCombatView combat={combat} user={null} />);
    expect(screen.getByText('Encounter Description')).toBeInTheDocument();
  });

  it('encounter description modal is absent when showEncounterDescription is false', () => {
    const combat = makeCombat({ combatState: makeCombatState({ encounterDescription: 'A dark cave' }), showEncounterDescription: false });
    render(<ActiveCombatView combat={combat} user={null} />);
    expect(screen.queryByText('Encounter Description')).not.toBeInTheDocument();
  });

  it('confirming remove calls removeCombatant with correct ID', async () => {
    const user = userEvent.setup();
    const goblin = makeCombatant();
    const removeCombatant = jest.fn();
    const combat = makeCombat({ combatState: makeCombatState({ combatants: [goblin] }), removeConfirmId: 'c1', removeConfirmPosition: { top: 0, left: 0 }, removeCombatant });
    render(<ActiveCombatView combat={combat} user={null} />);
    await user.click(screen.getByTestId('remove-confirm-button'));
    expect(removeCombatant).toHaveBeenCalledWith('c1');
  });

  it('clicking cancel in remove confirm popup does not call removeCombatant', async () => {
    const user = userEvent.setup();
    const goblin = makeCombatant();
    const removeCombatant = jest.fn();
    const setRemoveConfirmId = jest.fn();
    const combat = makeCombat({ combatState: makeCombatState({ combatants: [goblin] }), removeConfirmId: 'c1', removeConfirmPosition: { top: 0, left: 0 }, removeCombatant, setRemoveConfirmId });
    render(<ActiveCombatView combat={combat} user={null} />);
    await user.click(screen.getByRole('button', { name: /cancel/i }));
    expect(removeCombatant).not.toHaveBeenCalled();
    expect(setRemoveConfirmId).toHaveBeenCalledWith(null);
  });
});
