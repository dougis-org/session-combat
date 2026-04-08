import type { MonsterTemplate } from "@/lib/types";

export const EXISTING_MONSTER: MonsterTemplate = {
  id: "monster-1",
  userId: "user-123",
  name: "Goblin",
  size: "small",
  type: "humanoid",
  ac: 12,
  hp: 7,
  maxHp: 7,
  speed: "30 ft.",
  challengeRating: 0.25,
  abilityScores: { strength: 8, dexterity: 14, constitution: 10, intelligence: 10, wisdom: 8, charisma: 8 },
  isGlobal: false,
  createdAt: new Date(),
  updatedAt: new Date(),
};

export const EXISTING_GLOBAL_MONSTER: MonsterTemplate = {
  id: "global-1",
  userId: "GLOBAL",
  name: "Zombie",
  size: "medium",
  type: "undead",
  ac: 8,
  hp: 22,
  maxHp: 22,
  speed: "20 ft.",
  challengeRating: 0.125,
  abilityScores: { strength: 13, dexterity: 6, constitution: 16, intelligence: 3, wisdom: 6, charisma: 5 },
  isGlobal: true,
  createdAt: new Date(),
  updatedAt: new Date(),
};
