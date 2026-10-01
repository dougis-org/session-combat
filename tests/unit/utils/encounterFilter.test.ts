import { filterAndSortEncounters } from '@/lib/utils/encounterFilter';
import { makeEncounter } from '@/tests/unit/fixtures/combatHelpers';

const owlbear = makeEncounter({ id: 'e1', name: 'Owlbear Den' });
const goblin = makeEncounter({ id: 'e2', name: 'goblin Ambush' });
const dragon = makeEncounter({ id: 'e3', name: 'Dragon Lair' });
const encounters = [owlbear, goblin, dragon];

const names = (list: { name: string }[]) => list.map(e => e.name);

describe('filterAndSortEncounters', () => {
  it('sorts names case-insensitively', () => {
    expect(names(filterAndSortEncounters(encounters, '', ''))).toEqual([
      'Dragon Lair',
      'goblin Ambush',
      'Owlbear Den',
    ]);
  });

  it('does not mutate the input array', () => {
    const input = [...encounters];
    filterAndSortEncounters(input, '', '');
    expect(input).toEqual(encounters);
  });

  it('filters by case-insensitive substring', () => {
    expect(names(filterAndSortEncounters(encounters, 'GOB', ''))).toEqual(['goblin Ambush']);
  });

  it.each(['', '   '])('returns all encounters for blank query %j', query => {
    expect(filterAndSortEncounters(encounters, query, '')).toHaveLength(3);
  });

  it('trims the query before matching', () => {
    expect(names(filterAndSortEncounters(encounters, '  gob  ', ''))).toEqual(['goblin Ambush']);
  });

  it('retains the selected encounter when it does not match the query', () => {
    expect(names(filterAndSortEncounters(encounters, 'gob', 'e1'))).toEqual([
      'goblin Ambush',
      'Owlbear Den',
    ]);
  });

  it('returns [] when nothing matches and nothing is selected', () => {
    expect(filterAndSortEncounters(encounters, 'zzz', '')).toEqual([]);
  });

  it('handles 500 encounters', () => {
    const many = Array.from({ length: 500 }, (_, i) =>
      makeEncounter({ id: `id-${i}`, name: `Encounter ${String(499 - i).padStart(3, '0')}` }),
    );
    const result = filterAndSortEncounters(many, 'encounter 4', '');
    expect(result).toHaveLength(100);
    expect(result[0].name).toBe('Encounter 400');
    expect(result[99].name).toBe('Encounter 499');
  });
});
