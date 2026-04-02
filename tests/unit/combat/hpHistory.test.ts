import { describe, test, expect, beforeEach } from '@jest/globals';
import { pushHpHistory, popHpHistory, getHpHistoryStack, clearCombatHistory } from '@/lib/utils/hpHistory';
import type { HpHistoryEntry } from '@/lib/types';

// Minimal localStorage mock for node environment
const makeStorage = () => {
  const store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => { store[key] = value; },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { Object.keys(store).forEach(k => delete store[k]); },
  };
};

beforeEach(() => {
  const storage = makeStorage();
  Object.defineProperty(global, 'localStorage', { value: storage, writable: true });
});

const entry = (overrides: Partial<HpHistoryEntry> = {}): HpHistoryEntry => ({
  hp: 30,
  tempHp: 0,
  type: 'damage',
  amount: 5,
  timestamp: 1000,
  ...overrides,
});

// ---------------------------------------------------------------------------
// pushHpHistory
// ---------------------------------------------------------------------------

describe('pushHpHistory – basic push', () => {
  test('single entry is retrievable via getHpHistoryStack', () => {
    pushHpHistory('combat-1', 'combatant-a', entry({ hp: 30, tempHp: 0, amount: 5 }));
    const stack = getHpHistoryStack('combat-1', 'combatant-a');
    expect(stack).toHaveLength(1);
    expect(stack[0]).toMatchObject({ hp: 30, tempHp: 0, amount: 5 });
  });

  test('multiple pushes stack in push order', () => {
    pushHpHistory('c', 'a', entry({ amount: 1 }));
    pushHpHistory('c', 'a', entry({ amount: 2 }));
    pushHpHistory('c', 'a', entry({ amount: 3 }));
    const stack = getHpHistoryStack('c', 'a');
    expect(stack.map(e => e.amount)).toEqual([1, 2, 3]);
  });

  test('different combatants stored independently', () => {
    pushHpHistory('c', 'a', entry({ amount: 10 }));
    pushHpHistory('c', 'b', entry({ amount: 20 }));
    expect(getHpHistoryStack('c', 'a')[0].amount).toBe(10);
    expect(getHpHistoryStack('c', 'b')[0].amount).toBe(20);
  });
});

describe('pushHpHistory – cap enforcement at 10 (FIFO overflow)', () => {
  test('stack never exceeds 10 entries', () => {
    for (let i = 0; i < 12; i++) {
      pushHpHistory('c', 'a', entry({ amount: i }));
    }
    expect(getHpHistoryStack('c', 'a')).toHaveLength(10);
  });

  test('oldest entry is dropped on overflow (FIFO)', () => {
    for (let i = 0; i < 11; i++) {
      pushHpHistory('c', 'a', entry({ amount: i }));
    }
    const stack = getHpHistoryStack('c', 'a');
    // Entry 0 should be gone; entry 1 should be the new oldest
    expect(stack[0].amount).toBe(1);
    expect(stack[stack.length - 1].amount).toBe(10);
  });

  test('exactly 10 entries: no overflow', () => {
    for (let i = 0; i < 10; i++) {
      pushHpHistory('c', 'a', entry({ amount: i }));
    }
    const stack = getHpHistoryStack('c', 'a');
    expect(stack).toHaveLength(10);
    expect(stack[0].amount).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// popHpHistory
// ---------------------------------------------------------------------------

describe('popHpHistory', () => {
  test('returns and removes the top (most recent) entry', () => {
    pushHpHistory('c', 'a', entry({ amount: 1 }));
    pushHpHistory('c', 'a', entry({ amount: 2 }));
    const popped = popHpHistory('c', 'a');
    expect(popped?.amount).toBe(2);
    expect(getHpHistoryStack('c', 'a')).toHaveLength(1);
    expect(getHpHistoryStack('c', 'a')[0].amount).toBe(1);
  });

  test('returns undefined when stack is empty', () => {
    expect(popHpHistory('c', 'a')).toBeUndefined();
  });

  test('returns undefined when key is absent entirely', () => {
    expect(popHpHistory('no-such-combat', 'no-such-combatant')).toBeUndefined();
  });

  test('restores exact hp and tempHp from the snapshot', () => {
    pushHpHistory('c', 'a', entry({ hp: 25, tempHp: 8, type: 'damage', amount: 10 }));
    const restored = popHpHistory('c', 'a');
    expect(restored).toMatchObject({ hp: 25, tempHp: 8 });
  });
});

// ---------------------------------------------------------------------------
// getHpHistoryStack
// ---------------------------------------------------------------------------

describe('getHpHistoryStack', () => {
  test('returns empty array when key is absent', () => {
    expect(getHpHistoryStack('ghost-combat', 'ghost-combatant')).toEqual([]);
  });

  test('returns current stack without mutating it', () => {
    pushHpHistory('c', 'a', entry({ amount: 5 }));
    const stack = getHpHistoryStack('c', 'a');
    expect(stack).toHaveLength(1);
    // Calling again should still return 1 entry
    expect(getHpHistoryStack('c', 'a')).toHaveLength(1);
  });
});

// ---------------------------------------------------------------------------
// clearCombatHistory
// ---------------------------------------------------------------------------

describe('clearCombatHistory', () => {
  test('removes the localStorage key for the given combatId', () => {
    pushHpHistory('c', 'a', entry());
    pushHpHistory('c', 'b', entry());
    clearCombatHistory('c');
    expect(getHpHistoryStack('c', 'a')).toEqual([]);
    expect(getHpHistoryStack('c', 'b')).toEqual([]);
  });

  test('does not affect history for other combatIds', () => {
    pushHpHistory('c1', 'a', entry({ amount: 1 }));
    pushHpHistory('c2', 'a', entry({ amount: 2 }));
    clearCombatHistory('c1');
    expect(getHpHistoryStack('c1', 'a')).toEqual([]);
    expect(getHpHistoryStack('c2', 'a')[0].amount).toBe(2);
  });

  test('no-op when key does not exist', () => {
    expect(() => clearCombatHistory('nonexistent')).not.toThrow();
  });
});

// ---------------------------------------------------------------------------
// undoHpChange logic (task 3.2)
// Verifies: pop returns snapshot values; no new history entry recorded after pop
// ---------------------------------------------------------------------------

describe('undoHpChange logic', () => {
  test('popped entry has correct hp/tempHp snapshot values', () => {
    pushHpHistory('c', 'a', entry({ hp: 20, tempHp: 5, type: 'damage', amount: 10 }));
    const snapshot = popHpHistory('c', 'a');
    expect(snapshot?.hp).toBe(20);
    expect(snapshot?.tempHp).toBe(5);
  });

  test('no new history entry is recorded after undo (pop does not push)', () => {
    pushHpHistory('c', 'a', entry({ amount: 10 }));
    popHpHistory('c', 'a'); // simulate undo
    expect(getHpHistoryStack('c', 'a')).toHaveLength(0);
  });

  test('multiple undos consume entries one at a time', () => {
    pushHpHistory('c', 'a', entry({ amount: 1 }));
    pushHpHistory('c', 'a', entry({ amount: 2 }));
    pushHpHistory('c', 'a', entry({ amount: 3 }));
    expect(popHpHistory('c', 'a')?.amount).toBe(3);
    expect(popHpHistory('c', 'a')?.amount).toBe(2);
    expect(popHpHistory('c', 'a')?.amount).toBe(1);
    expect(popHpHistory('c', 'a')).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// Context menu enabled/disabled logic (task 3.3)
// The "Undo HP Change" button is enabled when stack.length > 0, disabled when empty.
// ---------------------------------------------------------------------------

describe('context menu enabled/disabled logic', () => {
  test('disabled when history stack is empty', () => {
    const hasHistory = getHpHistoryStack('c', 'a').length > 0;
    expect(hasHistory).toBe(false);
  });

  test('enabled after pushing one entry', () => {
    pushHpHistory('c', 'a', entry());
    const hasHistory = getHpHistoryStack('c', 'a').length > 0;
    expect(hasHistory).toBe(true);
  });

  test('disabled again after popping the last entry', () => {
    pushHpHistory('c', 'a', entry());
    popHpHistory('c', 'a');
    const hasHistory = getHpHistoryStack('c', 'a').length > 0;
    expect(hasHistory).toBe(false);
  });

  test('disabled after clearCombatHistory', () => {
    pushHpHistory('c', 'a', entry());
    clearCombatHistory('c');
    const hasHistory = getHpHistoryStack('c', 'a').length > 0;
    expect(hasHistory).toBe(false);
  });
});
