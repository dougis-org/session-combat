import { AbilityScores } from "@/lib/types";

export const ABILITY_SCORE_KEYS = [
  "strength",
  "dexterity",
  "constitution",
  "intelligence",
  "wisdom",
  "charisma",
] as const satisfies ReadonlyArray<keyof AbilityScores>;

export const SKILL_ABILITY_MAP: Record<string, keyof AbilityScores> = {
  acrobatics: "dexterity",
  "animal handling": "wisdom",
  arcana: "intelligence",
  athletics: "strength",
  deception: "charisma",
  history: "intelligence",
  insight: "wisdom",
  intimidation: "charisma",
  investigation: "intelligence",
  medicine: "wisdom",
  nature: "intelligence",
  perception: "wisdom",
  performance: "charisma",
  persuasion: "charisma",
  religion: "intelligence",
  "sleight of hand": "dexterity",
  stealth: "dexterity",
  survival: "wisdom",
};

export const SKILL_NAMES = Object.keys(SKILL_ABILITY_MAP);

export const PASSIVE_SENSE_SKILLS: Array<
  [string, keyof typeof SKILL_ABILITY_MAP, keyof AbilityScores]
> = [
  ["passive perception", "perception", "wisdom"],
  ["passive investigation", "investigation", "intelligence"],
  ["passive insight", "insight", "wisdom"],
];