/**
 * D&D 5e SRD Beasts
 * Natural animals and non-magical creatures
 */

import { MonsterTemplate } from '@/lib/types';

export const BEASTS: Omit<MonsterTemplate, 'id' | 'userId' | 'createdAt' | 'updatedAt' | '_id'>[] = [
  {
    name: 'Black Bear',
    size: 'medium',
    type: 'beast',
    alignment: 'unaligned',
    ac: 11,
    hp: 27,
    maxHp: 27,
    speed: '40 ft., climb 30 ft.',
    abilityScores: {
      strength: 15,
      dexterity: 10,
      constitution: 14,
      intelligence: 2,
      wisdom: 12,
      charisma: 5,
    },
    skills: {
      perception: 3,
    },
    senses: {
      passive_perception: '13',
    },
    languages: [],
    challengeRating: 1,
    experiencePoints: 200,
    description: 'A common forest predator that will attack if it feels threatened or protecting its cubs.',
    source: 'SRD',
    isGlobal: true,
    traits: [
      {
        name: 'Keen Smell',
        description: 'The bear has advantage on Wisdom (Perception) checks that rely on smell.',
      },
    ],
    actions: [
      {
        name: 'Multiattack',
        description: 'The bear makes two attacks: one with its bite and one with its claws.',
      },
      {
        name: 'Bite',
        description: 'Melee Weapon Attack: +4 to hit, reach 5 ft., one target. Hit: 5 (1d6 + 2) piercing damage.',
        attackBonus: 4,
        damageDescription: '1d6 + 2 piercing',
      },
      {
        name: 'Claws',
        description: 'Melee Weapon Attack: +4 to hit, reach 5 ft., one target. Hit: 7 (2d4 + 2) slashing damage.',
        attackBonus: 4,
        damageDescription: '2d4 + 2 slashing',
      },
    ],
  },
  {
    name: 'Dire Wolf',
    size: 'large',
    type: 'beast',
    alignment: 'unaligned',
    ac: 13,
    hp: 110,
    maxHp: 110,
    speed: '50 ft.',
    abilityScores: {
      strength: 17,
      dexterity: 15,
      constitution: 15,
      intelligence: 3,
      wisdom: 12,
      charisma: 7,
    },
    skills: {
      perception: 4,
      stealth: 4,
    },
    senses: {
      passive_perception: '14',
    },
    languages: [],
    challengeRating: 3,
    experiencePoints: 700,
    description: 'A massive wolf-like predator that hunts in packs and is significantly larger and more dangerous than normal wolves.',
    source: 'SRD',
    isGlobal: true,
    traits: [
      {
        name: 'Keen Hearing and Smell',
        description: 'The wolf has advantage on Wisdom (Perception) checks that rely on hearing or smell.',
      },
      {
        name: 'Pack Tactics',
        description: 'The wolf has advantage on an attack roll against a creature if at least one other wolf is within 5 feet of the target and the wolf isn\'t incapacitated.',
      },
    ],
    actions: [
      {
        name: 'Bite',
        description: 'Melee Weapon Attack: +5 to hit, reach 5 ft., one target. Hit: 10 (2d6 + 3) piercing damage. If the target is a creature, it must succeed on a DC 13 Strength saving throw or be knocked prone.',
        attackBonus: 5,
        damageDescription: '2d6 + 3 piercing',
      },
    ],
  },
];
