/**
 * D&D 5e SRD Fiends
 * Devils, demons, and other creatures from the lower planes
 */

import { MonsterTemplate } from '@/lib/types';

export const FIENDS: Omit<MonsterTemplate, 'id' | 'userId' | 'createdAt' | 'updatedAt' | '_id'>[] = [
  {
    name: 'Demon, Balor',
    size: 'huge',
    type: 'fiend',
    alignment: 'chaotic evil',
    ac: 19,
    hp: 262,
    maxHp: 262,
    speed: '40 ft., fly 80 ft.',
    abilityScores: {
      strength: 26,
      dexterity: 15,
      constitution: 22,
      intelligence: 20,
      wisdom: 16,
      charisma: 22,
    },
    savingThrows: {
      strength: 14,
      constitution: 12,
      wisdom: 10,
      charisma: 13,
    },
    damageResistances: ['cold', 'lightning', 'poison'],
    damageImmunities: ['fire'],
    conditionImmunities: ['frightened', 'poisoned'],
    senses: {
      darkvision: '120 ft.',
      passive_perception: '13',
    },
    languages: ['Abyssal', 'telepathy 120 ft.'],
    challengeRating: 19,
    experiencePoints: 22000,
    description: 'The most terrible of demon lords, balors command armies of lesser demons through fear and raw power.',
    source: 'SRD',
    isGlobal: true,
    traits: [
      {
        name: 'Death Throes',
        description: 'When the balor dies, it explodes, and each creature within 30 feet of it must make a DC 20 Dexterity saving throw, taking 70 (20d6) fire damage on a failed save, or half as much on a successful one.',
      },
      {
        name: 'Legendary Resistance (3/Day)',
        description: 'If the balor fails a saving throw, it can choose to succeed instead.',
      },
    ],
    actions: [
      {
        name: 'Multiattack',
        description: 'The balor can use its Frightful Presence. It then makes two attacks with its longsword or uses its Whip twice.',
      },
      {
        name: 'Longsword',
        description: 'Melee Weapon Attack: +14 to hit, reach 10 ft., one target. Hit: 21 (3d8 + 8) slashing damage plus 11 (2d10) lightning damage. If the balor scores a critical hit, it rolls damage dice three times, instead of twice.',
        attackBonus: 14,
        damageDescription: '3d8 + 8 slashing + 2d10 lightning',
      },
      {
        name: 'Whip',
        description: 'Melee Weapon Attack: +14 to hit, reach 30 ft., one target. Hit: 15 (2d6 + 8) slashing damage plus 11 (2d10) lightning damage, and the target must succeed on a DC 20 Strength saving throw or be knocked prone.',
        attackBonus: 14,
        damageDescription: '2d6 + 8 slashing + 2d10 lightning',
      },
    ],
  },
];
