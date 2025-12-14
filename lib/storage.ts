// Simple localStorage persistence utilities
import { SessionData, Encounter, Player, CombatState } from './types';

const STORAGE_KEY = 'dnd-session-data';

export const storage = {
  // Load all session data
  load(): SessionData {
    if (typeof window === 'undefined') {
      return { encounters: [], players: [] };
    }
    
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (data) {
        return JSON.parse(data);
      }
    } catch (error) {
      console.error('Error loading session data:', error);
    }
    
    return { encounters: [], players: [] };
  },

  // Save all session data
  save(data: SessionData): void {
    if (typeof window === 'undefined') return;
    
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.error('Error saving session data:', error);
    }
  },

  // Save encounters
  saveEncounters(encounters: Encounter[]): void {
    const data = this.load();
    data.encounters = encounters;
    this.save(data);
  },

  // Save players
  savePlayers(players: Player[]): void {
    const data = this.load();
    data.players = players;
    this.save(data);
  },

  // Save combat state
  saveCombatState(combatState: CombatState | undefined): void {
    const data = this.load();
    data.combatState = combatState;
    this.save(data);
  },

  // Clear all data
  clear(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(STORAGE_KEY);
  },
};
