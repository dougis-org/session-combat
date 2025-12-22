// MongoDB persistence utilities
import { getDatabase } from './db';
import { SessionData, Encounter, Character, CombatState, Party, MonsterTemplate } from './types';
import { GLOBAL_USER_ID } from './constants';

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
      // Ensure id field is set to the string representation of _id
      return encounters.map(enc => ({
        ...enc,
        id: enc._id?.toString() || enc.id,
      }));
    } catch (error) {
      console.error('Error loading encounters:', error);
      return [];
    }
  },

  // Load characters for a user
  async loadCharacters(userId: string): Promise<Character[]> {
    try {
      const db = await getDatabase();
      const characters = await db
        .collection<Character>('characters')
        .find({ userId })
        .toArray();
      // Ensure id field is set to the string representation of _id
      return characters.map(char => ({
        ...char,
        id: char._id?.toString() || char.id,
      }));
    } catch (error) {
      console.error('Error loading characters:', error);
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

  // Load parties for a user
  async loadParties(userId: string): Promise<Party[]> {
    try {
      const db = await getDatabase();
      const parties = await db
        .collection<Party>('parties')
        .find({ userId })
        .toArray();
      // Ensure id field is set to the string representation of _id
      return parties.map(party => ({
        ...party,
        id: party._id?.toString() || party.id,
      }));
    } catch (error) {
      console.error('Error loading parties:', error);
      return [];
    }
  },

  // Load monster templates for a user
  async loadMonsterTemplates(userId: string): Promise<MonsterTemplate[]> {
    try {
      const db = await getDatabase();
      const templates = await db
        .collection<MonsterTemplate>('monsterTemplates')
        .find({ userId })
        .toArray();
      // Ensure id field is set to the string representation of _id
      return templates.map(template => ({
        ...template,
        id: template._id?.toString() || template.id,
      }));
    } catch (error) {
      console.error('Error loading monster templates:', error);
      return [];
    }
  },

  // Load global monster templates (admin-controlled)
  async loadGlobalMonsterTemplates(): Promise<MonsterTemplate[]> {
    try {
      const db = await getDatabase();
      const templates = await db
        .collection<MonsterTemplate>('monsterTemplates')
        .find({ userId: GLOBAL_USER_ID })
        .toArray();
      // Ensure id field is set to the string representation of _id
      return templates.map(template => ({
        ...template,
        id: template._id?.toString() || template.id,
      }));
    } catch (error) {
      console.error('Error loading global monster templates:', error);
      return [];
    }
  },

  // Load all monster templates (user + global)
  async loadAllMonsterTemplates(userId: string): Promise<MonsterTemplate[]> {
    try {
      const [userTemplates, globalTemplates] = await Promise.all([
        this.loadMonsterTemplates(userId),
        this.loadGlobalMonsterTemplates(),
      ]);
      return [...userTemplates, globalTemplates].flat();
    } catch (error) {
      console.error('Error loading all monster templates:', error);
      return [];
    }
  },

  // Load all session data for a user
  async load(userId: string): Promise<SessionData> {
    try {
      const [encounters, characters, parties, combatState] = await Promise.all([
        this.loadEncounters(userId),
        this.loadCharacters(userId),
        this.loadParties(userId),
        this.loadCombatState(userId),
      ]);

      return { encounters, characters, parties, combatState: combatState || undefined };
    } catch (error) {
      console.error('Error loading session data:', error);
      return { encounters: [], characters: [], parties: [] };
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

  // Save character
  async saveCharacter(character: Character): Promise<void> {
    try {
      const db = await getDatabase();
      await db
        .collection<Character>('characters')
        .updateOne({ id: character.id, userId: character.userId }, { $set: character }, { upsert: true });
    } catch (error) {
      console.error('Error saving character:', error);
      throw error;
    }
  },

  // Save multiple characters
  async saveCharacters(characters: Character[]): Promise<void> {
    try {
      const db = await getDatabase();
      for (const character of characters) {
        await this.saveCharacter(character);
      }
    } catch (error) {
      console.error('Error saving characters:', error);
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

  // Delete character
  async deleteCharacter(id: string, userId: string): Promise<void> {
    try {
      const db = await getDatabase();
      await db.collection<Character>('characters').deleteOne({ id, userId });
      // Also remove character from all parties
      await db.collection<Party>('parties').updateMany(
        { userId },
        { $pull: { characterIds: id } }
      );
    } catch (error) {
      console.error('Error deleting character:', error);
      throw error;
    }
  },

  // Save party
  async saveParty(party: Party): Promise<void> {
    try {
      const db = await getDatabase();
      await db
        .collection<Party>('parties')
        .updateOne({ id: party.id, userId: party.userId }, { $set: party }, { upsert: true });
    } catch (error) {
      console.error('Error saving party:', error);
      throw error;
    }
  },

  // Save multiple parties
  async saveParties(parties: Party[]): Promise<void> {
    try {
      const db = await getDatabase();
      for (const party of parties) {
        await this.saveParty(party);
      }
    } catch (error) {
      console.error('Error saving parties:', error);
      throw error;
    }
  },

  // Delete party
  async deleteParty(id: string, userId: string): Promise<void> {
    try {
      const db = await getDatabase();
      await db.collection<Party>('parties').deleteOne({ id, userId });
    } catch (error) {
      console.error('Error deleting party:', error);
      throw error;
    }
  },

  // Save monster template
  async saveMonsterTemplate(template: MonsterTemplate): Promise<void> {
    try {
      const db = await getDatabase();
      await db
        .collection<MonsterTemplate>('monsterTemplates')
        .updateOne({ id: template.id, userId: template.userId }, { $set: template }, { upsert: true });
    } catch (error) {
      console.error('Error saving monster template:', error);
      throw error;
    }
  },

  // Delete monster template
  async deleteMonsterTemplate(id: string, userId: string): Promise<void> {
    try {
      const db = await getDatabase();
      await db.collection<MonsterTemplate>('monsterTemplates').deleteOne({ id, userId });
    } catch (error) {
      console.error('Error deleting monster template:', error);
      throw error;
    }
  },

  // Clear all data for a user
  async clear(userId: string): Promise<void> {
    try {
      const db = await getDatabase();
      await Promise.all([
        db.collection<Encounter>('encounters').deleteMany({ userId }),
        db.collection<Character>('characters').deleteMany({ userId }),
        db.collection<Party>('parties').deleteMany({ userId }),
        db.collection<CombatState>('combatStates').deleteMany({ userId }),
      ]);
    } catch (error) {
      console.error('Error clearing data:', error);
      throw error;
    }
  },
};

