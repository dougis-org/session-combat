// Client-side storage using localStorage
// This is a temporary client-side storage for the app
// In production, should use API routes instead

import { SessionData, Encounter, Player, CombatState } from './types';

export const clientStorage = {
  load(): SessionData {
    try {
      const data = localStorage.getItem('sessionData');
      if (data) {
        return JSON.parse(data);
      }
    } catch (error) {
      console.error('Error loading from localStorage:', error);
    }
    return { encounters: [], players: [] };
  },

  saveEncounters(encounters: Encounter[]): void {
    try {
      const data = this.load();
      data.encounters = encounters;
      localStorage.setItem('sessionData', JSON.stringify(data));
    } catch (error) {
      console.error('Error saving encounters:', error);
    }
  },

  savePlayers(players: Player[]): void {
    try {
      const data = this.load();
      data.players = players;
      localStorage.setItem('sessionData', JSON.stringify(data));
    } catch (error) {
      console.error('Error saving players:', error);
    }
  },

  saveCombatState(combatState: CombatState | undefined): void {
    try {
      const data = this.load();
      data.combatState = combatState;
      localStorage.setItem('sessionData', JSON.stringify(data));
    } catch (error) {
      console.error('Error saving combat state:', error);
    }
  },
};
