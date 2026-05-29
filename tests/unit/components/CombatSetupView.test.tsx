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
import { CombatSetupView } from '@/lib/components/CombatSetupView';
import { makeUseCombat } from '@/tests/unit/fixtures/useCombat';
import type { CombatantState, Encounter } from '@/lib/types';

function makeEncounter(overrides: Partial<Encounter> = {}): Encounter {
  return {
    id: 'e1',
    userId: 'user-1',
    name: 'Goblin Ambush',
    description: '',
    monsters: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

function makeSetupCombatant(overrides: Partial<CombatantState> = {}): CombatantState {
  return {
    id: 's1',
    name: 'Fighter',
    type: 'player',
    initiative: 0,
    hp: 20,
    maxHp: 20,
    ac: 16,
    conditions: [],
    abilityScores: {
      strength: 16,
      dexterity: 12,
      constitution: 14,
      intelligence: 10,
      wisdom: 10,
      charisma: 10,
    },
    ...overrides,
  } as CombatantState;
}

describe('CombatSetupView', () => {
  it('renders setup combatant names from setupCombatants', () => {
    const fighter = makeSetupCombatant({ id: 's1', name: 'Fighter', type: 'player' });
    const rogue = makeSetupCombatant({ id: 's2', name: 'Rogue', type: 'player' });
    const combat = makeUseCombat({ setupCombatants: [fighter, rogue] });
    render(<CombatSetupView combat={combat} user={null} />);
    expect(screen.getByText('Fighter')).toBeInTheDocument();
    expect(screen.getByText('Rogue')).toBeInTheDocument();
  });

  it('renders no combatant elements when setupCombatants is empty', () => {
    render(<CombatSetupView combat={makeUseCombat()} user={null} />);
    expect(screen.queryByText('Quick Entry Combatants:')).not.toBeInTheDocument();
  });

  it('clicking "Start Combat" calls startCombatWithSetupCombatants once', async () => {
    const user = userEvent.setup();
    const startCombatWithSetupCombatants = jest.fn();
    const fighter = makeSetupCombatant({ id: 's1', name: 'Fighter', type: 'player' });
    const combat = makeUseCombat({
      setupCombatants: [fighter],
      startCombatWithSetupCombatants,
    });
    render(<CombatSetupView combat={combat} user={null} />);
    await user.click(screen.getByTestId('start-combat-quick'));
    expect(startCombatWithSetupCombatants).toHaveBeenCalledTimes(1);
  });

  it('clicking "Add Party Member" calls setShowCombatantModal with true', async () => {
    const user = userEvent.setup();
    const setShowCombatantModal = jest.fn();
    const combat = makeUseCombat({ setShowCombatantModal });
    render(<CombatSetupView combat={combat} user={null} />);
    const [addBtn] = screen.getAllByRole('button', { name: /add party member/i });
    await user.click(addBtn);
    expect(setShowCombatantModal).toHaveBeenCalledWith(true);
  });

  it('QuickCombatantModal is visible when showCombatantModal is true', () => {
    const combat = makeUseCombat({ showCombatantModal: true });
    render(<CombatSetupView combat={combat} user={null} />);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Add Combatant' })).toBeInTheDocument();
  });

  it('changing encounter select calls setSelectedEncounterId', async () => {
    const user = userEvent.setup();
    const setSelectedEncounterId = jest.fn();
    const encounter = makeEncounter({ id: 'e1', name: 'Goblin Ambush' });
    const combat = makeUseCombat({ encounters: [encounter], setSelectedEncounterId });
    render(<CombatSetupView combat={combat} user={null} />);
    const [encounterSelect] = screen.getAllByRole('combobox');
    await user.selectOptions(encounterSelect, 'e1');
    expect(setSelectedEncounterId).toHaveBeenCalledWith('e1');
  });

  it('changing party select calls selectParty with null when empty value selected', async () => {
    const user = userEvent.setup();
    const selectParty = jest.fn();
    const combat = makeUseCombat({ selectParty });
    render(<CombatSetupView combat={combat} user={null} />);
    const [, partySelect] = screen.getAllByRole('combobox');
    await user.selectOptions(partySelect, '');
    expect(selectParty).toHaveBeenCalledWith(null);
  });

  it('clicking Add Lair calls setShowLairForm with true', async () => {
    const user = userEvent.setup();
    const setShowLairForm = jest.fn();
    const combat = makeUseCombat({ setShowLairForm });
    render(<CombatSetupView combat={combat} user={null} />);
    await user.click(screen.getByRole('button', { name: /add lair/i }));
    expect(setShowLairForm).toHaveBeenCalledWith(true);
  });

  it('clicking remove button calls removeCombatantFromSetup with correct ID', async () => {
    const user = userEvent.setup();
    const removeCombatantFromSetup = jest.fn();
    const fighter = makeSetupCombatant({ id: 's1', name: 'Fighter', type: 'player' });
    const combat = makeUseCombat({
      setupCombatants: [fighter],
      removeCombatantFromSetup,
    });
    render(<CombatSetupView combat={combat} user={null} />);
    await user.click(screen.getByRole('button', { name: /remove fighter/i }));
    expect(removeCombatantFromSetup).toHaveBeenCalledWith('s1');
  });
});
