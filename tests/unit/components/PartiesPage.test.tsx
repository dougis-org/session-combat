import React from 'react';
import { render, screen } from '@testing-library/react';

jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ children, href, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement>) =>
    React.createElement('a', { href, ...props }, children),
}));

jest.mock('@/lib/components/ProtectedRoute', () => ({
  ProtectedRoute: ({ children }: { children: React.ReactNode }) =>
    React.createElement(React.Fragment, null, children),
}));

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
      React.createElement('button', { onClick: onSave }, 'Save'),
      React.createElement('button', { onClick: onCancel }, 'Cancel'),
    ),
  textInputClass: () => '',
}));

const PC = {
  id: 'c1', name: 'Thorin', characterType: 'character', userId: 'u1',
  classes: [{ class: 'Fighter', level: 5 }], race: 'Dwarf',
  hp: 40, maxHp: 40, ac: 16,
  abilityScores: { strength: 16, dexterity: 10, constitution: 14, intelligence: 10, wisdom: 10, charisma: 10 },
};
const NPC = {
  id: 'c2', name: 'Barliman', characterType: 'npc', userId: 'u1',
  classes: [{ class: 'Fighter', level: 1 }],
  hp: 10, maxHp: 10, ac: 10,
  abilityScores: { strength: 10, dexterity: 10, constitution: 10, intelligence: 10, wisdom: 10, charisma: 10 },
};
const COMPANION = {
  id: 'c3', name: 'Bill', characterType: 'companion', userId: 'u1',
  classes: [{ class: 'Fighter', level: 1 }],
  hp: 5, maxHp: 5, ac: 10,
  abilityScores: { strength: 10, dexterity: 10, constitution: 10, intelligence: 10, wisdom: 10, charisma: 10 },
};
const PARTY_ALL = {
  id: 'p1', name: 'Fellowship', members: [
    { characterId: 'c1', addedAt: new Date().toISOString() },
    { characterId: 'c2', addedAt: new Date().toISOString() },
    { characterId: 'c3', addedAt: new Date().toISOString() },
  ],
  userId: 'u1', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
};
const PARTY_PC_ONLY = {
  id: 'p2', name: 'PC Party', members: [
    { characterId: 'c1', addedAt: new Date().toISOString() },
  ],
  userId: 'u1', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
};
const PARTY_EMPTY = {
  id: 'p3', name: 'Empty Party', members: [],
  userId: 'u1', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
};
const PC_NO_TYPE = {
  id: 'c4', name: 'Unknown', characterType: undefined, userId: 'u1',
  classes: [{ class: 'Rogue', level: 3 }],
  hp: 20, maxHp: 20, ac: 14,
  abilityScores: { strength: 10, dexterity: 16, constitution: 12, intelligence: 12, wisdom: 10, charisma: 10 },
};

async function renderWithData(characters: object[], parties: object[]) {
  global.fetch = jest.fn(async (url: RequestInfo | URL) => {
    const urlStr = String(url);
    if (urlStr.includes('/api/parties')) return { ok: true, json: async () => parties } as unknown as Response;
    if (urlStr.includes('/api/characters')) return { ok: true, json: async () => characters } as unknown as Response;
    if (urlStr.includes('/api/campaigns')) return { ok: true, json: async () => [] } as unknown as Response;
    return { ok: true, json: async () => [] } as unknown as Response;
  }) as typeof fetch;

  const { default: PartiesPage } = await import('@/app/parties/page');
  render(React.createElement(PartiesPage));
}

describe('PartiesPage — party card member display', () => {
  test('party with all three types renders three member sections', async () => {
    await renderWithData([PC, NPC, COMPANION], [PARTY_ALL]);

    expect(await screen.findByLabelText('Member section: Player Characters')).toBeInTheDocument();
    expect(screen.getByLabelText('Member section: Travelling NPCs')).toBeInTheDocument();
    expect(screen.getByLabelText('Member section: Companions')).toBeInTheDocument();
  });

  test('PC-only party hides NPC and Companion sections', async () => {
    await renderWithData([PC], [PARTY_PC_ONLY]);

    expect(await screen.findByLabelText('Member section: Player Characters')).toBeInTheDocument();
    expect(screen.queryByLabelText('Member section: Travelling NPCs')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Member section: Companions')).not.toBeInTheDocument();
  });

  test('zero-member party shows no member sections', async () => {
    await renderWithData([PC], [PARTY_EMPTY]);

    await screen.findByText('Empty Party');
    expect(screen.queryAllByLabelText(/^Member section:/)).toHaveLength(0);
  });

  test('member with undefined characterType defaults to Player Characters section', async () => {
    const party = { ...PARTY_PC_ONLY, members: [{ characterId: 'c4', addedAt: new Date().toISOString() }] };
    await renderWithData([PC_NO_TYPE], [party]);

    expect(await screen.findByLabelText('Member section: Player Characters')).toBeInTheDocument();
    expect(screen.queryByLabelText('Member section: Travelling NPCs')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Member section: Companions')).not.toBeInTheDocument();
  });

  test('comma-separated name list is no longer rendered', async () => {
    await renderWithData([PC, NPC], [PARTY_ALL]);

    await screen.findByText('Fellowship');
    const bodyText = document.body.textContent ?? '';
    expect(bodyText).not.toMatch(/Thorin,\s*Barliman/);
    expect(bodyText).not.toMatch(/Barliman,\s*Thorin/);
  });

  test('member names appear in the card', async () => {
    await renderWithData([PC, NPC, COMPANION], [PARTY_ALL]);

    expect(await screen.findByText('Thorin')).toBeInTheDocument();
    expect(screen.getByText('Barliman')).toBeInTheDocument();
    expect(screen.getByText('Bill')).toBeInTheDocument();
  });

  test('no additional fetches on render', async () => {
    await renderWithData([PC, NPC], [PARTY_ALL]);
    await screen.findByText('Fellowship');
    expect(global.fetch).toHaveBeenCalledTimes(3);
  });

  test('NPC-only party renders only NPC section and hides PC and Companion sections', async () => {
    const partyNpcOnly = {
      id: 'p4', name: 'NPC Party', members: [{ characterId: 'c2', addedAt: new Date().toISOString() }],
      userId: 'u1', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    };
    await renderWithData([NPC], [partyNpcOnly]);

    expect(await screen.findByLabelText('Member section: Travelling NPCs')).toBeInTheDocument();
    expect(screen.queryByLabelText('Member section: Player Characters')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Member section: Companions')).not.toBeInTheDocument();
  });

  test('member summaries render all six fields (name, race, class, level, AC, HP)', async () => {
    await renderWithData([PC], [PARTY_PC_ONLY]);

    expect(await screen.findByText('Thorin')).toBeInTheDocument();
    expect(screen.getByText('16')).toBeInTheDocument();
    expect(screen.getByText('40/40')).toBeInTheDocument();
    expect(screen.getByText(/Dwarf/)).toBeInTheDocument();
    expect(screen.getByText(/Fighter/)).toBeInTheDocument();
    expect(screen.getByText(/Lv 5/)).toBeInTheDocument();
  });

  test('renders placeholder Unknown card for missing character ID', async () => {
    const partyWithMissing = {
      id: 'p5', name: 'Missing Party', members: [{ characterId: 'nonexistent-id', addedAt: new Date().toISOString() }],
      userId: 'u1', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    };
    await renderWithData([], [partyWithMissing]);

    expect(await screen.findByText('Unknown')).toBeInTheDocument();
    expect(screen.getByLabelText('Member section: Player Characters')).toBeInTheDocument();
  });
});
