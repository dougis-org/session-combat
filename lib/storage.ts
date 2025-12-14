// MongoDB persistence utilities
import { getDatabase } from './db';
import { SessionData, Encounter, Player, CombatState } from './types';

/**
 * Server-side storage functions for MongoDB
 * Note: Use API routes for client-side data fetching
 */
export const storage = {
  // Load encounters for a user
  async loadEncounters(userId: string): Promise<Encounter[]> {
    try {
      const db = await getDatabase();
      const encounters = await db
        .collection<Encounter>('encounters')
        .find({ userId })
        .toArray();
      return encounters;
    } catch (error) {
      console.error('Error loading encounters:', error);
      return [];
    }
  },

  // Load players for a user
  async loadPlayers(userId: string): Promise<Player[]> {
    try {
      const db = await getDatabase();
      const players = await db
        .collection<Player>('players')
        .find({ userId })
        .toArray();
      return players;
    } catch (error) {
      console.error('Error loading players:', error);
      return [];
    }
  },

  // Load combat state for a user
  async loadCombatState(userId: string): Promise<CombatState | null> {
    try {
      const db = await getDatabase();
      const combatState = await db
        .collection<CombatState>('combatStates')
        .findOne({ userId });
      return combatState || null;
    } catch (error) {
      console.error('Error loading combat state:', error);
      return null;
    }
  },

  // Load all session data for a user
  async load(userId: string): Promise<SessionData> {
    try {
      const [encounters, players, combatState] = await Promise.all([
        this.loadEncounters(userId),
        this.loadPlayers(userId),
        this.loadCombatState(userId),
      ]);

      return { encounters, players, combatState: combatState || undefined };
    } catch (error) {
      console.error('Error loading session data:', error);
      return { encounters: [], players: [] };
    }
  },

  // Save encounter
  async saveEncounter(encounter: Encounter): Promise<void> {
    try {
      const db = await getDatabase();
      await db
        .collection<Encounter>('encounters')
        .updateOne({ id: encounter.id, userId: encounter.userId }, { $set: encounter }, { upsert: true });
    } catch (error) {
      console.error('Error saving encounter:', error);
      throw error;
    }
  },

  // Save multiple encounters
  async saveEncounters(encounters: Encounter[]): Promise<void> {
    try {
      const db = await getDatabase();
      for (const encounter of encounters) {
        await this.saveEncounter(encounter);
      }
    } catch (error) {
      console.error('Error saving encounters:', error);
      throw error;
    }
  },

  // Save player
  async savePlayer(player: Player): Promise<void> {
    try {
      const db = await getDatabase();
      await db
        .collection<Player>('players')
        .updateOne({ id: player.id, userId: player.userId }, { $set: player }, { upsert: true });
    } catch (error) {
      console.error('Error saving player:', error);
      throw error;
    }
  },

  // Save multiple players
  async savePlayers(players: Player[]): Promise<void> {
    try {
      const db = await getDatabase();
      for (const player of players) {
        await this.savePlayer(player);
      }
    } catch (error) {
      console.error('Error saving players:', error);
      throw error;
    }
  },

  // Save combat state
  async saveCombatState(combatState: CombatState | undefined): Promise<void> {
    if (!combatState) {
      return;
    }
    try {
      const db = await getDatabase();
      await db
        .collection<CombatState>('combatStates')
        .updateOne({ id: combatState.id, userId: combatState.userId }, { $set: combatState }, { upsert: true });
    } catch (error) {
      console.error('Error saving combat state:', error);
      throw error;
    }
  },

  // Delete encounter
  async deleteEncounter(id: string, userId: string): Promise<void> {
    try {
      const db = await getDatabase();
      await db.collection<Encounter>('encounters').deleteOne({ id, userId });
    } catch (error) {
      console.error('Error deleting encounter:', error);
      throw error;
    }
  },

  // Delete player
  async deletePlayer(id: string, userId: string): Promise<void> {
    try {
      const db = await getDatabase();
      await db.collection<Player>('players').deleteOne({ id, userId });
    } catch (error) {
      console.error('Error deleting player:', error);
      throw error;
    }
  },

  // Clear all data for a user
  async clear(userId: string): Promise<void> {
    try {
      const db = await getDatabase();
      await Promise.all([
        db.collection<Encounter>('encounters').deleteMany({ userId }),
        db.collection<Player>('players').deleteMany({ userId }),
        db.collection<CombatState>('combatStates').deleteMany({ userId }),
      ]);
    } catch (error) {
      console.error('Error clearing data:', error);
      throw error;
    }
  },
};

