// Data types for the combat tracker

// User and authentication
export interface User {
  _id?: string;
  id?: string;
  email: string;
  passwordHash: string;
  isAdmin?: boolean; // Admin users can manage global monster templates
  createdAt: Date;
  updatedAt: Date;
}

export interface AuthPayload {
  userId: string;
  email: string;
}

// Monster template in the library (reusable)
export interface MonsterTemplate {
  _id?: string;
  id: string;
  userId: string; // userId: 'GLOBAL' for admin-controlled global templates, otherwise user's userId
  name: string;
  hp: number;
  maxHp: number;
  ac: number;
  initiativeBonus: number;
  dexterity: number;
  isGlobal?: boolean; // True if this is a global template (userId === 'GLOBAL')
  createdAt: Date;
  updatedAt: Date;
}

// Monster instance in an encounter (unique copy with instance-specific state)
export interface Monster {
  _id?: string;
  id: string;
  userId?: string; // Optional for encounter instances
  templateId?: string; // Reference to MonsterTemplate if created from library
  name: string;
  hp: number;
  maxHp: number;
  ac: number;
  initiativeBonus: number;
  dexterity: number;
}

export interface Character {
  _id?: string;
  id: string;
  userId: string;
  name: string;
  hp: number;
  maxHp: number;
  ac: number;
  dexterity: number;
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

export interface InitiativeRoll {
  roll: number;
  bonus: number;
  total: number;
  method: 'rolled' | 'manual'; // 'rolled' = automatic roll, 'manual' = user entered
}

export interface CombatantState {
  id: string;
  name: string;
  type: 'player' | 'monster';
  initiative: number;
  initiativeRoll?: InitiativeRoll;
  dexterity: number;
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

export interface Party {
  _id?: string;
  id: string;
  userId: string;
  name: string;
  description?: string;
  characterIds: string[]; // ObjectId references to characters
  createdAt: Date;
  updatedAt: Date;
}

export interface SessionData {
  encounters: Encounter[];
  characters: Character[];
  parties: Party[];
  combatState?: CombatState;
}
