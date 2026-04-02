import type { HpHistoryEntry } from '@/lib/types';

const HISTORY_CAP = 10;

function storageKey(combatId: string): string {
  return `hp-history:${combatId}`;
}

function loadMap(combatId: string): Record<string, HpHistoryEntry[]> {
  try {
    const raw = localStorage.getItem(storageKey(combatId));
    return raw ? (JSON.parse(raw) as Record<string, HpHistoryEntry[]>) : {};
  } catch {
    return {};
  }
}

function saveMap(combatId: string, map: Record<string, HpHistoryEntry[]>): void {
  try {
    localStorage.setItem(storageKey(combatId), JSON.stringify(map));
  } catch {
    // Ignore localStorage quota or access errors
  }
}

export function pushHpHistory(
  combatId: string,
  combatantId: string,
  entry: HpHistoryEntry,
): void {
  const map = loadMap(combatId);
  const stack = map[combatantId] ?? [];
  stack.push(entry);
  if (stack.length > HISTORY_CAP) {
    stack.shift(); // FIFO overflow: drop oldest entry
  }
  map[combatantId] = stack;
  saveMap(combatId, map);
}

export function popHpHistory(
  combatId: string,
  combatantId: string,
): HpHistoryEntry | undefined {
  const map = loadMap(combatId);
  const stack = map[combatantId];
  if (!stack || stack.length === 0) return undefined;
  const entry = stack.pop();
  map[combatantId] = stack;
  saveMap(combatId, map);
  return entry;
}

export function getHpHistoryStack(
  combatId: string,
  combatantId: string,
): HpHistoryEntry[] {
  const map = loadMap(combatId);
  return map[combatantId] ?? [];
}

export function clearCombatHistory(combatId: string): void {
  try {
    localStorage.removeItem(storageKey(combatId));
  } catch {
    // Ignore localStorage errors
  }
}
