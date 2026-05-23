import { expandPartyToCharacters } from '@/lib/utils/partySelection';
import { Party, Character } from '@/lib/types';

const makeCharacter = (id: string): Character => ({
  id,
  userId: 'user-1',
  name: `Character ${id}`,
  classes: [{ class: 'Fighter', level: 1 }],
  ac: 10,
  hp: 10,
  maxHp: 10,
  abilityScores: { strength: 10, dexterity: 10, constitution: 10, intelligence: 10, wisdom: 10, charisma: 10 },
});

const makeParty = (overrides: Partial<Party> = {}): Party => ({
  id: 'party-1',
  userId: 'user-1',
  name: 'Test Party',
  members: [],
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-01'),
  ...overrides,
});

describe('expandPartyToCharacters', () => {
  it('returns only members without leftAt', () => {
    const chars = [makeCharacter('char-1'), makeCharacter('char-2')];
    const party = makeParty({
      members: [
        { characterId: 'char-1', addedAt: new Date('2026-01-01') },
        { characterId: 'char-2', addedAt: new Date('2026-01-01'), leftAt: new Date('2026-02-01') },
      ],
    });
    const result = expandPartyToCharacters(party, chars);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('char-1');
  });

  it('returns empty array when all members have leftAt', () => {
    const chars = [makeCharacter('char-1')];
    const party = makeParty({
      members: [{ characterId: 'char-1', addedAt: new Date(), leftAt: new Date() }],
    });
    expect(expandPartyToCharacters(party, chars)).toHaveLength(0);
  });

  it('returns empty array for party with empty members', () => {
    const chars = [makeCharacter('char-1')];
    const party = makeParty({ members: [] });
    expect(expandPartyToCharacters(party, chars)).toHaveLength(0);
  });

  it('handles party with no members array (guard for unmigrated docs)', () => {
    const chars = [makeCharacter('char-1')];
    const party = { ...makeParty(), members: undefined as unknown as Party['members'] };
    expect(expandPartyToCharacters(party, chars)).toHaveLength(0);
  });

  it('excludes characters not found in character library', () => {
    const chars = [makeCharacter('char-1')];
    const party = makeParty({
      members: [
        { characterId: 'char-1', addedAt: new Date() },
        { characterId: 'unknown-id', addedAt: new Date() },
      ],
    });
    const result = expandPartyToCharacters(party, chars);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('char-1');
  });
});
