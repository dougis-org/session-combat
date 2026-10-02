import { isRemovedFromPlay } from '@/lib/combat/removedFromPlay';
import { processRoundEnd } from '@/lib/combat/conditionExpiry';
import { CombatantState, StatusCondition } from '@/lib/types';

function makeCombatant(conditions: StatusCondition[] = []): CombatantState {
  return {
    id: 'c1',
    name: 'Goblin',
    type: 'monster',
    initiative: 10,
    initiativeRoll: { roll: 10, bonus: 0, total: 10, method: 'manual' },
    maxHp: 10,
    hp: 10,
    ac: 10,
    abilityScores: {
      strength: 10,
      dexterity: 10,
      constitution: 10,
      intelligence: 10,
      wisdom: 10,
      charisma: 10,
    },
    conditions,
  };
}

const banished = (duration?: number): StatusCondition => ({
  id: 'b1',
  name: 'Banished',
  description: 'gone',
  duration,
  removedFromPlay: true,
});
const prone: StatusCondition = { id: 'p1', name: 'Prone', description: '' };

describe('isRemovedFromPlay', () => {
  it('is false for empty and unflagged conditions', () => {
    expect(isRemovedFromPlay(makeCombatant())).toBe(false);
    expect(isRemovedFromPlay(makeCombatant([prone]))).toBe(false);
  });

  it('is false for a custom condition named Banished without the flag', () => {
    expect(isRemovedFromPlay(makeCombatant([{ id: 'x', name: 'Banished', description: '' }]))).toBe(false);
  });

  it('is true once a flagged condition is present', () => {
    expect(isRemovedFromPlay(makeCombatant([prone, banished()]))).toBe(true);
  });

  it('is false after manual removal', () => {
    const c = makeCombatant([banished()]);
    const after = { ...c, conditions: c.conditions.filter((x) => x.id !== 'b1') };
    expect(isRemovedFromPlay(after)).toBe(false);
  });

  it('is false after processRoundEnd expires a duration-1 flagged condition', () => {
    const { updatedCombatants } = processRoundEnd([makeCombatant([banished(1)])]);
    expect(isRemovedFromPlay(updatedCombatants[0])).toBe(false);
  });

  it('stays true while a timed flagged condition has rounds left', () => {
    const { updatedCombatants } = processRoundEnd([makeCombatant([banished(2)])]);
    expect(isRemovedFromPlay(updatedCombatants[0])).toBe(true);
  });

  it('tolerates combatants whose conditions field is missing', () => {
    const legacy = { ...makeCombatant(), conditions: undefined } as unknown as CombatantState;
    expect(isRemovedFromPlay(legacy)).toBe(false);
  });
});
