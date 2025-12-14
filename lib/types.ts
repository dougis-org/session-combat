// Data types for the combat tracker

export interface Monster {
  id: string;
  name: string;
  hp: number;
  maxHp: number;
  ac: number;
  initiativeBonus: number;
}

export interface Player {
  id: string;
  name: string;
  hp: number;
  maxHp: number;
  ac: number;
  initiativeBonus: number;
}

export interface Encounter {
  id: string;
  name: string;
  description: string;
  monsters: Monster[];
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
  id: string;
  encounterId?: string;
  combatants: CombatantState[];
  currentRound: number;
  currentTurnIndex: number;
  isActive: boolean;
}

export interface SessionData {
  encounters: Encounter[];
  players: Player[];
  combatState?: CombatState;
}
