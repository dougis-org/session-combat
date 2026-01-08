/**
 * Shared type definitions
 */

export interface Encounter {
  id: string;
  userId: string;
  name: string;
  difficulty?: string;
  creatures?: string[];
  _version?: number;
  _lastModified?: number;
  _deleted?: boolean;
}

export interface Party {
  id: string;
  userId: string;
  name: string;
  characters?: string[];
  _version?: number;
  _lastModified?: number;
  _deleted?: boolean;
}

export interface Character {
  id: string;
  userId: string;
  name: string;
  class?: string;
  level?: number;
  _version?: number;
  _lastModified?: number;
  _deleted?: boolean;
}

export interface CombatState {
  userId: string;
  encounterId: string;
  round: number;
  turn?: number;
  participants: any[];
  activeParticipantId?: string;
  _version?: number;
  _lastModified?: number;
  _deleted?: boolean;
}
