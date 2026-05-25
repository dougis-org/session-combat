import { describe, test, expect, jest, beforeEach } from '@jest/globals';
import { CampaignContext } from '@/lib/types';

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
  active: true,
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

function makeFetch(campaign: object, parties: object[], characters: object[]) {
  return jest.fn(async (url: RequestInfo | URL) => {
    const s = String(url);
    if (s.includes('/api/campaigns/camp-1') && !s.includes('parties')) {
      return { ok: true, json: async () => campaign } as unknown as Response;
    }
    if (s.includes('/api/parties')) {
      return { ok: true, json: async () => parties } as unknown as Response;
    }
    if (s.includes('/api/characters')) {
      return { ok: true, json: async () => characters } as unknown as Response;
    }
    return { ok: false, json: async () => ({}) } as unknown as Response;
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

  test('A2-8: all three fetches initiated in parallel via Promise.all', async () => {
    const campaign = makeCampaign();
    const started: string[] = [];
    const resolvers: Record<string, (r: Response) => void> = {};

    const parallelFetch = jest.fn((url: RequestInfo | URL) => {
      const s = String(url);
      return new Promise<Response>(resolve => {
        if (s.includes('/api/campaigns/')) {
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

    // Yield to the microtask queue so Promise.all registers all three fetches
    await Promise.resolve();
    await Promise.resolve();

    // All three must have been started before any resolved
    expect(started).toContain('campaign');
    expect(started).toContain('parties');
    expect(started).toContain('characters');

    // Now resolve all three
    const ok = (data: unknown) => ({ ok: true, json: async () => data } as unknown as Response);
    resolvers.campaign(ok(campaign));
    resolvers.parties(ok([]));
    resolvers.characters(ok([]));

    await fetchPromise;
    expect(parallelFetch).toHaveBeenCalledTimes(3);
  });

  test('A2-9: non-OK response rejects with error', async () => {
    const errorFetch = jest.fn(async (url: RequestInfo | URL) => {
      const s = String(url);
      if (s.includes('/api/parties')) return { ok: false, status: 500 } as unknown as Response;
      const campaign = makeCampaign();
      return { ok: true, json: async () => s.includes('/api/campaigns') ? campaign : [] } as unknown as Response;
    }) as typeof fetch;

    await expect(fetchCampaignContext('camp-1', errorFetch)).rejects.toThrow();
  });
});
