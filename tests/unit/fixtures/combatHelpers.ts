import type { CombatantState, CombatState, Encounter } from '@/lib/types';

export function makeCombatant(overrides: Partial<CombatantState> = {}): CombatantState {
  return {
    id: 'c1',
    name: 'Goblin',
    type: 'monster',
    initiative: 10,
    hp: 10,
    maxHp: 10,
    ac: 12,
    conditions: [],
    abilityScores: {
      strength: 8,
      dexterity: 14,
      constitution: 10,
      intelligence: 6,
      wisdom: 8,
      charisma: 8,
    },
    ...overrides,
  } as CombatantState;
}

export function makeCombatState(overrides: Partial<CombatState> = {}): CombatState {
  return {
    id: 'combat-1',
    userId: 'user-1',
    combatants: [],
    currentRound: 1,
    currentTurnIndex: 0,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

export function makeEncounter(overrides: Partial<Encounter> = {}): Encounter {
  return {
    id: 'e1',
    userId: 'user-1',
    name: 'Goblin Ambush',
    description: '',
    monsters: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}
