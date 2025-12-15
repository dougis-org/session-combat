// Data types for the combat tracker

// User and authentication
export interface User {
  _id?: string;
  id?: string;
  email: string;
  passwordHash: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuthPayload {
  userId: string;
  email: string;
}

export interface Monster {
  _id?: string;
  id: string;
  userId: string;
  name: string;
  hp: number;
  maxHp: number;
  ac: number;
  initiativeBonus: number;
}

export interface Player {
  _id?: string;
  id: string;
  userId: string;
  name: string;
  hp: number;
  maxHp: number;
  ac: number;
  initiativeBonus: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface Encounter {
  _id?: string;
  id: string;
  userId: string;
  name: string;
  description: string;
  monsters: Monster[];
  createdAt: Date;
  updatedAt: Date;
}

export interface StatusCondition {
  id: string;
  name: string;
  description: string;
  duration?: number; // in rounds
}

export interface CombatantStatus {
  combatantId: string;
  conditions: StatusCondition[];
}

export interface CombatantState {
  id: string;
  name: string;
  type: 'player' | 'monster';
  initiative: number;
  hp: number;
  maxHp: number;
  ac: number;
  conditions: StatusCondition[];
  notes?: string;
}

export interface CombatState {
  _id?: string;
  id: string;
  userId: string;
  encounterId?: string;
  combatants: CombatantState[];
  currentRound: number;
  currentTurnIndex: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface SessionData {
  encounters: Encounter[];
  players: Player[];
  combatState?: CombatState;
}
