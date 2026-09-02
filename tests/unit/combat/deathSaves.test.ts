import type { CombatantState } from '@/lib/types';
import {
  usesDeathSaves,
  enterDying,
  clearDeathState,
  applyDeathSaveRoll,
  toggleDeathSaveSlot,
  applyDamageWhileDowned,
  lifeStateDisplay,
} from '@/lib/combat/deathSaves';

const makeCombatant = (overrides: Partial<CombatantState> = {}): CombatantState => ({
  id: 'c1',
  name: 'Aria',
  type: 'player',
  initiative: 10,
  conditions: [],
  hp: 20,
  maxHp: 20,
  ac: 15,
  abilityScores: { strength: 10, dexterity: 10, constitution: 10, intelligence: 10, wisdom: 10, charisma: 10 },
  ...overrides,
});

describe('usesDeathSaves', () => {
  test('true for players', () => {
    expect(usesDeathSaves({ type: 'player' })).toBe(true);
  });
  test('false for monsters', () => {
    expect(usesDeathSaves({ type: 'monster' })).toBe(false);
  });
  test('false for lair', () => {
    expect(usesDeathSaves({ type: 'lair' })).toBe(false);
  });
});

describe('enterDying', () => {
  test('returns dying with an empty tracker', () => {
    expect(enterDying()).toEqual({
      lifeState: 'dying',
      deathSaves: { successes: 0, failures: 0 },
    });
  });
  test('does not mutate the input combatant', () => {
    const c = makeCombatant();
    enterDying();
    expect(c.lifeState).toBeUndefined();
    expect(c.deathSaves).toBeUndefined();
  });
});

describe('applyDeathSaveRoll', () => {
  const dying = (successes: number, failures: number, extra: Partial<CombatantState> = {}) =>
    makeCombatant({ hp: 0, lifeState: 'dying', deathSaves: { successes, failures }, ...extra });

  test('d20 = 15 adds a success', () => {
    expect(applyDeathSaveRoll(dying(0, 0), 15)).toEqual({
      deathSaves: { successes: 1, failures: 0 },
    });
  });
  test('d20 = 10 (boundary) adds a success', () => {
    expect(applyDeathSaveRoll(dying(0, 0), 10)).toEqual({
      deathSaves: { successes: 1, failures: 0 },
    });
  });
  test('d20 = 9 adds a failure', () => {
    expect(applyDeathSaveRoll(dying(1, 0), 9)).toEqual({
      deathSaves: { successes: 1, failures: 1 },
    });
  });
  test('d20 = 2 (boundary) adds a failure', () => {
    expect(applyDeathSaveRoll(dying(0, 0), 2)).toEqual({
      deathSaves: { successes: 0, failures: 1 },
    });
  });
  test('natural 20 revives at 1 HP and clears state', () => {
    expect(applyDeathSaveRoll(dying(1, 2), 20)).toEqual({
      hp: 1,
      lifeState: undefined,
      deathSaves: undefined,
      note: 'Nat 20 — revived at 1 HP',
    });
  });
  test('natural 1 adds two failures', () => {
    expect(applyDeathSaveRoll(dying(2, 0), 1)).toEqual({
      deathSaves: { successes: 2, failures: 2 },
    });
  });
  test('third success stabilises and clears counts', () => {
    expect(applyDeathSaveRoll(dying(2, 1), 15)).toEqual({
      lifeState: 'stable',
      deathSaves: undefined,
    });
  });
  test('third failure kills and clears counts', () => {
    expect(applyDeathSaveRoll(dying(2, 2), 5)).toEqual({
      lifeState: 'dead',
      deathSaves: undefined,
    });
  });
  test('nat 1 from {0,1} reaches 3 failures -> dead', () => {
    expect(applyDeathSaveRoll(dying(0, 1), 1)).toEqual({
      lifeState: 'dead',
      deathSaves: undefined,
    });
  });
  test('reaching 3 failures resolves to dead even at 2 successes', () => {
    expect(applyDeathSaveRoll(dying(2, 2), 1)).toEqual({
      lifeState: 'dead',
      deathSaves: undefined,
    });
  });
});

describe('toggleDeathSaveSlot', () => {
  const dying = (successes: number, failures: number) =>
    makeCombatant({ hp: 0, lifeState: 'dying', deathSaves: { successes, failures } });

  test('toggling success index 1 from {1,0} -> {2,0}', () => {
    expect(toggleDeathSaveSlot(dying(1, 0), 'success', 1)).toEqual({
      deathSaves: { successes: 2, failures: 0 },
    });
  });
  test('toggling the same slot again -> {1,0}', () => {
    expect(toggleDeathSaveSlot(dying(2, 0), 'success', 1)).toEqual({
      deathSaves: { successes: 1, failures: 0 },
    });
  });
  test('toggling failure index 0 from {0,0} -> {0,1}', () => {
    expect(toggleDeathSaveSlot(dying(0, 0), 'failure', 0)).toEqual({
      deathSaves: { successes: 0, failures: 1 },
    });
  });
  test('toggling success index 2 from {2,0} -> stable, cleared', () => {
    expect(toggleDeathSaveSlot(dying(2, 0), 'success', 2)).toEqual({
      lifeState: 'stable',
      deathSaves: undefined,
    });
  });
  test('toggling failure index 2 from {0,2} -> dead, cleared', () => {
    expect(toggleDeathSaveSlot(dying(0, 2), 'failure', 2)).toEqual({
      lifeState: 'dead',
      deathSaves: undefined,
    });
  });
});

describe('applyDamageWhileDowned', () => {
  const dying = (successes: number, failures: number) =>
    makeCombatant({ hp: 0, maxHp: 20, lifeState: 'dying', deathSaves: { successes, failures } });

  test('ordinary damage adds one failure, stays dying', () => {
    expect(applyDamageWhileDowned(dying(0, 0), { critical: false, damage: 5 })).toEqual({
      lifeState: 'dying',
      deathSaves: { successes: 0, failures: 1 },
    });
  });
  test('critical hit is instant death', () => {
    expect(applyDamageWhileDowned(dying(0, 0), { critical: true, damage: 5 })).toEqual({
      lifeState: 'dead',
      deathSaves: undefined,
    });
  });
  test('damage >= maxHp is instant death', () => {
    expect(applyDamageWhileDowned(dying(0, 0), { critical: false, damage: 20 })).toEqual({
      lifeState: 'dead',
      deathSaves: undefined,
    });
  });
  test('damage of 19 with maxHp 20 is one failure, still dying', () => {
    expect(applyDamageWhileDowned(dying(0, 0), { critical: false, damage: 19 })).toEqual({
      lifeState: 'dying',
      deathSaves: { successes: 0, failures: 1 },
    });
  });
  test('stable combatant taking damage returns to dying with one failure', () => {
    const stable = makeCombatant({ hp: 0, maxHp: 20, lifeState: 'stable' });
    expect(applyDamageWhileDowned(stable, { critical: false, damage: 5 })).toEqual({
      lifeState: 'dying',
      deathSaves: { successes: 0, failures: 1 },
    });
  });
  test('second failure from {0,1} -> {0,2}, still dying', () => {
    expect(applyDamageWhileDowned(dying(0, 1), { critical: false, damage: 5 })).toEqual({
      lifeState: 'dying',
      deathSaves: { successes: 0, failures: 2 },
    });
  });
  test('third failure from damage -> dead', () => {
    expect(applyDamageWhileDowned(dying(2, 2), { critical: false, damage: 5 })).toEqual({
      lifeState: 'dead',
      deathSaves: undefined,
    });
  });
});

describe('clearDeathState', () => {
  test('from any life state -> cleared', () => {
    for (const lifeState of ['dying', 'stable', 'dead'] as const) {
      expect(clearDeathState()).toEqual({ lifeState: undefined, deathSaves: undefined });
      expect(lifeState).toBeDefined();
    }
  });
});

describe('legacy / undefined handling', () => {
  test('applyDamageWhileDowned accepts a combatant with no death-save fields', () => {
    const c = makeCombatant({ hp: 0, maxHp: 20 });
    expect(() => applyDamageWhileDowned(c, { critical: false, damage: 3 })).not.toThrow();
  });
  test('a combatant with lifeState undefined reads as active', () => {
    expect(lifeStateDisplay(makeCombatant())).toEqual({
      badge: null,
      greyed: false,
      showTracker: false,
    });
  });
});

describe('lifeStateDisplay', () => {
  test('active player with hp > 0 -> no badge', () => {
    expect(lifeStateDisplay(makeCombatant())).toEqual({
      badge: null,
      greyed: false,
      showTracker: false,
    });
  });
  test('dying -> Dying badge, tracker shown', () => {
    expect(lifeStateDisplay(makeCombatant({ hp: 0, lifeState: 'dying' }))).toEqual({
      badge: 'Dying',
      greyed: false,
      showTracker: true,
    });
  });
  test('stable -> Stable badge, greyed, no tracker', () => {
    expect(lifeStateDisplay(makeCombatant({ hp: 0, lifeState: 'stable' }))).toEqual({
      badge: 'Stable',
      greyed: true,
      showTracker: false,
    });
  });
  test('dead -> Dead badge, greyed, no tracker', () => {
    expect(lifeStateDisplay(makeCombatant({ hp: 0, lifeState: 'dead' }))).toEqual({
      badge: 'Dead',
      greyed: true,
      showTracker: false,
    });
  });
  test('monster at 0 HP with no lifeState -> skull fallback', () => {
    expect(
      lifeStateDisplay(makeCombatant({ type: 'monster', hp: 0 }))
    ).toEqual({ badge: '☠️', greyed: false, showTracker: false });
  });
  test('player at 0 HP with lifeState stable shows Stable, not a bare skull', () => {
    expect(lifeStateDisplay(makeCombatant({ hp: 0, lifeState: 'stable' })).badge).toBe('Stable');
  });
});
