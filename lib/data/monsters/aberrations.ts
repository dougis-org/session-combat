/**
 * D&D 5e SRD Aberrations
 * Creatures from beyond the material plane or those with unnatural origins
 */

import { MonsterTemplate } from '@/lib/types';

export const ABERRATIONS: Omit<MonsterTemplate, 'id' | 'userId' | 'createdAt' | 'updatedAt' | '_id'>[] = [
  {
    name: 'Aboleth',
    size: 'large',
    type: 'aberration',
    alignment: 'chaotic evil',
    ac: 17,
    hp: 135,
    maxHp: 135,
    speed: '10 ft., swim 40 ft.',
    abilityScores: {
      strength: 21,
      dexterity: 9,
      constitution: 15,
      intelligence: 18,
      wisdom: 15,
      charisma: 18,
    },
    savingThrows: {
      intelligence: 8,
      wisdom: 6,
      charisma: 8,
    },
    skills: {
      perception: 10,
    },
    damageImmunities: [],
    conditionImmunities: [],
    senses: {
      darkvision: '120 ft.',
      passive_perception: '20',
    },
    languages: ['Abyssal', 'telepathy 120 ft.'],
    challengeRating: 10,
    experiencePoints: 5900,
    description: 'An enormous aberration with slimy tentacles and a horrifying appearance.',
    source: 'SRD',
    isGlobal: true,
    traits: [
      {
        name: 'Amphibious',
        description: 'The aboleth can breathe air and water.',
      },
      {
        name: 'Mucous Cloud',
        description: 'While underwater, the aboleth is surrounded by transformative mucus. A creature that touches the aboleth or that hits it with a melee attack while within 5 feet of it must make a DC 14 Constitution saving throw. On a failure, the creature is diseased for 1d4 hours.',
      },
    ],
    actions: [
      {
        name: 'Multiattack',
        description: 'The aboleth makes three tentacle attacks.',
      },
      {
        name: 'Tentacle',
        description: 'Melee Weapon Attack: +9 to hit, reach 15 ft., one target. Hit: 12 (2d6 + 5) bludgeoning damage. If the target is a creature, it is grappled (escape DC 17).',
        attackBonus: 9,
        damageDescription: '2d6 + 5 bludgeoning',
      },
      {
        name: 'Tail',
        description: 'Melee Weapon Attack: +9 to hit, reach 10 ft., one target not grappled by the aboleth. Hit: 15 (3d6 + 5) bludgeoning damage.',
        attackBonus: 9,
        damageDescription: '3d6 + 5 bludgeoning',
      },
    ],
    legendaryActions: [
      {
        name: 'Detect',
        description: 'The aboleth makes a Wisdom (Perception) check.',
      },
      {
        name: 'Tail Swipe',
        description: 'The aboleth makes one tail attack.',
      },
      {
        name: 'Tentacle Attack',
        description: 'The aboleth makes one tentacle attack.',
      },
    ],
  },
  {
    name: 'Beholder',
    size: 'medium',
    type: 'aberration',
    alignment: 'chaotic evil',
    ac: 17,
    hp: 180,
    maxHp: 180,
    speed: '0 ft., fly 20 ft. (hover)',
    abilityScores: {
      strength: 8,
      dexterity: 14,
      constitution: 16,
      intelligence: 17,
      wisdom: 16,
      charisma: 17,
    },
    savingThrows: {
      intelligence: 6,
      wisdom: 7,
      charisma: 7,
    },
    skills: {
      perception: 12,
    },
    conditionImmunities: ['prone'],
    senses: {
      darkvision: '120 ft.',
      passive_perception: '22',
    },
    languages: ['Deep Speech', 'Undercommon'],
    challengeRating: 13,
    experiencePoints: 10000,
    description: 'A feared creature of myth and nightmare, beholders are nearly impossible to surprise and devastatingly intelligent.',
    source: 'SRD',
    isGlobal: true,
    traits: [
      {
        name: 'Antimagic Cone',
        description: 'The beholder\'s eye creates an area of antimagic, as in the antimagic field spell, in a line 150 feet long and 1 foot wide. At the start of each of the beholder\'s turns, it can turn the antimagic on or off.',
      },
      {
        name: 'Legendary Resistance (3/Day)',
        description: 'If the beholder fails a saving throw, it can choose to succeed instead.',
      },
    ],
    actions: [
      {
        name: 'Bite',
        description: 'Melee Weapon Attack: +4 to hit, reach 5 ft., one target. Hit: 16 (4d6 + 2) piercing damage.',
        attackBonus: 4,
        damageDescription: '4d6 + 2 piercing',
      },
      {
        name: 'Eye Rays',
        description: 'The beholder shoots three of the following magical eye rays at random (reroll if the same eye ray is selected twice), choosing one to three targets it can see within 120 feet of it.',
      },
    ],
  },
];
