import React from 'react';
import { act } from 'react';
import { Root, createRoot } from 'react-dom/client';
import { Response as FetchResponse } from 'node-fetch';
import { CampaignsContent } from '@/app/campaigns/page';

jest.mock('@/lib/components/ProtectedRoute', () => ({
  ProtectedRoute: ({ children }: { children: React.ReactNode }) => React.createElement(React.Fragment, null, children),
}));

jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ children, href, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement>) =>
    React.createElement('a', { href, ...props }, children),
}));

function jsonResponse(body: unknown, status = 200): Response {
  return new FetchResponse(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  }) as unknown as Response;
}

const BASE_CAMPAIGN = {
  id: 'camp-1',
  userId: 'user-1',
  name: 'My Campaign',
  moduleName: 'LMoP',
  chapters: [{ id: 'ch1', title: 'The Mines', order: 0 }],
  currentChapterId: 'ch1',
  status: 'active',
  notes: '',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

const INACTIVE_CAMPAIGN = { ...BASE_CAMPAIGN, id: 'camp-inactive', name: 'Inactive Campaign', status: 'planning' };

const PARTY = {
  id: 'party-1',
  userId: 'user-1',
  name: 'The Brave Ones',
  campaignId: 'camp-1',
  members: [
    { characterId: 'char-pc', addedAt: new Date().toISOString() },
    { characterId: 'char-npc', addedAt: new Date().toISOString() },
    { characterId: 'char-departed', addedAt: new Date().toISOString(), leftAt: new Date().toISOString() },
  ],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

const PC_CHARACTER = {
  id: 'char-pc',
  userId: 'user-1',
  name: 'Aria',
  race: 'Elf',
  characterType: 'character',
  classes: [{ class: 'Wizard', level: 5 }],
  hp: 30, maxHp: 30, ac: 12,
  abilityScores: { strength: 8, dexterity: 14, constitution: 13, intelligence: 18, wisdom: 12, charisma: 10 },
};

const NPC_CHARACTER = {
  id: 'char-npc',
  userId: 'user-1',
  name: 'Mira',
  race: 'Human',
  characterType: 'npc',
  classes: [{ class: 'Rogue', level: 2 }],
  hp: 15, maxHp: 15, ac: 13,
  abilityScores: { strength: 10, dexterity: 15, constitution: 11, intelligence: 12, wisdom: 10, charisma: 14 },
};

const DEPARTED_CHARACTER = {
  id: 'char-departed',
  userId: 'user-1',
  name: 'Old Bob',
  characterType: 'character',
  classes: [{ class: 'Fighter', level: 1 }],
  hp: 10, maxHp: 10, ac: 15,
  abilityScores: { strength: 16, dexterity: 10, constitution: 14, intelligence: 8, wisdom: 10, charisma: 8 },
};

const MOCK_SESSION = {
  id: 'sess-1',
  userId: 'user-1',
  campaignId: 'camp-1',
  sessionNumber: 11,
  title: 'The Betrayer Revealed',
  datePlayed: '2026-05-14T00:00:00.000Z',
  summary: '',
  events: [],
  milestone: false,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

let container: HTMLDivElement;
let root: Root;
let originalFetch: typeof global.fetch;

beforeEach(() => {
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
  originalFetch = global.fetch;
});

afterEach(() => {
  act(() => { root.unmount(); });
  container.remove();
  global.fetch = originalFetch;
  jest.clearAllMocks();
});

interface FetchSetup {
  campaigns?: unknown[];
  parties?: unknown[];
  characters?: unknown[];
  templates?: unknown[];
  sessionsByCampaignId?: Record<string, unknown[]>;
}

function setupFetch({
  campaigns = [],
  parties = [],
  characters = [],
  templates = [],
  sessionsByCampaignId = {},
}: FetchSetup = {}) {
  global.fetch = jest.fn(async (input: RequestInfo | URL) => {
    const url = input.toString();
    if (url === '/api/campaigns') return jsonResponse(campaigns);
    if (url === '/api/parties') return jsonResponse(parties);
    if (url === '/api/characters') return jsonResponse(characters);
    if (url === '/api/campaigns/global') return jsonResponse(templates);
    const sessionMatch = url.match(/\/api\/campaigns\/([^/]+)\/sessions/);
    if (sessionMatch) {
      const id = sessionMatch[1];
      return jsonResponse(sessionsByCampaignId[id] ?? []);
    }
    return jsonResponse({ error: 'not found' }, 404);
  }) as typeof fetch;
}

async function renderPage() {
  await act(async () => { root.render(React.createElement(CampaignsContent)); });
}

describe('T3 — Fetch logic', () => {
  it('T3.1 — fires all four fetches in parallel on mount', async () => {
    setupFetch({ campaigns: [BASE_CAMPAIGN], parties: [PARTY], characters: [PC_CHARACTER] });
    await renderPage();

    const fetchMock = global.fetch as jest.MockedFunction<typeof fetch>;
    const urls = fetchMock.mock.calls.map(([url]) => url.toString());
    expect(urls).toContain('/api/campaigns');
    expect(urls).toContain('/api/parties');
    expect(urls).toContain('/api/characters');
    expect(urls).toContain('/api/campaigns/global');
  });

  it('T3.2 — departed members (leftAt set) are excluded from roster', async () => {
    setupFetch({
      campaigns: [BASE_CAMPAIGN],
      parties: [PARTY],
      characters: [PC_CHARACTER, NPC_CHARACTER, DEPARTED_CHARACTER],
    });
    await renderPage();
    expect(container.textContent).toContain('Aria');
    expect(container.textContent).toContain('Mira');
    expect(container.textContent).not.toContain('Old Bob');
  });

  it('T3.3 — characters split by characterType (PC vs NPC bucket)', async () => {
    setupFetch({
      campaigns: [BASE_CAMPAIGN],
      parties: [PARTY],
      characters: [PC_CHARACTER, NPC_CHARACTER, DEPARTED_CHARACTER],
    });
    await renderPage();
    expect(container.textContent).toContain('Player Characters');
    expect(container.textContent).toContain('Travelling NPCs & Companions');
  });
});

describe('T4 — Dashboard section UI', () => {
  it('T4.1 — zero active campaigns renders CTA card with updated text; no campaign cards', async () => {
    setupFetch({ campaigns: [INACTIVE_CAMPAIGN], parties: [], characters: [] });
    await renderPage();
    expect(container.textContent).toContain('No active campaigns');
    expect(container.textContent).toContain('set one to Active or create a new one');
    expect(container.textContent).not.toContain('Start Encounter');
  });

  it('T4.2 — two active campaigns render two campaign cards', async () => {
    const camp2 = { ...BASE_CAMPAIGN, id: 'camp-2', name: 'Second Campaign' };
    setupFetch({ campaigns: [BASE_CAMPAIGN, camp2], parties: [], characters: [] });
    await renderPage();
    expect(container.textContent).toContain('My Campaign');
    expect(container.textContent).toContain('Second Campaign');
    const encounterLinks = Array.from(container.querySelectorAll('a')).filter(
      a => a.textContent?.includes('Start Encounter')
    );
    expect(encounterLinks).toHaveLength(2);
  });

  it('T4.3 — active campaign with two linked parties renders two party sub-cards', async () => {
    const party2 = { ...PARTY, id: 'party-2', name: 'Second Party', members: [] };
    setupFetch({
      campaigns: [BASE_CAMPAIGN],
      parties: [PARTY, party2],
      characters: [PC_CHARACTER, NPC_CHARACTER],
    });
    await renderPage();
    expect(container.textContent).toContain('The Brave Ones');
    expect(container.textContent).toContain('Second Party');
  });

  it('T4.4 — active campaign with no linked party shows empty state with /parties link', async () => {
    setupFetch({ campaigns: [BASE_CAMPAIGN], parties: [], characters: [] });
    await renderPage();
    expect(container.textContent).toContain('No party linked');
    const partiesLink = Array.from(container.querySelectorAll('a')).find(
      a => a.getAttribute('href') === '/parties'
    );
    expect(partiesLink).toBeTruthy();
  });

  it('T4.5 — PC section hidden when party has only NPC members', async () => {
    const npcOnlyParty = {
      ...PARTY,
      members: [{ characterId: 'char-npc', addedAt: new Date().toISOString() }],
    };
    setupFetch({
      campaigns: [BASE_CAMPAIGN],
      parties: [npcOnlyParty],
      characters: [NPC_CHARACTER],
    });
    await renderPage();
    expect(container.textContent).toContain('Mira');
    expect(container.textContent).not.toContain('Player Characters');
    expect(container.textContent).toContain('Travelling NPCs & Companions');
  });

  it('T4.N1 — campaign with status planning does not appear in Active Campaigns section', async () => {
    const planningCampaign = { ...BASE_CAMPAIGN, id: 'camp-planning', name: 'Planning Campaign', status: 'planning' };
    setupFetch({ campaigns: [planningCampaign], parties: [], characters: [] });
    await renderPage();
    expect(container.textContent).toContain('No active campaigns');
    expect(container.textContent).not.toContain('Start Encounter');
  });

  it('T4.N2 — campaign with status on-hold does not appear in Active Campaigns section', async () => {
    const onHoldCampaign = { ...BASE_CAMPAIGN, id: 'camp-onhold', name: 'On Hold Campaign', status: 'on-hold' };
    setupFetch({ campaigns: [onHoldCampaign], parties: [], characters: [] });
    await renderPage();
    expect(container.textContent).toContain('No active campaigns');
  });

  it('T4.N3 — campaign with status completed does not appear in Active Campaigns section', async () => {
    const completedCampaign = { ...BASE_CAMPAIGN, id: 'camp-done', name: 'Completed Campaign', status: 'completed' };
    setupFetch({ campaigns: [completedCampaign], parties: [], characters: [] });
    await renderPage();
    expect(container.textContent).toContain('No active campaigns');
  });

  it('T4.N4 — active campaign with non-empty notes renders DM Notes snippet', async () => {
    const campaignWithNotes = { ...BASE_CAMPAIGN, notes: 'Quest: find the orb' };
    setupFetch({ campaigns: [campaignWithNotes], parties: [], characters: [] });
    await renderPage();
    const notesEl = container.querySelector('[data-testid="dm-notes-snippet"]');
    expect(notesEl).toBeTruthy();
    expect(notesEl?.textContent).toContain('Quest: find the orb');
  });

  it('T4.N5 — active campaign with empty notes renders no DM Notes section', async () => {
    const campaignNoNotes = { ...BASE_CAMPAIGN, notes: '' };
    setupFetch({ campaigns: [campaignNoNotes], parties: [], characters: [] });
    await renderPage();
    expect(container.querySelector('[data-testid="dm-notes-snippet"]')).toBeNull();
  });

  it('T4.N6 — active campaign with whitespace-only notes renders no DM Notes section', async () => {
    const campaignWsNotes = { ...BASE_CAMPAIGN, notes: '   ' };
    setupFetch({ campaigns: [campaignWsNotes], parties: [], characters: [] });
    await renderPage();
    expect(container.querySelector('[data-testid="dm-notes-snippet"]')).toBeNull();
  });

  it('T4.N7 — status badge for planning renders bg-slate-600', async () => {
    const planningCamp = { ...BASE_CAMPAIGN, id: 'camp-p', status: 'planning' };
    setupFetch({ campaigns: [planningCamp], parties: [], characters: [] });
    await renderPage();
    const badges = Array.from(container.querySelectorAll('span')).filter(s => s.className.includes('bg-slate-600'));
    expect(badges.length).toBeGreaterThan(0);
  });

  it('T4.N8 — status badge for active renders bg-green-700', async () => {
    setupFetch({ campaigns: [BASE_CAMPAIGN], parties: [], characters: [] });
    await renderPage();
    const badges = Array.from(container.querySelectorAll('span')).filter(s => s.className.includes('bg-green-700'));
    expect(badges.length).toBeGreaterThan(0);
  });

  it('T4.N9 — status badge for on-hold renders bg-yellow-600', async () => {
    const onHoldCamp = { ...BASE_CAMPAIGN, id: 'camp-oh', status: 'on-hold' };
    setupFetch({ campaigns: [onHoldCamp], parties: [], characters: [] });
    await renderPage();
    const badges = Array.from(container.querySelectorAll('span')).filter(s => s.className.includes('bg-yellow-600'));
    expect(badges.length).toBeGreaterThan(0);
  });

  it('T4.N10 — status badge for completed renders bg-gray-600', async () => {
    const completedCamp = { ...BASE_CAMPAIGN, id: 'camp-c', status: 'completed' };
    setupFetch({ campaigns: [completedCamp], parties: [], characters: [] });
    await renderPage();
    const badges = Array.from(container.querySelectorAll('span')).filter(s => s.className.includes('bg-gray-600'));
    expect(badges.length).toBeGreaterThan(0);
  });

  it('T4.6 — existing campaign management list renders below the dashboard section', async () => {
    setupFetch({ campaigns: [BASE_CAMPAIGN], parties: [], characters: [] });
    await renderPage();
    const headings = Array.from(container.querySelectorAll('h1, h2'));
    const activeIndex = headings.findIndex(h => h.textContent?.includes('Active Campaigns'));
    const catalogIndex = headings.findIndex(h => h.textContent?.includes('Campaign Catalog'));
    expect(activeIndex).toBeGreaterThanOrEqual(0);
    expect(catalogIndex).toBeGreaterThan(activeIndex);
    // Management list items appear
    expect(container.textContent).toContain('My Campaign');
  });
});

describe('T5 — Last Session card', () => {
  it('T5.1 — Last Session card renders session number and title when data present', async () => {
    setupFetch({
      campaigns: [BASE_CAMPAIGN],
      parties: [],
      characters: [],
      sessionsByCampaignId: { 'camp-1': [MOCK_SESSION] },
    });
    await renderPage();
    expect(container.textContent).toContain('Session 11');
    expect(container.textContent).toContain('The Betrayer Revealed');
  });

  it('T5.2 — Milestone badge visible when session.milestone === true', async () => {
    setupFetch({
      campaigns: [BASE_CAMPAIGN],
      parties: [],
      characters: [],
      sessionsByCampaignId: { 'camp-1': [{ ...MOCK_SESSION, milestone: true }] },
    });
    await renderPage();
    expect(container.textContent).toContain('Milestone');
  });

  it('T5.3 — Last Session card absent when session fetch returns empty array', async () => {
    setupFetch({
      campaigns: [BASE_CAMPAIGN],
      parties: [],
      characters: [],
      sessionsByCampaignId: { 'camp-1': [] },
    });
    await renderPage();
    expect(container.textContent).not.toContain('Session 11');
  });

  it('T5.4 — campaign cards render before session useEffect fires', async () => {
    let resolveSession!: (v: unknown) => void;
    const sessionPromise = new Promise(res => { resolveSession = res; });

    global.fetch = jest.fn(async (input: RequestInfo | URL) => {
      const url = input.toString();
      if (url === '/api/campaigns') return jsonResponse([BASE_CAMPAIGN]);
      if (url === '/api/parties') return jsonResponse([]);
      if (url === '/api/characters') return jsonResponse([]);
      if (url === '/api/campaigns/global') return jsonResponse([]);
      if (url.includes('/sessions')) {
        await sessionPromise;
        return jsonResponse([MOCK_SESSION]);
      }
      return jsonResponse({}, 404);
    }) as typeof fetch;

    await renderPage();

    // Campaign card visible before session resolves
    expect(container.textContent).toContain('My Campaign');
    expect(container.textContent).toContain('Start Encounter');
    expect(container.textContent).not.toContain('Session 11');

    resolveSession(undefined);
    await act(async () => { await sessionPromise; });
  });

  it('T5.5 — session fetch failure is silent; other content unaffected', async () => {
    global.fetch = jest.fn(async (input: RequestInfo | URL) => {
      const url = input.toString();
      if (url === '/api/campaigns') return jsonResponse([BASE_CAMPAIGN]);
      if (url === '/api/parties') return jsonResponse([]);
      if (url === '/api/characters') return jsonResponse([]);
      if (url === '/api/campaigns/global') return jsonResponse([]);
      if (url.includes('/sessions')) return jsonResponse({ error: 'Server error' }, 500);
      return jsonResponse({}, 404);
    }) as typeof fetch;

    await renderPage();

    expect(container.textContent).toContain('My Campaign');
    expect(container.textContent).not.toContain('Session 11');
    // No error text
    expect(container.textContent).not.toContain('Server error');
  });
});

describe('T6 — Integration smoke test', () => {
  it('T6.1 — active campaign + linked party + characters → all sections render', async () => {
    setupFetch({
      campaigns: [BASE_CAMPAIGN],
      parties: [PARTY],
      characters: [PC_CHARACTER, NPC_CHARACTER, DEPARTED_CHARACTER],
      sessionsByCampaignId: { 'camp-1': [MOCK_SESSION] },
    });
    await renderPage();

    expect(container.textContent).toContain('My Campaign');
    expect(container.textContent).toContain('The Brave Ones');
    expect(container.textContent).toContain('Aria');
    expect(container.textContent).toContain('Player Characters');
    expect(container.textContent).toContain('Mira');
    expect(container.textContent).toContain('Travelling NPCs & Companions');
    expect(container.textContent).toContain('Session 11');
    expect(container.textContent).not.toContain('Old Bob');
  });
});
