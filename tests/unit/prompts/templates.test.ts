import { describe, test, expect } from '@jest/globals';
import { CampaignContext } from '@/lib/types';
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
    active: true,
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

  test('B1-6: fullText === systemPrompt + "\\n\\n" + userMessage', () => {
    const result = npcTemplate.build({ role: 'innkeeper', location: 'Barovia', requirements: '' }, makeContext());
    expect(result.fullText).toBe(result.systemPrompt + '\n\n' + result.userMessage);
  });

  test('B1-7: null chapter — no "undefined" or "null" in output', () => {
    const result = npcTemplate.build({ role: 'guard', location: 'Village', requirements: '' }, nullChapterCtx);
    expect(result.fullText).not.toContain('undefined');
    expect(result.fullText).not.toContain('null');
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

  test('B1-6: fullText === systemPrompt + "\\n\\n" + userMessage', () => {
    const result = locationTemplate.build({ type: 'tavern', atmosphere: 'cozy', details: '' }, makeContext());
    expect(result.fullText).toBe(result.systemPrompt + '\n\n' + result.userMessage);
  });

  test('B1-7: null chapter — no "undefined" or "null"', () => {
    const result = locationTemplate.build({ type: 'dungeon', atmosphere: 'dark', details: '' }, nullChapterCtx);
    expect(result.fullText).not.toContain('undefined');
    expect(result.fullText).not.toContain('null');
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

  test('B1-6: fullText === systemPrompt + "\\n\\n" + userMessage', () => {
    const result = shopTemplate.build({ shopType: 'apothecary', setting: 'market', inventory: '' }, makeContext());
    expect(result.fullText).toBe(result.systemPrompt + '\n\n' + result.userMessage);
  });

  test('B1-7: null chapter — no "undefined" or "null"', () => {
    const result = shopTemplate.build({ shopType: 'armorer', setting: 'town', inventory: '' }, nullChapterCtx);
    expect(result.fullText).not.toContain('undefined');
    expect(result.fullText).not.toContain('null');
  });
});

describe('Magic Item template', () => {
  test('B1-4: full context — systemPrompt has campaign context, userMessage has item type/rarity', () => {
    const result = magicItemTemplate.build({ itemType: 'sword', rarity: 'rare', theme: '' }, makeContext());
    expect(result.systemPrompt).toContain('Curse of Strahd');
    expect(result.userMessage).toContain('sword');
    expect(result.userMessage).toContain('rare');
  });

  test('B1-6: fullText === systemPrompt + "\\n\\n" + userMessage', () => {
    const result = magicItemTemplate.build({ itemType: 'amulet', rarity: 'uncommon', theme: '' }, makeContext());
    expect(result.fullText).toBe(result.systemPrompt + '\n\n' + result.userMessage);
  });

  test('B1-7: null chapter — no "undefined" or "null"', () => {
    const result = magicItemTemplate.build({ itemType: 'ring', rarity: 'common', theme: '' }, nullChapterCtx);
    expect(result.fullText).not.toContain('undefined');
    expect(result.fullText).not.toContain('null');
  });
});

describe('Room Description template', () => {
  test('B1-5: full context — systemPrompt has campaign context, userMessage has room name/purpose', () => {
    const result = roomTemplate.build({ roomName: 'Throne Room', purpose: 'seat of power', features: '' }, makeContext());
    expect(result.systemPrompt).toContain('Curse of Strahd');
    expect(result.userMessage).toContain('Throne Room');
    expect(result.userMessage).toContain('seat of power');
  });

  test('B1-6: fullText === systemPrompt + "\\n\\n" + userMessage', () => {
    const result = roomTemplate.build({ roomName: 'Dungeon Cell', purpose: 'prison', features: '' }, makeContext());
    expect(result.fullText).toBe(result.systemPrompt + '\n\n' + result.userMessage);
  });

  test('B1-7: null chapter — no "undefined" or "null"', () => {
    const result = roomTemplate.build({ roomName: 'Library', purpose: 'study', features: '' }, nullChapterCtx);
    expect(result.fullText).not.toContain('undefined');
    expect(result.fullText).not.toContain('null');
  });

  test('B1-8: empty party — no error', () => {
    expect(() => roomTemplate.build({ roomName: 'Crypt', purpose: 'burial', features: '' }, emptyPartyCtx)).not.toThrow();
  });
});
