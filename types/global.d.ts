declare type CreatureAbility = any;

declare module '@/lib/types' {
  // Keep compatible with existing exports; provide missing names used across the app
  export type CreatureAbility = any;
  export type User = any;
  export type Character = any;
  export type CharacterClass = any;
  export const VALID_RACES: any;
  export const VALID_CLASSES: any;
  export function isValidRace(_race: any): boolean;
  export function isValidClass(_cls: any): boolean;
  export function calculateTotalLevel(_classes: any): number;
  export function validateCharacterClasses(_classes: any, _options?: any): any;
  export const VALID_ALIGNMENTS: any;
  export type DnDRace = any;

  export type CombatState = any;
  export type CombatantState = any;
  export type Encounter = any;
  export type Party = any;
  export type Monster = any;
  export type MonsterTemplate = any;
  export type AbilityScores = any;
  export type SessionData = any;
  export interface CreatureStats {
    communication?: string;
    [key: string]: any;
  }
}

declare module './types' {
  export type SessionData = any;
  export type Encounter = any;
  export type Character = any;
  export type CombatState = any;
  export type Party = any;
  export type MonsterTemplate = any;
}