import { LocalStore } from '../../../lib/sync/LocalStore';
import testCases from '../data/local-store-test-cases.json';

describe('LocalStore', () => {
  let localStore: LocalStore;
  const VERSION_KEY = 'sessionCombat:v1';

  beforeEach(() => {
    localStorage.clear();
    localStore = new LocalStore();
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe('saveEntity', () => {
    it('should persist encounter to localStorage with versioning', async () => {
      const encounter = testCases.encounters[0];
      const result = await localStore.saveEntity('encounters', encounter.input.id, encounter.input);
      
      expect(result).toBeDefined();
      expect(result._version).toBe(1);
      expect(result._lastModified).toBeDefined();
      
      // Verify persisted in localStorage
      const stored = localStorage.getItem(`${VERSION_KEY}:encounters:${encounter.input.id}`);
      expect(stored).toBeDefined();
      const parsed = JSON.parse(stored!);
      expect(parsed.name).toBe(encounter.input.name);
    });

    it('should increment version on subsequent saves', async () => {
      const encounter = testCases.encounters[0];
      const id = encounter.input.id;
      
      const v1 = await localStore.saveEntity('encounters', id, encounter.input);
      expect(v1._version).toBe(1);
      
      const updated = { ...encounter.input, name: 'Updated Name' };
      const v2 = await localStore.saveEntity('encounters', id, updated);
      expect(v2._version).toBe(2);
    });

    it('should handle unicode in entity names', async () => {
      const encounter = testCases.encounters[1];
      const result = await localStore.saveEntity('encounters', encounter.input.id, encounter.input);
      
      expect(result.name).toBe('龍との戦い');
    });

    it('should reject entity with empty name', async () => {
      const invalidCase = testCases.edgeCases[0];
      await expect(
        localStore.saveEntity('encounters', invalidCase.input.id, invalidCase.input)
      ).rejects.toThrow();
    });

    it('should reject entity without id', async () => {
      const invalidCase = testCases.edgeCases[1];
      await expect(
        localStore.saveEntity('encounters', undefined as any, invalidCase.input)
      ).rejects.toThrow();
    });
  });

  describe('loadEntity', () => {
    it('should retrieve saved entity by id', async () => {
      const encounter = testCases.encounters[0];
      await localStore.saveEntity('encounters', encounter.input.id, encounter.input);
      
      const loaded = await localStore.loadEntity('encounters', encounter.input.id);
      expect(loaded).toBeDefined();
      expect(loaded?.name).toBe(encounter.input.name);
    });

    it('should return null if entity not found', async () => {
      const loaded = await localStore.loadEntity('encounters', 'nonexistent-id');
      expect(loaded).toBeNull();
    });
  });

  describe('loadAllEntities', () => {
    it('should return all encounters as array', async () => {
      const encounters = testCases.encounters.slice(0, 2);
      for (const enc of encounters) {
        await localStore.saveEntity('encounters', enc.input.id, enc.input);
      }
      
      const all = await localStore.loadAllEntities('encounters');
      expect(Array.isArray(all)).toBe(true);
      expect(all.length).toBe(2);
    });

    it('should deduplicate entries', async () => {
      const encounter = testCases.encounters[0];
      await localStore.saveEntity('encounters', encounter.input.id, encounter.input);
      await localStore.saveEntity('encounters', encounter.input.id, { ...encounter.input, difficulty: 'medium' });
      
      const all = await localStore.loadAllEntities('encounters');
      expect(all.length).toBe(1);
    });

    it('should return empty array when no entities exist', async () => {
      const all = await localStore.loadAllEntities('encounters');
      expect(Array.isArray(all)).toBe(true);
      expect(all.length).toBe(0);
    });
  });

  describe('deleteEntity', () => {
    it('should soft-delete entity by setting _deleted flag', async () => {
      const encounter = testCases.encounters[0];
      await localStore.saveEntity('encounters', encounter.input.id, encounter.input);
      
      const deleted = await localStore.deleteEntity('encounters', encounter.input.id);
      expect(deleted._deleted).toBe(true);
      
      const stored = localStorage.getItem(`${VERSION_KEY}:encounters:${encounter.input.id}`);
      const parsed = JSON.parse(stored!);
      expect(parsed._deleted).toBe(true);
    });

    it('should not remove entity from storage immediately', async () => {
      const encounter = testCases.encounters[0];
      await localStore.saveEntity('encounters', encounter.input.id, encounter.input);
      await localStore.deleteEntity('encounters', encounter.input.id);
      
      const stored = localStorage.getItem(`${VERSION_KEY}:encounters:${encounter.input.id}`);
      expect(stored).toBeDefined();
    });
  });

  describe('migrateOldFormat', () => {
    it('should detect and migrate old sessionData key format', async () => {
      const oldData = {
        encounters: [{ id: 'old-enc-1', name: 'Old encounter' }],
        parties: []
      };
      localStorage.setItem('sessionData', JSON.stringify(oldData));
      
      await localStore.migrateOldFormat();
      
      // Old key should be removed
      expect(localStorage.getItem('sessionData')).toBeNull();
      
      // New keys should exist
      expect(localStorage.getItem(`${VERSION_KEY}:encounters:old-enc-1`)).toBeDefined();
    });

    it('should not fail if old format does not exist', async () => {
      await expect(localStore.migrateOldFormat()).resolves.not.toThrow();
    });
  });

  describe('error handling', () => {
    it('should handle QuotaExceededError gracefully', async () => {
      const storeSpy = jest.spyOn(Storage.prototype, 'setItem')
        .mockImplementation(() => {
          const err = new DOMException('QuotaExceededError');
          err.name = 'QuotaExceededError';
          throw err;
        });

      const encounter = testCases.encounters[0];
      await expect(
        localStore.saveEntity('encounters', encounter.input.id, encounter.input)
      ).rejects.toThrow();

      storeSpy.mockRestore();
    });

    it('should handle parse errors gracefully', async () => {
      localStorage.setItem(`${VERSION_KEY}:encounters:bad-id`, 'not valid json');
      
      const loaded = await localStore.loadEntity('encounters', 'bad-id');
      expect(loaded).toBeNull();
    });
  });
});
