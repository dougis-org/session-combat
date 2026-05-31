import { CampaignContext } from '@/lib/types';
import { makeSession } from '../fixtures/sessions';
import {
  TEMPLATES,
  buildSystemPrompt,
  npcTemplate,
  locationTemplate,
  shopTemplate,
  magicItemTemplate,
  roomTemplate,
} from '@/lib/prompts/templates';

const makeContext = (overrides: Partial<CampaignContext> = {}): CampaignContext => ({
  campaign: {
    id: 'camp-1',
    userId: 'u1',
    name: 'Curse of Strahd',
    moduleName: 'CoS',
    chapters: [{ id: 'ch-2', title: 'Act II', order: 2 }],
    currentChapterId: 'ch-2',
    status: 'active',
    notes: '',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  chapter: { id: 'ch-2', title: 'Act II', order: 2 },
  parties: [{ id: 'p-1', userId: 'u1', name: 'The Party', members: [], createdAt: new Date(), updatedAt: new Date() }],
  allMembers: [
    { characterId: 'c-1', addedAt: new Date() },
    { characterId: 'c-2', addedAt: new Date() },
  ],
  characters: [
    {
      id: 'c-1', userId: 'u1', name: 'Alice',
      classes: [{ class: 'Fighter', level: 3 }],
      abilityScores: { strength: 10, dexterity: 10, constitution: 10, intelligence: 10, wisdom: 10, charisma: 10 },
      ac: 15, hp: 30, maxHp: 30,
      createdAt: new Date(), updatedAt: new Date(),
    },
    {
      id: 'c-2', userId: 'u1', name: 'Bob',
      classes: [{ class: 'Wizard', level: 3 }],
      abilityScores: { strength: 10, dexterity: 10, constitution: 10, intelligence: 10, wisdom: 10, charisma: 10 },
      ac: 12, hp: 20, maxHp: 20,
      createdAt: new Date(), updatedAt: new Date(),
    },
  ],
  ...overrides,
});

const nullChapterCtx = makeContext({ chapter: null });
const emptyPartyCtx = makeContext({ characters: [], allMembers: [] });

const TEMPLATE_CASES: Array<[string, typeof npcTemplate, Record<string, string>]> = [
  ['npc', npcTemplate, { role: 'innkeeper', location: 'Barovia', requirements: '' }],
  ['location', locationTemplate, { type: 'tavern', atmosphere: 'cozy', details: '' }],
  ['shop', shopTemplate, { shopType: 'blacksmith', setting: 'busy district', inventory: '' }],
  ['magic-item', magicItemTemplate, { itemType: 'sword', rarity: 'rare', theme: '' }],
  ['room', roomTemplate, { roomName: 'Throne Room', purpose: 'seat of power', features: '' }],
];

describe('buildSystemPrompt', () => {
  test('B1-10: full context contains campaign name, module, chapter, character list', () => {
    const result = buildSystemPrompt(makeContext());
    expect(result).toContain('Curse of Strahd');
    expect(result).toContain('CoS');
    expect(result).toContain('Act II');
    expect(result).toContain('Alice');
    expect(result).toContain('Bob');
  });

  test('B1-11: null chapter and empty characters — no crash, contains campaign name', () => {
    const result = buildSystemPrompt(makeContext({ chapter: null, characters: [] }));
    expect(result).toContain('Curse of Strahd');
    expect(result).toContain('CoS');
    expect(typeof result).toBe('string');
  });

  test('TC-4-1: no session block when recentSessions is []', () => {
    const result = buildSystemPrompt(makeContext({ recentSessions: [] }));
    expect(result).not.toContain('Recent sessions:');
  });

  test('TC-4-2: no session block when recentSessions is undefined', () => {
    const result = buildSystemPrompt(makeContext());
    expect(result).not.toContain('Recent sessions:');
  });

  test('TC-4-3: session block present with correct heading when sessions exist', () => {
    const result = buildSystemPrompt(makeContext({ recentSessions: [makeSession()] }));
    expect(result).toContain('Recent sessions:');
  });

  test('TC-4-4: session line format — title and date', () => {
    const result = buildSystemPrompt(makeContext({ recentSessions: [makeSession()] }));
    expect(result).toContain('- Session 11 (May 14, 2026): The Betrayer Revealed');
  });

  test('TC-4-5: milestone with newLevel appends correct suffix', () => {
    const result = buildSystemPrompt(makeContext({ recentSessions: [makeSession({ milestone: true, newLevel: 11 })] }));
    expect(result).toContain('— party reached Level 11.');
  });

  test('TC-4-6: milestone without newLevel appends fallback suffix', () => {
    const result = buildSystemPrompt(makeContext({ recentSessions: [makeSession({ milestone: true, newLevel: undefined })] }));
    expect(result).toContain('— milestone reached.');
  });

  test('TC-4-7: session with no title uses "Untitled Session"', () => {
    const result = buildSystemPrompt(makeContext({ recentSessions: [makeSession({ title: undefined })] }));
    expect(result).toContain('Untitled Session');
  });

  test('TC-4-9: datePlayed as ISO string (runtime JSON shape) renders correct date', () => {
    const result = buildSystemPrompt(makeContext({ recentSessions: [makeSession({ datePlayed: '2026-05-14' as unknown as Date })] }));
    expect(result).toContain('May 14, 2026');
  });

  test('TC-4-8: multiple sessions render in array order', () => {
    const sessions = [makeSession({ sessionNumber: 12, title: 'S12' }), makeSession({ sessionNumber: 11, title: 'S11' }), makeSession({ sessionNumber: 10, title: 'S10' })];
    const result = buildSystemPrompt(makeContext({ recentSessions: sessions }));
    const s12pos = result.indexOf('Session 12');
    const s10pos = result.indexOf('Session 10');
    expect(result).toContain('Recent sessions:');
    expect(s12pos).toBeLessThan(s10pos);
  });
});

describe('buildSystemPrompt — DM notes toggle', () => {
  const ctxWithNotes = makeContext({ campaign: { id: 'camp-1', userId: 'u1', name: 'Curse of Strahd', moduleName: 'CoS', chapters: [], currentChapterId: undefined, status: 'active', notes: 'Quest hook: the gate is sealed.', createdAt: new Date(), updatedAt: new Date() } });
  const ctxWhitespaceNotes = makeContext({ campaign: { ...ctxWithNotes.campaign, notes: '   ' } });

  test('TC-N1: notes block absent when opts omitted', () => {
    const result = buildSystemPrompt(ctxWithNotes);
    expect(result).not.toContain('Current campaign context (DM notes):');
  });

  test('TC-N2: notes block absent when opts.includeNotes is false', () => {
    const result = buildSystemPrompt(ctxWithNotes, { includeNotes: false });
    expect(result).not.toContain('Current campaign context (DM notes):');
  });

  test('TC-N3: notes block present when opts.includeNotes is true', () => {
    const result = buildSystemPrompt(ctxWithNotes, { includeNotes: true });
    expect(result).toContain('Current campaign context (DM notes):\nQuest hook: the gate is sealed.');
  });

  test('TC-N4: notes block absent when notes are whitespace only, even with includeNotes: true', () => {
    const result = buildSystemPrompt(ctxWhitespaceNotes, { includeNotes: true });
    expect(result).not.toContain('Current campaign context (DM notes):');
  });

  test('TC-N5: npcTemplate passes opts through — notes block appears in fullText', () => {
    const result = npcTemplate.build({ role: 'innkeeper', location: 'Barovia', requirements: '' }, ctxWithNotes, { includeNotes: true });
    expect(result.fullText).toContain('Current campaign context (DM notes):');
    expect(result.fullText).toContain('Quest hook: the gate is sealed.');
  });
});

describe('TEMPLATES array', () => {
  test('B1-12: exactly 5 entries with distinct ids', () => {
    expect(TEMPLATES).toHaveLength(5);
    const ids = TEMPLATES.map(t => t.id);
    expect(new Set(ids).size).toBe(5);
  });

  test('B1-13: TEMPLATES ids drive tab rendering (no structural changes needed for new template)', () => {
    const ids = TEMPLATES.map(t => t.id);
    expect(ids).toEqual(expect.arrayContaining(['npc', 'location', 'shop', 'magic-item', 'room']));
  });
});

describe('NPC template', () => {
  test('B1-1: full context — systemPrompt has campaign/chapter/characters, userMessage has role/location', () => {
    const result = npcTemplate.build({ role: 'innkeeper', location: 'Barovia', requirements: '' }, makeContext());
    expect(result.systemPrompt).toContain('Curse of Strahd');
    expect(result.systemPrompt).toContain('Act II');
    expect(result.systemPrompt).toContain('Alice');
    expect(result.systemPrompt).toContain('Bob');
    expect(result.userMessage).toContain('innkeeper');
    expect(result.userMessage).toContain('Barovia');
  });

  test('B1-8: empty party — no runtime error, notes no party members', () => {
    expect(() => npcTemplate.build({ role: 'merchant', location: 'Market', requirements: '' }, emptyPartyCtx)).not.toThrow();
  });

  test('B1-9: optional field absent — no runtime error', () => {
    expect(() => npcTemplate.build({ role: 'guard', location: '' }, makeContext())).not.toThrow();
  });
});

describe('Location template', () => {
  test('B1-2: full context — systemPrompt has campaign context, userMessage has type/atmosphere', () => {
    const result = locationTemplate.build({ type: 'tavern', atmosphere: 'cozy', details: '' }, makeContext());
    expect(result.systemPrompt).toContain('Curse of Strahd');
    expect(result.userMessage).toContain('tavern');
    expect(result.userMessage).toContain('cozy');
  });

  test('B1-8: empty party — no error', () => {
    expect(() => locationTemplate.build({ type: 'forest', atmosphere: 'eerie', details: '' }, emptyPartyCtx)).not.toThrow();
  });
});

describe('Shop template', () => {
  test('B1-3: full context — systemPrompt has campaign context, userMessage has shop type/setting', () => {
    const result = shopTemplate.build({ shopType: 'blacksmith', setting: 'busy district', inventory: '' }, makeContext());
    expect(result.systemPrompt).toContain('Curse of Strahd');
    expect(result.userMessage).toContain('blacksmith');
    expect(result.userMessage).toContain('busy district');
  });
});

describe('Magic Item template', () => {
  test('B1-4: full context — systemPrompt has campaign context, userMessage has item type/rarity', () => {
    const result = magicItemTemplate.build({ itemType: 'sword', rarity: 'rare', theme: '' }, makeContext());
    expect(result.systemPrompt).toContain('Curse of Strahd');
    expect(result.userMessage).toContain('sword');
    expect(result.userMessage).toContain('rare');
  });
});

describe('Room Description template', () => {
  test('B1-5: full context — systemPrompt has campaign context, userMessage has room name/purpose', () => {
    const result = roomTemplate.build({ roomName: 'Throne Room', purpose: 'seat of power', features: '' }, makeContext());
    expect(result.systemPrompt).toContain('Curse of Strahd');
    expect(result.userMessage).toContain('Throne Room');
    expect(result.userMessage).toContain('seat of power');
  });

  test('B1-8: empty party — no error', () => {
    expect(() => roomTemplate.build({ roomName: 'Crypt', purpose: 'burial', features: '' }, emptyPartyCtx)).not.toThrow();
  });
});

test.each(TEMPLATE_CASES)(
  'B1-6: %s template — fullText equals systemPrompt + \\n\\n + userMessage',
  (_, template, fields) => {
    const result = template.build(fields, makeContext());
    expect(result.fullText).toBe(result.systemPrompt + '\n\n' + result.userMessage);
  },
);

test.each(TEMPLATE_CASES)(
  'B1-7: %s template — null chapter produces no "undefined" or "null" in output',
  (_, template, fields) => {
    const result = template.build(fields, nullChapterCtx);
    expect(result.fullText).not.toContain('undefined');
    expect(result.fullText).not.toContain('null');
  },
);
