import { CampaignContext, SharedCharacterEntry } from '@/lib/types';
import { makeSession } from '../fixtures/sessions';

const makeCampaign = (overrides = {}) => ({
  id: 'camp-1',
  userId: 'u1',
  name: 'Curse of Strahd',
  moduleName: 'CoS',
  chapters: [
    { id: 'ch-1', title: 'Act I', order: 1 },
    { id: 'ch-2', title: 'The Sunken Temple', order: 2 },
  ],
  currentChapterId: 'ch-2',
  status: 'active',
  notes: '',
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

const makeParty = (id: string, campaignId: string, members: object[]) => ({
  id,
  userId: 'u1',
  name: `Party ${id}`,
  members,
  campaignId,
  createdAt: new Date(),
  updatedAt: new Date(),
});

const makeCharacter = (id: string, name: string, overrides = {}) => ({
  id,
  userId: 'u1',
  name,
  classes: [{ class: 'Fighter', level: 3 }],
  abilityScores: { strength: 10, dexterity: 10, constitution: 10, intelligence: 10, wisdom: 10, charisma: 10 },
  ac: 15,
  hp: 30,
  maxHp: 30,
  speed: '30 ft.',
  challengeRating: 0,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

const makeMember = (characterId: string) => ({ characterId, addedAt: new Date() });

function routeFetch(url: RequestInfo | URL, campaign: object, parties: object[], characters: object[], sessions: object[], sharedChars: object[] = []): Response {
  const s = String(url);
  if (s.includes('/sessions')) return { ok: true, json: async () => sessions } as unknown as Response;
  if (s.match(/\/api\/campaigns\/[^/]+\/characters/)) return { ok: true, json: async () => sharedChars } as unknown as Response;
  if (s.includes('/api/campaigns/') && !s.includes('parties')) return { ok: true, json: async () => campaign } as unknown as Response;
  if (s.includes('/api/parties')) return { ok: true, json: async () => parties } as unknown as Response;
  if (s.includes('/api/characters')) return { ok: true, json: async () => characters } as unknown as Response;
  return { ok: false, json: async () => ({}) } as unknown as Response;
}

function makeFetch(campaign: object, parties: object[], characters: object[], sessions: object[] = [], sharedChars: object[] = []) {
  return jest.fn(async (url: RequestInfo | URL) => routeFetch(url, campaign, parties, characters, sessions, sharedChars));
}

function makeFetchWithSessionOverride(campaign: object, sessionHandler: (url: string) => Promise<Response>) {
  return jest.fn(async (url: RequestInfo | URL) => {
    const s = String(url);
    if (s.includes('/sessions')) return sessionHandler(s);
    return routeFetch(url, campaign, [], [], [], []);
  }) as typeof fetch;
}

describe('fetchCampaignContext', () => {
  let fetchCampaignContext: (campaignId: string, fetchImpl?: typeof fetch) => Promise<CampaignContext>;

  beforeEach(async () => {
    jest.resetModules();
    const mod = await import('@/lib/utils/campaignContext');
    fetchCampaignContext = mod.fetchCampaignContext;
  });

  test('A2-1: single party linked to campaign', async () => {
    const campaign = makeCampaign();
    const members = [makeMember('c-1'), makeMember('c-2')];
    const party = makeParty('p-1', 'camp-1', members);
    const characters = [makeCharacter('c-1', 'Alice'), makeCharacter('c-2', 'Bob')];

    const ctx = await fetchCampaignContext('camp-1', makeFetch(campaign, [party], characters));

    expect(ctx.parties).toHaveLength(1);
    expect(ctx.allMembers).toEqual(members);
  });

  test('A2-2: three parties with 2, 3, 4 members merged', async () => {
    const campaign = makeCampaign();
    const p1 = makeParty('p-1', 'camp-1', [makeMember('c-1'), makeMember('c-2')]);
    const p2 = makeParty('p-2', 'camp-1', [makeMember('c-3'), makeMember('c-4'), makeMember('c-5')]);
    const p3 = makeParty('p-3', 'camp-1', [makeMember('c-6'), makeMember('c-7'), makeMember('c-8'), makeMember('c-9')]);
    const otherParty = makeParty('p-4', 'camp-other', [makeMember('c-10')]);
    const characters = ['c-1','c-2','c-3','c-4','c-5','c-6','c-7','c-8','c-9'].map(id => makeCharacter(id, `Char ${id}`));

    const ctx = await fetchCampaignContext('camp-1', makeFetch(campaign, [p1, p2, p3, otherParty], characters));

    expect(ctx.parties).toHaveLength(3);
    expect(ctx.allMembers).toHaveLength(9);
  });

  test('A2-3: no parties linked to campaign', async () => {
    const campaign = makeCampaign();
    const unrelated = makeParty('p-1', 'camp-other', [makeMember('c-1')]);

    const ctx = await fetchCampaignContext('camp-1', makeFetch(campaign, [unrelated], []));

    expect(ctx.parties).toEqual([]);
    expect(ctx.allMembers).toEqual([]);
  });

  test('A2-4: campaign with currentChapterId resolves chapter', async () => {
    const campaign = makeCampaign({ currentChapterId: 'ch-2' });

    const ctx = await fetchCampaignContext('camp-1', makeFetch(campaign, [], []));

    expect(ctx.chapter?.title).toBe('The Sunken Temple');
  });

  test('A2-5: campaign with no currentChapterId -> chapter is null', async () => {
    const campaign = makeCampaign({ currentChapterId: undefined });

    const ctx = await fetchCampaignContext('camp-1', makeFetch(campaign, [], []));

    expect(ctx.chapter).toBeNull();
  });

  test('A2-6: all members have active characters -> all resolved in context.characters', async () => {
    const campaign = makeCampaign();
    const members = [makeMember('c-1'), makeMember('c-2')];
    const party = makeParty('p-1', 'camp-1', members);
    const characters = [makeCharacter('c-1', 'Alice'), makeCharacter('c-2', 'Bob'), makeCharacter('c-3', 'Unrelated')];

    const ctx = await fetchCampaignContext('camp-1', makeFetch(campaign, [party], characters));

    expect(ctx.characters).toHaveLength(2);
    expect(ctx.characters.map(c => c.id)).toEqual(expect.arrayContaining(['c-1', 'c-2']));
  });

  test('A2-7: soft-deleted character excluded from context.characters', async () => {
    const campaign = makeCampaign();
    const members = [makeMember('c-1'), makeMember('c-2')];
    const party = makeParty('p-1', 'camp-1', members);
    const characters = [
      makeCharacter('c-1', 'Alice'),
      makeCharacter('c-2', 'Bob', { deletedAt: new Date() }),
    ];

    const ctx = await fetchCampaignContext('camp-1', makeFetch(campaign, [party], characters));

    expect(ctx.characters).toHaveLength(1);
    expect(ctx.characters[0].id).toBe('c-1');
  });

  test('A2-7b: departed member excluded from context.characters but kept in allMembers', async () => {
    const campaign = makeCampaign();
    const departed = { characterId: 'c-2', addedAt: new Date(), leftAt: new Date() };
    const members = [makeMember('c-1'), departed];
    const party = makeParty('p-1', 'camp-1', members);
    const characters = [makeCharacter('c-1', 'Alice'), makeCharacter('c-2', 'Bob')];

    const ctx = await fetchCampaignContext('camp-1', makeFetch(campaign, [party], characters));

    expect(ctx.allMembers).toHaveLength(2);
    expect(ctx.characters).toHaveLength(1);
    expect(ctx.characters[0].id).toBe('c-1');
  });

  test('A2-8: all five fetches initiated in parallel via Promise.all', async () => {
    const campaign = makeCampaign();
    const started: string[] = [];
    const resolvers: Record<string, (r: Response) => void> = {};

    const parallelFetch = jest.fn((url: RequestInfo | URL) => {
      const s = String(url);
      return new Promise<Response>(resolve => {
        if (s.includes('/sessions')) {
          started.push('sessions');
          resolvers.sessions = resolve;
        } else if (s.match(/\/api\/campaigns\/[^/]+\/characters/)) {
          started.push('sharedChars');
          resolvers.sharedChars = resolve;
        } else if (s.includes('/api/campaigns/')) {
          started.push('campaign');
          resolvers.campaign = resolve;
        } else if (s.includes('/api/parties')) {
          started.push('parties');
          resolvers.parties = resolve;
        } else {
          started.push('characters');
          resolvers.characters = resolve;
        }
      });
    }) as typeof fetch;

    const fetchPromise = fetchCampaignContext('camp-1', parallelFetch);

    // Yield to the microtask queue so Promise.all registers all five fetches
    await Promise.resolve();
    await Promise.resolve();

    // All five must have been started before any resolved
    expect(started).toContain('campaign');
    expect(started).toContain('parties');
    expect(started).toContain('characters');
    expect(started).toContain('sessions');
    expect(started).toContain('sharedChars');

    // Now resolve all five
    const ok = (data: unknown) => ({ ok: true, json: async () => data } as unknown as Response);
    resolvers.campaign(ok(campaign));
    resolvers.parties(ok([]));
    resolvers.characters(ok([]));
    resolvers.sessions(ok([]));
    resolvers.sharedChars(ok([]));

    await fetchPromise;
    expect(parallelFetch).toHaveBeenCalledTimes(5);
  });

  test('TC-3-1: sessions URL includes ?limit=3', async () => {
    const campaign = makeCampaign();
    const fetchMock = makeFetch(campaign, [], []);
    await fetchCampaignContext('camp-1', fetchMock as typeof fetch);
    const urls = fetchMock.mock.calls.map(([u]) => String(u));
    expect(urls).toContain('/api/campaigns/camp-1/sessions?limit=3');
  });

  test('TC-3-2: sessions fetch returns data — included in context', async () => {
    const campaign = makeCampaign();
    const sessions = [makeSession({ sessionNumber: 5 }), makeSession({ sessionNumber: 4 })];
    const ctx = await fetchCampaignContext('camp-1', makeFetch(campaign, [], [], sessions));
    expect(ctx.recentSessions).toHaveLength(2);
    expect(ctx.recentSessions![0].sessionNumber).toBe(5);
  });

  test('TC-3-3: zero sessions returns empty array', async () => {
    const campaign = makeCampaign();
    const ctx = await fetchCampaignContext('camp-1', makeFetch(campaign, [], [], []));
    expect(ctx.recentSessions).toEqual([]);
  });

  test('TC-3-4: sessions fetch 500 — resolves with empty recentSessions, does not throw', async () => {
    const ctx = await fetchCampaignContext(
      'camp-1',
      makeFetchWithSessionOverride(makeCampaign(), async () => ({ ok: false, status: 500 } as unknown as Response)),
    );
    expect(ctx.recentSessions).toEqual([]);
  });

  test('TC-3-5: sessions fetch network error — resolves with empty recentSessions, does not throw', async () => {
    const ctx = await fetchCampaignContext(
      'camp-1',
      makeFetchWithSessionOverride(makeCampaign(), async () => { throw new Error('Network error'); }),
    );
    expect(ctx.recentSessions).toEqual([]);
  });

  test('TC-3-6: sessions fetch returns malformed JSON — resolves with empty recentSessions, does not throw', async () => {
    const ctx = await fetchCampaignContext(
      'camp-1',
      makeFetchWithSessionOverride(makeCampaign(), async () => ({
        ok: true,
        json: async () => { throw new SyntaxError('Unexpected token'); },
      } as unknown as Response)),
    );
    expect(ctx.recentSessions).toEqual([]);
  });

  test('A2-9: non-OK response rejects with error', async () => {
    const errorFetch = jest.fn(async (url: RequestInfo | URL) => {
      const s = String(url);
      if (s.includes('/api/parties')) return { ok: false, status: 500 } as unknown as Response;
      const campaign = makeCampaign();
      if (s.match(/\/api\/campaigns\/[^/]+\/characters/)) return { ok: true, json: async () => [] } as unknown as Response;
      return { ok: true, json: async () => s.includes('/api/campaigns') ? campaign : [] } as unknown as Response;
    }) as typeof fetch;

    await expect(fetchCampaignContext('camp-1', errorFetch)).rejects.toThrow();
  });

  const makeSharedEntry = (characterId: string, userId: string, deletedAt?: Date): SharedCharacterEntry => ({
    share: { id: `share-${characterId}`, campaignId: 'camp-1', characterId, userId, sharedAt: new Date() },
    character: makeCharacter(characterId, `Char ${characterId}`, { deletedAt }) as unknown as Character,
  });

  test('C1-1: shared character in active party appears in context.characters', async () => {
    const campaign = makeCampaign();
    const sharedEntry = makeSharedEntry('shared-char', 'player-1');
    const party = makeParty('p-1', 'camp-1', [makeMember('shared-char')]);
    const ctx = await fetchCampaignContext('camp-1', makeFetch(campaign, [party], [], [], [sharedEntry]));
    expect(ctx.characters.map(c => c.id)).toContain('shared-char');
  });

  test('C1-2: DM-owned character in party still appears (no regression)', async () => {
    const campaign = makeCampaign();
    const dmChar = makeCharacter('dm-char', 'DM Hero');
    const party = makeParty('p-1', 'camp-1', [makeMember('dm-char')]);
    const ctx = await fetchCampaignContext('camp-1', makeFetch(campaign, [party], [dmChar], [], []));
    expect(ctx.characters.map(c => c.id)).toContain('dm-char');
  });

  test('C1-3: reactive guard excludes character with revoked share', async () => {
    const campaign = makeCampaign();
    const party = makeParty('p-1', 'camp-1', [makeMember('shared-char')]);
    // shared chars fetch returns empty (share revoked)
    const ctx = await fetchCampaignContext('camp-1', makeFetch(campaign, [party], [], [], []));
    expect(ctx.characters.map(c => c.id)).not.toContain('shared-char');
  });

  test('C1-4: soft-deleted shared character excluded', async () => {
    const campaign = makeCampaign();
    const deletedEntry = makeSharedEntry('shared-deleted', 'player-1', new Date());
    const party = makeParty('p-1', 'camp-1', [makeMember('shared-deleted')]);
    const ctx = await fetchCampaignContext('camp-1', makeFetch(campaign, [party], [], [], [deletedEntry]));
    expect(ctx.characters.map(c => c.id)).not.toContain('shared-deleted');
  });

  test('C1-5: shared char with leftAt excluded by existing leftAt logic', async () => {
    const campaign = makeCampaign();
    const sharedEntry = makeSharedEntry('shared-char', 'player-1');
    const party = makeParty('p-1', 'camp-1', [{ characterId: 'shared-char', addedAt: new Date(), leftAt: new Date() }]);
    const ctx = await fetchCampaignContext('camp-1', makeFetch(campaign, [party], [], [], [sharedEntry]));
    expect(ctx.characters.map(c => c.id)).not.toContain('shared-char');
  });

  test('C1-6: failed shared-char fetch degrades to DM-only chars without throwing', async () => {
    const campaign = makeCampaign();
    const dmChar = makeCharacter('dm-char', 'DM Hero');
    const party = makeParty('p-1', 'camp-1', [makeMember('dm-char')]);
    const errorFetch = jest.fn(async (url: RequestInfo | URL) => {
      const s = String(url);
      if (s.match(/\/api\/campaigns\/[^/]+\/characters/)) return { ok: false, status: 500 } as unknown as Response;
      return routeFetch(url, campaign, [party], [dmChar], []);
    }) as typeof fetch;
    const ctx = await fetchCampaignContext('camp-1', errorFetch);
    expect(ctx.characters.map(c => c.id)).toContain('dm-char');
    expect(ctx.characters.map(c => c.id)).not.toContain('shared-char');
  });
});
