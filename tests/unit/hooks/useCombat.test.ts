/** @jest-environment jsdom */

import React from 'react';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { useCombat } from '@/lib/hooks/useCombat';
import type { CombatState, CombatantState } from '@/lib/types';

const clearCombatHistoryMock = jest.fn();

jest.mock('@/lib/utils/partySelection', () => ({
  resolveCharactersForCombat: (_selectedPartyId: string | null, _parties: unknown[], characters: unknown[]) => characters,
}));

jest.mock('@/lib/combat/conditionExpiry', () => ({
  processRoundEnd: (combatants: unknown[]) => ({ updatedCombatants: combatants, expiring: [] }),
}));

jest.mock('@/lib/utils/hpHistory', () => ({
  pushHpHistory: jest.fn(),
  popHpHistory: jest.fn(),
  getHpHistoryStack: jest.fn(() => []),
  clearCombatHistory: (...args: unknown[]) => clearCombatHistoryMock(...args),
}));

jest.mock('@/lib/utils/combat', () => ({
  applyDamage: (hp: number, tempHp: number, damage: number) => {
    const remaining = Math.max(0, tempHp - damage);
    const spill = Math.max(0, damage - tempHp);
    return { hp: Math.max(0, hp - spill), tempHp: remaining };
  },
  applyHealing: (hp: number, maxHp: number, heal: number) => ({ hp: Math.min(maxHp, hp + heal) }),
  setTempHp: (_tempHp: number, value: number) => ({ tempHp: value }),
  resetIncomingLegendaryPool: (combatants: unknown[]) => combatants,
  sortCombatants: (combatants: Array<{ initiative: number; name: string }>) =>
    [...combatants].sort((a, b) => (b.initiative - a.initiative) || a.name.localeCompare(b.name)),
  buildLairCombatant: (name: string) => ({
    id: `lair-${name.toLowerCase().replace(/\s+/g, '-')}`,
    name,
    type: 'lair',
    initiative: 20,
    conditions: [],
    hp: 1,
    maxHp: 1,
    ac: 10,
    lairActions: [{ name: 'Lair Action', description: 'Action' }],
  }),
  buildCombatantFromSource: (item: { name: string; hp?: number; maxHp?: number; ac?: number }, type: 'monster' | 'player', idPrefix: string) => ({
    id: `${idPrefix}-${item.name.toLowerCase().replace(/\s+/g, '-')}`,
    name: item.name,
    type,
    initiative: 0,
    conditions: [],
    hp: item.hp ?? 10,
    maxHp: item.maxHp ?? 10,
    ac: item.ac ?? 10,
  }),
  applyDamageWithType: (hp: number, tempHp: number, damage: number) => {
    const remaining = Math.max(0, tempHp - damage);
    const spill = Math.max(0, damage - tempHp);
    return { hp: Math.max(0, hp - spill), tempHp: remaining };
  },
  mergeActiveDamageEffects: (base: unknown[], add: unknown[]) => [...(base ?? []), ...(add ?? [])],
  removeActiveDamageEffects: (base: Array<{ type: string; kind: string }>, type: string, kind: string) =>
    (base ?? []).filter(e => !(e.type === type && e.kind === kind)),
  getDexInitiativeBonus: () => 2,
  buildInitiativeRoll: () => ({ roll: 10, bonus: 2, total: 12, method: 'rolled' }),
}));

type HookResult = ReturnType<typeof useCombat>;

function makeCombatant(id: string, name: string, type: 'player' | 'monster' | 'lair' = 'monster'): CombatantState {
  return {
    id,
    name,
    type,
    initiative: type === 'lair' ? 20 : 0,
    conditions: [],
    hp: 10,
    maxHp: 10,
    ac: 12,
    abilityScores: {
      strength: 10,
      dexterity: 10,
      constitution: 10,
      intelligence: 10,
      wisdom: 10,
      charisma: 10,
    },
  };
}

function makeCombatState(combatants: CombatantState[]): CombatState {
  return {
    id: 'combat-1',
    userId: 'u1',
    encounterId: undefined,
    encounterDescription: undefined,
    combatants,
    currentRound: 1,
    currentTurnIndex: 0,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

function response(data: unknown, ok = true) {
  return {
    ok,
    json: async () => data,
  };
}

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>(res => {
    resolve = res;
  });
  return { promise, resolve };
}

function createFetchMock({
  encounters = [],
  characters = [],
  combat = null,
  monsters = [],
  parties = [],
}: {
  encounters?: unknown[];
  characters?: unknown[];
  combat?: unknown;
  monsters?: unknown[];
  parties?: unknown[];
} = {}) {
  const mock = jest.fn(async (url: string, options?: RequestInit) => {
    if (url === '/api/combat' && options?.method === 'POST') {
      return response({ ok: true });
    }

    if (url === '/api/encounters') return response(encounters);
    if (url === '/api/characters') return response(characters);
    if (url === '/api/combat') return response(combat);
    if (url === '/api/monsters') return response(monsters);
    if (url === '/api/parties') return response(parties);

    return response(null, false);
  });

  global.fetch = mock as unknown as typeof fetch;
  return mock;
}

function renderHook() {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  const resultRef: { current: HookResult } = { current: undefined as unknown as HookResult };

  function Probe() {
    const value = useCombat();
    React.useEffect(() => {
      resultRef.current = value;
    }, [value]);
    return null;
  }

  act(() => {
    root.render(React.createElement(Probe));
  });

  return {
    result: resultRef,
    unmount: () => {
      act(() => {
        root.unmount();
      });
      container.remove();
    },
  };
}

function getLastPostBody(fetchMock: jest.Mock) {
  const postCalls = fetchMock.mock.calls.filter(([, opts]: [string, RequestInit?]) => opts?.method === 'POST');
  return JSON.parse(String(postCalls[postCalls.length - 1][1]?.body));
}

function getPostCallCount(fetchMock: jest.Mock) {
  return fetchMock.mock.calls.filter(([, opts]: [string, RequestInit?]) => opts?.method === 'POST').length;
}

// Shared helper to drastically reduce duplication and complexity
async function testHook(
  callback: (result: { current: HookResult }, fetchMock: jest.Mock) => void | Promise<void>,
  initialFetchData?: Parameters<typeof createFetchMock>[0]
) {
  const fetchMock = createFetchMock(initialFetchData);
  const { result, unmount } = renderHook();

  await act(async () => {
    await Promise.resolve();
  });

  await callback(result, fetchMock);

  unmount();
}

describe('useCombat', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (globalThis as unknown as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true;
    global.confirm = jest.fn(() => true);
    global.alert = jest.fn();
    global.crypto = { randomUUID: () => 'uuid-1' } as Crypto;
  });

  test('initial state is loading with empty collections before data resolves', async () => {
    const encounters = deferred<ReturnType<typeof response>>();
    const characters = deferred<ReturnType<typeof response>>();
    const combat = deferred<ReturnType<typeof response>>();
    const monsters = deferred<ReturnType<typeof response>>();
    const parties = deferred<ReturnType<typeof response>>();

    global.fetch = jest.fn((url: string) => {
      if (url === '/api/encounters') return encounters.promise as unknown as Promise<Response>;
      if (url === '/api/characters') return characters.promise as unknown as Promise<Response>;
      if (url === '/api/combat') return combat.promise as unknown as Promise<Response>;
      if (url === '/api/monsters') return monsters.promise as unknown as Promise<Response>;
      if (url === '/api/parties') return parties.promise as unknown as Promise<Response>;
      return Promise.resolve(response(null, false) as unknown as Response);
    }) as unknown as typeof fetch;

    const { result, unmount } = renderHook();
    expect(result.current.loading).toBe(true);
    expect(result.current.combatState).toBeNull();
    expect(result.current.encounters).toEqual([]);
    expect(result.current.characters).toEqual([]);

    encounters.resolve(response([]));
    characters.resolve(response([]));
    combat.resolve(response(null));
    monsters.resolve(response([]));
    parties.resolve(response([]));

    await act(async () => {
      await Promise.resolve();
    });

    unmount();
  });

  test('loads initial data and clears loading flag', async () => {
    await testHook((result) => {
      expect(result.current.loading).toBe(false);
      expect(result.current.encounters).toHaveLength(1);
      expect(result.current.characters).toHaveLength(1);
      expect(result.current.parties).toHaveLength(1);
    }, {
      encounters: [{ id: 'e1', name: 'Ambush', monsters: [] }],
      characters: [{ id: 'ch1', name: 'Aria', hp: 12, maxHp: 12, ac: 14 }],
      combat: null,
      monsters: [{ id: 'm1', name: 'Goblin', hp: 7, maxHp: 7, ac: 13 }],
      parties: [{ id: 'p1', name: 'Heroes', characterIds: ['ch1'] }],
    });
  });

  test('addCombatantToSetup keeps ref sync for immediate duplicate rename path', async () => {
    await testHook((result) => {
      act(() => {
        result.current.addCombatantToSetup(makeCombatant('s1', 'Goblin', 'monster'));
        result.current.addCombatantFromLibrary({ name: 'Goblin', hp: 7, maxHp: 7, ac: 13 } as never, 'monster', 'monster');
      });

      const names = result.current.setupCombatants.map(c => c.name).sort();
      expect(names).toEqual(['Goblin 1', 'Goblin 2']);
    });
  });

  test('confirmAddLair in setup phase appends lair and resets form state', async () => {
    await testHook((result) => {
      act(() => {
        result.current.setShowLairForm(true);
        result.current.setLairFormName('Volcano Lair');
        result.current.setLairFormSeedMonster('Dragon');
      });

      act(() => {
        result.current.confirmAddLair();
      });

      expect(result.current.setupCombatants.some(c => c.type === 'lair' && c.name === 'Volcano Lair')).toBe(true);
      expect(result.current.showLairForm).toBe(false);
      expect(result.current.lairFormName).toBe('');
      expect(result.current.lairFormSeedMonster).toBe('');
    });
  });

  test('confirmAddLair in active phase posts updated combat state', async () => {
    await testHook(async (result, fetchMock) => {
      await act(async () => {
        await result.current.saveCombatState(makeCombatState([makeCombatant('c1', 'Fighter', 'player')]));
      });

      act(() => {
        result.current.setShowLairForm(true);
        result.current.setLairFormName('Crypt Lair');
      });

      act(() => {
        result.current.confirmAddLair();
      });

      const lastBody = getLastPostBody(fetchMock);
      expect(lastBody.combatants.some((c: CombatantState) => c.type === 'lair' && c.name === 'Crypt Lair')).toBe(true);
    });
  });

  test('addCombatantFromLibrary routes to setup when combat is not active', async () => {
    await testHook((result, fetchMock) => {
      act(() => {
        result.current.addCombatantFromLibrary({ name: 'Wolf', hp: 11, maxHp: 11, ac: 13 } as never, 'monster', 'monster');
      });

      expect(result.current.setupCombatants).toHaveLength(1);
      expect(getPostCallCount(fetchMock)).toBe(0);
    });
  });

  test('addCombatantFromLibrary routes to active combat and posts', async () => {
    await testHook(async (result, fetchMock) => {
      await act(async () => {
        await result.current.saveCombatState(makeCombatState([makeCombatant('c1', 'Cleric', 'player')]));
      });

      act(() => {
        result.current.addCombatantFromLibrary({ name: 'Bandit', hp: 11, maxHp: 11, ac: 12 } as never, 'monster', 'monster');
      });

      expect(getPostCallCount(fetchMock)).toBeGreaterThanOrEqual(2);
    });
  });

  test('startCombat creates active state and persists it', async () => {
    await testHook((result, fetchMock) => {
      act(() => {
        result.current.startCombat();
      });

      expect(result.current.combatState?.isActive).toBe(true);
      expect(result.current.combatState?.combatants.length).toBeGreaterThanOrEqual(1);

      expect(getPostCallCount(fetchMock)).toBeGreaterThanOrEqual(1);
    }, {
      characters: [{ id: 'ch1', name: 'Aria', hp: 12, maxHp: 12, ac: 14 }],
    });
  });

  test('endCombat clears active combat and resets setup state when confirmed', async () => {
    await testHook(async (result) => {
      await act(async () => {
        await result.current.saveCombatState(makeCombatState([makeCombatant('c1', 'Paladin', 'player')]));
      });

      act(() => {
        result.current.addCombatantToSetup(makeCombatant('s1', 'Scout', 'monster'));
        result.current.endCombat();
      });

      expect(result.current.combatState).toBeNull();
      expect(result.current.setupCombatants).toEqual([]);
      expect(clearCombatHistoryMock).toHaveBeenCalledWith('combat-1');
    });
  });

  test('nextTurn advances currentTurnIndex within a round', async () => {
    await testHook(async (result, fetchMock) => {
      await act(async () => {
        await result.current.saveCombatState(makeCombatState([
          makeCombatant('c1', 'Fighter', 'player'),
          makeCombatant('c2', 'Orc', 'monster'),
        ]));
      });

      const postCallsBefore = getPostCallCount(fetchMock);

      act(() => { result.current.nextTurn(); });

      const lastBody = getLastPostBody(fetchMock);
      expect(getPostCallCount(fetchMock)).toBeGreaterThan(postCallsBefore);
      expect(lastBody.currentTurnIndex).toBe(1);
      expect(lastBody.currentRound).toBe(1);
    });
  });

  test('nextTurn wraps to index 0 and increments round at end of round', async () => {
    await testHook(async (result, fetchMock) => {
      await act(async () => {
        await result.current.saveCombatState(makeCombatState([makeCombatant('c1', 'Fighter', 'player')]));
      });

      act(() => { result.current.nextTurn(); });

      const lastBody = getLastPostBody(fetchMock);
      expect(lastBody.currentTurnIndex).toBe(0);
      expect(lastBody.currentRound).toBe(2);
    });
  });

  test('rollInitiative sets initiativeRoll on non-lair combatants and sorts the list', async () => {
    const fighter = makeCombatant('c1', 'Fighter', 'player');
    const lair = { ...makeCombatant('lair-1', 'Cave', 'lair'), initiative: 20 };

    await testHook(async (result, fetchMock) => {
      await act(async () => {
        await result.current.saveCombatState(makeCombatState([fighter, lair]));
      });

      act(() => { result.current.rollInitiative(); });

      const lastBody = getLastPostBody(fetchMock);

      const updatedFighter = lastBody.combatants.find((c: CombatantState) => c.id === 'c1');
      expect(updatedFighter.initiativeRoll).toBeDefined();
      expect(updatedFighter.initiative).toBe(12);

      const updatedLair = lastBody.combatants.find((c: CombatantState) => c.id === 'lair-1');
      expect(updatedLair.initiativeRoll).toBeUndefined();
    });
  });
});
