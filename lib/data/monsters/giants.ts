/**
 * D&D 5e SRD Giants
 * Large humanoid giants and their kin
 */

import { MonsterTemplate } from '@/lib/types';

export const GIANTS: Omit<MonsterTemplate, 'id' | 'userId' | 'createdAt' | 'updatedAt' | '_id'>[] = [
  {
    name: 'Frost Giant',
    size: 'huge',
    type: 'giant',
    alignment: 'chaotic evil',
    ac: 15,
    hp: 138,
    maxHp: 138,
    speed: '40 ft.',
    abilityScores: {
      strength: 23,
      dexterity: 9,
      constitution: 21,
      intelligence: 9,
      wisdom: 10,
      charisma: 12,
    },
    savingThrows: {
      constitution: 8,
      wisdom: 3,
      charisma: 4,
    },
    skills: {
      athletics: 9,
      perception: 3,
    },
    damageImmunities: ['cold'],
    senses: {
      passive_perception: '13',
    },
    languages: ['Giant'],
    challengeRating: 8,
    experiencePoints: 3900,
    description: 'These powerful giants are native to the icy wastelands and view lesser creatures with contempt.',
    source: 'SRD',
    isGlobal: true,
    traits: [],
    actions: [
      {
        name: 'Multiattack',
        description: 'The giant makes two greataxe attacks.',
      },
      {
        name: 'Greataxe',
        description: 'Melee Weapon Attack: +9 to hit, reach 10 ft., one target. Hit: 25 (3d12 + 6) slashing damage.',
        attackBonus: 9,
        damageDescription: '3d12 + 6 slashing',
      },
      {
        name: 'Rock',
        description: 'Ranged Weapon Attack: +9 to hit, range 60/240 ft., one target. Hit: 28 (4d10 + 6) bludgeoning damage.',
        attackBonus: 9,
        damageDescription: '4d10 + 6 bludgeoning',
      },
    ],
  },
];
