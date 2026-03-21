import { expandPartyToCharacters, findDuplicatePartyCharacters } from '@/lib/utils/partySelection';
import { Party, Character } from '@/lib/types';

const makeCharacter = (id: string, name: string): Character =>
  ({
    id,
    name,
    hp: 10,
    maxHp: 10,
    ac: 12,
    abilityScores: { strength: 10, dexterity: 10, constitution: 10, intelligence: 10, wisdom: 10, charisma: 10 },
  } as Character);

const makeParty = (id: string, characterIds: string[]): Party =>
  ({
    id,
    userId: 'user-1',
    name: `Party ${id}`,
    characterIds,
    createdAt: new Date(),
    updatedAt: new Date(),
  } as Party);

describe('expandPartyToCharacters', () => {
  const characters: Character[] = [
    makeCharacter('char-1', 'Aria'),
    makeCharacter('char-2', 'Brom'),
    makeCharacter('char-3', 'Cael'),
  ];

  it('returns only characters belonging to the party', () => {
    const party = makeParty('p-1', ['char-1', 'char-3']);
    const result = expandPartyToCharacters(party, characters);
    expect(result.map(c => c.id)).toEqual(['char-1', 'char-3']);
  });

  it('returns empty array for a party with no characters', () => {
    const party = makeParty('p-2', []);
    const result = expandPartyToCharacters(party, characters);
    expect(result).toEqual([]);
  });

  it('silently skips character IDs not found in the library', () => {
    const party = makeParty('p-3', ['char-1', 'char-999']);
    const result = expandPartyToCharacters(party, characters);
    expect(result.map(c => c.id)).toEqual(['char-1']);
  });

  it('returns empty array when party has no characterIds', () => {
    const party = { ...makeParty('p-4', []), characterIds: undefined as unknown as string[] };
    const result = expandPartyToCharacters(party, characters);
    expect(result).toEqual([]);
  });
});

describe('findDuplicatePartyCharacters', () => {
  const partyChars: Character[] = [
    makeCharacter('char-1', 'Aria'),
    makeCharacter('char-2', 'Brom'),
    makeCharacter('char-3', 'Cael'),
  ];

  it('detects characters already in setupCombatants via character-${id} prefix', () => {
    const setupCombatants = [
      { id: 'character-char-1' },
      { id: 'monster-goblin-0' },
    ];
    const result = findDuplicatePartyCharacters(partyChars, setupCombatants);
    expect(result.map(c => c.id)).toEqual(['char-1']);
  });

  it('returns empty array when no party characters overlap with setup', () => {
    const setupCombatants = [{ id: 'character-char-99' }];
    const result = findDuplicatePartyCharacters(partyChars, setupCombatants);
    expect(result).toEqual([]);
  });

  it('returns all party characters when all are already in setup', () => {
    const setupCombatants = [
      { id: 'character-char-1' },
      { id: 'character-char-2' },
      { id: 'character-char-3' },
    ];
    const result = findDuplicatePartyCharacters(partyChars, setupCombatants);
    expect(result.map(c => c.id)).toEqual(['char-1', 'char-2', 'char-3']);
  });

  it('returns empty array when setupCombatants is empty', () => {
    const result = findDuplicatePartyCharacters(partyChars, []);
    expect(result).toEqual([]);
  });

  it('detects characters when setupCombatant IDs have a uuid suffix', () => {
    const setupCombatants = [
      { id: 'character-char-1-123e4567-e89b-12d3-a456-426614174000' },
      { id: 'monster-goblin-0' },
    ];
    const result = findDuplicatePartyCharacters(partyChars, setupCombatants);
    expect(result.map(c => c.id)).toEqual(['char-1']);
  });

  it('does not false-positive on unrelated IDs that contain the character id as a substring', () => {
    const setupCombatants = [
      { id: 'monster-char-1-variant' }, // not a character- prefix, should not match
    ];
    const result = findDuplicatePartyCharacters(partyChars, setupCombatants);
    expect(result).toEqual([]);
  });
});
