import { LocalStore } from '../../lib/sync/LocalStore';

/**
 * Integration test for combat session ejection.
 * Verifies that combat sessions are properly removed from localStorage
 * when "End Combat" button is clicked.
 */
describe('Combat Session Ejection', () => {
  let localStore: LocalStore;

  beforeEach(() => {
    localStorage.clear();
    localStore = new LocalStore();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should eject active combat session when end combat is called', async () => {
    const userId = 'user-123';
    const combatSession = {
      userId,
      encounterId: 'enc-001',
      round: 3,
      turn: 1,
      participants: [
        { id: 'creature-1', name: 'Goblin', hp: 10 },
        { id: 'char-1', name: 'Hero', hp: 30 }
      ],
      activeParticipantId: 'creature-1'
    };

    // Save combat session locally
    await localStore.saveEntity('combatState', userId, combatSession);

    // Verify it exists
    let loaded = await localStore.loadEntity('combatState', userId);
    expect(loaded).toBeDefined();
    expect(loaded?.round).toBe(3);

    // End combat (eject)
    const ejected = await localStore.deleteEntity('combatState', userId);
    expect(ejected._deleted).toBe(true);

    // Verify it's marked as deleted
    const stored = localStorage.getItem(`sessionCombat:v1:combatState:${userId}`);
    const parsed = JSON.parse(stored!);
    expect(parsed._deleted).toBe(true);
  });

  it('should prevent stale combat data from interfering with subsequent combats', async () => {
    const userId = 'user-123';
    const firstCombat = {
      userId,
      encounterId: 'enc-001',
      round: 5,
      participants: ['creature-1', 'char-1']
    };

    // Start first combat
    await localStore.saveEntity('combatState', userId, firstCombat);

    // End first combat
    await localStore.deleteEntity('combatState', userId);

    // Start new combat
    const secondCombat = {
      userId,
      encounterId: 'enc-002',
      round: 1,
      participants: ['creature-2', 'char-1']
    };

    await localStore.saveEntity('combatState', userId, secondCombat);

    // Verify only new combat data is active
    const loaded = await localStore.loadEntity('combatState', userId);
    expect(loaded?.encounterId).toBe('enc-002');
    expect(loaded?.round).toBe(1);
  });

  it('should handle rapid combat start/end cycles', async () => {
    const userId = 'user-123';

    for (let i = 0; i < 3; i++) {
      const combat = {
        userId,
        encounterId: `enc-00${i + 1}`,
        round: 1,
        participants: []
      };

      await localStore.saveEntity('combatState', userId, combat);
      const loaded = await localStore.loadEntity('combatState', userId);
      expect(loaded?.encounterId).toBe(`enc-00${i + 1}`);

      await localStore.deleteEntity('combatState', userId);
      const deleted = localStorage.getItem(`sessionCombat:v1:combatState:${userId}`);
      const parsed = JSON.parse(deleted!);
      expect(parsed._deleted).toBe(true);
    }
  });
});
