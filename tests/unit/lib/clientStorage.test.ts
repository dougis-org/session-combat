import { clientStorage } from '@/lib/clientStorage';

// Mock localStorage for Node.js test environment
let store: Record<string, string> = {};
const localStorageMock = {
  getItem: jest.fn((key: string) => store[key] ?? null),
  setItem: jest.fn((key: string, value: string) => { store[key] = value; }),
  removeItem: jest.fn((key: string) => { delete store[key]; }),
  clear: jest.fn(() => { store = {}; }),
};

Object.defineProperty(global, 'localStorage', { value: localStorageMock });

function itDoesNotThrowOnSetItemError(action: () => void) {
  it('does not throw when setItem fails', () => {
    localStorageMock.setItem.mockImplementationOnce(() => { throw new Error('QuotaExceededError'); });
    expect(action).not.toThrow();
  });
}

describe('clientStorage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    store = {};
  });

  describe('load', () => {
    it('returns default shape when localStorage is empty', () => {
      const result = clientStorage.load();
      expect(result).toEqual({ encounters: [], characters: [], parties: [], campaigns: [] });
    });

    it('returns stored data merged with defaults', () => {
      store['sessionData'] = JSON.stringify({ encounters: [{ id: 'e1' }], characters: [], parties: [], campaigns: [] });
      const result = clientStorage.load();
      expect(result.encounters).toHaveLength(1);
      expect(result.encounters[0]).toMatchObject({ id: 'e1' });
    });

    it('backfills missing campaigns key for legacy payloads', () => {
      store['sessionData'] = JSON.stringify({ encounters: [], characters: [], parties: [] });
      const result = clientStorage.load();
      expect(result.campaigns).toEqual([]);
    });

    it('returns default shape when JSON is invalid', () => {
      store['sessionData'] = 'not-valid-json{{{';
      const result = clientStorage.load();
      expect(result).toEqual({ encounters: [], characters: [], parties: [], campaigns: [] });
    });
  });

  describe('saveEncounters', () => {
    it('persists encounters to localStorage', () => {
      clientStorage.saveEncounters([{ id: 'e1' } as any]);
      expect(localStorageMock.setItem).toHaveBeenCalled();
      const saved = JSON.parse(localStorageMock.setItem.mock.calls[0][1]);
      expect(saved.encounters).toHaveLength(1);
      expect(saved.encounters[0].id).toBe('e1');
    });

    it('preserves existing characters when saving encounters', () => {
      store['sessionData'] = JSON.stringify({ encounters: [], characters: [{ id: 'c1' }], parties: [], campaigns: [] });
      clientStorage.saveEncounters([]);
      const saved = JSON.parse(localStorageMock.setItem.mock.calls[0][1]);
      expect(saved.characters).toHaveLength(1);
    });

    itDoesNotThrowOnSetItemError(() => clientStorage.saveEncounters([]));
  });

  describe('saveCharacters', () => {
    it('persists characters to localStorage', () => {
      clientStorage.saveCharacters([{ id: 'c1' } as any]);
      const saved = JSON.parse(localStorageMock.setItem.mock.calls[0][1]);
      expect(saved.characters[0].id).toBe('c1');
    });

    itDoesNotThrowOnSetItemError(() => clientStorage.saveCharacters([]));
  });

  describe('saveCombatState', () => {
    it('persists combat state to localStorage', () => {
      clientStorage.saveCombatState({ round: 2 } as any);
      const saved = JSON.parse(localStorageMock.setItem.mock.calls[0][1]);
      expect(saved.combatState.round).toBe(2);
    });

    it('saves undefined combat state', () => {
      clientStorage.saveCombatState(undefined);
      const saved = JSON.parse(localStorageMock.setItem.mock.calls[0][1]);
      expect(saved.combatState).toBeUndefined();
    });

    itDoesNotThrowOnSetItemError(() => clientStorage.saveCombatState(undefined));
  });

  describe('saveParties', () => {
    it('persists parties to localStorage', () => {
      clientStorage.saveParties([{ id: 'p1' } as any]);
      const saved = JSON.parse(localStorageMock.setItem.mock.calls[0][1]);
      expect(saved.parties[0].id).toBe('p1');
    });

    itDoesNotThrowOnSetItemError(() => clientStorage.saveParties([]));
  });

  describe('clear', () => {
    it('removes sessionData from localStorage', () => {
      store['sessionData'] = JSON.stringify({ encounters: [] });
      clientStorage.clear();
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('sessionData');
    });

    it('leaves localStorage empty after clear', () => {
      store['sessionData'] = JSON.stringify({ encounters: [] });
      clientStorage.clear();
      expect(store['sessionData']).toBeUndefined();
    });

    it('does not throw when removeItem fails', () => {
      localStorageMock.removeItem.mockImplementationOnce(() => { throw new Error('SecurityError'); });
      expect(() => clientStorage.clear()).not.toThrow();
    });
  });
});
