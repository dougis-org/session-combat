import { getCombatEndSuggestion } from '@/lib/combat/combatEnd';
import { makeCombatant } from '@/tests/unit/fixtures/combatHelpers';

const monster = (id: string, hp: number) => makeCombatant({ id, type: 'monster', hp });
const player = (id: string, hp: number, lifeState?: 'dying' | 'stable' | 'dead') =>
  makeCombatant({ id, type: 'player', hp, lifeState });

describe('getCombatEndSuggestion', () => {
  it('returns monsters-defeated when every monster is at 0 HP', () => {
    expect(getCombatEndSuggestion([monster('m1', 0), monster('m2', -3), player('p1', 10)])).toBe('monsters-defeated');
  });

  it('returns null while any monster is alive', () => {
    expect(getCombatEndSuggestion([monster('m1', 0), monster('m2', 1), player('p1', 10)])).toBeNull();
  });

  it('returns null for a players-only combat', () => {
    expect(getCombatEndSuggestion([player('p1', 10), player('p2', 5)])).toBeNull();
  });

  it('returns players-down when every player is dead and a monster is alive', () => {
    expect(getCombatEndSuggestion([player('p1', 0, 'dead'), player('p2', 0, 'dead'), monster('m1', 5)])).toBe('players-down');
  });

  it.each(['dying', 'stable'] as const)('returns null when players are at 0 HP and %s', (lifeState) => {
    expect(getCombatEndSuggestion([player('p1', 0, lifeState), monster('m1', 5)])).toBeNull();
  });

  it('returns null when one player is dead but another is still up', () => {
    expect(getCombatEndSuggestion([player('p1', 0, 'dead'), player('p2', 7), monster('m1', 5)])).toBeNull();
  });

  it('returns null for a player at 0 HP with no lifeState (not yet resolved)', () => {
    expect(getCombatEndSuggestion([player('p1', 0), monster('m1', 5)])).toBeNull();
  });

  it('ignores lair combatants', () => {
    const lair = makeCombatant({ id: 'l1', type: 'lair', hp: 50 });
    expect(getCombatEndSuggestion([monster('m1', 0), player('p1', 10), lair])).toBe('monsters-defeated');
  });

  it('prefers monsters-defeated when both sides are finished', () => {
    expect(getCombatEndSuggestion([monster('m1', 0), player('p1', 0, 'dead')])).toBe('monsters-defeated');
  });

  it('returns null for an empty combatant list', () => {
    expect(getCombatEndSuggestion([])).toBeNull();
  });
});
