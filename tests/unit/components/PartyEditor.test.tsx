import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { PartyEditor } from '@/app/parties/page';
import { SharedCharacterEntry, Party, Character, Campaign } from '@/lib/types';

jest.mock('@/lib/components/ui', () => ({
  ErrorBanner: () => null,
  LoadingState: () => React.createElement('div', null, 'Loading...'),
  FormField: ({ label, children }: { label: string; children: React.ReactNode }) =>
    React.createElement('div', null, React.createElement('label', null, label), children),
  EditorShell: ({ children, onSave, onCancel }: {
    children: React.ReactNode;
    onSave: () => void;
    onCancel: () => void;
    title?: string;
    validationError?: string | null;
    saving?: boolean;
    canSave?: boolean;
    saveLabel?: string;
  }) =>
    React.createElement('div', null,
      children,
      React.createElement('button', { onClick: onSave, 'data-testid': 'save-btn' }, 'Save'),
      React.createElement('button', { onClick: onCancel }, 'Cancel'),
    ),
  textInputClass: () => '',
}));

jest.mock('@/lib/components/CharacterMiniSummary', () => ({
  CharacterMiniSummary: () => null,
}));

const makeParty = (overrides: Partial<Party> = {}): Party => ({
  id: 'p-1',
  userId: 'dm-1',
  name: 'Test Party',
  description: '',
  members: [],
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

const makeCharacter = (id: string, name: string): Character => ({
  id,
  userId: 'dm-1',
  name,
  classes: [{ class: 'Fighter', level: 1 }],
  abilityScores: { strength: 10, dexterity: 10, constitution: 10, intelligence: 10, wisdom: 10, charisma: 10 },
  ac: 10,
  hp: 10,
  maxHp: 10,
});

const makeSharedEntry = (characterId: string, userId: string, name: string, deletedAt?: Date): SharedCharacterEntry => ({
  share: { id: `share-${characterId}`, campaignId: 'camp-1', characterId, userId, sharedAt: new Date() },
  character: makeCharacter(characterId, name),
});

const makeCampaign = (id: string, name: string): Campaign => ({
  id,
  userId: 'dm-1',
  name,
  moduleName: 'Test',
  chapters: [],
  status: 'active',
  notes: '',
  createdAt: new Date(),
  updatedAt: new Date(),
});

const defaultProps = {
  party: makeParty({ campaignId: 'camp-1' }),
  characters: [] as Character[],
  campaigns: [makeCampaign('camp-1', 'Campaign Alpha')],
  sharedCharacters: [] as SharedCharacterEntry[],
  onSave: jest.fn().mockResolvedValue(undefined),
  onCancel: jest.fn(),
  onCampaignChange: jest.fn(),
  isNew: false,
};

describe('PartyEditor — shared characters', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('D1-1: shows "Shared by Campaign Members" section when campaignId set and sharedCharacters present', () => {
    const shared = [makeSharedEntry('sc-1', 'player-1', 'Arya Stark')];
    render(React.createElement(PartyEditor, { ...defaultProps, sharedCharacters: shared }));
    expect(screen.getByText('Shared by Campaign Members')).toBeTruthy();
    expect(screen.getByText('Arya Stark')).toBeTruthy();
  });

  test('D1-2: shared characters grouped by owner', () => {
    const shared = [
      makeSharedEntry('sc-1', 'player-1', 'Arya'),
      makeSharedEntry('sc-2', 'player-2', 'Sansa'),
      makeSharedEntry('sc-3', 'player-2', 'Bran'),
    ];
    render(React.createElement(PartyEditor, { ...defaultProps, sharedCharacters: shared }));
    const p1Label = screen.getByLabelText('Shared by: player-1');
    const p2Label = screen.getByLabelText('Shared by: player-2');
    expect(p1Label).toBeTruthy();
    expect(p2Label).toBeTruthy();
    expect(screen.getByText('Arya')).toBeTruthy();
    expect(screen.getByText('Sansa')).toBeTruthy();
    expect(screen.getByText('Bran')).toBeTruthy();
  });

  test('D1-3: soft-deleted shared character is not shown', () => {
    const deletedEntry = makeSharedEntry('sc-del', 'player-1', 'Deleted Char');
    deletedEntry.character.deletedAt = new Date();
    const shared = [deletedEntry, makeSharedEntry('sc-act', 'player-1', 'Active Char')];
    render(React.createElement(PartyEditor, { ...defaultProps, sharedCharacters: shared }));
    expect(screen.queryByText('Deleted Char')).toBeNull();
    expect(screen.getByText('Active Char')).toBeTruthy();
  });

  test('D1-4: no shared section when sharedCharacters is empty', () => {
    render(React.createElement(PartyEditor, { ...defaultProps, sharedCharacters: [] }));
    expect(screen.queryByText('Shared by Campaign Members')).not.toBeInTheDocument();
  });

  test('D1-5: no shared section when party has no campaignId', () => {
    render(React.createElement(PartyEditor, {
      ...defaultProps,
      party: makeParty({ campaignId: undefined }),
      sharedCharacters: [makeSharedEntry('sc-1', 'player-1', 'Arya')],
    }));
    expect(screen.queryByText('Shared by Campaign Members')).not.toBeInTheDocument();
  });

  test('D1-6: shared character checkbox toggles and is included in save payload', async () => {
    const shared = [makeSharedEntry('sc-1', 'player-1', 'Arya Stark')];
    render(React.createElement(PartyEditor, { ...defaultProps, sharedCharacters: shared }));
    const checkbox = screen.getByRole('checkbox', { name: /Arya Stark/i });
    fireEvent.click(checkbox);
    fireEvent.click(screen.getByTestId('save-btn'));
    await Promise.resolve();
    expect(defaultProps.onSave).toHaveBeenCalledTimes(1);
    const [, characterIds] = defaultProps.onSave.mock.calls[0];
    expect(characterIds).toContain('sc-1');
  });

  test('D1-7: onCampaignChange is called when campaign select changes', () => {
    render(React.createElement(PartyEditor, { ...defaultProps }));
    const select = screen.getByRole('combobox');
    fireEvent.change(select, { target: { value: 'camp-1' } });
    expect(defaultProps.onCampaignChange).toHaveBeenCalledWith('camp-1');
  });
});
