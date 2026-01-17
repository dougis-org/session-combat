import { PartyTestDataProvider } from './helpers/partyTestData';
import { expandPartyToCharacters, findDuplicatePartyCharacters } from '../../lib/utils/partySelection';

describe('Party selection utilities (RED tests)', () => {
  test.each(PartyTestDataProvider.sampleParties())('expandPartyToCharacters handles %p', (party) => {
    // characters fixture
    const characters = [
      { id: 'char-1', name: 'A' },
      { id: 'char-2', name: 'B' },
      { id: 'char-3', name: 'C' },
      { id: 'char-4', name: 'D' },
    ];

    const expanded = expandPartyToCharacters(party as any, characters as any);

    expect(Array.isArray(expanded)).toBe(true);
    if (party.characterIds) {
      expect(expanded.length).toBe(party.characterIds.length);
    }
  });

  test('findDuplicatePartyCharacters detects duplicates', () => {
    const partyChars = [ { id: 'char-1' }, { id: 'char-2' } ];
    const setupCombatants = [ { id: 'character-char-2' }, { id: 'character-char-3' } ];

    const duplicates = findDuplicatePartyCharacters(partyChars as any, setupCombatants as any);
    expect(duplicates.map(d => d.id)).toContain('char-2');
  });
});
