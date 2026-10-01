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
import { makeCombatant, makeEncounter } from '@/tests/unit/fixtures/combatHelpers';
import type { CombatantState, Party } from '@/lib/types';

jest.mock('@/lib/components/ActiveCampaignBanner', () => ({
  ActiveCampaignBanner: () => null,
}));

function makeSetupCombatant(overrides: Partial<CombatantState> = {}): CombatantState {
  return makeCombatant({ id: 's1', name: 'Fighter', type: 'player', initiative: 0, hp: 20, maxHp: 20, ac: 16, abilityScores: { strength: 16, dexterity: 12, constitution: 14, intelligence: 10, wisdom: 10, charisma: 10 }, ...overrides });
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
    await user.click(screen.getByRole('button', { name: /add party member/i }));
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
    const encounterSelect = screen.getByDisplayValue('No encounter');
    await user.selectOptions(encounterSelect, 'e1');
    expect(setSelectedEncounterId).toHaveBeenCalledWith('e1');
  });

  it('changing party select calls selectParty with null when empty value selected', async () => {
    const user = userEvent.setup();
    const selectParty = jest.fn();
    const party: Party = { id: 'p1', userId: 'user-1', name: 'Alpha Squad', members: [], createdAt: new Date(), updatedAt: new Date() };
    const combat = makeUseCombat({ parties: [party], selectedPartyId: 'p1', selectParty });
    render(<CombatSetupView combat={combat} user={null} />);
    const partySelect = screen.getByDisplayValue('Alpha Squad');
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

  it('renders campaign empty state with a link to manage campaign encounters when campaignId is set and encounters is empty', () => {
    const combat = makeUseCombat({ campaignId: 'campaign-1', encounters: [] });
    render(<CombatSetupView combat={combat} user={null} />);
    expect(screen.getByText('No encounters linked to this campaign.')).toBeInTheDocument();
    const link = screen.getByRole('link', { name: 'Manage Campaign Encounters' });
    expect(link).toHaveAttribute('href', '/campaigns/campaign-1/encounters');
    expect(screen.queryByDisplayValue('No encounter')).not.toBeInTheDocument();
  });

  it('renders the encounter select instead of the empty state when campaignId is set and encounters is non-empty', () => {
    const encounter = makeEncounter({ id: 'e1', name: 'Goblin Ambush' });
    const combat = makeUseCombat({ campaignId: 'campaign-1', encounters: [encounter] });
    render(<CombatSetupView combat={combat} user={null} />);
    expect(screen.queryByText('No encounters linked to this campaign.')).not.toBeInTheDocument();
    expect(screen.getByDisplayValue('No encounter')).toBeInTheDocument();
  });

  it('renders the encounter select instead of the empty state when campaignId is unset, even with no encounters', () => {
    const combat = makeUseCombat({ campaignId: undefined, encounters: [] });
    render(<CombatSetupView combat={combat} user={null} />);
    expect(screen.queryByText('No encounters linked to this campaign.')).not.toBeInTheDocument();
    expect(screen.getByDisplayValue('No encounter')).toBeInTheDocument();
  });

  it('encodes special characters in campaignId when building the empty-state link href', () => {
    const combat = makeUseCombat({ campaignId: 'a/b?c', encounters: [] });
    render(<CombatSetupView combat={combat} user={null} />);
    const link = screen.getByRole('link', { name: 'Manage Campaign Encounters' });
    expect(link).toHaveAttribute('href', '/campaigns/a%2Fb%3Fc/encounters');
  });

  describe('encounter picker sort and search', () => {
    const encounters = [
      makeEncounter({ id: 'e1', name: 'Owlbear Den' }),
      makeEncounter({ id: 'e2', name: 'goblin Ambush' }),
      makeEncounter({ id: 'e3', name: 'Dragon Lair' }),
    ];

    const encounterOptionNames = () =>
      screen
        .getByDisplayValue('No encounter')
        .querySelectorAll('option');

    it('renders options alphabetically after "No encounter"', () => {
      render(<CombatSetupView combat={makeUseCombat({ encounters })} user={null} />);
      const labels = Array.from(encounterOptionNames()).map(o => o.textContent);
      expect(labels).toEqual(['No encounter', 'Dragon Lair', 'goblin Ambush', 'Owlbear Den']);
    });

    it('exposes the search input by accessible name', () => {
      render(<CombatSetupView combat={makeUseCombat({ encounters })} user={null} />);
      expect(screen.getAllByRole('textbox', { name: 'Search encounters' })).toHaveLength(1);
    });

    it('filters options when typing in the search input', async () => {
      const user = userEvent.setup();
      render(<CombatSetupView combat={makeUseCombat({ encounters })} user={null} />);
      await user.type(screen.getByRole('textbox', { name: 'Search encounters' }), 'gob');
      const labels = Array.from(encounterOptionNames()).map(o => o.textContent);
      expect(labels).toEqual(['No encounter', 'goblin Ambush']);
    });

    it('restores all options for cleared or whitespace-only input', async () => {
      const user = userEvent.setup();
      render(<CombatSetupView combat={makeUseCombat({ encounters })} user={null} />);
      const input = screen.getByRole('textbox', { name: 'Search encounters' });
      await user.type(input, 'gob');
      await user.clear(input);
      expect(encounterOptionNames()).toHaveLength(4);
      await user.type(input, '   ');
      expect(encounterOptionNames()).toHaveLength(4);
    });

    it('keeps the selected encounter selected and offered after a non-matching search', async () => {
      const user = userEvent.setup();
      const combat = makeUseCombat({ encounters, selectedEncounterId: 'e1' });
      render(<CombatSetupView combat={combat} user={null} />);
      await user.type(screen.getByRole('textbox', { name: 'Search encounters' }), 'gob');
      const labels = Array.from(screen.getByDisplayValue('Owlbear Den').querySelectorAll('option')).map(o => o.textContent);
      expect(labels).toEqual(['No encounter', 'goblin Ambush', 'Owlbear Den']);
      expect(screen.queryByText('No encounters match')).not.toBeInTheDocument();
    });

    it('shows "No encounters match" when nothing matches', async () => {
      const user = userEvent.setup();
      render(<CombatSetupView combat={makeUseCombat({ encounters })} user={null} />);
      expect(screen.queryByText('No encounters match')).not.toBeInTheDocument();
      await user.type(screen.getByRole('textbox', { name: 'Search encounters' }), 'zzz');
      expect(screen.getByText('No encounters match')).toBeInTheDocument();
      expect(encounterOptionNames()).toHaveLength(1);
    });

    it('shows "No encounters match" when only the retained selection remains', async () => {
      const user = userEvent.setup();
      const combat = makeUseCombat({ encounters, selectedEncounterId: 'e1' });
      render(<CombatSetupView combat={combat} user={null} />);
      await user.type(screen.getByRole('textbox', { name: 'Search encounters' }), 'zzz');
      expect(screen.getByText('No encounters match')).toBeInTheDocument();
    });

    it('renders no search input in the campaign empty state', () => {
      const combat = makeUseCombat({ campaignId: 'campaign-1', encounters: [] });
      render(<CombatSetupView combat={combat} user={null} />);
      expect(screen.queryByRole('textbox', { name: 'Search encounters' })).not.toBeInTheDocument();
    });

    it('shows the search input for campaign-scoped setup with encounters', () => {
      const combat = makeUseCombat({ campaignId: 'campaign-1', encounters });
      render(<CombatSetupView combat={combat} user={null} />);
      expect(screen.getByRole('textbox', { name: 'Search encounters' })).toBeInTheDocument();
    });
  });
});
