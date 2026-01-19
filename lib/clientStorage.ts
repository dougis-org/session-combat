// Client-side storage using localStorage
// This is a temporary client-side storage for the app
// In production, should use API routes instead

import { SessionData, Encounter, Character, CombatState, Party } from './types';

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
    return { encounters: [], characters: [], parties: [] };
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

  saveCharacters(characters: Character[]): void {
    try {
      const data = this.load();
      data.characters = characters;
      localStorage.setItem('sessionData', JSON.stringify(data));
    } catch (error) {
      console.error('Error saving characters:', error);
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

  saveParties(parties: Party[]): void {
    try {
      const data = this.load();
      data.parties = parties;
      localStorage.setItem('sessionData', JSON.stringify(data));
    } catch (error) {
      console.error('Error saving parties:', error);
    }
  },

  // Clear client-side session data (used on logout)
  clear(): void {
    try {
      localStorage.removeItem('sessionData');
      console.debug('[clientStorage] Cleared sessionData');
    } catch (error) {
      console.error('Error clearing client storage:', error);
    }
  },
};
